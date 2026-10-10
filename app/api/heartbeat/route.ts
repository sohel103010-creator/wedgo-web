export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  // Lightweight: only update if older than 2 min
  await query(
    "UPDATE profiles SET last_active = NOW() WHERE user_id = $1 AND (last_active IS NULL OR last_active < NOW() - INTERVAL '2 minutes')",
    [user.id]
  );
  return NextResponse.json({ ok: true });
}
