"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Profile() {
  const [profile, setProfile] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

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
    setMsg(d.ok ? `✅ সেভ হয়েছে! প্রোফাইল ${d.completion_pct}% সম্পূর্ণ` : (d.error || "ব্যর্থ"));
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
      <h2 className="title">👤 প্রোফাইল আপডেট</h2>

      <div className="card">
        <div className="row-between"><strong>সম্পূর্ণ: {profile.completion_pct || 0}%</strong></div>
        <div className="progress-bar mt"><div style={{ width: (profile.completion_pct || 0) + "%" }}></div></div>
      </div>

      <div className="card">
        <label className="small">বয়স</label>
        <input type="number" placeholder="বয়স" value={profile.age || ""} onChange={(e) => set("age", parseInt(e.target.value))} />

        <label className="small">উচ্চতা</label>
        <input placeholder="যেমন: ৫ ফুট ৬ ইঞ্চি" value={profile.height || ""} onChange={(e) => set("height", e.target.value)} />

        <label className="small">ঠিকানা</label>
        <input placeholder="বর্তমান ঠিকানা" value={profile.address || ""} onChange={(e) => set("address", e.target.value)} />

        <label className="small">জেলা</label>
        <input placeholder="জেলা" value={profile.district || ""} onChange={(e) => set("district", e.target.value)} />

        <label className="small">রক্তের গ্রুপ</label>
        <select value={profile.blood_group || ""} onChange={(e) => set("blood_group", e.target.value)}>
          <option value="">সিলেক্ট করুন</option>
          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <label className="small">বৈবাহিক অবস্থা</label>
        <select value={profile.marital_status || ""} onChange={(e) => set("marital_status", e.target.value)}>
          <option value="">সিলেক্ট করুন</option>
          <option value="unmarried">অবিবাহিত</option>
          <option value="divorced">ডিভোর্সি</option>
          <option value="widow">বিধবা/বিপত্নীক</option>
        </select>

        <label className="small">{isFemale ? "ঘর জামাই" : "ঘর জামাই অপশন"}</label>
        <select value={profile.ghar_jamai || ""} onChange={(e) => set("ghar_jamai", e.target.value)}>
          <option value="">সিলেক্ট করুন</option>
          {isFemale ? (
            <><option value="needed">ঘর জামাই লাগবে</option><option value="not_needed">ঘর জামাই লাগবে না</option></>
          ) : (
            <><option value="willing">ঘর জামাই থাকতে চাই</option><option value="not_willing">ঘর জামাই থাকতে চাই না</option></>
          )}
        </select>

        <label className="small">শিক্ষা</label>
        <input placeholder="শিক্ষাগত যোগ্যতা" value={profile.education || ""} onChange={(e) => set("education", e.target.value)} />

        <label className="small">পেশা</label>
        <input placeholder="পেশা" value={profile.occupation || ""} onChange={(e) => set("occupation", e.target.value)} />

        <label className="small">ধর্ম</label>
        <select value={profile.religion || ""} onChange={(e) => set("religion", e.target.value)}>
          <option value="">সিলেক্ট করুন</option>
          <option value="islam">ইসলাম</option>
          <option value="hindu">হিন্দু</option>
          <option value="buddhist">বৌদ্ধ</option>
          <option value="christian">খ্রিস্টান</option>
        </select>

        <label className="small">নিজের সম্পর্কে</label>
        <textarea placeholder="নিজের সম্পর্কে লিখুন..." value={profile.bio || ""} onChange={(e) => set("bio", e.target.value)} rows={3} />

        <label className="small">প্রোফাইল ছবি (মূল)</label>
        <input type="file" accept="image/*" onChange={(e) => handlePhoto("photo1", e)} />
        {profile.photo1 && <img src={profile.photo1} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", marginBottom: 10 }} />}

        <label className="small">মিডিয়া ছবি (দ্বিতীয়)</label>
        <input type="file" accept="image/*" onChange={(e) => handlePhoto("photo2", e)} />
        {profile.photo2 && <img src={profile.photo2} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", marginBottom: 10 }} />}

        <button className="btn" onClick={save} disabled={saving}>{saving ? "সেভ হচ্ছে..." : "💾 সেভ করুন"}</button>
        {msg && <div className="alert alert-ok">{msg}</div>}
      </div>

      <nav className="nav">
        <Link href="/dashboard"><span className="ico">🏠</span>হোম</Link>
        <Link href="/partners"><span className="ico">💑</span>পার্টনার</Link>
        <Link href="/chat"><span className="ico">💬</span>চ্যাট</Link>
        <Link href="/wallet"><span className="ico">💰</span>ওয়ালেট</Link>
        <Link href="/profile" className="active"><span className="ico">👤</span>প্রোফাইল</Link>
      </nav>
    </div>
  );
}
