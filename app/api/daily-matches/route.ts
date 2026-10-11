export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";
import { calcCompatibility } from "@/lib/compat";

// Today's top matches — deterministic per day (rotates daily), top 5 by compatibility
export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const meR = await query("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  const me = meR.rows[0] || {};

  const targetGender = user.gender === "male" ? "female" : "male";
  const r = await query(
    `SELECT u.id, u.name, p.age, p.district, p.religion, p.education, p.marital_status, p.photo1, p.verified
     FROM users u LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.role = 'member' AND u.status = 'active' AND u.gender = $1 AND u.id != $2
     LIMIT 30`,
    [targetGender, user.id]
  );

  const scored = r.rows
    .map((p: any) => ({ ...p, compat: calcCompatibility(me, p) }))
    .sort((a: any, b: any) => b.compat - a.compat)
    .slice(0, 15);

  // Rotate daily so picks feel fresh each day
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const rot = scored.length > 0 ? dayOfYear % scored.length : 0;
  const rotated = [...scored.slice(rot), ...scored.slice(0, rot)];

  return NextResponse.json({ matches: rotated.slice(0, 5), date: now.toISOString().slice(0, 10) });
}
