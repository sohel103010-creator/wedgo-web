export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  if (user.gender !== "female" && user.role !== "admin") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const r = await query(
    `SELECT u.id, u.name, p.photo1, w.total_earned
     FROM users u LEFT JOIN profiles p ON u.id = p.user_id
     LEFT JOIN wallets w ON u.id = w.user_id
     WHERE u.gender = 'female' AND u.role = 'member'
     ORDER BY w.total_earned DESC NULLS LAST LIMIT 20`
  );
  return NextResponse.json({ leaders: r.rows });
}
