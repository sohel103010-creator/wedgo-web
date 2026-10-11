"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const FAKE_PROFILES = [
  { name: "রিয়া", age: 24, district: "ঢাকা", emoji: "👩" },
  { name: "সাকিব", age: 28, district: "চট্টগ্রাম", emoji: "👨" },
  { name: "নুসরাত", age: 22, district: "সিলেট", emoji: "👩" },
  { name: "তানভীর", age: 30, district: "রাজশাহী", emoji: "👨" },
  { name: "মিম", age: 25, district: "খুলনা", emoji: "👩" },
  { name: "আরিফ", age: 27, district: "বরিশাল", emoji: "👨" },
];

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function adminLogin() {
    setMsg("");
    const r = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail }),
    });
    const d = await r.json();
    if (d.ok) {
      localStorage.setItem("wedgo_token", d.token);
      localStorage.setItem("wedgo_role", "admin");
      window.location.href = "/admin";
    } else {
      setMsg(d.error || "লগইন ব্যর্থ");
    }
  }

  useEffect(() => {
    const t = localStorage.getItem("wedgo_token");
    const role = localStorage.getItem("wedgo_role");
    if (t) {
      window.location.href = role === "admin" ? "/admin" : "/dashboard";
    }
  }, []);

  return (
    <div className="container">
      <div className="row-between" style={{ marginTop: 8 }}>
        <div style={{ width: 60 }}></div>
        <div></div>
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: 12 }}
        >
          🔐 অ্যাডমিন
        </button>
      </div>

      {showAdmin && (
        <div className="card mt">
          <h3 className="center">অ্যাডমিন লগইন</h3>
          <p className="small center" style={{ marginBottom: 12 }}>শুধুমাত্র অনুমোদিত জিমেইল দিয়ে লগইন</p>
          <input
            type="email"
            placeholder="অ্যাডমিন জিমেইল"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <button className="btn" onClick={adminLogin}>লগইন</button>
          {msg && <div className="alert alert-err">{msg}</div>}
        </div>
      )}

      <div className="logo">💒 WedGo</div>
      <p className="tagline">
        সারা বিশ্বে একমাত্র ম্যাট্রিমনি যেখানে শর্ট টাইম রিলেশন করে,
        অডিও কল, ভিডিও কলে কথা বলে জেনে বুঝে তারপর বিয়ে করা যায়
      </p>

      <div className="row" style={{ marginBottom: 20 }}>
        <Link href="/login" className="btn center" style={{ marginBottom: 0 }}>লগইন</Link>
        <Link href="/register" className="btn btn-outline center" style={{ marginBottom: 0 }}>রেজিস্ট্রেশন</Link>
      </div>

      <h3 className="center" style={{ marginBottom: 14 }}>💑 আমাদের সদস্যরা</h3>
      <div className="profile-grid">
        {FAKE_PROFILES.map((p, i) => (
          <div
            key={i}
            className="pcard blurred"
            onClick={() => alert("এই প্রোফাইলটি দেখতে রেজিস্ট্রেশন করুন")}
            style={{ cursor: "pointer" }}
          >
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, filter: "blur(8px)" }}>
              {p.emoji}
            </div>
            <div className="info">
              <div style={{ fontWeight: 700 }}>{p.name}, {p.age}</div>
              <div className="small">{p.district}</div>
              <div className="small" style={{ color: "#f5a623" }}>👁 দেখতে রেজিস্ট্রেশন করুন</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt center">
        <h3>✨ কেন WedGo?</h3>
        <div className="small" style={{ lineHeight: 2, marginTop: 8 }}>
          🎥 ভিডিও কলে কথা বলে সিদ্ধান্ত নিন<br />
          🔒 নিরাপদ ও ভেরিফায়েড প্রোফাইল<br />
          📞 HD অডিও/ভিডিও কল সিস্টেম
        </div>
      </div>

      <div className="card mt center" style={{ border: "1px solid #e91e63" }}>
        <h3>📱 WedGo অ্যাপ ডাউনলোড করুন</h3>
        <p className="small" style={{ marginTop: 8 }}>
          প্লে স্টোর ছাড়াই সরাসরি ডাউনলোড করুন — ওয়েবসাইটের সব ফিচার অ্যাপেই পাবেন
        </p>
        <a
          href="https://github.com/sohel103010-creator/wedgo-web/releases/download/v1.0-app/wedgo.apk"
          className="btn center"
          style={{ marginTop: 12, background: "#e91e63" }}
        >
          ⬇ অ্যাপ ডাউনলোড (v1.0)
        </a>
        <p className="small" style={{ marginTop: 10, opacity: 0.8 }}>
          ইনস্টল: ডাউনলোড → ফাইলে ট্যাপ → Install। প্রয়োজনে "Unknown sources" allow করুন।
        </p>
      </div>

      <p className="small center mt" style={{ paddingBottom: 20 }}>
        <a href="https://www.facebook.com/profile.php?id=61594689478770" target="_blank" style={{ color: "#e91e63" }}>📘 Facebook Page</a>
      </p>
    </div>
  );
}
