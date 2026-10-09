export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const data = await req.json();
  const fields = ["age","height","address","district","blood_group","marital_status","ghar_jamai","education","occupation","religion","bio","photo1","photo2"];
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const f of fields) {
    if (data[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(data[f]); }
  }

  // Calculate completion %
  const checkFields = ["age","height","address","district","blood_group","marital_status","education","occupation","bio","photo1","photo2"];
  let filled = 0;
  const current = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  for (const f of checkFields) {
    const v = data[f] !== undefined ? data[f] : current?.[f];
    if (v) filled++;
  }
  const pct = Math.round((filled / checkFields.length) * 100);
  sets.push(`completion_pct = $${i++}`); vals.push(pct);
  sets.push(`updated_at = NOW()`);

  vals.push(user.id);
  await query(`UPDATE profiles SET ${sets.join(", ")} WHERE user_id = $${i}`, vals);

  // Reward for completing profile first time
  if (pct >= 80 && (current?.completion_pct || 0) < 80) {
    await query("UPDATE wallet SET balance = balance + 20 WHERE user_id = $1", [user.id]);
  }

  return NextResponse.json({ ok: true, completion_pct: pct });
}
