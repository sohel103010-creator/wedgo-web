"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [me, setMe] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [payForm, setPayForm] = useState({ method: "bkash", sender_number: "", trx_id: "" });
  const [msg, setMsg] = useState("");
  const [extra, setExtra] = useState<any[]>([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetch("/api/packages").then((r) => r.json()).then((d) => {
      setPackages(d.packages || []); setSettings(d.settings || {}); setExtra(d.extra || []);
    });
    const token = localStorage.getItem("wedgo_token");
    if (token) fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then((d) => {
      setMe(d);
      // Females don't need packages - redirect
      if (d?.user?.gender === "female") {
        window.location.href = "/dashboard";
      }
    });
  }, []);

  if (me?.user?.gender === "female") {
    return (
      <div className="container page-pad center">
        <div className="card">
          <h3>💝 মেয়েদের জন্য সব ফ্রি!</h3>
          <p className="small">আপনার কোনো প্যাকেজ কেনার দরকার নেই।</p>
          <Link href="/dashboard" className="btn mt">ড্যাশবোর্ডে যান</Link>
        </div>
      </div>
    );
  }

  async function applyCoupon() {
    if (!coupon.trim() || !selected) return;
    const r = await fetch("/api/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, amount: selected.price }),
    });
    const d = await r.json();
    if (d.ok) { setDiscount(d.discount); setMsg(`✅ কুপন প্রয়োগ! ছাড়: ৳${d.discount}`); }
    else setMsg(d.error || "ব্যর্থ");
  }

  async function submitPayment() {
    if (!me?.user) { window.location.href = "/login"; return; }
    setMsg("");
    const token = localStorage.getItem("wedgo_token");
    const payload: any = { ...payForm, amount: selected.price };
    if (selected.isExtra) payload.extra_label = selected.label;
    else payload.package_id = selected.id;
    const r = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (d.ok) {
      setMsg("✅ পেমেন্ট জমা হয়েছে! অ্যাডমিন অনুমোদনের পর প্যাকেজ চালু হবে।");
      setSelected(null);
    } else setMsg(d.error || "ব্যর্থ");
  }

  const payNumbers: any = { bkash: settings.bkash_number, nagad: settings.nagad_number, rocket: settings.rocket_number };
  const payNames: any = { bkash: "বিকাশ", nagad: "নগদ", rocket: "রকেট" };

  return (
    <div className="container page-pad">
      <h2 className="title">💎 প্রিমিয়াম প্যাকেজ</h2>
      <p className="subtitle">মেয়েদের জন্য সম্পূর্ণ ফ্রি! শুধুমাত্র পুরুষদের কিনতে হবে।</p>

      {msg && <div className="alert alert-ok">{msg}</div>}

      {packages.map((p) => (
        <div key={p.id} className={`card pkg ${p.price === 2000 ? "hot" : ""}`}>
          {p.price === 2000 && <div className="center"><span className="badge badge-premium">🔥 জনপ্রিয়</span></div>}
          <h3 className="center">{p.name}</h3>
          <div className="price center">৳{p.price}<span className="small">/মাস</span></div>
          <ul className="feat-list">
            <li className={p.msg_days >= 30 ? "" : "no"}>আনলিমিটেড মেসেজ ({p.msg_days} দিন)</li>
            <li className={p.audio_minutes > 0 ? "" : "no"}>{p.audio_minutes > 0 ? `${p.audio_minutes} মিনিট অডিও কল` : "অডিও কল নেই"}</li>
            <li className={p.video_minutes > 0 ? "" : "no"}>{p.video_minutes > 0 ? `${p.video_minutes} মিনিট ভিডিও কল` : "ভিডিও কল নেই"}</li>
            <li className={p.photo_share ? "" : "no"}>ছবি শেয়ার {p.photo_share ? "" : "নেই"}</li>
            <li className={p.number_share ? "" : "no"}>নম্বর শেয়ার {p.number_share ? "" : "নেই"}</li>
            <li className={p.link_share ? "" : "no"}>লিংক শেয়ার {p.link_share ? "" : "নেই"}</li>
            <li className={p.unlimited_views ? "" : "no"}>{p.unlimited_views ? "আনলিমিটেড প্রোফাইল ভিউ" : p.profile_views ? `${p.profile_views}টি প্রোফাইল ভিউ` : "প্রোফাইল ভিউ সীমিত"}</li>
          </ul>
          <button className="btn btn-gold" onClick={() => setSelected(p)}>কিনুন</button>
        </div>
      ))}

      {/* Extra minutes */}
      {extra.length > 0 && me?.subscription && (() => {
        const s = me.subscription;
        const audioLeft = (s.audio_minutes || 0) - (s.audio_used || 0);
        const videoLeft = (s.video_minutes || 0) - (s.video_used || 0);
        const minutesFinished = audioLeft <= 0 && videoLeft <= 0;
        if (!minutesFinished) return null;
        return (
        <div className="card mt">
          <h3 className="center">⏱ অতিরিক্ত মিনিট কিনুন</h3>
          <p className="small center">আপনার মিনিট শেষ! নতুন মিনিট কিনুন</p>
          {extra.map((e: any, i: number) => (
            <div key={i} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <span>{e.label}</span>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <strong style={{ color: "#f5a623" }}>৳{e.price}</strong>
                <button className="btn" style={{ marginBottom: 0, padding: "6px 14px", fontSize: 13, width: "auto" }}
                  onClick={() => setSelected({ ...e, isExtra: true })}>কিনুন</button>
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      {/* Payment modal */}
      {selected && (
        <div className="card mt" style={{ border: "2px solid #f5a623" }}>
          <h3 className="center">💳 পেমেন্ট — {selected.name} (৳{selected.price})</h3>
          {discount > 0 && <p className="center" style={{ color: "#4caf50", fontWeight: 700 }}>ছাড়: ৳{discount} → মোট: ৳{selected.price - discount}</p>}
          <div className="row">
            <input placeholder="কুপন কোড (যদি থাকে)" value={coupon} onChange={(e) => setCoupon(e.target.value)} style={{ marginBottom: 0 }} />
            <button className="btn btn-outline" style={{ marginBottom: 0, width: 100 }} onClick={applyCoupon}>প্রয়োগ</button>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            {["bkash", "nagad", "rocket"].map((m) => (
              <button key={m} onClick={() => setPayForm({ ...payForm, method: m })}
                className={payForm.method === m ? "btn" : "btn btn-outline"} style={{ marginBottom: 0, padding: "10px 4px", fontSize: 13 }}>
                {payNames[m]}
              </button>
            ))}
          </div>
          <div className="alert alert-warn center">
            <strong>{payNames[payForm.method]} সেন্ড মানি নম্বর:</strong><br />
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>{payNumbers[payForm.method]}</span>
          </div>
          <input placeholder="আপনার সেন্ড মানি নম্বর" value={payForm.sender_number} onChange={(e) => setPayForm({ ...payForm, sender_number: e.target.value })} />
          <input placeholder="ট্রানজেকশন আইডি" value={payForm.trx_id} onChange={(e) => setPayForm({ ...payForm, trx_id: e.target.value })} />
          <p className="small">⚠️ ভুয়া ট্রানজেকশন দিলে আইডি স্থগিত হবে। AI স্বয়ংক্রিয়ভাবে যাচাই করবে।</p>
          <div className="row">
            <button className="btn" style={{ marginBottom: 0 }} onClick={submitPayment}>জমা দিন</button>
            <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => setSelected(null)}>বাতিল</button>
          </div>
        </div>
      )}

      <nav className="nav">
        <Link href="/dashboard"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>
    </div>
  );
}
