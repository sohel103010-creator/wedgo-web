"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import InstallPrompt from "../components/InstallPrompt";
import { useLang, Nav } from "@/lib/i18n";

export default function Dashboard() {
  const { t, lang } = useLang();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [dailyMatches, setDailyMatches] = useState<any[]>([]);
  const [expiryWarn, setExpiryWarn] = useState("");
  const [pushOn, setPushOn] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  function urlB64ToU8(base64: string) {
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  async function enablePush() {
    setPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushLoading(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await fetch("/api/push/vapid").then((r) => r.json());
      if (!publicKey) throw new Error("no key");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToU8(publicKey),
      });
      const token = localStorage.getItem("wedgo_token");
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(sub.toJSON()),
      });
      if ((await r.json()).ok) setPushOn(true);
    } catch {}
    setPushLoading(false);
  }

  useEffect(() => {
    // If already subscribed, show the "on" state
    (async () => {
      try {
        if ("serviceWorker" in navigator && Notification.permission === "granted") {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) setPushOn(true);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (token) {
      fetch("/api/recommended", { headers: { Authorization: "Bearer " + token } })
        .then((r) => r.json()).then((d) => setRecommended(d.recommended || []));
      fetch("/api/daily-matches", { headers: { Authorization: "Bearer " + token } })
        .then((r) => r.json()).then((d) => setDailyMatches(d.matches || []));
      // Check subscription expiry
      fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then((d) => {
        const sub = d?.subscription;
        if (sub?.expiry_date) {
          const days = Math.ceil((new Date(sub.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (days <= 7 && days > 0) {
            setExpiryWarn(t("dash.expiryDays", { n: days }));
          } else if (days <= 0) {
            setExpiryWarn(t("dash.expired"));
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); });

    // Heartbeat every 60s (lightweight, keeps online status fresh)
    const beat = () => fetch("/api/heartbeat", {
      method: "POST", headers: { Authorization: "Bearer " + token }
    }).catch(() => {});
    beat();
    const hb = setInterval(beat, 60000);
    return () => clearInterval(hb);
  }, []);

  function logout() {
    localStorage.removeItem("wedgo_token");
    localStorage.removeItem("wedgo_role");
    window.location.href = "/";
  }

  if (loading) return <div className="container center" style={{ paddingTop: 60 }}>{t("common.loading")}</div>;
  if (!data?.user) return <div className="container center" style={{ paddingTop: 60 }}>{t("common.loginFirst")}</div>;

  const { user, profile, subscription, wallet } = data;
  const pct = profile?.completion_pct || 0;
  const isFemale = user.gender === "female";

  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="container page-pad">
      {expiryWarn && (
        <div className="alert" style={{ background: "rgba(255,152,0,0.2)", border: "1px solid #ff9800", borderRadius: 12, padding: 12, marginBottom: 12, textAlign: "center", fontWeight: 700 }}>
          {expiryWarn} <Link href="/packages" style={{ color: "#f5a623" }}>{t("dash.renew")}</Link>
        </div>
      )}

      <InstallPrompt />
      {typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && (
        <div className="card mt center" style={{ padding: "10px" }}>
          {pushOn ? (
            <span className="small" style={{ color: "#4caf50", fontWeight: 700 }}>{t("push.on")}</span>
          ) : (
            <button className="btn btn-outline" onClick={enablePush} disabled={pushLoading} style={{ margin: 0 }}>
              {pushLoading ? t("common.loading") : t("push.enable")}
            </button>
          )}
        </div>
      )}
      <div className="row-between" style={{ marginTop: 10 }}>
        <h2>👋 {user.name}</h2>
        <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>{t("dash.logout")}</button>
      </div>

      {/* Profile completion */}
      <div className="card mt">
        <div className="row-between">
          <strong>{t("dash.profileDone", { n: pct })}</strong>
          <Link href="/profile" style={{ color: "#e91e63", fontSize: 14 }}>{t("common.update")}</Link>
        </div>
        <div className="progress-bar mt"><div style={{ width: pct + "%" }}></div></div>
        {pct < 80 && <p className="small mt">{t("dash.bonus80")}</p>}
      </div>

      {/* Subscription status */}
      <div className="card">
        {subscription ? (
          <>
            <div className="row-between">
              <strong>📦 {subscription.package_name}</strong>
              <span className="badge badge-premium">{t("common.daysLeft", { n: daysLeft })}</span>
            </div>
            <p className="small mt">{t("dash.expiryDate", { d: new Date(subscription.expires_at).toLocaleDateString(lang === "en" ? "en-GB" : "bn-BD") })}</p>
            {(subscription.audio_minutes > 0 || subscription.video_minutes > 0) && (
              <p className="small">{t("dash.audioLeft", { n: subscription.audio_minutes - (subscription.audio_used || 0) })} | {t("dash.videoLeft", { n: subscription.video_minutes - (subscription.video_used || 0) })}</p>
            )}
          </>
        ) : (
          <>
            <div className="alert alert-warn">
              {isFemale ? t("dash.femaleAll") : t("dash.noPremium")}
            </div>
            {!isFemale && <Link href="/packages" className="btn btn-gold center">{t("dash.buyPremium")}</Link>}
          </>
        )}
      </div>

      {/* Wallet */}
      <div className="card">
        <div className="row-between">
          <strong>{t("dash.walletBal", { n: wallet?.balance || 0 })}</strong>
          <Link href="/wallet" style={{ color: "#f5a623", fontSize: 14 }}>{t("common.details")}</Link>
        </div>
        {isFemale && <p className="small mt">{t("dash.totalEarn", { n: wallet?.total_earned || 0 })}</p>}
      </div>

      {/* Quick links */}
      <div className="stat-grid">
        <Link href="/partners" className="card stat"><div className="num">💑</div><div className="lbl">{t("dash.findPartner")}</div></Link>
        <Link href="/chat" className="card stat"><div className="num">💬</div><div className="lbl">{t("dash.messages")}</div></Link>
        <Link href="/profile" className="card stat"><div className="num">👤</div><div className="lbl">{t("dash.profile")}</div></Link>
        <Link href="/wallet" className="card stat"><div className="num">💰</div><div className="lbl">{t("dash.wallet")}</div></Link>
      </div>

      {dailyMatches.length > 0 && (
        <div className="card" style={{ border: "1px solid #e91e63" }}>
          <h3>{t("dash.todayMatch")}</h3>
          <p className="small">{t("dash.todayMatchSub")}</p>
          <div className="profile-grid mt">
            {dailyMatches.map((p: any) => (
              <Link key={p.id} href={`/partners/${p.id}`} className="pcard" style={{ textDecoration: "none", color: "inherit" }}>
                {p.photo1 ? <img src={p.photo1} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40 }}>👤</div>}
                <div className="info">
                  <div style={{ fontWeight: 700 }}>{p.name}{p.age ? `, ${p.age}` : ""}</div>
                  <div className="small" style={{ color: "#4caf50", fontWeight: 700 }}>{t("dash.matchPct", { n: p.compat })}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recommended.length > 0 && (
        <div className="card">
          <h3>💝 {t("dash.suggested")}</h3>
          <div className="profile-grid">
            {recommended.slice(0, 6).map((p: any) => (
              <Link key={p.id} href={`/partners/${p.id}`} className="pcard" style={{ textDecoration: "none", color: "inherit" }}>
                {p.photo1 ? <img src={p.photo1} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40 }}>👤</div>}
                <div className="info">
                  <div style={{ fontWeight: 700 }}>{p.name}{p.age ? `, ${p.age}` : ""}</div>
                  <div className="small" style={{ color: "#4caf50", fontWeight: 700 }}>{t("dash.matchPct", { n: p.compat })}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {user.referral_code && (
        <div className="card center">
          <p className="small">{t("dash.referralCode")}</p>
          <h3 style={{ color: "#f5a623", letterSpacing: 2 }}>{user.referral_code}</h3>
          <p className="small">{t("dash.referralBonus")}</p>
        </div>
      )}

      <Nav active="dashboard" />
    </div>
  );
}
