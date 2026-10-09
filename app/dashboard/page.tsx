"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  function logout() {
    localStorage.removeItem("wedgo_token");
    localStorage.removeItem("wedgo_role");
    window.location.href = "/";
  }

  if (loading) return <div className="container center" style={{ paddingTop: 60 }}>লোড হচ্ছে...</div>;
  if (!data?.user) return <div className="container center" style={{ paddingTop: 60 }}>লগইন করুন</div>;

  const { user, profile, subscription, wallet } = data;
  const pct = profile?.completion_pct || 0;
  const isFemale = user.gender === "female";

  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="container page-pad">
      <div className="row-between" style={{ marginTop: 10 }}>
        <h2>👋 {user.name}</h2>
        <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>লগআউট</button>
      </div>

      {/* Profile completion */}
      <div className="card mt">
        <div className="row-between">
          <strong>প্রোফাইল সম্পূর্ণ: {pct}%</strong>
          <Link href="/profile" style={{ color: "#e91e63", fontSize: 14 }}>আপডেট করুন →</Link>
        </div>
        <div className="progress-bar mt"><div style={{ width: pct + "%" }}></div></div>
        {pct < 80 && <p className="small mt">৮০%+ সম্পূর্ণ করলে ২০ টাকা বোনাস!</p>}
      </div>

      {/* Subscription status */}
      <div className="card">
        {subscription ? (
          <>
            <div className="row-between">
              <strong>📦 {subscription.package_name}</strong>
              <span className="badge badge-premium">{daysLeft} দিন বাকি</span>
            </div>
            <p className="small mt">মেয়াদ শেষ: {new Date(subscription.expires_at).toLocaleDateString("bn-BD")}</p>
            {(subscription.audio_minutes > 0 || subscription.video_minutes > 0) && (
              <p className="small">🎙 অডিও: {subscription.audio_minutes - (subscription.audio_used || 0)} মিনিট বাকি | 📹 ভিডিও: {subscription.video_minutes - (subscription.video_used || 0)} মিনিট বাকি</p>
            )}
          </>
        ) : (
          <>
            <div className="alert alert-warn">
              {isFemale ? "💝 মেয়েদের জন্য সব ফ্রি!" : "আপনার কোনো প্রিমিয়াম প্যাকেজ নেই"}
            </div>
            {!isFemale && <Link href="/packages" className="btn btn-gold center">প্রিমিয়াম কিনুন</Link>}
          </>
        )}
      </div>

      {/* Wallet */}
      <div className="card">
        <div className="row-between">
          <strong>💰 ওয়ালেট ব্যালেন্স: ৳{wallet?.balance || 0}</strong>
          <Link href="/wallet" style={{ color: "#f5a623", fontSize: 14 }}>বিস্তারিত →</Link>
        </div>
        {isFemale && <p className="small mt">মোট আয়: ৳{wallet?.total_earned || 0}</p>}
      </div>

      {/* Quick links */}
      <div className="stat-grid">
        <Link href="/partners" className="card stat"><div className="num">💑</div><div className="lbl">পার্টনার খুঁজুন</div></Link>
        <Link href="/chat" className="card stat"><div className="num">💬</div><div className="lbl">মেসেজ</div></Link>
        <Link href="/profile" className="card stat"><div className="num">👤</div><div className="lbl">প্রোফাইল</div></Link>
        <Link href="/wallet" className="card stat"><div className="num">💰</div><div className="lbl">ওয়ালেট</div></Link>
      </div>

      {user.referral_code && (
        <div className="card center">
          <p className="small">আপনার রেফারেল কোড</p>
          <h3 style={{ color: "#f5a623", letterSpacing: 2 }}>{user.referral_code}</h3>
          <p className="small">বন্ধুকে আনুন, ৫০ টাকা বোনাস পান!</p>
        </div>
      )}

      <nav className="nav">
        <Link href="/dashboard" className="active"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>
    </div>
  );
}
