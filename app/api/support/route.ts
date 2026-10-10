export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { subject, message } = await req.json();
  if (!subject || !message) return NextResponse.json({ error: "সব তথ্য দিন" }, { status: 400 });
  await query("INSERT INTO support_tickets (user_id, subject, message) VALUES ($1, $2, $3)", [user.id, subject, message]);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const r = await query("SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC", [user.id]);
  return NextResponse.json({ tickets: r.rows });
}
