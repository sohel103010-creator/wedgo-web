"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { dict, type Lang } from "./dict";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LangCtx = createContext<Ctx>({
  lang: "bn",
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => {
    const s = localStorage.getItem("wedgo_lang");
    if (s === "en" || s === "bn") setLangState(s);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("wedgo_lang", l); } catch {}
  };
  const t = (key: string, vars?: Record<string, string | number>) => {
    let s: string = (dict[lang] as Record<string, string>)[key]
      ?? (dict.bn as Record<string, string>)[key]
      ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
    // also support {n}/{d} shorthands
    return s;
  };
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

/** Slide toggle: বাং ⇄ EN */
export function LangToggle() {
  const { lang, setLang } = useLang();
  const isEn = lang === "en";
  return (
    <button
      onClick={() => setLang(isEn ? "bn" : "en")}
      aria-label="Language / ভাষা"
      style={{
        position: "relative", display: "flex", alignItems: "center",
        width: 76, height: 30, borderRadius: 999,
        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
        cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, bottom: 2, width: 34, borderRadius: 999,
        background: "#e91e63", transition: "left 0.2s ease",
        left: isEn ? 38 : 4,
      }} />
      <span style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 800, color: isEn ? "#fff" : "#ffd3e3", zIndex: 1 }}>বাং</span>
      <span style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 800, color: isEn ? "#ffd3e3" : "#fff", zIndex: 1 }}>EN</span>
    </button>
  );
}

/** Shared bottom nav with language toggle */
export function Nav({ active }: { active: string }) {
  const { t } = useLang();
  const items = [
    { href: "/dashboard", key: "dashboard", ico: "🏠", label: t("nav.home") },
    { href: "/partners", key: "partners", ico: "💑", label: t("nav.partners") },
    { href: "/chat", key: "chat", ico: "💬", label: t("nav.chat") },
    { href: "/wallet", key: "wallet", ico: "💰", label: t("nav.wallet") },
    { href: "/profile", key: "profile", ico: "👤", label: t("nav.profile") },
  ];
  return (
    <nav className="nav">
      {items.map((it) => (
        <Link key={it.key} href={it.href} className={active === it.key ? "active" : ""}>
          <span className="ico">{it.ico}</span>{it.label}
        </Link>
      ))}
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
        <LangToggle />
      </div>
    </nav>
  );
}
