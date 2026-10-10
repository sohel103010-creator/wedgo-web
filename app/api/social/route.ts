export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { action, target_id, reason, details } = await req.json();

  if (action === "block") {
    await query("INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user.id, target_id]);
    return NextResponse.json({ ok: true });
  }
  if (action === "unblock") {
    await query("DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2", [user.id, target_id]);
    return NextResponse.json({ ok: true });
  }
  if (action === "report") {
    await query("INSERT INTO reports (reporter_id, reported_id, reason, details) VALUES ($1, $2, $3, $4)",
      [user.id, target_id, reason, details || ""]);
    return NextResponse.json({ ok: true });
  }
  if (action === "favorite") {
    await query("INSERT INTO favorites (user_id, fav_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user.id, target_id]);
    return NextResponse.json({ ok: true });
  }
  if (action === "unfavorite") {
    await query("DELETE FROM favorites WHERE user_id = $1 AND fav_user_id = $2", [user.id, target_id]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "অজানা" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "favorites") {
    const r = await query(
      `SELECT u.id, u.name, u.gender, p.age, p.district, p.photo1 FROM favorites f
       JOIN users u ON f.fav_user_id = u.id LEFT JOIN profiles p ON u.id = p.user_id
       WHERE f.user_id = $1`, [user.id]
    );
    return NextResponse.json({ favorites: r.rows });
  }
  if (type === "visitors") {
    const r = await query(
      `SELECT u.id, u.name, p.age, p.photo1, v.created_at FROM profile_views v
       JOIN users u ON v.viewer_id = u.id LEFT JOIN profiles p ON u.id = p.user_id
       WHERE v.viewed_id = $1 ORDER BY v.created_at DESC LIMIT 50`, [user.id]
    );
    return NextResponse.json({ visitors: r.rows });
  }
  if (type === "blocks") {
    const r = await query("SELECT blocked_id FROM blocks WHERE blocker_id = $1", [user.id]);
    return NextResponse.json({ blocks: r.rows.map((x: any) => x.blocked_id) });
  }
  return NextResponse.json({ error: "অজানা" }, { status: 400 });
}
