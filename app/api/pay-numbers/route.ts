export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { query } from "@/lib/auth";

// Lightweight: just payment numbers, no schema check
export async function GET() {
  try {
    const s = await query("SELECT key, value FROM settings WHERE key IN ('bkash_number','nagad_number','rocket_number')");
    const settings: any = {};
    for (const row of s.rows) settings[row.key] = row.value;
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ bkash_number: "01301275001", nagad_number: "01301275001", rocket_number: "013012750018" });
  }
}
