export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromReq, ensureSchemaAndSeed, query, queryOne } from "@/lib/auth";

async function checkAdmin(req: NextRequest) {
  await ensureSchemaAndSeed();
  const token = getTokenFromReq(req);
  if (!token) return null;
  const p = verifyToken(token);
  if (!p || p.role !== "admin") return null;
  const admin = await queryOne("SELECT * FROM admins WHERE id = $1", [p.adminId]);
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "stats";

  if (tab === "stats") {
    const totalUsers = await queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'member'");
    const maleUsers = await queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'member' AND gender = 'male'");
    const femaleUsers = await queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'member' AND gender = 'female'");
    const premium = await queryOne("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active' AND expires_at > NOW()");
    const pendingPay = await queryOne("SELECT COUNT(*) as c FROM payments WHERE status = 'pending'");
    const pendingWd = await queryOne("SELECT COUNT(*) as c FROM withdrawals WHERE status = 'pending'");
    const todayCalls = await queryOne("SELECT COUNT(*) as c, COALESCE(SUM(duration_sec),0) as secs FROM call_history WHERE started_at > NOW() - INTERVAL '1 day'");
    const revenue = await queryOne("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'approved'");
    return NextResponse.json({
      stats: {
        totalUsers: totalUsers?.c || 0, maleUsers: maleUsers?.c || 0, femaleUsers: femaleUsers?.c || 0,
        premium: premium?.c || 0, pendingPay: pendingPay?.c || 0, pendingWd: pendingWd?.c || 0,
        todayCalls: todayCalls?.c || 0, todaySecs: todayCalls?.secs || 0, revenue: revenue?.total || 0,
      }, admin: { email: admin.email, isMain: admin.is_main }
    });
  }

  if (tab === "users") {
    const q = searchParams.get("q") || "";
    const r = await query(
      `SELECT u.*, p.age, p.district, p.verified,
        (SELECT COUNT(*) FROM subscriptions WHERE user_id = u.id AND status = 'active' AND expires_at > NOW()) as has_premium
       FROM users u LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'member' AND (u.name ILIKE $1 OR u.mobile ILIKE $1 OR u.email ILIKE $1)
       ORDER BY u.created_at DESC LIMIT 100`, [`%${q}%`]
    );
    return NextResponse.json({ users: r.rows });
  }

  if (tab === "payments") {
    const r = await query(
      `SELECT p.*, u.name as user_name, u.mobile, pk.name as package_name
       FROM payments p JOIN users u ON p.user_id = u.id
       LEFT JOIN packages pk ON p.package_id = pk.id
       WHERE p.status = 'pending' ORDER BY p.created_at DESC`
    );
    return NextResponse.json({ payments: r.rows });
  }

  if (tab === "withdrawals") {
    const r = await query(
      `SELECT w.*, u.name as user_name FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'pending' ORDER BY w.created_at DESC`
    );
    return NextResponse.json({ withdrawals: r.rows });
  }

  if (tab === "calls") {
    const r = await query(
      `SELECT c.*, u1.name as caller_name, u2.name as receiver_name
       FROM call_history c
       JOIN users u1 ON c.caller_id = u1.id
       JOIN users u2 ON c.receiver_id = u2.id
       WHERE c.started_at > NOW() - INTERVAL '1 day'
       ORDER BY c.started_at DESC LIMIT 100`
    );
    return NextResponse.json({ calls: r.rows });
  }

  if (tab === "settings") {
    const r = await query("SELECT key, value FROM settings");
    const settings: any = {};
    for (const row of r.rows) settings[row.key] = row.value;
    const pkgs = await query("SELECT * FROM packages ORDER BY sort_order");
    return NextResponse.json({ settings, packages: pkgs.rows });
  }

  if (tab === "reports") {
    const r = await query(
      `SELECT r.*, u1.name as reporter_name, u2.name as reported_name
       FROM reports r JOIN users u1 ON r.reporter_id = u1.id
       JOIN users u2 ON r.reported_id = u2.id
       WHERE r.status = 'pending' ORDER BY r.created_at DESC`
    );
    return NextResponse.json({ reports: r.rows });
  }

  return NextResponse.json({ error: "অজানা ট্যাব" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });

  const { action, ...params } = await req.json();

  if (action === "approve_payment") {
    const pay = await queryOne("SELECT * FROM payments WHERE id = $1", [params.id]);
    if (!pay) return NextResponse.json({ error: "পেমেন্ট পাওয়া যায়নি" }, { status: 404 });
    await query("UPDATE payments SET status = 'approved' WHERE id = $1", [params.id]);
    // Activate subscription
    const pkg = await queryOne("SELECT * FROM packages WHERE id = $1", [pay.package_id]);
    const expires = new Date(Date.now() + (pkg?.duration_days || 30) * 86400000);
    await query(
      "INSERT INTO subscriptions (user_id, package_id, expires_at) VALUES ($1, $2, $3)",
      [pay.user_id, pay.package_id, expires]
    );
    await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, 'প্যাকেজ চালু!', $2, 'premium')",
      [pay.user_id, `${pkg?.name} প্যাকেজ চালু হয়েছে`]);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject_payment") {
    await query("UPDATE payments SET status = 'rejected', admin_note = $2 WHERE id = $1", [params.id, params.note || ""]);
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_withdrawal") {
    const wd = await queryOne("SELECT * FROM withdrawals WHERE id = $1", [params.id]);
    if (!wd) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
    await query("UPDATE withdrawals SET status = 'completed' WHERE id = $1", [params.id]);
    await query("UPDATE wallet SET total_withdrawn = total_withdrawn + $1 WHERE user_id = $2", [wd.amount, wd.user_id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject_withdrawal") {
    const wd = await queryOne("SELECT * FROM withdrawals WHERE id = $1", [params.id]);
    await query("UPDATE withdrawals SET status = 'rejected' WHERE id = $1", [params.id]);
    await query("UPDATE wallet SET balance = balance + $1 WHERE user_id = $2", [wd.amount, wd.user_id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "suspend_user") {
    const days = params.days || 2;
    await query("UPDATE users SET status = 'suspended', suspended_until = NOW() + ($1 || ' days')::INTERVAL WHERE id = $2", [days, params.user_id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "unsuspend_user") {
    await query("UPDATE users SET status = 'active', suspended_until = NULL WHERE id = $1", [params.user_id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "ban_user") {
    await query("UPDATE users SET status = 'banned' WHERE id = $1", [params.user_id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "update_setting") {
    if (!admin.is_main && ["bkash_number", "nagad_number", "rocket_number"].includes(params.key)) {
      return NextResponse.json({ error: "শুধুমাত্র মেইন অ্যাডমিন পেমেন্ট নম্বর বদলাতে পারবেন" }, { status: 403 });
    }
    await query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", [params.key, params.value]);
    return NextResponse.json({ ok: true });
  }

  if (action === "update_package") {
    await query("UPDATE packages SET price = $2 WHERE id = $1", [params.id, params.price]);
    return NextResponse.json({ ok: true });
  }

  if (action === "add_admin") {
    if (!admin.is_main) return NextResponse.json({ error: "শুধুমাত্র মেইন অ্যাডমিন" }, { status: 403 });
    await query("INSERT INTO admins (email, mobile, added_by) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      [params.email.toLowerCase(), params.mobile || null, admin.id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_admin") {
    if (!admin.is_main) return NextResponse.json({ error: "শুধুমাত্র মেইন অ্যাডমিন" }, { status: 403 });
    await query("DELETE FROM admins WHERE id = $1 AND is_main = FALSE", [params.id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "send_notification") {
    if (params.user_id === "all") {
      await query("INSERT INTO notifications (user_id, title, body, ntype) SELECT id, $1, $2, 'admin' FROM users WHERE role = 'member'",
        [params.title, params.body]);
    } else {
      await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'admin')",
        [params.user_id, params.title, params.body]);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "verify_user") {
    await query("UPDATE profiles SET verified = TRUE WHERE user_id = $1", [params.user_id]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "অজানা অ্যাকশন" }, { status: 400 });
}
