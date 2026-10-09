export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query, queryOne } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { liked_id } = await req.json();

  // Check monthly limit: 5 likes per month
  const count = await queryOne(
    "SELECT COUNT(*) as c FROM likes WHERE liker_id = $1 AND created_at > NOW() - INTERVAL '30 days'",
    [user.id]
  );
  if ((count?.c || 0) >= 5) {
    return NextResponse.json({ error: "এই মাসে ৫টি লাভ রিয়াক্ট শেষ! পরের মাসে আবার পারবেন।" }, { status: 403 });
  }

  try {
    await query("INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)", [user.id, liked_id]);
  } catch { return NextResponse.json({ error: "ইতিমধ্যে রিয়াক্ট দিয়েছেন" }, { status: 400 }); }

  await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, 'নতুন লাভ রিয়াক্ট ❤️', $2, 'like')",
    [liked_id, `${user.name} আপনাকে পছন্দ করেছেন`]);

  // Check mutual like
  const mutual = await queryOne("SELECT id FROM likes WHERE liker_id = $1 AND liked_id = $2", [liked_id, user.id]);

  return NextResponse.json({ ok: true, mutual: !!mutual });
}
