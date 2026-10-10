export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromReq, getActiveSubscription, query, queryOne } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromReq(req);
  const p = await queryOne(
    `SELECT u.id, u.name, u.gender, u.mobile, p.* FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1`,
    [params.id]
  );
  if (!p) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  // Profile view limit check for male users
  if (user && user.id != params.id && user.gender !== "female" && user.role !== "admin") {
    const sub = await getActiveSubscription(user.id);
    if (sub && !sub.unlimited_views && sub.profile_views) {
      // Count distinct profiles viewed during this subscription
      const views = await query(
        `SELECT COUNT(DISTINCT viewed_id) as cnt FROM profile_views
         WHERE viewer_id = $1 AND created_at > $2`,
        [user.id, sub.created_at]
      );
      const cnt = parseInt(views.rows[0]?.cnt || "0");
      // Check if already viewed this profile
      const alreadyViewed = await query(
        "SELECT 1 FROM profile_views WHERE viewer_id = $1 AND viewed_id = $2 AND created_at > $3 LIMIT 1",
        [user.id, params.id, sub.created_at]
      );
      if (cnt >= sub.profile_views && alreadyViewed.rows.length === 0) {
        return NextResponse.json({ error: `এই প্যাকেজে শুধুমাত্র ${sub.profile_views}টি প্রোফাইল দেখতে পারবেন` }, { status: 403 });
      }
    }
  }
  // Log profile view
  if (user && user.id != params.id) {
    await query("INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)", [user.id, params.id]);
    // Notify (only once per day per viewer to avoid spam)
    const recent = await query(
      "SELECT id FROM notifications WHERE user_id = $1 AND ntype = 'profile_view' AND body LIKE $2 AND created_at > NOW() - INTERVAL '1 day'",
      [params.id, `%${user.name}%`]
    );
    if (recent.rows.length === 0) {
      await query("INSERT INTO notifications (user_id, title, body, ntype) VALUES ($1, $2, $3, 'profile_view')",
        [params.id, "👁 কেউ প্রোফাইল দেখেছে", `${user.name} আপনার প্রোফাইল দেখেছেন`]);
    }
  }
  const { mobile, ...safe } = p;
  // Hide mobile unless premium with number share
  return NextResponse.json({ partner: safe });
}
