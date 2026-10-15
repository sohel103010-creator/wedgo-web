export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";

// Earnings rates per minute brackets (video)
const VIDEO_RATES: [number, number][] = [[10, 300], [20, 500], [30, 700], [40, 900], [50, 1100], [60, 1300]];
const AUDIO_RATES: [number, number][] = [[10, 100], [20, 180], [30, 250], [60, 400], [90, 700], [120, 900]];

function calcEarning(minutes: number, rates: [number, number][]): number {
  // Per-minute rate based on user's spec: interpolate
  let total = 0;
  let remaining = minutes;
  let prevMin = 0, prevPay = 0;
  for (const [m, pay] of rates) {
    if (remaining <= 0) break;
    const bracketMins = Math.min(remaining, m - prevMin);
    const perMin = (pay - prevPay) / (m - prevMin);
    total += bracketMins * perMin;
    remaining -= bracketMins;
    prevMin = m; prevPay = pay;
  }
  return Math.round(total);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { action, answer_sdp, candidate } = await req.json();
  const callId = params.id;

  const call = await queryOne("SELECT * FROM calls WHERE id = $1", [callId]);
  if (!call) return NextResponse.json({ error: "কল পাওয়া যায়নি" }, { status: 404 });

  if (action === "answer") {
    if (call.receiver_id !== user.id) return NextResponse.json({ error: "অননুমোদিত" }, { status: 403 });
    await query("UPDATE calls SET status = 'ongoing', answer_sdp = $1, answered_at = NOW() WHERE id = $2",
      [answer_sdp || null, callId]);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await query("UPDATE calls SET status = 'rejected', ended_at = NOW() WHERE id = $1", [callId]);
    return NextResponse.json({ ok: true });
  }

  if (action === "ice") {
    if (!candidate) return NextResponse.json({ error: "candidate লাগবে" }, { status: 400 });
    await query("INSERT INTO ice_candidates (call_id, sender_id, candidate) VALUES ($1, $2, $3)",
      [callId, user.id, JSON.stringify(candidate)]);
    return NextResponse.json({ ok: true });
  }

  if (action === "end") {
    const now = new Date();
    const start = call.answered_at ? new Date(call.answered_at) : new Date(call.created_at);
    const durationSec = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
    const durationMin = Math.ceil(durationSec / 60);

    await query("UPDATE calls SET status = 'ended', duration_sec = $1, ended_at = NOW() WHERE id = $2",
      [durationSec, callId]);

    // Record in call_history
    await query(
      "INSERT INTO call_history (caller_id, receiver_id, call_type, duration_sec, started_at, ended_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [call.caller_id, call.receiver_id, call.call_type, durationSec, call.answered_at || call.created_at]
    );

    // Deduct minutes from the male's subscription (or caller's if male)
    // Admin calls are free: no minute deduction, no female earnings.
    const caller = await queryOne("SELECT gender, role FROM users WHERE id = $1", [call.caller_id]);
    const receiver = await queryOne("SELECT role FROM users WHERE id = $1", [call.receiver_id]);
    const adminInvolved = caller?.role === "admin" || receiver?.role === "admin";
    const maleId = caller?.gender === "male" ? call.caller_id : call.receiver_id;
    const femaleId = caller?.gender === "female" ? call.caller_id : call.receiver_id;

    if (!adminInvolved) {
    const sub = await getActiveSubscription(maleId);
    if (sub && durationMin > 0) {
      if (call.call_type === "video") {
        await query("UPDATE subscriptions SET video_used = video_used + $1 WHERE id = $2",
          [Math.min(durationMin, sub.video_minutes - (sub.video_used || 0)), sub.id]);
      } else {
        await query("UPDATE subscriptions SET audio_used = audio_used + $1 WHERE id = $2",
          [Math.min(durationMin, sub.audio_minutes - (sub.audio_used || 0)), sub.id]);
      }
    }

    // Female earnings
    if (femaleId && durationMin > 0) {
      const rates = call.call_type === "video" ? VIDEO_RATES : AUDIO_RATES;
      const earning = calcEarning(durationMin, rates);
      if (earning > 0) {
        await query("UPDATE wallet SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2",
          [earning, femaleId]);
        await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, '💰 আয় যোগ হয়েছে', $2, 'earning')",
          [femaleId, `কল থেকে ৳${earning} আয় হয়েছে`]);
      }
    }
    }

    return NextResponse.json({ ok: true, duration_sec: durationSec });
  }

  return NextResponse.json({ error: "অজানা অ্যাকশন" }, { status: 400 });
}
