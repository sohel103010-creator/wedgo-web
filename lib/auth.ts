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
  // Run migrations
  await query("UPDATE packages SET duration_days = 10, msg_days = 10 WHERE price = 100 AND duration_days != 10").catch(() => {});
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_online BOOLEAN DEFAULT FALSE").catch(() => {});
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark'").catch(() => {});
  await query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS extra_label VARCHAR(100)").catch(() => {});
  // Dedupe packages: the seed INSERT has no UNIQUE target, so every cold start added 4 more rows (2026-10-10)
  await query("UPDATE subscriptions s SET package_id = k.keep_id FROM (SELECT MIN(id) AS keep_id, name, price FROM packages GROUP BY name, price) k JOIN packages p ON p.name = k.name AND p.price = k.price WHERE s.package_id = p.id AND s.package_id <> k.keep_id").catch(() => {});
  await query("UPDATE payments pmt SET package_id = k.keep_id FROM (SELECT MIN(id) AS keep_id, name, price FROM packages GROUP BY name, price) k JOIN packages p ON p.name = k.name AND p.price = k.price WHERE pmt.package_id = p.id AND pmt.package_id <> k.keep_id").catch(() => {});
  await query("DELETE FROM packages p USING packages q WHERE p.name = q.name AND p.price = q.price AND p.id > q.id").catch(() => {});
  await query("DO $$ BEGIN ALTER TABLE packages ADD CONSTRAINT packages_name_price_unique UNIQUE (name, price); EXCEPTION WHEN duplicate_object THEN NULL; END $$").catch(() => {});
  await query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to INTEGER").catch(() => {});
  await query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE").catch(() => {});
  await query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE").catch(() => {});
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP").catch(() => {});
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selfie_photo TEXT").catch(() => {});
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'none'").catch(() => {});
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_bonus_date DATE").catch(() => {});
  // Chat requests
  await query(`CREATE TABLE IF NOT EXISTS chat_requests (
    id SERIAL PRIMARY KEY, sender_id INTEGER REFERENCES users(id), receiver_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
  )`).catch(() => {});
  // Gifts
  await query(`CREATE TABLE IF NOT EXISTS gifts (
    id SERIAL PRIMARY KEY, name VARCHAR(50), emoji VARCHAR(10), price INTEGER, active BOOLEAN DEFAULT TRUE
  )`).catch(() => {});
  await query(`CREATE TABLE IF NOT EXISTS gift_sends (
    id SERIAL PRIMARY KEY, sender_id INTEGER REFERENCES users(id), receiver_id INTEGER REFERENCES users(id),
    gift_id INTEGER REFERENCES gifts(id), created_at TIMESTAMP DEFAULT NOW()
  )`).catch(() => {});
  // Seed gifts
  await query(`INSERT INTO gifts (name, emoji, price) VALUES
    ('গোলাপ', '🌹', 50), ('চকলেট', '🍫', 100), ('টেডি', '🧸', 200),
    ('হীরা', '💎', 500), ('মুকুট', '👑', 1000)
    ON CONFLICT DO NOTHING`).catch(() => {});
  // Coupons
  await query(`CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY, code VARCHAR(30) UNIQUE NOT NULL, discount_pct INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0, max_uses INTEGER DEFAULT 0, used_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
  )`).catch(() => {});
  // Success stories
  await query(`CREATE TABLE IF NOT EXISTS success_stories (
    id SERIAL PRIMARY KEY, couple_names VARCHAR(200), story TEXT, photo TEXT,
    active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW()
  )`).catch(() => {});
}

// One-time migrations for existing databases
export async function runMigrations(): Promise<void> {
  await ensureSchemaAndSeed();
  // 100 Taka package -> 10 days (2026-10-10)
  await query("UPDATE packages SET duration_days = 10, msg_days = 10 WHERE price = 100 AND duration_days != 10");
  // Add new columns if not exist
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_online BOOLEAN DEFAULT FALSE");
  await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark'");
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
  if (user) {
    // Heartbeat: update last_active (throttled to every 2 min)
    query("UPDATE profiles SET last_active = NOW() WHERE user_id = $1 AND (last_active IS NULL OR last_active < NOW() - INTERVAL '2 minutes')", [user.id]).catch(() => {});
  }
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
