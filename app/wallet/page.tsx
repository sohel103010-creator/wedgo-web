"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Wallet() {
  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<"main" | "withdraw" | "numbers">("main");
  const [wForm, setWForm] = useState({ amount: "", method: "bkash", number: "" });
  const [nForm, setNForm] = useState({ bkash: "", nagad: "", rocket: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/wallet", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => {
        setData(d);
        if (d.wallet) setNForm({ bkash: d.wallet.bkash_number || "", nagad: d.wallet.nagad_number || "", rocket: d.wallet.rocket_number || "" });
      });
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then(setMe);
  }, []);

  async function withdraw() {
    setMsg("");
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action: "withdraw", amount: parseInt(wForm.amount), method: wForm.method, number: wForm.number }),
    });
    const d = await r.json();
    setMsg(d.ok ? "✅ উত্তোলন আবেদন জমা হয়েছে!" : (d.error || "ব্যর্থ"));
  }

  async function saveNumbers() {
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action: "save_numbers", number: nForm }),
    });
    const d = await r.json();
    setMsg(d.ok ? "✅ নম্বর সেভ হয়েছে!" : "ব্যর্থ");
  }

  const isFemale = me?.user?.gender === "female";
  const w = data?.wallet;

  // Earnings rates (per user spec)
  const audioRates = [[10, 100], [20, 180], [30, 250], [60, 400], [90, 700], [120, 900]];
  const videoRates = [[10, 300], [20, 500], [30, 700], [40, 900], [50, 1100], [60, 1300]];

  return (
    <div className="container page-pad">
      <h2 className="title">💰 ওয়ালেট</h2>

      <div className="card center">
        <div className="small">বর্তমান ব্যালেন্স</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#f5a623" }}>৳{w?.balance || 0}</div>
        {isFemale && <div className="small mt">মোট আয়: ৳{w?.total_earned || 0} | মোট উত্তোলন: ৳{w?.total_withdrawn || 0}</div>}
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className={tab === "main" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("main")}>হিস্টোরি</button>
        {isFemale && <button className={tab === "withdraw" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("withdraw")}>উত্তোলন</button>}
        <button className={tab === "numbers" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("numbers")}>পেমেন্ট নম্বর</button>
      </div>

      {msg && <div className="alert alert-ok">{msg}</div>}

      {tab === "main" && (
        <>
          {isFemale && (
            <div className="card">
              <h3>💵 আয়ের হার (ভিডিও কল)</h3>
              {videoRates.map(([m, t]: any, i: number) => (
                <div key={i} className="row-between" style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>{m} মিনিট</span><strong style={{ color: "#4caf50" }}>৳{t}</strong>
                </div>
              ))}
              <h3 className="mt">🎙 আয়ের হার (অডিও কল)</h3>
              {audioRates.map(([m, t]: any, i: number) => (
                <div key={i} className="row-between" style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>{m} মিনিট</span><strong style={{ color: "#4caf50" }}>৳{t}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <h3>উত্তোলন হিস্টোরি</h3>
            {(data?.withdrawals || []).map((x: any) => (
              <div key={x.id} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span>৳{x.amount} ({x.method})</span>
                <span className="badge" style={{ background: x.status === "completed" ? "#4caf50" : x.status === "rejected" ? "#f44336" : "#f5a623" }}>{x.status}</span>
              </div>
            ))}
            {(!data?.withdrawals || data.withdrawals.length === 0) && <p className="small">কোনো উত্তোলন নেই</p>}
          </div>
        </>
      )}

      {tab === "withdraw" && isFemale && (
        <div className="card">
          <h3>উত্তোলন আবেদন</h3>
          <p className="small">সর্বনিম্ন ৫০০ টাকা</p>
          <input type="number" placeholder="টাকার পরিমাণ" value={wForm.amount} onChange={(e) => setWForm({ ...wForm, amount: e.target.value })} />
          <select value={wForm.method} onChange={(e) => setWForm({ ...wForm, method: e.target.value })}>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="rocket">রকেট</option>
          </select>
          <input placeholder="আপনার নম্বর" value={wForm.number} onChange={(e) => setWForm({ ...wForm, number: e.target.value })} />
          <button className="btn" onClick={withdraw}>আবেদন করুন</button>
        </div>
      )}

      {tab === "numbers" && (
        <div className="card">
          <h3>পেমেন্ট নম্বর সংরক্ষণ</h3>
          <p className="small">উত্তোলনের জন্য আপনার নম্বর সেভ করে রাখুন</p>
          <input placeholder="বিকাশ নম্বর" value={nForm.bkash} onChange={(e) => setNForm({ ...nForm, bkash: e.target.value })} />
          <input placeholder="নগদ নম্বর" value={nForm.nagad} onChange={(e) => setNForm({ ...nForm, nagad: e.target.value })} />
          <input placeholder="রকেট নম্বর" value={nForm.rocket} onChange={(e) => setNForm({ ...nForm, rocket: e.target.value })} />
          <button className="btn" onClick={saveNumbers}>সেভ করুন</button>
        </div>
      )}

      <nav className="nav">
        <Link href="/dashboard"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet" className="active"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>
    </div>
  );
}
