export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchemaAndSeed, checkPassword, signToken, queryOne } from "@/lib/auth";
import { normalizePhone, legacyVariants } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    await ensureSchemaAndSeed();
    const { mobile: rawMobile, password, email } = await req.json();

    if (!rawMobile) {
      return NextResponse.json({ error: "মোবাইল নম্বর দিন" }, { status: 400 });
    }

    const mobile = normalizePhone(rawMobile);
    let user = await queryOne("SELECT * FROM users WHERE mobile = $1", [mobile]);
    // Fallback for accounts created before E.164 normalization
    if (!user) {
      for (const v of legacyVariants(mobile)) {
        user = await queryOne("SELECT * FROM users WHERE mobile = $1", [v]);
        if (user) break;
      }
    }
    if (!user) {
      return NextResponse.json({ error: "এই নম্বরে কোনো অ্যাকাউন্ট নেই" }, { status: 404 });
    }

    if (user.status === "suspended" && user.suspended_until && new Date(user.suspended_until) > new Date()) {
      return NextResponse.json({ error: "আপনার আইডি স্থগিত আছে" }, { status: 403 });
    }

    // Login via phone + password
    if (password) {
      if (!user.password_hash || !(await checkPassword(password, user.password_hash))) {
        return NextResponse.json({ error: "পাসওয়ার্ড ভুল" }, { status: 401 });
      }
    }
    // Login via phone + email
    else if (email) {
      if (user.email.toLowerCase() !== email.toLowerCase().trim()) {
        return NextResponse.json({ error: "ইমেইল মিলছে না" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "পাসওয়ার্ড বা ইমেইল দিন" }, { status: 400 });
    }

    const token = signToken({ id: user.id, role: user.role });
    const res = NextResponse.json({
      ok: true, token,
      user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, gender: user.gender, role: user.role }
    });
    res.cookies.set("wedgo_token", token, { httpOnly: true, maxAge: 30 * 24 * 3600, path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "লগইন ব্যর্থ" }, { status: 500 });
  }
}
