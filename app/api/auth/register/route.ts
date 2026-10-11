export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchemaAndSeed, hashPassword, signToken, queryOne, query } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

function genReferralCode(): string {
  return "WG" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchemaAndSeed();
    const { name, mobile: rawMobile, email, password, gender, referral } = await req.json();
    const mobile = normalizePhone(rawMobile || "");

    if (!name || !mobile || !email || !password || !gender) {
      return NextResponse.json({ error: "সব তথ্য দিন" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }, { status: 400 });
    }

    const existing = await queryOne("SELECT id FROM users WHERE mobile = $1 OR email = $2", [mobile, email.toLowerCase()]);
    if (existing) {
      return NextResponse.json({ error: "এই মোবাইল বা ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে" }, { status: 400 });
    }

    let referredBy: number | null = null;
    if (referral) {
      const ref = await queryOne("SELECT id FROM users WHERE referral_code = $1", [referral.toUpperCase()]);
      if (ref) referredBy = ref.id;
    }

    const password_hash = await hashPassword(password);
    const referral_code = genReferralCode();

    const user = await queryOne(
      `INSERT INTO users (name, mobile, email, password_hash, gender, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, mobile, email, gender, role`,
      [name.trim(), mobile.trim(), email.toLowerCase().trim(), password_hash, gender, referral_code, referredBy]
    );

    await query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [user!.id]);
    await query("INSERT INTO wallet (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [user!.id]);

    if (referredBy) {
      await query("INSERT INTO referrals (referrer_id, referred_id, bonus) VALUES ($1, $2, 50)", [referredBy, user!.id]);
      await query("UPDATE wallet SET balance = balance + 50 WHERE user_id = $1", [referredBy]);
    }

    // Notify all members about new registration
    await query(
      `INSERT INTO notifications (user_id, title, body, ntype)
       SELECT id, 'নতুন সদস্য', $1 || ' যোগ দিয়েছেন', 'new_member' FROM users WHERE id != $2 AND role = 'member'`,
      [name.trim(), user!.id]
    );

    const token = signToken({ id: user!.id, role: "member" });
    const res = NextResponse.json({ ok: true, token, user });
    res.cookies.set("wedgo_token", token, { httpOnly: true, maxAge: 30 * 24 * 3600, path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "রেজিস্ট্রেশন ব্যর্থ: " + e.message }, { status: 500 });
  }
}
