"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang, Nav } from "@/lib/i18n";

export default function Visitors() {
  const { t, lang } = useLang();
  const [visitors, setVisitors] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    fetch("/api/social?type=visitors", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setVisitors(d.visitors || []));
  }, []);

  return (
    <div className="container page-pad">
      <h2 className="title">{t("vis.title")}</h2>
      <p className="subtitle">{t("vis.sub")}</p>
      {visitors.length === 0 && <div className="card center"><p className="small">{t("vis.none")}</p></div>}
      {visitors.map((v: any, i: number) => (
        <Link key={i} href={`/partners/${v.id}`} className="card row">
          <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            {v.photo1 ? <img src={v.photo1} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <strong>{v.name}{v.age ? `, ${v.age}` : ""}</strong>
            <div className="small">{new Date(v.created_at).toLocaleString(lang === "en" ? "en-US" : "bn-BD")}</div>
          </div>
        </Link>
      ))}
      <Nav active="" />
    </div>
  );
}
