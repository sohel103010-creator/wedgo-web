"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PartnerDetail() {
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
        alert("💕 ম্যাচ! দুজনেই একে অপরকে পছন্দ করেছেন!");
      } else {
        alert("❤️ লাভ রিয়াক্ট পাঠানো হয়েছে!");
      }
    }
    else alert(d.error || "ব্যর্থ");
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
    if (d.ok) { setChatStatus("pending"); alert("💌 চ্যাট রিকোয়েস্ট পাঠানো হয়েছে!"); }
    else alert(d.error || "ব্যর্থ");
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
    if (!confirm("গিফট পাঠাবেন?")) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: params.id, gift_id: giftId }),
    });
    const d = await r.json();
    alert(d.ok ? "🎁 গিফট পাঠানো হয়েছে!" : (d.error || "ব্যর্থ"));
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
    alert(d.ok ? "✅ সম্পন্ন!" : (d.error || "ব্যর্থ"));
    if (action === "block") window.location.href = "/partners";
  }

  async function report() {
    const reason = prompt("রিপোর্টের কারণ লিখুন:\n1. ভুয়া প্রোফাইল\n2. অশালীন আচরণ\n3. প্রতারণা\n4. হয়রানি\n5. স্প্যাম");
    if (reason) doAction("report", { reason });
  }

  if (!partner) return <div className="container center" style={{ paddingTop: 60 }}>লোড হচ্ছে...</div>;

  const p = partner;
  return (
    <div className="container page-pad">
      <Link href="/partners" className="small">← ফিরুন</Link>
      <div className="card mt center">
        {p.photo1 ? (
          <img src={p.photo1} style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 16 }} />
        ) : (
          <div style={{ fontSize: 80, padding: 40 }}>{p.gender === "female" ? "👩" : "👨"}</div>
        )}
        <h2 className="mt">{p.name}{p.age ? `, ${p.age}` : ""} {p.verified && <span className="badge badge-verified">✓ ভেরিফায়েড</span>}</h2>
        {!p.hide_online && p.last_active && (() => {
          const mins = Math.floor((Date.now() - new Date(p.last_active).getTime()) / 60000);
          if (mins < 5) return <span className="badge badge-online">🟢 অনলাইন</span>;
          if (mins < 60) return <div className="small">🕐 {Math.floor(mins)} মিনিট আগে অ্যাক্টিভ ছিল</div>;
          const h = Math.floor(mins / 60);
          if (h < 24) return <div className="small">🕐 {h} ঘণ্টা আগে অ্যাক্টিভ ছিল</div>;
          return <div className="small">🕐 {Math.floor(h / 24)} দিন আগে অ্যাক্টিভ ছিল</div>;
        })()}
        <div className="row mt">
          <button className="btn" style={{ marginBottom: 0, background: liked ? "#4caf50" : undefined }} onClick={sendLike} disabled={liked}>
            {liked ? "❤️ পাঠানো হয়েছে" : "❤️ লাভ রিয়াক্ট"}
          </button>
          <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => window.location.href = "/chat"}>💬 চ্যাট</button>
          {chatStatus === "" && (
            <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={sendChatRequest}>💌 রিকোয়েস্ট</button>
          )}
          {chatStatus === "pending" && <span className="small" style={{ color: "#f5a623" }}>⏳ রিকোয়েস্ট পাঠানো হয়েছে</span>}
          {chatStatus === "accepted" && <span className="small" style={{ color: "#4caf50" }}>✅ গৃহীত হয়েছে</span>}
        </div>
        <div className="row mt">
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13 }} onClick={() => doAction("favorite")}>⭐ ফেভারিট</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13 }} onClick={() => setShowGifts(!showGifts)}>🎁 গিফট</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13 }} onClick={report}>🚩 রিপোর্ট</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, fontSize: 13, borderColor: "#f44336", color: "#f44336" }} onClick={() => { if (confirm("ব্লক করবেন?")) doAction("block"); }}>🚫 ব্লক</button>
        </div>

        {showGifts && (
          <div className="card" style={{ border: "2px solid #e91e63" }}>
            <h3>🎁 গিফট পাঠান</h3>
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
          <tr><td>বয়স</td><td>{p.age || "—"}</td></tr>
          <tr><td>উচ্চতা</td><td>{p.height || "—"}</td></tr>
          <tr><td>ঠিকানা</td><td>{p.address || "—"}</td></tr>
          <tr><td>জেলা</td><td>{p.district || "—"}</td></tr>
          <tr><td>রক্তের গ্রুপ</td><td>{p.blood_group || "—"}</td></tr>
          <tr><td>বৈবাহিক অবস্থা</td><td>{p.marital_status === "unmarried" ? "অবিবাহিত" : p.marital_status === "divorced" ? "ডিভোর্সি" : p.marital_status === "widow" ? "বিধবা/বিপত্নীক" : "—"}</td></tr>
          <tr><td>শিক্ষা</td><td>{p.education || "—"}</td></tr>
          <tr><td>পেশা</td><td>{p.occupation || "—"}</td></tr>
          <tr><td>ধর্ম</td><td>{p.religion || "—"}</td></tr>
          <tr><td>ঘর জামাই</td><td>{p.ghar_jamai || "—"}</td></tr>
        </table>
        {p.bio && <><h3 className="mt">📝 নিজের সম্পর্কে</h3><p className="small" style={{ lineHeight: 1.8 }}>{p.bio}</p></>}
        {p.photo2 && <><h3 className="mt">📷 মিডিয়া</h3><img src={p.photo2} style={{ width: "100%", borderRadius: 12 }} /></>}
      </div>

      <nav className="nav">
        <Link href="/dashboard"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners" className="active"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>
    </div>
  );
}
