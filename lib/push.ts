import webpush from "web-push";
import { query } from "./auth";

const PUB = process.env.VAPID_PUBLIC_KEY || "";
const PRIV = process.env.VAPID_PRIVATE_KEY || "";

if (PUB && PRIV) {
  try {
    webpush.setVapidDetails("mailto:wedgo@zenera.top", PUB, PRIV);
  } catch {}
}

export function pushConfigured() {
  return !!(PUB && PRIV);
}

/** Fire-and-forget web push to all of a user's subscribed devices. */
export async function sendPush(userId: number, title: string, body: string, url = "/chat") {
  if (!PUB || !PRIV) return;
  try {
    const subs = await query("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1", [userId]);
    await Promise.all(
      subs.rows.map((s: any) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title, body, url })
          )
          .catch(async (e: any) => {
            // Prune dead subscriptions
            if (e?.statusCode === 404 || e?.statusCode === 410) {
              await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [s.endpoint]).catch(() => {});
            }
          })
      )
    );
  } catch {}
}
