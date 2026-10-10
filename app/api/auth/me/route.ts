export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  const sub = await getActiveSubscription(user.id);
  const wallet = await queryOne("SELECT * FROM wallet WHERE user_id = $1", [user.id]);

  // Daily login bonus (10tk, once per day)
  let bonusMsg = "";
  const today = new Date().toISOString().split("T")[0];
  if (profile?.last_bonus_date !== today) {
    await query("UPDATE profiles SET last_bonus_date = $1 WHERE user_id = $2", [today, user.id]);
    await query("UPDATE wallet SET balance = balance + 10 WHERE user_id = $1", [user.id]);
    await query("INSERT INTO wallet_transactions (user_id, amount, ttype, note) VALUES ($1, 10, 'credit', 'ডেইলি লগইন বোনাস')", [user.id]);
    bonusMsg = "🎁 ডেইলি লগইন বোনাস: ৳১০!";
  }

  return NextResponse.json({
    user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, gender: user.gender, role: user.role, referral_code: user.referral_code },
    profile, subscription: sub, wallet, bonusMsg,
  });
}
