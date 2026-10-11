"use client";
import { useState } from "react";
import Link from "next/link";
import { COUNTRY_CODES, composePhone } from "@/lib/phone";

export default function Register() {
  const [form, setForm] = useState({ name: "", mobile: "", cc: "880", email: "", password: "", gender: "male", referral: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) { setForm({ ...form, [k]: v }); }

  async function doRegister() {
    setMsg(""); setLoading(true);
    try {
      const mobile = composePhone(form.cc, form.mobile);
      if (mobile.replace(/\D/g, "").length < 8) {
        setMsg("সঠিক মোবাইল নম্বর দিন");
        setLoading(false);
        return;
      }
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mobile }),
      });
      const d = await r.json();
      if (d.ok) {
        localStorage.setItem("wedgo_token", d.token);
        localStorage.setItem("wedgo_role", "member");
        window.location.href = "/dashboard";
      } else {
        setMsg(d.error || "রেজিস্ট্রেশন ব্যর্থ");
      }
    } catch { setMsg("নেটওয়ার্ক সমস্যা"); }
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="logo" style={{ fontSize: 28 }}>💒 WedGo</div>
      <h2 className="title">রেজিস্ট্রেশন</h2>
      <p className="subtitle">ফ্রি রেজিস্ট্রেশন করুন</p>

      <div className="card">
        <input placeholder="আপনার নাম" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={form.cc} onChange={(e) => set("cc", e.target.value)} style={{ maxWidth: 128 }}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
            ))}
          </select>
          <input placeholder="মোবাইল নম্বর" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} inputMode="numeric" style={{ flex: 1 }} />
        </div>
        <input type="email" placeholder="জিমেইল" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <input type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" value={form.password} onChange={(e) => set("password", e.target.value)} />
        <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="male">👨 ছেলে</option>
          <option value="female">👩 মেয়ে</option>
        </select>
        <input placeholder="রেফারেল কোড (যদি থাকে)" value={form.referral} onChange={(e) => set("referral", e.target.value)} />

        <button className="btn" onClick={doRegister} disabled={loading}>
          {loading ? "অপেক্ষা করুন..." : "রেজিস্ট্রেশন সম্পন্ন করুন"}
        </button>
        {msg && <div className="alert alert-err">{msg}</div>}

        <p className="center mt">
          <Link href="/login" style={{ color: "#f5a623", fontSize: 14 }}>ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন</Link>
        </p>
      </div>
      <div className="center"><Link href="/" className="small">← হোমে ফিরুন</Link></div>
    </div>
  );
}
