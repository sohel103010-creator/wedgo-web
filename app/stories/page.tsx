"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Stories() {
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/stories").then((r) => r.json()).then((d) => setStories(d.stories || []));
  }, []);

  return (
    <div className="container page-pad">
      <h2 className="title">💑 সফলতার গল্প</h2>
      <p className="subtitle">WedGo-তে পরিচয় হয়ে বিয়ে করেছেন যারা</p>
      {stories.length === 0 && (
        <div className="card center"><p className="small">শীঘ্রই আসছে...</p></div>
      )}
      {stories.map((s: any) => (
        <div key={s.id} className="card">
          {s.photo && <img src={s.photo} style={{ width: "100%", borderRadius: 12, marginBottom: 10 }} />}
          <h3>💕 {s.couple_names}</h3>
          <p className="small" style={{ lineHeight: 1.8, marginTop: 8 }}>{s.story}</p>
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
