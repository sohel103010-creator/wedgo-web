"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Partners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [filters, setFilters] = useState({ minAge: "", maxAge: "", district: "", marital: "" });
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
    // Show opposite gender by default
    fetch("/api/partners?" + p.toString()).then((r) => r.json()).then((d) => setPartners(d.partners || []));
  }

  const hasPremium = !!me?.subscription;
  const isFemale = me?.user?.gender === "female";

  function viewProfile(p: any) {
    if (!me?.user) { window.location.href = "/login"; return; }
    if (!hasPremium && !isFemale) {
      alert("এই প্রোফাইলটি দেখতে প্রিমিয়াম প্যাকেজ কিনুন");
      window.location.href = "/packages";
      return;
    }
    window.location.href = "/partners/" + p.id;
  }

  return (
    <div className="container page-pad">
      <div className="row-between" style={{ marginTop: 10 }}>
        <h2>💑 পার্টনার খুঁজুন</h2>
        <div className="row" style={{ gap: 8 }}>
          <button onClick={() => loadPartners()} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>🔄</button>
          <button onClick={() => setShowFilter(!showFilter)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>🔍 ফিল্টার</button>
        </div>
      </div>

      {showFilter && (
        <div className="card mt">
          <div className="row">
            <input type="number" placeholder="সর্বনিম্ন বয়স" value={filters.minAge} onChange={(e) => setFilters({ ...filters, minAge: e.target.value })} />
            <input type="number" placeholder="সর্বোচ্চ বয়স" value={filters.maxAge} onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })} />
          </div>
          <input placeholder="জেলা" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} />
          <select value={filters.marital} onChange={(e) => setFilters({ ...filters, marital: e.target.value })}>
            <option value="">বৈবাহিক অবস্থা (সব)</option>
            <option value="unmarried">অবিবাহিত</option>
            <option value="divorced">ডিভোর্সি</option>
            <option value="widow">বিধবা/বিপত্নীক</option>
          </select>
          <button className="btn" onClick={loadPartners}>খুঁজুন</button>
        </div>
      )}

      {!hasPremium && !isFemale && me?.user && (
        <div className="alert alert-warn mt">🔒 প্রোফাইল দেখতে <Link href="/packages" style={{ color: "#f5a623", fontWeight: 700 }}>প্রিমিয়াম প্যাকেজ</Link> কিনুন</div>
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
                {blurred && <div className="small" style={{ color: "#f5a623" }}>🔒 দেখতে প্রিমিয়াম কিনুন</div>}
              </div>
            </div>
          );
        })}
      </div>
      {partners.length === 0 && <p className="center small mt">কোনো প্রোফাইল পাওয়া যায়নি</p>}

      <nav className="nav">
        <Link href="/dashboard"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners" className="active"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>
    </div>
  );
}
