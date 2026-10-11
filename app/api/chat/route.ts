export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";
import { sendPush } from "@/lib/push";

// Check for spam: numbers, links (auto-delete + suspend logic handled in POST)
function containsBlocked(content: string, canShareNumber: boolean, canShareLink: boolean): string | null {
  // Convert Bengali/Arabic digits to English
  const bnDigits = "০১২৩৪৫৬৭৮৯";
  let normalized = content;
  for (let i = 0; i < 10; i++) {
    normalized = normalized.split(bnDigits[i]).join(String(i));
  }
  // Remove all separators: spaces, dashes, dots, parentheses, plus
  const digitsOnly = normalized.replace(/[\s\-().+]/g, "");
  if (!canShareNumber && /\d{6,}/.test(digitsOnly)) {
    return "number";
  }
  if (!canShareLink && /(https?:\/\/|www\.|\.com|\.net|\.org|\.bd|\.info|\.me|\.io|t\.me|bit\.ly|tinyurl|wa\.me|messenger\.com|facebook\.com|imo|whatsapp)/i.test(content)) {
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
    // Attach reactions
    const ids = r.rows.map((m: any) => m.id);
    let reactions: any[] = [];
    if (ids.length > 0) {
      const rr = await query(
        `SELECT message_id, emoji, COUNT(*)::int AS c FROM message_reactions
         WHERE message_id = ANY($1) GROUP BY message_id, emoji`,
        [ids]
      ).catch(() => ({ rows: [] as any[] }));
      reactions = (rr as any).rows;
    }
    const byMsg: Record<number, { emoji: string; c: number }[]> = {};
    for (const x of reactions) {
      (byMsg[x.message_id] = byMsg[x.message_id] || []).push({ emoji: x.emoji, c: x.c });
    }
    const messages = r.rows.map((m: any) => ({ ...m, reactions: byMsg[m.id] || [] }));
    return NextResponse.json({ messages });
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
    // Basic package: max 3 chat partners
    if (sub.max_chat_partners) {
      const partners = await query(
        `SELECT COUNT(DISTINCT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as cnt
         FROM messages WHERE sender_id = $1 OR receiver_id = $1`,
        [user.id]
      );
      const cnt = parseInt(partners.rows[0]?.cnt || "0");
      // Check if this receiver is already a partner
      const existing = await query(
        "SELECT 1 FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) LIMIT 1",
        [user.id, receiver_id]
      );
      if (cnt >= sub.max_chat_partners && existing.rows.length === 0) {
        return NextResponse.json({ error: `এই প্যাকেজে শুধুমাত্র ${sub.max_chat_partners} জনের সাথে কথা বলতে পারবেন` }, { status: 403 });
      }
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

  if (msg_type === "voice") {
    // Voice messages: only for package 3 & 4 (price >= 2000)
    let canVoice = isAdmin;
    if (isFemale) {
      const maleSub = await getActiveSubscription(receiver_id);
      canVoice = (maleSub?.price || 0) >= 2000;
    } else if (sub) {
      canVoice = (sub.price || 0) >= 2000;
    }
    if (!canVoice) {
      return NextResponse.json({ error: "ভয়েস মেসেজ পাঠাতে গোল্ড/প্লাটিনাম প্যাকেজ লাগবে" }, { status: 403 });
    }
  }

  // Female teaser limit: when the male has NO active subscription, she may send at most
  // 3 text messages (counted since his last subscription expired) — the hook that
  // makes him buy a package again to keep talking.
  if (isFemale && !isAdmin && (msg_type === "text" || !msg_type)) {
    const maleSub = await getActiveSubscription(receiver_id);
    if (!maleSub) {
      const lastSub = await queryOne(
        "SELECT expires_at FROM subscriptions WHERE user_id = $1 ORDER BY expires_at DESC LIMIT 1",
        [receiver_id]
      );
      const since = lastSub?.expires_at ?? null;
      const sent = await queryOne(
        `SELECT COUNT(*)::int AS c FROM messages WHERE sender_id = $1 AND receiver_id = $2 AND (msg_type = 'text' OR msg_type IS NULL)${since ? " AND created_at > $3" : ""}`,
        since ? [user.id, receiver_id, since] : [user.id, receiver_id]
      );
      if ((sent?.c || 0) >= 3) {
        return NextResponse.json({ error: "তিনি প্যাকেজ কিনলে আবার কথা বলতে পারবেন 💛" }, { status: 403 });
      }
    }
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

  // Web push (fire-and-forget)
  const preview = msg_type === "text" ? content.trim().slice(0, 60) : msg_type === "photo" ? "📷 ছবি" : msg_type === "voice" ? "🎤 ভয়েস মেসেজ" : "মেসেজ";
  sendPush(receiver_id, `💬 ${user.name}`, preview, "/chat").catch(() => {});

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
