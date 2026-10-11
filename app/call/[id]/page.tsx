"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function CallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const callId = params.id as string;
  const isCaller = searchParams.get("caller") === "1";
  const callType = (searchParams.get("type") || "video") as "video" | "audio";

  const [status, setStatus] = useState("connecting");
  const [remoteName, setRemoteName] = useState("");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [error, setError] = useState("");

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastIceRef = useRef("1970-01-01");
  const timerRef = useRef<any>(null);
  const maxDurRef = useRef(3600);
  const [lowTime, setLowTime] = useState(false);

  function token() { return localStorage.getItem("wedgo_token") || ""; }

  useEffect(() => {
    startCall();
    return () => { cleanup(); };
  }, []);

  async function startCall() {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video" ? { width: 1280, height: 720 } : false,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await fetch(`/api/calls/${callId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
            body: JSON.stringify({ action: "ice", candidate: e.candidate.toJSON() }),
          });
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        // Update offer on server
        await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
          body: JSON.stringify({ receiver_id: searchParams.get("to"), call_type: callType, offer_sdp: JSON.stringify(offer) }),
        }).catch(() => {});
        // For existing call, we need to update offer — use direct approach
        setStatus("ringing");
      } else {
        // Receiver: get offer and answer
        const r = await fetch(`/api/calls?call_id=${callId}`, {
          headers: { Authorization: "Bearer " + token() },
        });
        const d = await r.json();
        setRemoteName(d.call?.caller_name || "");
        if (d.call?.offer_sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(d.call.offer_sdp)));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await fetch(`/api/calls/${callId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
            body: JSON.stringify({ action: "answer", answer_sdp: JSON.stringify(answer) }),
          });
          setStatus("ongoing");
          startTimer();
        }
      }

      // Poll for updates
      const poll = setInterval(async () => {
        const r = await fetch(`/api/calls?call_id=${callId}&since=${encodeURIComponent(lastIceRef.current)}`, {
          headers: { Authorization: "Bearer " + token() },
        });
        const d = await r.json();
        if (!d.call) { clearInterval(poll); return; }
        if (typeof d.max_duration_sec === "number" && d.max_duration_sec > 0) {
          maxDurRef.current = d.max_duration_sec;
        }

        if (d.call.status === "ended" || d.call.status === "rejected") {
          clearInterval(poll);
          endCallUI(d.call.status === "rejected" ? "কল প্রত্যাখ্যান করা হয়েছে" : "কল শেষ");
          return;
        }

        if (isCaller && d.call.status === "ongoing" && status !== "ongoing") {
          setStatus("ongoing");
          startTimer();
          if (d.call.answer_sdp && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(d.call.answer_sdp)));
          }
        }

        if (isCaller && !d.call.answer_sdp) {
          // Still ringing, get offer from call
        }

        for (const ice of d.ice || []) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(ice.candidate)));
          } catch {}
          lastIceRef.current = ice.created_at;
        }
      }, 2000);

      (window as any).__callPoll = poll;
    } catch (e: any) {
      setError("ক্যামেরা/মাইক্রোফোন এক্সেস দিন: " + e.message);
      setStatus("error");
    }
  }

  function startTimer() {
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const nd = d + 1;
        const max = maxDurRef.current;
        // Cut at payer's remaining minutes (or 60-min hard cap)
        if (nd >= max) {
          endCall();
          return d;
        }
        if (max - nd === 60) setLowTime(true);
        return nd;
      });
    }, 1000);
  }

  function cleanup() {
    clearInterval((window as any).__callPoll);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
  }

  async function endCall() {
    await fetch(`/api/calls/${callId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
      body: JSON.stringify({ action: "end" }),
    });
    endCallUI("কল শেষ হয়েছে");
  }

  function endCallUI(msg: string) {
    cleanup();
    alert(msg + `\nসময়কাল: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`);
    window.location.href = "/chat";
  }

  function toggleMute() {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMuted(!t.enabled); }
  }

  function toggleVideo() {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setVideoOff(!t.enabled); }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      style={{ height: "100vh", background: "#111", display: "flex", flexDirection: "column", color: "#fff", userSelect: "none", WebkitUserSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {/* Screenshot guard notice */}
      <div style={{ background: "#f44336", color: "#fff", textAlign: "center", padding: "6px", fontSize: 12, fontWeight: 700 }}>
        🔒 স্ক্রিনশট ও স্ক্রিনরেকর্ড নিষিদ্ধ
      </div>
      {lowTime && status === "ongoing" && (
        <div style={{ background: "#ff9800", color: "#fff", textAlign: "center", padding: "6px", fontSize: 13, fontWeight: 700 }}>
          ⏳ ১ মিনিট বাকি — মিনিট শেষ হলে কল কেটে যাবে
        </div>
      )}
      <div style={{ padding: 16, textAlign: "center" }}>
        <h2>{remoteName || "কল হচ্ছে..."}</h2>
        <p style={{ color: "#aaa" }}>
          {status === "ringing" ? "📞 রিং হচ্ছে..." : status === "ongoing" ? `⏱ ${fmt(duration)}` : status}
        </p>
        {error && <div className="alert alert-err">{error}</div>}
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <video ref={remoteRef} autoPlay playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", background: "#222" }} />
        {callType === "video" && (
          <video ref={localRef} autoPlay playsInline muted
            style={{ position: "absolute", bottom: 16, right: 16, width: 120, height: 160, objectFit: "cover", borderRadius: 12, border: "2px solid #e91e63", background: "#333" }} />
        )}
        {callType === "audio" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>🎙</div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: 24 }}>
        <button onClick={toggleMute} style={btnStyle}>{muted ? "🔇" : "🎤"}</button>
        {callType === "video" && (
          <button onClick={toggleVideo} style={btnStyle}>{videoOff ? "📷❌" : "📷"}</button>
        )}
        <button onClick={endCall} style={{ ...btnStyle, background: "#f44336" }}>📞</button>
      </div>
    </div>
  );
}

const btnStyle: any = {
  width: 60, height: 60, borderRadius: "50%", border: "none",
  background: "rgba(255,255,255,0.2)", fontSize: 24, color: "#fff",
};
