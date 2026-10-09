import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { query, queryOne } from "./db";

export { query, queryOne };

const JWT_SECRET = process.env.JWT_SECRET || "wedgo-secret-key-2026";

let seeded = false;

export async function ensureSchemaAndSeed(): Promise<void> {
  if (seeded) return;
  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  const statements = schema.split(/;\s*\n/).map((s) => s.trim()).filter((s) => s.length > 0);
  for (const stmt of statements) {
    try { await query(stmt); } catch (e: any) { /* ignore dup errors */ }
  }
  seeded = true;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function signToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): any | null {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

export function getTokenFromReq(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/wedgo_token=([^;]+)/);
  return m ? m[1] : null;
}

export async function getUserFromReq(req: Request) {
  await ensureSchemaAndSeed();
  const token = getTokenFromReq(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await queryOne("SELECT * FROM users WHERE id = $1", [payload.id]);
  return user;
}

export async function isAdminEmail(email: string): Promise<boolean> {
  await ensureSchemaAndSeed();
  const row = await queryOne("SELECT id FROM admins WHERE email = $1", [email.toLowerCase()]);
  return !!row;
}

export async function getActiveSubscription(userId: number) {
  const sub = await queryOne(
    `SELECT s.*, p.name as package_name, p.price, p.audio_minutes, p.video_minutes,
            p.photo_share, p.number_share, p.link_share, p.profile_views,
            p.unlimited_views, p.unlimited_msg, p.msg_only
     FROM subscriptions s JOIN packages p ON s.package_id = p.id
     WHERE s.user_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
     ORDER BY s.expires_at DESC LIMIT 1`,
    [userId]
  );
  return sub;
}

export function canMessage(sub: any): boolean {
  return !!sub;
}

export function canAudioCall(sub: any): boolean {
  return !!sub && (sub.audio_minutes || 0) > 0 && (sub.audio_used || 0) < sub.audio_minutes;
}

export function canVideoCall(sub: any): boolean {
  return !!sub && (sub.video_minutes || 0) > 0 && (sub.video_used || 0) < sub.video_minutes;
}

export function canSharePhoto(sub: any): boolean {
  return !!sub && !!sub.photo_share;
}

export function canShareNumber(sub: any): boolean {
  return !!sub && !!sub.number_share;
}
