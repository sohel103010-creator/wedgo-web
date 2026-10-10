export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");
  const district = searchParams.get("district");
  const marital = searchParams.get("marital");
  const education = searchParams.get("education");
  const occupation = searchParams.get("occupation");
  const religion = searchParams.get("religion");
  const minHeight = searchParams.get("minHeight");
  const maxHeight = searchParams.get("maxHeight");

  let sql = `SELECT u.id, u.name, u.gender, p.age, p.height, p.district, p.marital_status,
             p.education, p.occupation, p.religion, p.photo1, p.verified, p.online_status,
             p.last_active, p.featured, p.completion_pct
             FROM users u LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.role = 'member' AND u.status = 'active'`;
  const vals: any[] = [];
  let i = 1;

  if (user) { sql += ` AND u.id != $${i++}`; vals.push(user.id); }
  if (gender) { sql += ` AND u.gender = $${i++}`; vals.push(gender); }
  if (minAge) { sql += ` AND p.age >= $${i++}`; vals.push(parseInt(minAge)); }
  if (maxAge) { sql += ` AND p.age <= $${i++}`; vals.push(parseInt(maxAge)); }
  if (district) { sql += ` AND p.district ILIKE $${i++}`; vals.push(`%${district}%`); }
  if (marital) { sql += ` AND p.marital_status = $${i++}`; vals.push(marital); }
  if (education) { sql += ` AND p.education ILIKE $${i++}`; vals.push(`%${education}%`); }
  if (occupation) { sql += ` AND p.occupation ILIKE $${i++}`; vals.push(`%${occupation}%`); }
  if (religion) { sql += ` AND p.religion = $${i++}`; vals.push(religion); }
  if (minHeight) { sql += ` AND p.height >= $${i++}`; vals.push(parseInt(minHeight)); }
  if (maxHeight) { sql += ` AND p.height <= $${i++}`; vals.push(parseInt(maxHeight)); }

  sql += ` ORDER BY p.featured DESC, p.boost_until DESC NULLS LAST, u.created_at DESC LIMIT 60`;

  const r = await query(sql, vals);
  return NextResponse.json({ partners: r.rows });
}
