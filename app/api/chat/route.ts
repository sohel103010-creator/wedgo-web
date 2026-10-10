export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query } from "@/lib/auth";

// Check for spam: numbers, links (auto-delete + suspend logic handled in POST)
function containsBlocked(content: string, canShareNumber: boolean, canShareLink: boolean): string | null {
  if (!canShareNumber && /\d{6,}/.test(content.replace(/[\s-]/g, ""))) {
    return "number";
  }
  if (!canShareLink && /(https?:\/\/|www\.|\.com|\.net|\.org)/i.test(content)) {
    return "link";
  }
  return null;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUser = searchParams.get("with");

  if (withUser) {
    const r = await query(
      `SELECT m.*, u.name as sender_name FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
       AND NOT (m.sender_id = $1 AND m.deleted_by_sender = TRUE)
       AND NOT (m.receiver_id = $1 AND m.deleted_by_receiver = TRUE)
       ORDER BY m.created_at ASC LIMIT 100`,
      [user.id, withUser]
    );
    await query("UPDATE messages SET seen = TRUE WHERE sender_id = $1 AND receiver_id = $2", [withUser, user.id]);
    return NextResponse.json({ messages: r.rows });
  }

  // Chat list
  const r = await query(
    `SELECT DISTINCT
       CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as user_id,
       u.name, p.photo1,
       (SELECT content FROM messages WHERE ((sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)) ORDER BY created_at DESC LIMIT 1) as last_msg,
       (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = $1 AND seen = FALSE) as unread
     FROM messages m
     JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE m.sender_id = $1 OR m.receiver_id = $1
     ORDER BY user_id`,
    [user.id]
  );
  return NextResponse.json({ chats: r.rows });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { receiver_id, content, msg_type } = await req.json();
  if (!receiver_id || !content?.trim()) {
    return NextResponse.json({ error: "মেসেজ লিখুন" }, { status: 400 });
  }

  // Check subscription for male users
  const sub = await getActiveSubscription(user.id);
  const isFemale = user.gender === "female";
  const isAdmin = user.role === "admin";

  if (!isFemale && !isAdmin) {
    if (!sub) {
      return NextResponse.json({ error: "মেসেজ করতে প্রিমিয়াম প্যাকেজ কিনুন" }, { status: 403 });
    }
  }

  // For female: check the male's subscription to determine permissions
  let canNum = isAdmin, canLink = isAdmin, canPhoto = isAdmin;
  if (isFemale) {
    const maleSub = await getActiveSubscription(receiver_id);
    canNum = !!maleSub?.number_share;
    canLink = !!maleSub?.link_share;
    canPhoto = !!maleSub?.photo_share;
  } else if (sub) {
    canNum = !!sub.number_share;
    canLink = !!sub.link_share;
    canPhoto = !!sub.photo_share;
  }

  if (msg_type === "photo" && !canPhoto) {
    return NextResponse.json({ error: "ছবি শেয়ার করতে উচ্চতর প্যাকেজ লাগবে" }, { status: 403 });
  }

  if (msg_type === "voice" && !canPhoto) {
    return NextResponse.json({ error: "ভয়েস মেসেজ পাঠাতে উচ্চতর প্যাকেজ লাগবে" }, { status: 403 });
  }

  const blocked = containsBlocked(content, canNum, canLink);
  if (blocked) {
    // Auto-suspend for 2 days
    await query("UPDATE users SET status = 'suspended', suspended_until = NOW() + INTERVAL '2 days' WHERE id = $1", [user.id]);
    return NextResponse.json({ error: blocked === "number" ? "নম্বর শেয়ার নিষিদ্ধ! আইডি ২ দিনের জন্য স্থগিত করা হয়েছে।" : "লিংক শেয়ার নিষিদ্ধ! আইডি ২ দিনের জন্য স্থগিত করা হয়েছে।" }, { status: 403 });
  }

  await query(
    "INSERT INTO messages (sender_id, receiver_id, content, msg_type) VALUES ($1, $2, $3, $4)",
    [user.id, receiver_id, content.trim(), msg_type || "text"]
  );

  // Notification
  await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'message')",
    [receiver_id, "নতুন মেসেজ", `${user.name} মেসেজ পাঠিয়েছেন`]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const forEveryone = searchParams.get("all") === "1";
  if (forEveryone) {
    await query("UPDATE messages SET content = '[ডিলিট করা হয়েছে]', msg_type = 'text' WHERE id = $1 AND sender_id = $2", [id, user.id]);
  } else {
    await query("UPDATE messages SET deleted = TRUE WHERE id = $1 AND sender_id = $2", [id, user.id]);
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { id, pinned } = await req.json();
  await query("UPDATE messages SET pinned = $1 WHERE id = $2 AND sender_id = $3", [pinned, id, user.id]);
  return NextResponse.json({ ok: true });
}
