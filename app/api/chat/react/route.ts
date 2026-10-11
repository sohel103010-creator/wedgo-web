export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, ensureSchemaAndSeed, query } from "@/lib/auth";

// Toggle a reaction on a message (tap same emoji again to remove)
export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  try {
    await ensureSchemaAndSeed();
    const { message_id, emoji } = await req.json();
    if (!message_id || !emoji) return NextResponse.json({ error: "তথ্য অসম্পূর্ণ" }, { status: 400 });

    // Only participants of the conversation may react
    const m = await query("SELECT sender_id, receiver_id FROM messages WHERE id = $1", [message_id]);
    if (!m.rows[0] || (m.rows[0].sender_id !== user.id && m.rows[0].receiver_id !== user.id)) {
      return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
    }

    const existing = await query("SELECT emoji FROM message_reactions WHERE message_id = $1 AND user_id = $2", [message_id, user.id]);
    if (existing.rows[0]?.emoji === emoji) {
      await query("DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2", [message_id, user.id]);
      return NextResponse.json({ ok: true, removed: true });
    }
    await query(
      `INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = $3`,
      [message_id, user.id, emoji]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "ব্যর্থ: " + e.message }, { status: 500 });
  }
}
