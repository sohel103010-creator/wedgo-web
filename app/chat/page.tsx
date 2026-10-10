"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Chat() {
  const [chats, setChats] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState<any>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then(setMe);
    loadChats();
    const iv = setInterval(() => { loadChats(); if (active) loadMessages(active.user_id); checkIncoming(); }, 5000);
    checkIncoming();
    return () => clearInterval(iv);
  }, []);

  function checkIncoming() {
    const token = localStorage.getItem("wedgo_token");
    fetch("/api/calls", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => {
        if (d.incoming) {
          setIncoming(d.incoming);
          // Play ringtone
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 440;
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            o.start();
            setTimeout(() => o.stop(), 1500);
          } catch {}
        }
      });
  }

  async function startCall(type: "audio" | "video") {
    if (!active) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: active.user_id, call_type: type }),
    });
    const d = await r.json();
    if (d.ok) {
      window.location.href = `/call/${d.call_id}?caller=1&type=${type}&to=${active.user_id}`;
    } else {
      alert(d.error || "কল করা যায়নি");
    }
  }

  function loadChats() {
    const token = localStorage.getItem("wedgo_token");
    fetch("/api/chat", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setChats(d.chats || []));
  }

  function loadMessages(uid: number) {
    const token = localStorage.getItem("wedgo_token");
    fetch(`/api/chat?with=${uid}`, { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => {
        setMessages(d.messages || []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }

  function openChat(c: any) {
    setActive(c); loadMessages(c.user_id);
  }

  async function send() {
    if (!text.trim() || !active) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: active.user_id, content: text }),
    });
    const d = await r.json();
    if (d.ok) { setText(""); loadMessages(active.user_id); }
    else alert(d.error || "পাঠানো যায়নি");
  }

  if (active) {
    return (
      <div className="container" style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "12px" }}>
        <div className="row" style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setActive(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20 }}>←</button>
          <strong style={{ flex: 1 }}>{active.name}</strong>
          <button onClick={() => startCall("audio")} style={{ background: "rgba(76,175,80,0.2)", border: "1px solid #4caf50", color: "#fff", padding: "8px 12px", borderRadius: 10, fontSize: 18 }}>🎙</button>
          <button onClick={() => startCall("video")} style={{ background: "rgba(33,150,243,0.2)", border: "1px solid #2196f3", color: "#fff", padding: "8px 12px", borderRadius: 10, fontSize: 18 }}>📹</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {messages.map((m: any) => (
            <div key={m.id} className={`chat-bubble ${m.sender_id === me?.user?.id ? "chat-me" : "chat-them"}`}>
              {m.content}
              <div className="small" style={{ fontSize: 10, opacity: 0.7 }}>{new Date(m.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>
        <div className="row" style={{ padding: "10px 0" }}>
          <input placeholder="মেসেজ লিখুন..." value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} style={{ marginBottom: 0 }} />
          <button className="btn" style={{ width: 70, marginBottom: 0 }} onClick={send}>➤</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-pad">
      <h2 className="title">💬 মেসেজ</h2>
      {chats.length === 0 && (
        <div className="card center">
          <p>এখনো কোনো চ্যাট নেই</p>
          <Link href="/partners" className="btn mt">পার্টনার খুঁজুন</Link>
        </div>
      )}
      {chats.map((c: any) => (
        <div key={c.user_id} className="card row" onClick={() => openChat(c)} style={{ cursor: "pointer" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, overflow: "hidden" }}>
            {c.photo1 ? <img src={c.photo1} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <strong>{c.name}</strong>
            <div className="small">{c.last_msg?.substring(0, 40) || ""}</div>
          </div>
          {c.unread > 0 && <span className="badge" style={{ background: "#e91e63" }}>{c.unread}</span>}
        </div>
      ))}
      <nav className="nav">
        <Link href="/dashboard"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat" className="active"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>

      {/* Incoming call popup */}
      {incoming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card center" style={{ maxWidth: 320 }}>
            <div style={{ fontSize: 64 }}>{incoming.call_type === "video" ? "📹" : "🎙"}</div>
            <h2>{incoming.caller_name}</h2>
            <p className="small">{incoming.call_type === "video" ? "ভিডিও কল" : "অডিও কল"} আসছে...</p>
            <div className="row mt">
              <button className="btn" style={{ marginBottom: 0, background: "#4caf50" }}
                onClick={() => window.location.href = `/call/${incoming.id}?type=${incoming.call_type}`}>
                ✅ ধরুন
              </button>
              <button className="btn" style={{ marginBottom: 0, background: "#f44336" }}
                onClick={async () => {
                  const token = localStorage.getItem("wedgo_token");
                  await fetch(`/api/calls/${incoming.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                    body: JSON.stringify({ action: "reject" }),
                  });
                  setIncoming(null);
                }}>
                ❌ কাটুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
