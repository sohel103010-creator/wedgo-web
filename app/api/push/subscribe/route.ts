export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, ensureSchemaAndSeed, query } from "@/lib/auth";

// Save a push subscription
export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  try {
    await ensureSchemaAndSeed();
    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "তথ্য অসম্পূর্ণ" }, { status: 400 });
    }
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
      [user.id, endpoint, keys.p256dh, keys.auth]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "ব্যর্থ: " + e.message }, { status: 500 });
  }
}

// Remove a push subscription
export async function DELETE(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({}));
  if (endpoint) {
    await query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [user.id, endpoint]).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
