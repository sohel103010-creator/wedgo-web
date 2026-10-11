"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLang, Nav } from "@/lib/i18n";

export default function Packages() {
  const { t } = useLang();
  const [packages, setPackages] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [me, setMe] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const payRef = useRef<HTMLDivElement>(null);

  function selectPackage(p: any) {
    setSelected(p);
    // Scroll to payment form after it renders
    setTimeout(() => payRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }
  const [payForm, setPayForm] = useState({ method: "bkash", sender_number: "", trx_id: "" });
  const [msg, setMsg] = useState("");
  const [extra, setExtra] = useState<any[]>([]);

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
          <h3>{t("pkg.welcome")}</h3>
          <p className="small">{t("pkg.femaleAll")}</p>
          <Link href="/dashboard" className="btn mt">{t("pkg.goDash")}</Link>
        </div>
      </div>
    );
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
      setMsg(t("pkg.payOk"));
      setSelected(null);
    } else setMsg(d.error || t("common.fail"));
  }

  const payNumbers: any = { bkash: settings.bkash_number, nagad: settings.nagad_number, rocket: settings.rocket_number };
  const payNames: any = { bkash: "বিকাশ", nagad: "নগদ", rocket: "রকেট" };

  return (
    <div className="container page-pad">
      <h2 className="title">{t("pkg.title")}</h2>

      {msg && <div className="alert alert-ok">{msg}</div>}

      {packages.map((p) => (
        <div key={p.id} className={`card pkg ${p.price === 2000 ? "hot" : ""}`}>
          {p.price === 2000 && <div className="center"><span className="badge badge-premium">{t("pkg.popular")}</span></div>}
          <h3 className="center">{p.name}</h3>
          <div className="price center">৳{p.price}<span className="small">{t("pkg.perMonth")}</span></div>
          <ul className="feat-list">
            <li className={p.msg_days >= 30 ? "" : "no"}>{t("pkg.unlimitedMsg", { n: p.msg_days })}</li>
            {p.max_chat_partners ? <li>{t("pkg.chatWith", { n: p.max_chat_partners })}</li> : <li>{t("pkg.unlimitedChat")}</li>}
            <li className={p.audio_minutes > 0 ? "" : "no"}>{p.audio_minutes > 0 ? t("pkg.audioMin", { n: p.audio_minutes }) : t("pkg.noAudio")}</li>
            <li className={p.video_minutes > 0 ? "" : "no"}>{p.video_minutes > 0 ? t("pkg.videoMin", { n: p.video_minutes }) : t("pkg.noVideo")}</li>
            <li className={p.photo_share ? "" : "no"}>{t("pkg.photoShare")} {p.photo_share ? "" : t("pkg.none")}</li>
            <li className={p.number_share ? "" : "no"}>{t("pkg.numberShare")} {p.number_share ? "" : t("pkg.none")}</li>
            <li className={p.link_share ? "" : "no"}>{t("pkg.linkShare")} {p.link_share ? "" : t("pkg.none")}</li>
            <li className={p.unlimited_views ? "" : "no"}>{p.unlimited_views ? t("pkg.unlimitedViews") : p.profile_views ? t("pkg.profileViews", { n: p.profile_views }) : t("pkg.limitedViews")}</li>
          </ul>
          <button className="btn btn-gold" onClick={() => selectPackage(p)}>{t("pkg.buy")}</button>
        </div>
      ))}

      {/* Extra minutes */}
      {extra.length > 0 && me?.subscription && (() => {
        const s = me.subscription;
        // Only for package 3 & 4 (Gold/Platinum, price >= 2000)
        if ((s.price || 0) < 2000) return null;
        const audioLeft = (s.audio_minutes || 0) - (s.audio_used || 0);
        const videoLeft = (s.video_minutes || 0) - (s.video_used || 0);
        const minutesFinished = audioLeft <= 0 && videoLeft <= 0;
        if (!minutesFinished) return null;
        return (
        <div className="card mt">
          <h3 className="center">{t("pkg.extraMin")}</h3>
          <p className="small center">{t("pkg.minFinished")}</p>
          {extra.map((e: any, i: number) => (
            <div key={i} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <span>{e.label}</span>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <strong style={{ color: "#f5a623" }}>৳{e.price}</strong>
                <button className="btn" style={{ marginBottom: 0, padding: "6px 14px", fontSize: 13, width: "auto" }}
                  onClick={() => selectPackage({ ...e, isExtra: true })}>{t("pkg.buy")}</button>
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      {/* Payment modal */}
      {selected && (
        <div ref={payRef} className="card mt" style={{ border: "2px solid #f5a623" }}>
          <h3 className="center">💳 পেমেন্ট — {selected.name} (৳{selected.price})</h3>
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
          <input placeholder={t("pkg.senderNum")} value={payForm.sender_number} onChange={(e) => setPayForm({ ...payForm, sender_number: e.target.value })} />
          <input placeholder={t("pkg.trxId")} value={payForm.trx_id} onChange={(e) => setPayForm({ ...payForm, trx_id: e.target.value })} />
          <p className="small">{t("pkg.payWarn")}</p>
          <div className="row">
            <button className="btn" style={{ marginBottom: 0 }} onClick={submitPayment}>{t("pkg.submit")}</button>
            <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => setSelected(null)}>{t("common.cancel")}</button>
          </div>
        </div>
      )}

      <Nav active="" />
    </div>
  );
}
