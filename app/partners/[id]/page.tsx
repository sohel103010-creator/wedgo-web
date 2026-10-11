"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang, Nav } from "@/lib/i18n";

export default function PartnerDetail() {
  const { t } = useLang();
  const params = useParams();
  const [partner, setPartner] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (token) fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then(setMe);
    fetch(`/api/partners/${params.id}`).then((r) => r.json()).then((d) => setPartner(d.partner));
  }, []);

  async function sendLike() {
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ liked_id: params.id }),
    });
    const d = await r.json();
    if (d.ok) {
      setLiked(true);
      if (d.mutual) {
        alert(t("pd.match"));
      } else {
        alert(t("pd.likeSent"));
      }
    }
    else alert(d.error || t("common.fail"));
  }

  const [chatStatus, setChatStatus] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);

  async function sendChatRequest() {
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/chat-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: params.id, action: "send" }),
    });
    const d = await r.json();
    if (d.ok) { setChatStatus("pending"); alert(t("pd.reqSentAlert")); }
    else alert(d.error || t("common.fail"));
  }

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (token) {
      fetch("/api/chat-requests", { headers: { Authorization: "Bearer " + token } })
        .then((r) => r.json()).then((d) => {
          const s = (d.sent || []).find((x: any) => x.receiver_id == params.id);
          if (s) setChatStatus(s.status);
        });
    }
    fetch("/api/gifts").then((r) => r.json()).then((d) => setGifts(d.gifts || []));
  }, []);

  async function sendGift(giftId: number) {
    if (!confirm(t("pd.sendGift"))) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: params.id, gift_id: giftId }),
    });
    const d = await r.json();
    alert(d.ok ? t("pd.giftSent") : (d.error || "ব্যর্থ"));
    setShowGifts(false);
  }

  async function doAction(action: string, extra: any = {}) {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    const r = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action, target_id: params.id, ...extra }),
    });
    const d = await r.json();
    alert(d.ok ? t("pd.done") : (d.error || t("common.fail")));
    if (action === "block") window.location.href = "/partners";
  }

  async function report() {
    const reason = prompt(t("pd.reportPrompt"));
    if (reason) doAction("report", { reason });
  }

  if (!partner) return <div className="container center" style={{ paddingTop: 60 }}>{t("common.loading")}</div>;

  const p = partner;
  return (
    <div className="container page-pad">
      <Link href="/partners" className="small">{t("common.back")}</Link>
      <div className="card mt center">
        {p.photo1 ? (
          <img src={p.photo1} style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 16 }} />
        ) : (
          <div style={{ fontSize: 80, padding: 40 }}>{p.gender === "female" ? "👩" : "👨"}</div>
        )}
        <h2 className="mt">{p.name}{p.age ? `, ${p.age}` : ""} {p.verified && <span className="badge badge-verified">{t("pd.verified")}</span>}</h2>
        {!p.hide_online && p.last_active && (() => {
          const mins = Math.floor((Date.now() - new Date(p.last_active).getTime()) / 60000);
          if (mins < 5) return <span className="badge badge-online">{t("partners.online")}</span>;
          if (mins < 60) return <div className="small">{t("partners.minAgo", { n: Math.floor(mins) })}</div>;
          const h = Math.floor(mins / 60);
          if (h < 24) return <div className="small">{t("partners.hourAgo", { n: h })}</div>;
          return <div className="small">{t("partners.dayAgo", { n: Math.floor(h / 24) })}</div>;
        })()}
        <div className="row mt">
          <button className="btn" style={{ marginBottom: 0, background: liked ? "#4caf50" : undefined }} onClick={sendLike} disabled={liked}>
            {liked ? t("pd.likedState") : t("pd.like")}
          </button>
          <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => window.location.href = "/chat"}>{t("pd.chat")}</button>
          {chatStatus === "" && (
            <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={sendChatRequest}>{t("pd.chatReq")}</button>
          )}
          {chatStatus === "pending" && <span className="small" style={{ color: "#f5a623" }}>{t("pd.reqSent")}</span>}
          {chatStatus === "accepted" && <span className="small" style={{ color: "#4caf50" }}>{t("pd.accepted")}</span>}
        </div>
        <div className="row mt">
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13 }} onClick={() => doAction("favorite")}>{t("pd.fav")}</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13 }} onClick={() => setShowGifts(!showGifts)}>{t("pd.gift")}</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13 }} onClick={report}>{t("pd.report")}</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13, borderColor: "#f44336", color: "#f44336" }} onClick={() => { if (confirm(t("pd.blockConfirm"))) doAction("block"); }}>{t("pd.block")}</button>
        </div>

        {showGifts && (
          <div className="card" style={{ border: "2px solid #e91e63" }}>
            <h3>{t("pd.sendGift")}</h3>
            <div className="row">
              {gifts.map((g: any) => (
                <button key={g.id} onClick={() => sendGift(g.id)}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: 12, flex: "1 1 28%", color: "#fff" }}>
                  <div style={{ fontSize: 32 }}>{g.emoji}</div>
                  <div className="small">{g.name}</div>
                  <div style={{ color: "#f5a623", fontWeight: 700 }}>৳{g.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>📋 বিস্তারিত</h3>
        <table className="admin-tbl">
          <tr><td>{t("pd.age")}</td><td>{p.age || "—"}</td></tr>
          <tr><td>{t("pd.height")}</td><td>{p.height || "—"}</td></tr>
          <tr><td>{t("pd.address")}</td><td>{p.address || "—"}</td></tr>
          <tr><td>{t("pd.district")}</td><td>{p.district || "—"}</td></tr>
          <tr><td>{t("pd.blood")}</td><td>{p.blood_group || "—"}</td></tr>
          <tr><td>{t("pd.marital")}</td><td>{p.marital_status === "unmarried" ? t("partners.unmarried") : p.marital_status === "divorced" ? t("partners.divorced") : p.marital_status === "widow" ? t("partners.widow") : "—"}</td></tr>
          <tr><td>{t("pd.education")}</td><td>{p.education || "—"}</td></tr>
          <tr><td>{t("pd.occupation")}</td><td>{p.occupation || "—"}</td></tr>
          <tr><td>{t("pd.religion")}</td><td>{p.religion || "—"}</td></tr>
          <tr><td>{t("pd.gharjamai")}</td><td>{p.ghar_jamai || "—"}</td></tr>
        </table>
        {p.bio && <><h3 className="mt">{t("pd.about")}</h3><p className="small" style={{ lineHeight: 1.8 }}>{p.bio}</p></>}
        {p.photo2 && <><h3 className="mt">{t("pd.media")}</h3><img src={p.photo2} style={{ width: "100%", borderRadius: 12 }} /></>}
      </div>

      <Nav active="partners" />
    </div>
  );
}
