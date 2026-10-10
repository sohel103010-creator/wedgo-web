"use client";
import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa_dismissed")) { setDismissed(true); return; }
    // Show after 3 seconds
    const t = setTimeout(() => setShow(true), 3000);
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => { window.removeEventListener("beforeinstallprompt", handler); clearTimeout(t); };
  }, []);

  if (!show || dismissed) return null;

  function install() {
    if (prompt) {
      prompt.prompt();
      prompt.userChoice.then(() => setShow(false));
    } else {
      alert("📲 ইনস্টল করতে:\n\nAndroid (Chrome): মেনু (⋮) → \"Add to Home screen\"\n\niPhone (Safari): Share (⎙) → \"Add to Home Screen\"");
    }
  }

  function dismiss() {
    localStorage.setItem("pwa_dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="card center" style={{ border: "2px solid #e91e63" }}>
      <h3>📲 WedGo অ্যাপ ইনস্টল করুন!</h3>
      <p className="small">হোম স্ক্রিনে অ্যাপ আইকন পান — দ্রুত অ্যাক্সেসের জন্য</p>
      <div className="row">
        <button className="btn" style={{ marginBottom: 0 }} onClick={install}>
          ইনস্টল করুন
        </button>
        <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={dismiss}>
          পরে
        </button>
      </div>
    </div>
  );
}
