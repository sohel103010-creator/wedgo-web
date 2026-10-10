export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { receiver_id, action } = await req.json();

  if (action === "send") {
    await query(
      "INSERT INTO chat_requests (sender_id, receiver_id) VALUES ($1, $2) ON CONFLICT (sender_id, receiver_id) DO NOTHING",
      [user.id, receiver_id]
    );
    await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'chat_request')",
      [receiver_id, "💌 চ্যাট রিকোয়েস্ট", `${user.name} আপনার সাথে চ্যাট করতে চান`]);
    return NextResponse.json({ ok: true });
  }

  if (action === "accept") {
    await query("UPDATE chat_requests SET status = 'accepted' WHERE sender_id = $1 AND receiver_id = $2",
      [receiver_id, user.id]);
    await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'chat_request')",
      [receiver_id, "✅ রিকোয়েস্ট গৃহীত", `${user.name} আপনার চ্যাট রিকোয়েস্ট গ্রহণ করেছেন`]);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await query("UPDATE chat_requests SET status = 'rejected' WHERE sender_id = $1 AND receiver_id = $2",
      [receiver_id, user.id]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "অজানা" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  // Pending requests received
  const received = await query(
    `SELECT cr.*, u.name as sender_name, p.photo1 as sender_photo FROM chat_requests cr
     JOIN users u ON cr.sender_id = u.id LEFT JOIN profiles p ON u.id = p.user_id
     WHERE cr.receiver_id = $1 AND cr.status = 'pending' ORDER BY cr.created_at DESC`,
    [user.id]
  );
  // My sent requests
  const sent = await query("SELECT receiver_id, status FROM chat_requests WHERE sender_id = $1", [user.id]);

  return NextResponse.json({ received: received.rows, sent: sent.rows });
}
