export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function GET() {
  const r = await query("SELECT * FROM gifts WHERE active = TRUE ORDER BY price");
  return NextResponse.json({ gifts: r.rows });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { receiver_id, gift_id } = await req.json();

  const g = await query("SELECT * FROM gifts WHERE id = $1", [gift_id]);
  const gift = g.rows[0];
  if (!gift) return NextResponse.json({ error: "গিফট পাওয়া যায়নি" }, { status: 400 });

  // Check wallet balance
  const w = await query("SELECT balance FROM wallet WHERE user_id = $1", [user.id]);
  if ((w.rows[0]?.balance || 0) < gift.price) {
    return NextResponse.json({ error: "ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই" }, { status: 400 });
  }

  await query("UPDATE wallet SET balance = balance - $1 WHERE user_id = $2", [gift.price, user.id]);
  await query("INSERT INTO wallet_transactions (user_id, amount, ttype, note) VALUES ($1, $2, 'debit', $3)",
    [user.id, gift.price, `গিফট: ${gift.emoji} ${gift.name}`]);
  await query("INSERT INTO gift_sends (sender_id, receiver_id, gift_id) VALUES ($1, $2, $3)",
    [user.id, receiver_id, gift_id]);

  // 50% goes to receiver, 50% to admin/platform
  const receiverCut = Math.round(gift.price * 0.5);
  await query("UPDATE wallet SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2",
    [receiverCut, receiver_id]);

  await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'gift')",
    [receiver_id, `${gift.emoji} গিফট পেয়েছেন!`, `${user.name} আপনাকে ${gift.name} পাঠিয়েছেন`]);

  return NextResponse.json({ ok: true });
}
