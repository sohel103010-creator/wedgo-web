export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const wallet = await queryOne("SELECT * FROM wallet WHERE user_id = $1", [user.id]);
  const withdrawals = await query("SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [user.id]);
  const earnings = await query(
    `SELECT * FROM call_history WHERE receiver_id = $1 AND call_type = 'video' ORDER BY started_at DESC LIMIT 20`,
    [user.id]
  );

  return NextResponse.json({ wallet, withdrawals: withdrawals.rows, earnings: earnings.rows });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { action, amount, method, number } = await req.json();

  if (action === "withdraw") {
    if (user.gender !== "female") {
      return NextResponse.json({ error: "শুধুমাত্র নারী সদস্যরা উত্তোলন করতে পারবেন" }, { status: 403 });
    }
    const wallet = await queryOne("SELECT balance FROM wallet WHERE user_id = $1", [user.id]);
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই" }, { status: 400 });
    }
    if (amount < 500) {
      return NextResponse.json({ error: "সর্বনিম্ন ৫০০ টাকা উত্তোলন করা যাবে" }, { status: 400 });
    }
    await query(
      "INSERT INTO withdrawals (user_id, amount, method, number) VALUES ($1, $2, $3, $4)",
      [user.id, amount, method, number]
    );
    await query("UPDATE wallet SET balance = balance - $1 WHERE user_id = $2", [amount, user.id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "save_numbers") {
    await query(
      "UPDATE wallet SET bkash_number = $1, nagad_number = $2, rocket_number = $3 WHERE user_id = $4",
      [number?.bkash || null, number?.nagad || null, number?.rocket || null, user.id]
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "অজানা অ্যাকশন" }, { status: 400 });
}
