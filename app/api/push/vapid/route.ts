export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// Exposes ONLY the public VAPID key (safe for browsers)
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY || "";
  if (!key) return NextResponse.json({ error: "push not configured" }, { status: 503 });
  return NextResponse.json({ publicKey: key });
}
