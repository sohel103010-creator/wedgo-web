"use client";
import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="card center" style={{ border: "2px solid #e91e63" }}>
      <h3>📲 WedGo অ্যাপ ইনস্টল করুন!</h3>
      <p className="small">হোম স্ক্রিনে অ্যাপ আইকন পান</p>
      <div className="row">
        <button className="btn" style={{ marginBottom: 0 }} onClick={() => { prompt?.prompt(); setShow(false); }}>
          ইনস্টল করুন
        </button>
        <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => setShow(false)}>
          পরে
        </button>
      </div>
    </div>
  );
}
