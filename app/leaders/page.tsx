"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Leaders() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json()).then((d) => {
      setMe(d);
      // Only females and admins can see
      if (d?.user?.gender === "female" || d?.user?.role === "admin") {
        fetch("/api/leaders", { headers: { Authorization: "Bearer " + token } })
          .then((r) => r.json()).then((x) => setLeaders(x.leaders || []));
      }
    });
  }, []);

  if (me && me.user?.gender !== "female" && me.user?.role !== "admin") {
    return (
      <div className="container page-pad center">
        <div className="card"><p>শুধুমাত্র নারী সদস্যরা দেখতে পারবে</p></div>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="container page-pad">
      <h2 className="title">🏆 টপ আর্নার</h2>
      <p className="subtitle">সর্বোচ্চ আয়কারী নারী সদস্য</p>
      {leaders.map((l: any, i: number) => (
        <div key={l.id} className="card row">
          <span style={{ fontSize: 28 }}>{medals[i] || `${i + 1}.`}</span>
          <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {l.photo1 ? <img src={l.photo1} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👩"}
          </div>
          <div style={{ flex: 1 }}>
            <strong>{l.name}</strong>
            <div className="small">মোট আয়: ৳{l.total_earned}</div>
          </div>
        </div>
      ))}
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
