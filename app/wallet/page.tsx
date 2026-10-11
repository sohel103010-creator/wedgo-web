"use client";
import { useState, useEffect } from "react";
import { useLang, Nav } from "@/lib/i18n";

export default function Wallet() {
  const { t } = useLang();
  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<"main" | "withdraw" | "numbers" | "addmoney">("main");
  const [wForm, setWForm] = useState({ amount: "", method: "bkash", number: "" });
  const [aForm, setAForm] = useState({ amount: "", method: "bkash", sender_number: "", trx_id: "" });
  const [nForm, setNForm] = useState({ bkash: "", nagad: "", rocket: "" });
  const [msg, setMsg] = useState("");
  const [payNumbers, setPayNumbers] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/wallet", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => {
        setData(d);
        if (d.wallet) setNForm({ bkash: d.wallet.bkash_number || "", nagad: d.wallet.nagad_number || "", rocket: d.wallet.rocket_number || "" });
      });
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then(setMe);
    // Get admin payment numbers (lightweight endpoint)
    fetch("/api/pay-numbers").then((r) => r.json()).then((s) => {
      setPayNumbers({ bkash: s.bkash_number, nagad: s.nagad_number, rocket: s.rocket_number });
    });
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
    setMsg(d.ok ? t("wallet.withdrawOk") : (d.error || "ব্যর্থ"));
  }

  async function addMoney() {
    setMsg("");
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action: "addmoney", amount: parseInt(aForm.amount), method: aForm.method, sender_number: aForm.sender_number, trx_id: aForm.trx_id }),
    });
    const d = await r.json();
    setMsg(d.ok ? t("wallet.addMoneyOk") : (d.error || "ব্যর্থ"));
    if (d.ok) setAForm({ amount: "", method: "bkash", sender_number: "", trx_id: "" });
  }

  async function saveNumbers() {
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action: "save_numbers", number: nForm }),
    });
    const d = await r.json();
    setMsg(d.ok ? t("wallet.numSaved") : "ব্যর্থ");
  }

  const isFemale = me?.user?.gender === "female";
  const w = data?.wallet;

  // Earnings rates (per user spec)
  const audioRates = [[10, 100], [20, 180], [30, 250], [60, 400], [90, 700], [120, 900]];
  const videoRates = [[10, 300], [20, 500], [30, 700], [40, 900], [50, 1100], [60, 1300]];

  return (
    <div className="container page-pad">
      <h2 className="title">{t("wallet.title")}</h2>

      <div className="card center">
        <div className="small">{t("wallet.balance")}</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#f5a623" }}>৳{w?.balance || 0}</div>
        {(data?.daily_earning > 0 || data?.monthly_earning > 0) && (
          <div className="row mt" style={{ gap: 16 }}>
            <div className="center" style={{ flex: 1, background: "rgba(76,175,80,0.15)", borderRadius: 10, padding: 10 }}>
              <div className="small">{t("wallet.todayEarn")}</div>
              <strong style={{ color: "#4caf50" }}>৳{data?.daily_earning || 0}</strong>
            </div>
            <div className="center" style={{ flex: 1, background: "rgba(33,150,243,0.15)", borderRadius: 10, padding: 10 }}>
              <div className="small">{t("wallet.monthEarn")}</div>
              <strong style={{ color: "#2196f3" }}>৳{data?.monthly_earning || 0}</strong>
            </div>
          </div>
        )}
        {isFemale && <div className="small mt">মোট আয়: ৳{w?.total_earned || 0} | মোট উত্তোলন: ৳{w?.total_withdrawn || 0}</div>}
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className={tab === "main" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("main")}>{t("wallet.history")}</button>
        {isFemale && <button className={tab === "withdraw" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("withdraw")}>{t("wallet.withdraw")}</button>}
        {!isFemale && <button className={tab === "addmoney" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("addmoney")}>{t("wallet.addMoney")}</button>}
        <button className={tab === "numbers" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setTab("numbers")}>{t("wallet.payNum")}</button>
      </div>

      {msg && <div className="alert alert-ok">{msg}</div>}

      {tab === "main" && (
        <>
          {isFemale && (
            <div className="card">
              <h3>{t("wallet.videoRate")}</h3>
              {videoRates.map(([m, t]: any, i: number) => (
                <div key={i} className="row-between" style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>{m} মিনিট</span><strong style={{ color: "#4caf50" }}>৳{t}</strong>
                </div>
              ))}
              <h3 className="mt">{t("wallet.audioRate")}</h3>
              {audioRates.map(([m, t]: any, i: number) => (
                <div key={i} className="row-between" style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>{m} মিনিট</span><strong style={{ color: "#4caf50" }}>৳{t}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <h3>{t("wallet.withdrawHist")}</h3>
            {(data?.withdrawals || []).map((x: any) => (
              <div key={x.id} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span>৳{x.amount} ({x.method})</span>
                <span className="badge" style={{ background: x.status === "completed" ? "#4caf50" : x.status === "rejected" ? "#f44336" : "#f5a623" }}>{x.status}</span>
              </div>
            ))}
            {(!data?.withdrawals || data.withdrawals.length === 0) && <p className="small">{t("wallet.noWithdraw")}</p>}
          </div>
        </>
      )}

      {tab === "withdraw" && isFemale && (
        <div className="card">
          <h3>{t("wallet.withdrawReq")}</h3>
          <p className="small">{t("wallet.min500")}</p>
          <input type="number" placeholder={t("wallet.amount")} value={wForm.amount} onChange={(e) => setWForm({ ...wForm, amount: e.target.value })} />
          <select value={wForm.method} onChange={(e) => setWForm({ ...wForm, method: e.target.value })}>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="rocket">রকেট</option>
          </select>
          <input placeholder={t("wallet.yourNum")} value={wForm.number} onChange={(e) => setWForm({ ...wForm, number: e.target.value })} />
          <button className="btn" onClick={withdraw}>আবেদন করুন</button>
        </div>
      )}

      {tab === "addmoney" && !isFemale && (
        <div className="card">
          <h3>{t("wallet.addMoney")}</h3>
          <div className="center" style={{ background: "rgba(245,166,35,0.12)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div className="small">
              {aForm.method === "bkash" ? "বিকাশ" : aForm.method === "nagad" ? "নগদ" : "রকেট"} সেন্ড মানি নম্বর:
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1, color: "#f5a623" }}>
              {payNumbers[aForm.method] || t("common.loading")}
            </div>
            <div className="small">এই নম্বরে সেন্ড মানি করুন</div>
          </div>
          <input type="number" placeholder={t("wallet.amount")} value={aForm.amount} onChange={(e) => setAForm({ ...aForm, amount: e.target.value })} />
          <select value={aForm.method} onChange={(e) => setAForm({ ...aForm, method: e.target.value })}>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="rocket">রকেট</option>
          </select>
          <input placeholder={t("pkg.senderNum")} value={aForm.sender_number} onChange={(e) => setAForm({ ...aForm, sender_number: e.target.value })} />
          <input placeholder={t("pkg.trxId")} value={aForm.trx_id} onChange={(e) => setAForm({ ...aForm, trx_id: e.target.value })} />
          <button className="btn" onClick={addMoney}>{t("pkg.submit")}</button>
        </div>
      )}

      {tab === "numbers" && (
        <div className="card">
          <h3>{t("wallet.savePayNum")}</h3>
          <p className="small">{t("wallet.saveNum")}</p>
          <input placeholder="বিকাশ নম্বর" value={nForm.bkash} onChange={(e) => setNForm({ ...nForm, bkash: e.target.value })} />
          <input placeholder="নগদ নম্বর" value={nForm.nagad} onChange={(e) => setNForm({ ...nForm, nagad: e.target.value })} />
          <input placeholder="রকেট নম্বর" value={nForm.rocket} onChange={(e) => setNForm({ ...nForm, rocket: e.target.value })} />
          <button className="btn" onClick={saveNumbers}>{t("common.save")}</button>
        </div>
      )}

      <Nav active="wallet" />
    </div>
  );
}
