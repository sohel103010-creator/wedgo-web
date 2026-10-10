export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { hours } = await req.json();

  // Boost costs: 100tk for 24h, 200tk for 72h
  const cost = hours === 72 ? 200 : 100;
  const w = await query("SELECT balance FROM wallets WHERE user_id = $1", [user.id]);
  const balance = w.rows[0]?.balance || 0;
  if (balance < cost) return NextResponse.json({ error: "ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই" }, { status: 400 });

  await query("UPDATE wallets SET balance = balance - $1 WHERE user_id = $2", [cost, user.id]);
  await query("INSERT INTO wallet_transactions (user_id, amount, ttype, note) VALUES ($1, $2, 'debit', $3)",
    [user.id, cost, `প্রোফাইল বুস্ট ${hours} ঘণ্টা`]);
  await query("UPDATE profiles SET boosted_until = NOW() + ($1 || ' hours')::INTERVAL WHERE user_id = $2", [hours, user.id]);

  return NextResponse.json({ ok: true });
}
