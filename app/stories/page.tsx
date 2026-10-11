"use client";
import { useState, useEffect } from "react";
import { useLang, Nav } from "@/lib/i18n";

export default function Stories() {
  const { t } = useLang();
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/stories").then((r) => r.json()).then((d) => setStories(d.stories || []));
  }, []);

  return (
    <div className="container page-pad">
      <h2 className="title">{t("story.title")}</h2>
      <p className="subtitle">{t("story.sub")}</p>
      {stories.length === 0 && (
        <div className="card center"><p className="small">{t("story.soon")}</p></div>
      )}
      {stories.map((s: any) => (
        <div key={s.id} className="card">
          {s.photo && <img src={s.photo} style={{ width: "100%", borderRadius: 12, marginBottom: 10 }} />}
          <h3>💕 {s.couple_names}</h3>
          <p className="small" style={{ lineHeight: 1.8, marginTop: 8 }}>{s.story}</p>
        </div>
      ))}
      <Nav active="" />
    </div>
  );
}
