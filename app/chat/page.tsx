"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Chat() {
  const [chats, setChats] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then(setMe);
    loadChats();
    const iv = setInterval(() => { loadChats(); if (active) loadMessages(active.user_id); }, 5000);
    return () => clearInterval(iv);
  }, []);

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
          <strong>{active.name}</strong>
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
    </div>
  );
}
