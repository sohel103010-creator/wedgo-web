export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromReq(req);
  const p = await queryOne(
    `SELECT u.id, u.name, u.gender, u.mobile, p.* FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [params.id]
  );
  if (!p) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  // Log profile view
  if (user && user.id != params.id) {
    await query("INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)", [user.id, params.id]);
  }
  const { mobile, ...safe } = p;
  // Hide mobile unless premium with number share
  return NextResponse.json({ partner: safe });
}
