export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";

// Simple AI check: validate trx_id format
function aiCheckTrx(trxId: string, method: string): string {
  if (!trxId || trxId.length < 6) return "suspicious";
  // bKash/nagad trx IDs are typically 10 alphanumeric chars
  if (/^[A-Z0-9]{8,12}$/i.test(trxId.trim())) return "likely_valid";
  return "suspicious";
}

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const { package_id, extra_label, amount, method, sender_number, trx_id } = await req.json();
  if ((!package_id && !extra_label) || !method || !sender_number || !trx_id) {
    return NextResponse.json({ error: "সব তথ্য দিন" }, { status: 400 });
  }

  // Extra minutes: only for package 3 & 4 holders (price >= 2000)
  if (extra_label && extra_label.includes("মিনিট")) {
    const sub = await getActiveSubscription(user.id);
    if (!sub || (sub.price || 0) < 2000) {
      return NextResponse.json({ error: "এক্সট্রা মিনিট শুধু গোল্ড/প্লাটিনাম প্যাকেজের জন্য" }, { status: 403 });
    }
  }

  const ai_check = aiCheckTrx(trx_id, method);

  await query(
    `INSERT INTO payments (user_id, package_id, extra_label, amount, method, sender_number, trx_id, ai_check)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, package_id || null, extra_label || null, amount, method, sender_number.trim(), trx_id.trim().toUpperCase(), ai_check]
  );

  return NextResponse.json({ ok: true, ai_check });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const r = await query(
    `SELECT p.*, pk.name as package_name FROM payments p
     LEFT JOIN packages pk ON p.package_id = pk.id
     WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 20`,
    [user.id]
  );
  return NextResponse.json({ payments: r.rows });
}
