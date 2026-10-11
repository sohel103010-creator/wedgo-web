"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang, Nav } from "@/lib/i18n";

export default function Profile() {
  const { t } = useLang();
  const [profile, setProfile] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function setTheme(theme: string) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wedgo_theme", theme);
  }

  function logout() {
    localStorage.removeItem("wedgo_token");
    localStorage.removeItem("wedgo_user");
    window.location.href = "/login";
  }

  async function boost(hours: number) {
    if (!confirm(`${hours} ঘণ্টার বুস্ট কিনবেন?`)) return;
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/boost", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ hours }),
    });
    const d = await r.json();
    alert(d.ok ? t("profile.boostOn") : (d.error || t("common.fail")));
  }

  useEffect(() => {
    const t = localStorage.getItem("wedgo_theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_token");
    if (!token) { window.location.href = "/login"; return; }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setProfile(d.profile || {}); });
  }, []);

  function set(k: string, v: any) { setProfile({ ...profile, [k]: v }); }

  async function save() {
    setSaving(true); setMsg("");
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(profile),
    });
    const d = await r.json();
    setMsg(d.ok ? `✅ সেভ হয়েছে! প্রোফাইল ${d.completion_pct}% সম্পূর্ণ` : (d.error || t("common.fail")));
    setSaving(false);
  }

  function handlePhoto(k: string, e: any) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 480 / img.width);
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        set(k, c.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  }

  const isFemale = user?.gender === "female";

  return (
    <div className="container page-pad">
      <h2 className="title">{t("profile.title")}</h2>

      <div className="card">
        <div className="row-between"><strong>সম্পূর্ণ: {profile.completion_pct || 0}%</strong></div>
        <div className="progress-bar mt"><div style={{ width: (profile.completion_pct || 0) + "%" }}></div></div>
      </div>

      <div className="card">
        <label className="small">{t("profile.age")}</label>
        <input type="number" placeholder={t("profile.age")} value={profile.age || ""} onChange={(e) => set("age", parseInt(e.target.value))} />

        <label className="small">{t("profile.height")}</label>
        <input placeholder={t("profile.heightPh")} value={profile.height || ""} onChange={(e) => set("height", e.target.value)} />

        <label className="small">{t("pd.address")}</label>
        <input placeholder={t("profile.address")} value={profile.address || ""} onChange={(e) => set("address", e.target.value)} />

        <label className="small">{t("profile.district")}</label>
        <input placeholder={t("profile.district")} value={profile.district || ""} onChange={(e) => set("district", e.target.value)} />

        <label className="small">{t("profile.blood")}</label>
        <select value={profile.blood_group || ""} onChange={(e) => set("blood_group", e.target.value)}>
          <option value="">{t("profile.select")}</option>
          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <label className="small">{t("profile.marital")}</label>
        <select value={profile.marital_status || ""} onChange={(e) => set("marital_status", e.target.value)}>
          <option value="">{t("profile.select")}</option>
          <option value="unmarried">{t("partners.unmarried")}</option>
          <option value="divorced">{t("partners.divorced")}</option>
          <option value="widow">{t("partners.widow")}</option>
        </select>

        <label className="small">{isFemale ? t("pd.gharjamai") : t("profile.gharjamai")}</label>
        <select value={profile.ghar_jamai || ""} onChange={(e) => set("ghar_jamai", e.target.value)}>
          <option value="">{t("profile.select")}</option>
          {isFemale ? (
            <><option value="needed">{t("profile.gjNeed")}</option><option value="not_needed">{t("profile.gjNeedNo")}</option></>
          ) : (
            <><option value="willing">{t("profile.gjYes")}</option><option value="not_willing">{t("profile.gjNo")}</option></>
          )}
        </select>

        <label className="small">{t("profile.education")}</label>
        <input placeholder={t("profile.education")} value={profile.education || ""} onChange={(e) => set("education", e.target.value)} />

        <label className="small">{t("profile.occupation")}</label>
        <input placeholder={t("profile.occupation")} value={profile.occupation || ""} onChange={(e) => set("occupation", e.target.value)} />

        <label className="small">{t("profile.religion")}</label>
        <select value={profile.religion || ""} onChange={(e) => set("religion", e.target.value)}>
          <option value="">{t("profile.select")}</option>
          <option value="islam">{t("partners.islam")}</option>
          <option value="hindu">{t("partners.hindu")}</option>
          <option value="buddhist">{t("partners.buddhist")}</option>
          <option value="christian">{t("partners.christian")}</option>
        </select>

        <label className="small">{t("profile.about")}</label>
        <textarea placeholder={t("profile.aboutPh")} value={profile.bio || ""} onChange={(e) => set("bio", e.target.value)} rows={3} />

        <label className="small">{t("profile.photoMain")}</label>
        <input type="file" accept="image/*" onChange={(e) => handlePhoto("photo1", e)} />
        {profile.photo1 && <img src={profile.photo1} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", marginBottom: 10 }} />}

        <label className="small">{t("profile.photo2")}</label>
        <input type="file" accept="image/*" onChange={(e) => handlePhoto("photo2", e)} />
        {profile.photo2 && <img src={profile.photo2} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", marginBottom: 10 }} />}

        <button className="btn" onClick={save} disabled={saving}>{saving ? t("profile.saving") : t("profile.save")}</button>
        {msg && <div className="alert alert-ok">{msg}</div>}
      </div>

      <div className="card">
        <h3>🔒 প্রাইভেসি সেটিংস</h3>
        <div className="row-between">
          <span>{t("profile.hideOnline")}</span>
          <button onClick={() => { set("hide_online", !profile.hide_online); }} className="btn btn-outline" style={{ marginBottom: 0, width: "auto", padding: "8px 16px" }}>
            {profile.hide_online ? t("profile.hidden") : t("profile.shown")}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>🎨 থিম</h3>
        <div className="row">
          <button onClick={() => setTheme("dark")} className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }}>🌙 ডার্ক</button>
          <button onClick={() => setTheme("light")} className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }}>☀️ লাইট</button>
        </div>
      </div>

      <div className="card">
        <h3>✅ ভেরিফিকেশন</h3>
        {profile.verification_status === "approved" ? (
          <p style={{ color: "#4caf50", fontWeight: 700 }}>{t("pd.verified")}</p>
        ) : profile.verification_status === "pending" ? (
          <p className="small">⏳ যাচাই চলছে...</p>
        ) : (
          <>
            <p className="small">{t("profile.selfie")}</p>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = async () => {
                const img = new Image();
                img.onload = async () => {
                  const c = document.createElement("canvas");
                  const scale = Math.min(1, 600 / img.width);
                  c.width = img.width * scale; c.height = img.height * scale;
                  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
                  const token = localStorage.getItem("wedgo_token");
                  const r = await fetch("/api/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                    body: JSON.stringify({ selfie: c.toDataURL("image/jpeg", 0.7) }),
                  });
                  const d = await r.json();
                  alert(d.ok ? t("profile.selfieOk") : (d.error || t("common.fail")));
                };
                img.src = reader.result as string;
              };
              reader.readAsDataURL(f);
            }} />
          </>
        )}
      </div>

      <div className="card">
        <h3>{t("profile.boost")}</h3>
        <p className="small">{t("profile.boostInfo")}</p>
        <div className="row">
          <button className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }} onClick={() => boost(24)}>২৪ ঘণ্টা — ৳১০০</button>
          <button className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }} onClick={() => boost(72)}>৭২ ঘণ্টা — ৳২০০</button>
        </div>
      </div>

      <div className="card">
        <h3>🔗 দ্রুত লিংক</h3>
        <div className="row">
          <Link href="/favorites" className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }}>⭐ ফেভারিট</Link>
          <Link href="/visitors" className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }}>👁 ভিজিটর</Link>
        </div>
        <div className="row mt">
          <Link href="/support" className="btn btn-outline" style={{ marginBottom: 0, flex: 1 }}>🆘 সাপোর্ট</Link>
          <button onClick={logout} className="btn btn-outline" style={{ marginBottom: 0, flex: 1, borderColor: "#f44336", color: "#f44336" }}>🚪 {t("dash.logout")}</button>
        </div>
      </div>

      <Nav active="profile" />
    </div>
  );
}
