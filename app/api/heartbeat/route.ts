export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query, queryOne } from "@/lib/auth";
import { sendPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  // Detect "just came online": last_active was null or > 5 min ago
  const prev = await queryOne("SELECT last_active, hide_online FROM profiles WHERE user_id = $1", [user.id]).catch(() => null);
  const wasOffline = !prev?.last_active || (Date.now() - new Date(prev.last_active).getTime() > 5 * 60 * 1000);

  // Lightweight: only update if older than 2 min
  await query(
    "UPDATE profiles SET last_active = NOW() WHERE user_id = $1 AND (last_active IS NULL OR last_active < NOW() - INTERVAL '2 minutes')",
    [user.id]
  );

  // Notify admirers once per online session (respect hide_online, 12h dedup)
  if (wasOffline && !prev?.hide_online) {
    notifyAdmirers(user.id, user.name).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}

async function notifyAdmirers(onlineUserId: number, name: string) {
  await query(`CREATE TABLE IF NOT EXISTS online_pings (
    id SERIAL PRIMARY KEY, admirer_id INT REFERENCES users(id) ON DELETE CASCADE,
    online_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT NOW()
  )`).catch(() => {});

  const r = await query(
    `SELECT DISTINCT s.user_id AS admirer FROM (
       SELECT user_id FROM favorites WHERE fav_user_id = $1
       UNION
       SELECT liker_id AS user_id FROM likes WHERE liked_id = $1
     ) s
     WHERE NOT EXISTS (
       SELECT 1 FROM online_pings
       WHERE admirer_id = s.user_id AND online_user_id = $1
       AND sent_at > NOW() - INTERVAL '12 hours'
     )`,
    [onlineUserId]
  ).catch(() => ({ rows: [] as any[] }));

  for (const row of (r as any).rows) {
    await sendPush(
      row.admirer,
      `🟢 ${name}`,
      "অনলাইনে এসেছে • is online now — এখনই কথা বলুন 💬",
      "/chat"
    ).catch(() => {});
    await query("INSERT INTO online_pings (admirer_id, online_user_id) VALUES ($1, $2)", [row.admirer, onlineUserId]).catch(() => {});
  }
}
