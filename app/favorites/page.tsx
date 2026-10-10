"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Favorites() {
  const [favs, setFavs] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    fetch("/api/social?type=favorites", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setFavs(d.favorites || []));
  }, []);

  async function remove(id: number) {
    const token = localStorage.getItem("wedgo_token");
    await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ action: "unfavorite", target_id: id }),
    });
    setFavs(favs.filter((f) => f.id !== id));
  }

  return (
    <div className="container page-pad">
      <h2 className="title">⭐ ফেভারিট লিস্ট</h2>
      {favs.length === 0 && <div className="card center"><p className="small">কোনো ফেভারিট নেই</p></div>}
      <div className="profile-grid">
        {favs.map((p) => (
          <div key={p.id} className="pcard">
            {p.photo1 ? <img src={p.photo1} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 50 }}>👤</div>}
            <div className="info">
              <div style={{ fontWeight: 700 }}>{p.name}{p.age ? `, ${p.age}` : ""}</div>
              <div className="row-between">
                <Link href={`/partners/${p.id}`} className="small" style={{ color: "#f5a623" }}>দেখুন</Link>
                <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: "#f44336" }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
