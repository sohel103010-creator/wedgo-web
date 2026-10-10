export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, query } from "@/lib/auth";

export async function GET() {
  const r = await query("SELECT * FROM success_stories WHERE active = TRUE ORDER BY created_at DESC");
  return NextResponse.json({ stories: r.rows });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  const { couple_names, story, photo } = await req.json();
  await query("INSERT INTO success_stories (couple_names, story, photo) VALUES ($1, $2, $3)", [couple_names, story, photo]);
  return NextResponse.json({ ok: true });
}
