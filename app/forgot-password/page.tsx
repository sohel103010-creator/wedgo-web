"use client";
import { useState } from "react";
import Link from "next/link";
import { COUNTRY_CODES, composePhone } from "@/lib/phone";

export default function ForgotPassword() {
  const [mobile, setMobile] = useState("");
  const [cc, setCc] = useState("880");
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function reset() {
    setMsg("");
    const r = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: composePhone(cc, mobile), email, newPassword: newPw }),
    });
    const d = await r.json();
    if (d.ok) { setOk(true); setMsg("✅ পাসওয়ার্ড পরিবর্তন হয়েছে! এখন লগইন করুন।"); }
    else setMsg(d.error || "ব্যর্থ");
  }

  return (
    <div className="container">
      <div className="logo" style={{ fontSize: 28 }}>💒 WedGo</div>
      <h2 className="title">পাসওয়ার্ড রিসেট</h2>
      <div className="card">
        <div style={{ display: "flex", gap: 8 }}>
          <select value={cc} onChange={(e) => setCc(e.target.value)} style={{ maxWidth: 128 }}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
            ))}
          </select>
          <input placeholder="মোবাইল নম্বর" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ flex: 1 }} />
        </div>
        <input type="email" placeholder="রেজিস্ট্রেশনের জিমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="নতুন পাসওয়ার্ড" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        <button className="btn" onClick={reset}>পাসওয়ার্ড পরিবর্তন</button>
        {msg && <div className={ok ? "alert alert-ok" : "alert alert-err"}>{msg}</div>}
        {ok && <Link href="/login" className="btn center">লগইন করুন</Link>}
      </div>
      <div className="center"><Link href="/login" className="small">← লগইনে ফিরুন</Link></div>
    </div>
  );
}
