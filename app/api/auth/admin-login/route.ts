export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchemaAndSeed, signToken, queryOne } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureSchemaAndSeed();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "জিমেইল দিন" }, { status: 400 });
    }

    const admin = await queryOne("SELECT * FROM admins WHERE email = $1", [email.toLowerCase().trim()]);
    if (!admin) {
      return NextResponse.json({ error: "এই জিমেইল দিয়ে অ্যাডমিন লগইন সম্ভব নয়" }, { status: 403 });
    }

    // Admin login via Gmail only (no password) — email must be in admins table
    const token = signToken({ id: 0, role: "admin", adminId: admin.id, email: admin.email, isMain: admin.is_main });
    const res = NextResponse.json({
      ok: true, token,
      admin: { id: admin.id, email: admin.email, isMain: admin.is_main }
    });
    res.cookies.set("wedgo_token", token, { httpOnly: true, maxAge: 30 * 24 * 3600, path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "লগইন ব্যর্থ" }, { status: 500 });
  }
}
