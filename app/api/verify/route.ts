export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { selfie } = await req.json();
  if (!selfie) return NextResponse.json({ error: "সেলফি দিন" }, { status: 400 });

  await query("UPDATE profiles SET selfie_photo = $1, verification_status = 'pending' WHERE user_id = $2", [selfie, user.id]);
  return NextResponse.json({ ok: true });
}

// Admin approve/reject
export async function PUT(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  const { user_id, status } = await req.json();
  await query("UPDATE profiles SET verification_status = $1, verified = $2 WHERE user_id = $3",
    [status, status === "approved", user_id]);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  const r = await query(
    `SELECT u.id, u.name, p.selfie_photo, p.photo1 FROM profiles p
     JOIN users u ON p.user_id = u.id WHERE p.verification_status = 'pending'`
  );
  return NextResponse.json({ pending: r.rows });
}
