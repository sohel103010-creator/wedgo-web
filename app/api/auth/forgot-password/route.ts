export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchemaAndSeed, hashPassword, query, queryOne } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureSchemaAndSeed();
    const { mobile, email, newPassword } = await req.json();
    if (!mobile || !email || !newPassword) {
      return NextResponse.json({ error: "সব তথ্য দিন" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }, { status: 400 });
    }
    const user = await queryOne("SELECT * FROM users WHERE mobile = $1", [mobile.trim()]);
    if (!user || user.email.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: "তথ্য মিলছে না" }, { status: 404 });
    }
    const hash = await hashPassword(newPassword);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
