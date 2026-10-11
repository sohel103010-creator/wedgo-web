"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang, Nav } from "@/lib/i18n";

export default function Favorites() {
  const { t } = useLang();
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
      <h2 className="title">{t("fav.title")}</h2>
      {favs.length === 0 && <div className="card center"><p className="small">{t("fav.none")}</p></div>}
      <div className="profile-grid">
        {favs.map((p) => (
          <div key={p.id} className="pcard">
            {p.photo1 ? <img src={p.photo1} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 50 }}>👤</div>}
            <div className="info">
              <div style={{ fontWeight: 700 }}>{p.name}{p.age ? `, ${p.age}` : ""}</div>
              <div className="row-between">
                <Link href={`/partners/${p.id}`} className="small" style={{ color: "#f5a623" }}>{t("fav.view")}</Link>
                <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: "#f44336" }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Nav active="" />
    </div>
  );
}
