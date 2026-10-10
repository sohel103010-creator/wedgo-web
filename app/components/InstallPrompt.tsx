"use client";
import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa_dismissed")) { setDismissed(true); return; }
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Only show when native install is available
  if (!prompt || dismissed) return null;

  function install() {
    prompt.prompt();
    prompt.userChoice.then((choice: any) => {
      if (choice.outcome === "accepted") {
        localStorage.setItem("pwa_dismissed", "1");
      }
      setPrompt(null);
    });
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
