"use client";
import { useState } from "react";
import { useLang, Nav } from "@/lib/i18n";

const FAQS = [
  { q: "রেজিস্ট্রেশন কি ফ্রি?", a: "হ্যাঁ, রেজিস্ট্রেশন সম্পূর্ণ ফ্রি।" },
  { q: "ছেলেদের কেন প্যাকেজ কিনতে হবে?", a: "মেয়েদের সাথে যোগাযোগ (মেসেজ/কল) করতে পুরুষদের প্রিমিয়াম প্যাকেজ কিনতে হবে।" },
  { q: "মেয়েরা কীভাবে আয় করবে?", a: "ভিডিও/অডিও কলে কথা বললে প্রতি মিনিট হিসেবে ব্যালেন্স যোগ হবে, যা উত্তোলন করা যাবে।" },
  { q: "পেমেন্ট কীভাবে করব?", a: "বিকাশ/নগদ/রকেটে সেন্ড মানি করে ট্রানজেকশন আইডি জমা দিন। অ্যাডমিন অনুমোদন দিলে প্যাকেজ চালু হবে।" },
  { q: "ভুল করে নম্বর শেয়ার করলে কী হবে?", a: "১০০/৫০০/২০০০ প্যাকেজে নম্বর/লিংক শেয়ার করলে আইডি ২ দিনের জন্য সাসপেন্ড হবে।" },
];

export default function Support() {
  const { t } = useLang();
  const [open, setOpen] = useState(-1);
  const [ticket, setTicket] = useState({ subject: "", message: "" });
  const [msg, setMsg] = useState("");

  async function submitTicket() {
    const token = localStorage.getItem("wedgo_token");
    const r = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(ticket),
    });
    const d = await r.json();
    setMsg(d.ok ? t("sup.ticketOk") : (d.error || "ব্যর্থ"));
    if (d.ok) setTicket({ subject: "", message: "" });
  }

  return (
    <div className="container page-pad">
      <h2 className="title">{t("sup.title")}</h2>

      <div className="card">
        <h3>{t("sup.faq")}</h3>
        {FAQS.map((f, i) => (
          <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 0" }}>
            <div onClick={() => setOpen(open === i ? -1 : i)} style={{ cursor: "pointer", fontWeight: 700 }}>
              {open === i ? "▼" : "▶"} {f.q}
            </div>
            {open === i && <p className="small mt" style={{ lineHeight: 1.8 }}>{f.a}</p>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>{t("sup.ticket")}</h3>
        <input placeholder={t("sup.subject")} value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} />
        <textarea placeholder={t("sup.writeIssue")} value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} rows={4} />
        <button className="btn" onClick={submitTicket}>{t("sup.submit")}</button>
        {msg && <div className="alert alert-ok">{msg}</div>}
      </div>

      <div className="card center">
        <a href="https://www.facebook.com/profile.php?id=61594689478770" target="_blank" style={{ color: "#e91e63" }}>📘 Facebook Page-এ মেসেজ করুন</a>
      </div>

      <Nav active="" />
    </div>
  );
}
