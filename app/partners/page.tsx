"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang, Nav } from "@/lib/i18n";

export default function Partners() {
  const { t } = useLang();
  const [partners, setPartners] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [filters, setFilters] = useState({ minAge: "", maxAge: "", district: "", marital: "", education: "", occupation: "", religion: "", minHeight: "", maxHeight: "" });
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } })
        .then((r) => r.json()).then((d) => setMe(d));
    }
    loadPartners();
  }, []);

  function loadPartners() {
    const p = new URLSearchParams();
    if (filters.minAge) p.set("minAge", filters.minAge);
    if (filters.maxAge) p.set("maxAge", filters.maxAge);
    if (filters.district) p.set("district", filters.district);
    if (filters.marital) p.set("marital", filters.marital);
    if (filters.education) p.set("education", filters.education);
    if (filters.occupation) p.set("occupation", filters.occupation);
    if (filters.religion) p.set("religion", filters.religion);
    if (filters.minHeight) p.set("minHeight", filters.minHeight);
    if (filters.maxHeight) p.set("maxHeight", filters.maxHeight);
    // Show opposite gender by default
    fetch("/api/partners?" + p.toString()).then((r) => r.json()).then((d) => setPartners(d.partners || []));
  }

  const hasPremium = !!me?.subscription;
  const isFemale = me?.user?.gender === "female";

  function viewProfile(p: any) {
    if (!me?.user) { window.location.href = "/login"; return; }
    if (!hasPremium && !isFemale) {
      alert(t("partners.needPremiumAlert"));
      window.location.href = "/packages";
      return;
    }
    window.location.href = "/partners/" + p.id;
  }

  function activeText(p: any) {
    if (p.hide_online) return null;
    if (!p.last_active) return null;
    const mins = Math.floor((Date.now() - new Date(p.last_active).getTime()) / 60000);
    if (mins < 5) return <span style={{ color: "#4caf50", fontWeight: 700 }}>{t("partners.online")}</span>;
    if (mins < 60) return <span className="small">{t("partners.minAgo", { n: Math.floor(mins) })}</span>;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return <span className="small">{t("partners.hourAgo", { n: hours })}</span>;
    const days = Math.floor(hours / 24);
    return <span className="small">{t("partners.dayAgo", { n: days })}</span>;
  }

  return (
    <div className="container page-pad">
      <div className="row-between" style={{ marginTop: 10 }}>
        <h2>{t("partners.title")}</h2>
        <div className="row" style={{ gap: 8 }}>
          <button onClick={() => loadPartners()} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>🔄</button>
          <button onClick={() => setShowFilter(!showFilter)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>{t("partners.filter")}</button>
        </div>
      </div>

      {showFilter && (
        <div className="card mt">
          <div className="row">
            <input type="number" placeholder={t("partners.minAge")} value={filters.minAge} onChange={(e) => setFilters({ ...filters, minAge: e.target.value })} />
            <input type="number" placeholder={t("partners.maxAge")} value={filters.maxAge} onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })} />
          </div>
          <input placeholder={t("partners.district")} value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} />
          <select value={filters.marital} onChange={(e) => setFilters({ ...filters, marital: e.target.value })}>
            <option value="">{t("partners.maritalAll")}</option>
            <option value="unmarried">{t("partners.unmarried")}</option>
            <option value="divorced">{t("partners.divorced")}</option>
            <option value="widow">{t("partners.widow")}</option>
          </select>
          <div className="row">
            <input type="number" placeholder={t("partners.minHeight")} value={filters.minHeight} onChange={(e) => setFilters({ ...filters, minHeight: e.target.value })} />
            <input type="number" placeholder={t("partners.maxHeight")} value={filters.maxHeight} onChange={(e) => setFilters({ ...filters, maxHeight: e.target.value })} />
          </div>
          <input placeholder={t("partners.education")} value={filters.education} onChange={(e) => setFilters({ ...filters, education: e.target.value })} />
          <input placeholder={t("partners.occupation")} value={filters.occupation} onChange={(e) => setFilters({ ...filters, occupation: e.target.value })} />
          <select value={filters.religion} onChange={(e) => setFilters({ ...filters, religion: e.target.value })}>
            <option value="">{t("partners.religionAll")}</option>
            <option value="islam">{t("partners.islam")}</option>
            <option value="hindu">{t("partners.hindu")}</option>
            <option value="buddhist">{t("partners.buddhist")}</option>
            <option value="christian">{t("partners.christian")}</option>
          </select>
          <button className="btn" onClick={loadPartners}>{t("partners.search")}</button>
        </div>
      )}

      {!hasPremium && !isFemale && me?.user && (
        <div className="alert alert-warn mt"><Link href="/packages" style={{ color: "#f5a623", fontWeight: 700 }}>{t("partners.needPremium")}</Link></div>
      )}

      <div className="profile-grid mt">
        {partners.map((p) => {
          const blurred = !hasPremium && !isFemale;
          return (
            <div key={p.id} className={`pcard ${blurred ? "blurred" : ""}`} onClick={() => viewProfile(p)} style={{ cursor: "pointer" }}>
              {p.photo1 ? (
                <img src={p.photo1} alt={p.name} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
                  {p.gender === "female" ? "👩" : "👨"}
                </div>
              )}
              <div className="info">
                <div style={{ fontWeight: 700 }}>
                  {p.name}{p.age ? `, ${p.age}` : ""}
                  {p.verified && <span className="badge badge-verified">✓</span>}
                </div>
                <div className="small">{p.district || ""} {p.occupation ? `• ${p.occupation}` : ""}</div>
                <div>{activeText(p)}</div>
                {blurred && <div className="small" style={{ color: "#f5a623" }}>{t("partners.buyPremiumToView")}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {partners.length === 0 && <p className="center small mt">{t("partners.none")}</p>}

      <Nav active="partners" />
    </div>
  );
}
