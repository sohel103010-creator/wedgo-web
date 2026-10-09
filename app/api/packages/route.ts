export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchemaAndSeed, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await ensureSchemaAndSeed();
  const pkgs = await query("SELECT * FROM packages WHERE active = TRUE ORDER BY sort_order");
  const settings: any = {};
  const s = await query("SELECT key, value FROM settings WHERE key IN ('bkash_number','nagad_number','rocket_number')");
  for (const row of s.rows) settings[row.key] = row.value;

  const extra = [
    { label: "১০ মিনিট ভিডিও কল", price: 510 },
    { label: "২০ মিনিট ভিডিও কল", price: 1020 },
    { label: "৩০ মিনিট ভিডিও কল", price: 2040 },
    { label: "৪০ মিনিট ভিডিও কল", price: 3000 },
  ];

  return NextResponse.json({ packages: pkgs.rows, settings, extra });
}
