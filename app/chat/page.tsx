"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLang, Nav } from "@/lib/i18n";

export default function Chat() {
  const { t, lang } = useLang();
  const [chats, setChats] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState<any>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const timeLocale = lang === "en" ? "en-US" : "bn-BD";

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then(setMe);
    loadChats();
    // Admin deep-link: /chat?with=<user_id>&call=audio|video
    const qs = new URLSearchParams(window.location.search);
    const withId = qs.get("with");
    if (withId && /^\d+$/.test(withId)) {
      openDirectChat(parseInt(withId), qs.get("call"));
    }
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

  async function startCall(type: "audio" | "video", target?: any) {
    const who = target || active;
    if (!who) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: who.user_id, call_type: type }),
    });
    const d = await r.json();
    if (d.ok) {
      window.location.href = `/call/${d.call_id}?caller=1&type=${type}&to=${who.user_id}`;
    } else {
      alert(d.error || t("chat.callFailed"));
    }
  }

  // Admin deep-link: /chat?with=<user_id>&call=audio|video — opens 1-on-1 directly
  async function openDirectChat(uid: number, autoCall?: string | null) {
    const token = localStorage.getItem("wedgo_token");
    try {
      const r = await fetch(`/api/partners/${uid}`, { headers: { Authorization: "Bearer " + token } }).then((x) => x.json());
      if (r.partner) {
        const c = { user_id: r.partner.id, name: r.partner.name, photo1: r.partner.photo1 || null };
        setActive(c);
        loadMessages(uid);
        if (autoCall === "audio" || autoCall === "video") {
          startCall(autoCall as "audio" | "video", c);
        }
      }
    } catch {}
  }

  function loadChats() {
    const token = localStorage.getItem("wedgo_token");
    fetch("/api/chat", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setChats(d.chats || []));
    fetch("/api/chat-requests", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setRequests(d.received || []));
  }

  async function handleRequest(senderId: number, action: string) {
    const token = localStorage.getItem("wedgo_token");
    await fetch("/api/chat-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: senderId, action }),
    });
    loadChats();
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

  async function send(msgType = "text", contentOverride?: string) {
    const content = contentOverride || text.trim();
    if (!content || !active) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ receiver_id: active.user_id, content, msg_type: msgType, reply_to: replyTo?.id }),
    });
    const d = await r.json();
    if (d.ok) { setText(""); setReplyTo(null); loadMessages(active.user_id); }
    else alert(d.error || t("chat.sendFailed"));
  }

  async function deleteMsg(id: number, forEveryone: boolean) {
    const token = localStorage.getItem("wedgo_token");
    await fetch(`/api/chat?id=${id}&all=${forEveryone ? 1 : 0}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    loadMessages(active.user_id);
  }

  async function pinMsg(id: number, pinned: boolean) {
    const token = localStorage.getItem("wedgo_token");
    await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ id, pinned: !pinned }),
    });
    loadMessages(active.user_id);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      audioChunks.current = [];
      mr.ondataavailable = (e) => audioChunks.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => send("voice", reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch { alert(t("chat.micDenied")); }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  function sendPhoto(e: any) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 800 / img.width);
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        send("photo", c.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  }

  function onTyping() {
    // Send typing indicator (simple: just show local)
    setTyping(true);
    setTimeout(() => setTyping(false), 3000);
  }

  const [reactTo, setReactTo] = useState<number | null>(null);
  const REACT_EMOJIS = ["\u2764\uFE0F", "\uD83D\uDC4D", "\uD83D\uDE2E", "\uD83D\uDE02", "\uD83D\uDE22", "\uD83D\uDE4F"];

  async function sendReaction(message_id: number, emoji: string) {
    const token = localStorage.getItem("wedgo_token");
    await fetch("/api/chat/react", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ message_id, emoji }),
    });
    setReactTo(null);
    if (active) loadMessages(active.user_id);
  }

  function renderMessage(m: any) {
    const isMe = m.sender_id === me?.user?.id;
    if (m.deleted && !isMe) return null;
    const msgContent = m.deleted ? <em style={{ opacity: 0.5 }}>আপনি মেসেজটি ডিলিট করেছেন</em> : null;

    const actions = (
      <div style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 12 }}>
        <button onClick={() => setReplyTo(m)} style={{ background: "none", border: "none", color: "#f5a623", fontSize: 12 }}>↩️</button>
        {isMe && (
          <>
            <button onClick={() => pinMsg(m.id, m.pinned)} style={{ background: "none", border: "none", color: "#f5a623", fontSize: 12 }}>{m.pinned ? "📌" : "📍"}</button>
            <button onClick={() => { if (confirm(t("chat.delConfirm"))) deleteMsg(m.id, false); }} style={{ background: "none", border: "none", color: "#f44336", fontSize: 12 }}>🗑</button>
            <button onClick={() => { if (confirm(t("chat.delAllConfirm"))) deleteMsg(m.id, true); }} style={{ background: "none", border: "none", color: "#f44336", fontSize: 12 }}>🗑👥</button>
          </>
        )}
        <button onClick={() => setReactTo(reactTo === m.id ? null : m.id)} style={{ background: "none", border: "none", fontSize: 12 }}>😊</button>
      </div>
    );

    const reactionBar = m.reactions && m.reactions.length > 0 && (
      <div style={{ display: "flex", gap: 4, marginTop: 4, fontSize: 12 }}>
        {m.reactions.map((rx: any, i: number) => (
          <span key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "2px 8px" }}>
            {rx.emoji}{rx.c > 1 ? ` ${rx.c}` : ""}
          </span>
        ))}
      </div>
    );

    const reactPicker = reactTo === m.id && (
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {REACT_EMOJIS.map((e) => (
          <button key={e} onClick={() => sendReaction(m.id, e)} style={{ background: "none", border: "none", fontSize: 22 }}>{e}</button>
        ))}
      </div>
    );

    if (m.msg_type === "photo" && !m.deleted) {
      return (
        <div key={m.id} className={`chat-bubble ${isMe ? "chat-me" : "chat-them"}`} style={{ padding: 4 }}>
          {m.pinned && <div style={{ fontSize: 10 }}>📌 পিন করা</div>}
          <img src={m.content} style={{ maxWidth: 220, borderRadius: 12 }} />
          <div className="small" style={{ fontSize: 10, opacity: 0.7, padding: "0 8px 4px" }}>{new Date(m.created_at).toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })}</div>
          {reactionBar}
          {reactPicker}
          {actions}
        </div>
      );
    }
    if (m.msg_type === "voice" && !m.deleted) {
      return (
        <div key={m.id} className={`chat-bubble ${isMe ? "chat-me" : "chat-them"}`}>
          {m.pinned && <div style={{ fontSize: 10 }}>📌 পিন করা</div>}
          <audio controls src={m.content} style={{ maxWidth: 200 }} />
          <div className="small" style={{ fontSize: 10, opacity: 0.7 }}>{new Date(m.created_at).toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })}</div>
          {reactionBar}
          {reactPicker}
          {actions}
        </div>
      );
    }
    return (
      <div key={m.id} className={`chat-bubble ${isMe ? "chat-me" : "chat-them"}`}>
        {m.pinned && <div style={{ fontSize: 10 }}>📌 পিন করা</div>}
        {m.deleted ? msgContent : m.content}
        <div className="small" style={{ fontSize: 10, opacity: 0.7 }}>{new Date(m.created_at).toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })}</div>
        {reactionBar}
        {reactPicker}
        {actions}
      </div>
    );
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
          {messages.map((m: any) => renderMessage(m))}
          {typing && <div className="chat-bubble chat-them"><em>{t("chat.typing")}</em></div>}
          <div ref={bottomRef}></div>
        </div>
        {replyTo && (
          <div style={{ background: "rgba(245,166,35,0.15)", border: "1px solid #f5a623", borderRadius: 10, padding: "8px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
            <span className="small">↩️ রিপ্লাই: {replyTo.content?.substring(0, 50)}</span>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "#fff" }}>✕</button>
          </div>
        )}
        <div className="row" style={{ padding: "10px 0" }}>
          <label style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "10px 12px", borderRadius: 12, fontSize: 18, cursor: "pointer" }}>
            📷<input type="file" accept="image/*" onChange={sendPhoto} style={{ display: "none" }} />
          </label>
          <button onClick={recording ? stopRecording : startRecording}
            style={{
              background: recording ? "#f44336" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", padding: "10px 12px", borderRadius: 12, fontSize: 18,
              display: (me?.user?.role === "admin" || me?.user?.gender === "female" || (me?.subscription?.price || 0) >= 2000) ? "" : "none"
            }}>
            {recording ? "⏹" : "🎤"}
          </button>
          <input placeholder={t("chat.typeMsg")} value={text} onChange={(e) => { setText(e.target.value); onTyping(); }}
            onKeyDown={(e) => e.key === "Enter" && send()} style={{ marginBottom: 0 }} />
          <button className="btn" style={{ width: 70, marginBottom: 0 }} onClick={() => send()}>➤</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-pad">
      <h2 className="title">{t("chat.title")}</h2>
      {requests.length > 0 && (
        <div className="card" style={{ border: "2px solid #e91e63" }}>
          <h3>{t("chat.requests")} ({requests.length})</h3>
          {requests.map((r: any) => (
            <div key={r.id} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="row" style={{ alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {r.sender_photo ? <img src={r.sender_photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                </div>
                <strong>{r.sender_name}</strong>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" style={{ marginBottom: 0, padding: "6px 12px", fontSize: 13, width: "auto", background: "#4caf50" }}
                  onClick={() => handleRequest(r.sender_id, "accept")}>✅</button>
                <button className="btn" style={{ marginBottom: 0, padding: "6px 12px", fontSize: 13, width: "auto", background: "#f44336" }}
                  onClick={() => handleRequest(r.sender_id, "reject")}>❌</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {chats.length === 0 && (
        <div className="card center">
          <p>{t("chat.noChats")}</p>
          <Link href="/partners" className="btn mt">{t("dash.findPartner")}</Link>
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
      <Nav active="chat" />

      {/* Incoming call popup */}
      {incoming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card center" style={{ maxWidth: 320 }}>
            <div style={{ fontSize: 64 }}>{incoming.call_type === "video" ? "📹" : "🎙"}</div>
            <h2>{incoming.caller_name}</h2>
            <p className="small">{incoming.call_type === "video" ? t("chat.videoCall") : t("chat.audioCall")} আসছে...</p>
            <div className="row mt">
              <button className="btn" style={{ marginBottom: 0, background: "#4caf50" }}
                onClick={() => window.location.href = `/call/${incoming.id}?type=${incoming.call_type}`}>
                ✅ {t("chat.answer")}
              </button>
              <button className="btn" style={{ marginBottom: 0, background: "#f44336" }}
                onClick={async () => {
                  const token = localStorage.getItem("wedgo_token");
                  await fetch("/api/calls", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                    body: JSON.stringify({ call_id: incoming.id, action: "missed" }),
                  });
                  setIncoming(null);
                }}>
                ❌ {t("chat.decline")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
