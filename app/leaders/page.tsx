"use client";
import { useState, useEffect } from "react";
import { useLang, Nav } from "@/lib/i18n";

export default function Leaders() {
  const { t } = useLang();
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
        <div className="card"><p>{t("lead.femaleOnly")}</p></div>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="container page-pad">
      <h2 className="title">{t("lead.title")}</h2>
      <p className="subtitle">{t("lead.sub")}</p>
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
      <Nav active="" />
    </div>
  );
}
