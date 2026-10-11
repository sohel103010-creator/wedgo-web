"use client";
import { useState } from "react";
import Link from "next/link";
import { COUNTRY_CODES, composePhone } from "@/lib/phone";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [cc, setCc] = useState("880");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"password" | "email">("password");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    setMsg(""); setLoading(true);
    try {
      const fullMobile = composePhone(cc, mobile);
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "password" ? { mobile: fullMobile, password } : { mobile: fullMobile, email }),
      });
      const d = await r.json();
      if (d.ok) {
        localStorage.setItem("wedgo_token", d.token);
        localStorage.setItem("wedgo_role", "member");
        window.location.href = "/dashboard";
      } else {
        setMsg(d.error || "লগইন ব্যর্থ");
      }
    } catch { setMsg("নেটওয়ার্ক সমস্যা"); }
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="logo" style={{ fontSize: 28 }}>💒 WedGo</div>
      <h2 className="title">লগইন</h2>

      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <button className={mode === "password" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setMode("password")}>পাসওয়ার্ড দিয়ে</button>
          <button className={mode === "email" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setMode("email")}>জিমেইল দিয়ে</button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select value={cc} onChange={(e) => setCc(e.target.value)} style={{ maxWidth: 128 }}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
            ))}
          </select>
          <input placeholder="মোবাইল নম্বর" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" style={{ flex: 1 }} />
        </div>
        {mode === "password" ? (
          <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} />
        ) : (
          <input type="email" placeholder="জিমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}

        <button className="btn" onClick={doLogin} disabled={loading}>
          {loading ? "অপেক্ষা করুন..." : "লগইন"}
        </button>
        {msg && <div className="alert alert-err">{msg}</div>}

        <div className="row-between mt">
          <Link href="/forgot-password" style={{ color: "#e91e63", fontSize: 14 }}>পাসওয়ার্ড ভুলে গেছেন?</Link>
          <Link href="/register" style={{ color: "#f5a623", fontSize: 14 }}>রেজিস্ট্রেশন করুন</Link>
        </div>
      </div>
      <div className="center"><Link href="/" className="small">← হোমে ফিরুন</Link></div>
    </div>
  );
}
