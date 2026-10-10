export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function GET() {
  const r = await query("SELECT * FROM coupons ORDER BY created_at DESC");
  return NextResponse.json({ coupons: r.rows });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  const { code, discount_pct, discount_amount, max_uses } = await req.json();
  await query(
    "INSERT INTO coupons (code, discount_pct, discount_amount, max_uses) VALUES ($1, $2, $3, $4)",
    [code.toUpperCase(), discount_pct || 0, discount_amount || 0, max_uses || 0]
  );
  return NextResponse.json({ ok: true });
}

// Validate coupon
export async function PUT(req: NextRequest) {
  const { code, amount } = await req.json();
  const r = await query("SELECT * FROM coupons WHERE code = $1 AND active = TRUE", [code.toUpperCase()]);
  const c = r.rows[0];
  if (!c) return NextResponse.json({ error: "ভুল কুপন কোড" }, { status: 400 });
  if (c.max_uses > 0 && c.used_count >= c.max_uses) return NextResponse.json({ error: "কুপন শেষ" }, { status: 400 });

  let discount = 0;
  if (c.discount_pct > 0) discount = Math.round((amount * c.discount_pct) / 100);
  else discount = c.discount_amount;

  return NextResponse.json({ ok: true, discount, final: amount - discount });
}
