export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";
import { sendPush } from "@/lib/push";

// Initiate a call
export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { receiver_id, call_type, offer_sdp } = await req.json();
  if (!receiver_id || !call_type) {
    return NextResponse.json({ error: "তথ্য অসম্পূর্ণ" }, { status: 400 });
  }

  // Check permissions
  const isFemale = user.gender === "female";
  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    if (isFemale) {
      // Female can only call if the male has an active package with call minutes
      const maleSub = await getActiveSubscription(receiver_id);
      if (!maleSub) {
        return NextResponse.json({ error: "উনি প্রিমিয়াম সদস্য নন" }, { status: 403 });
      }
      const mins = call_type === "video" ? maleSub.video_minutes - (maleSub.video_used || 0) : maleSub.audio_minutes - (maleSub.audio_used || 0);
      if (mins <= 0) {
        return NextResponse.json({ error: "কল মিনিট শেষ" }, { status: 403 });
      }
    } else {
      const sub = await getActiveSubscription(user.id);
      if (!sub) {
        return NextResponse.json({ error: "কল করতে প্রিমিয়াম প্যাকেজ কিনুন" }, { status: 403 });
      }
      const mins = call_type === "video" ? sub.video_minutes - (sub.video_used || 0) : sub.audio_minutes - (sub.audio_used || 0);
      if (mins <= 0) {
        return NextResponse.json({ error: "কল মিনিট শেষ। অতিরিক্ত মিনিট কিনুন।" }, { status: 403 });
      }
    }
  }

  // Check if receiver is already in a call
  const busy = await queryOne(
    "SELECT id FROM calls WHERE (caller_id = $1 OR receiver_id = $1) AND status IN ('ringing','ongoing')",
    [receiver_id]
  );
  if (busy) {
    return NextResponse.json({ error: "উনি এখন ব্যস্ত আছেন" }, { status: 409 });
  }

  const call = await queryOne(
    "INSERT INTO calls (caller_id, receiver_id, call_type, offer_sdp) VALUES ($1, $2, $3, $4) RETURNING id",
    [user.id, receiver_id, call_type, offer_sdp || null]
  );

  // Notify receiver
  await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'call')",
    [receiver_id, call_type === "video" ? "📹 ভিডিও কল আসছে" : "🎙 অডিও কল আসছে", `${user.name} কল করছেন`]);

  // Web push for incoming call (fire-and-forget)
  sendPush(receiver_id, "📞 WedGo কল", `${user.name} কল করছেন`, "/chat").catch(() => {});

  return NextResponse.json({ ok: true, call_id: call!.id });
}

// Poll for incoming calls or get call status
export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const callId = searchParams.get("call_id");

  if (callId) {
    const call = await queryOne(
      `SELECT c.*, u1.name as caller_name, u2.name as receiver_name
       FROM calls c JOIN users u1 ON c.caller_id = u1.id JOIN users u2 ON c.receiver_id = u2.id
       WHERE c.id = $1`, [callId]
    );
    if (!call) return NextResponse.json({ error: "কল পাওয়া যায়নি" }, { status: 404 });

    // Get new ICE candidates
    const since = searchParams.get("since") || "1970-01-01";
    const ice = await query(
      "SELECT * FROM ice_candidates WHERE call_id = $1 AND sender_id != $2 AND created_at > $3 ORDER BY created_at",
      [callId, user.id, since]
    );

    // Max call duration from the payer's (male's) remaining minutes — prevents
    // talking beyond paid minutes (money leak). Capped at the 60-min hard limit.
    // Admin calls: full hour, no minute checks.
    let max_duration_sec = 3600;
    try {
      const us = await query("SELECT id, gender, role FROM users WHERE id = $1 OR id = $2", [call.caller_id, call.receiver_id]);
      const hasAdmin = us.rows.some((u: any) => u.role === "admin");
      if (!hasAdmin) {
        const male = us.rows.find((u: any) => u.gender === "male");
        if (male) {
          const msub = await getActiveSubscription(male.id);
          if (msub) {
            const mins = call.call_type === "video"
              ? (msub.video_minutes || 0) - (msub.video_used || 0)
              : (msub.audio_minutes || 0) - (msub.audio_used || 0);
            max_duration_sec = Math.max(0, Math.min(Math.floor(mins * 60), 3600));
          } else {
            max_duration_sec = 0;
          }
        }
      }
    } catch { /* keep 3600 fallback */ }

    return NextResponse.json({ call, ice: ice.rows, max_duration_sec });
  }

  // Check for incoming ringing calls
  const incoming = await query(
    `SELECT c.*, u.name as caller_name FROM calls c JOIN users u ON c.caller_id = u.id
     WHERE c.receiver_id = $1 AND c.status = 'ringing' ORDER BY c.created_at DESC LIMIT 1`,
    [user.id]
  );

  return NextResponse.json({ incoming: incoming.rows[0] || null });
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { call_id, action } = await req.json();

  if (action === "missed") {
    // Mark as missed and notify caller
    await query("UPDATE calls SET status = 'missed' WHERE id = $1", [call_id]);
    const c = await queryOne("SELECT caller_id, receiver_id, call_type FROM calls WHERE id = $1", [call_id]);
    if (c) {
      await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'call')",
        [c.caller_id, "📵 মিসড কল", `আপনার ${c.call_type === "video" ? "ভিডিও" : "অডিও"} কলের উত্তর দেওয়া হয়নি`]);
    }
    return NextResponse.json({ ok: true });
  }
  if (action === "reject") {
    await query("UPDATE calls SET status = 'rejected' WHERE id = $1", [call_id]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "অজানা" }, { status: 400 });
}
