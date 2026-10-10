export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  const sub = await getActiveSubscription(user.id);
  const wallet = await queryOne("SELECT * FROM wallet WHERE user_id = $1", [user.id]);

  return NextResponse.json({
    user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, gender: user.gender, role: user.role, referral_code: user.referral_code },
    profile, subscription: sub, wallet,
  });
}
