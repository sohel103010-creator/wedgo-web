"use client";
import { useState } from "react";
import Link from "next/link";
import { COUNTRY_CODES, composePhone } from "@/lib/phone";
import { useLang, LangToggle } from "@/lib/i18n";

export default function Login() {
  const { t } = useLang();
  const [mobile, setMobile] = useState("");
  const [cc, setCc] = useState("880");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"password" | "email">("password");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    setMsg(""); setLoading(true);
    try {
      const fullMobile = composePhone(cc, mobile);
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "password" ? { mobile: fullMobile, password } : { mobile: fullMobile, email }),
      });
      const d = await r.json();
      if (d.ok) {
        localStorage.setItem("wedgo_token", d.token);
        localStorage.setItem("wedgo_role", "member");
        window.location.href = "/dashboard";
      } else {
        setMsg(d.error || t("common.loginFirst"));
      }
    } catch { setMsg("নেটওয়ার্ক সমস্যা"); }
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="logo" style={{ fontSize: 28 }}>💒 WedGo</div>
      <div className="row-between" style={{ marginBottom: 12 }}><h2 className="title" style={{ margin: 0 }}>{t("auth.login")}</h2><LangToggle /></div>

      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <button className={mode === "password" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setMode("password")}>{t("auth.withPassword")}</button>
          <button className={mode === "email" ? "btn" : "btn btn-outline"} style={{ marginBottom: 0 }} onClick={() => setMode("email")}>{t("auth.withEmail")}</button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select value={cc} onChange={(e) => setCc(e.target.value)} style={{ maxWidth: 128 }}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
            ))}
          </select>
          <input placeholder={t("auth.mobilePh")} value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" style={{ flex: 1 }} />
        </div>
        {mode === "password" ? (
          <input type="password" placeholder={t("auth.passwordLoginPh")} value={password} onChange={(e) => setPassword(e.target.value)} />
        ) : (
          <input type="email" placeholder={t("auth.emailPh")} value={email} onChange={(e) => setEmail(e.target.value)} />
        )}

        <button className="btn" onClick={doLogin} disabled={loading}>
          {loading ? t("auth.wait") : t("auth.login")}
        </button>
        {msg && <div className="alert alert-err">{msg}</div>}

        <div className="row-between mt">
          <Link href="/forgot-password" style={{ color: "#e91e63", fontSize: 14 }}>{t("auth.forgotPw")}</Link>
          <Link href="/register" style={{ color: "#f5a623", fontSize: 14 }}>{t("auth.noAccount")}</Link>
        </div>
      </div>
      <div className="center"><Link href="/" className="small">{t("common.back")}</Link></div>
    </div>
  );
}
