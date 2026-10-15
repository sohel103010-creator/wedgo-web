"use client";
import { useState, useEffect } from "react";

export default function Admin() {
  const [tab, setTab] = useState("stats");
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [notif, setNotif] = useState({ title: "", body: "", user_id: "all" });
  const [newAdmin, setNewAdmin] = useState({ email: "", mobile: "" });
  const [settingKey, setSettingKey] = useState("");
  const [settingVal, setSettingVal] = useState("");

  function token() { return localStorage.getItem("wedgo_token") || ""; }

  useEffect(() => {
    if (!token()) { window.location.href = "/"; return; }
    loadTab("stats");
  }, []);

  async function loadTab(t: string) {
    setTab(t); setLoading(true);
    const r = await fetch(`/api/admin?tab=${t}`, { headers: { Authorization: "Bearer " + token() } });
    const d = await r.json();
    setData(d); setLoading(false);
  }

  async function action(act: string, params: any = {}) {
    if (!confirm("নিশ্চিত?")) return;
    const r = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
      body: JSON.stringify({ action: act, ...params }),
    });
    const d = await r.json();
    alert(d.ok ? "✅ সম্পন্ন!" : (d.error || "ব্যর্থ"));
    loadTab(tab);
  }

  function logout() {
    localStorage.removeItem("wedgo_token");
    localStorage.removeItem("wedgo_role");
    window.location.href = "/";
  }

  const tabs = [
    ["stats", "📊 ড্যাশবোর্ড"], ["users", "👥 সদস্য"], ["payments", "💳 পেমেন্ট"],
    ["withdrawals", "💸 উত্তোলন"], ["calls", "📞 কল রিপোর্ট"],
    ["reports", "🚩 রিপোর্ট"], ["verify", "✅ ভেরিফাই"], ["settings", "⚙️ সেটিংস"],
  ];

  const s = data.stats;

  return (
    <div className="container" style={{ maxWidth: 800, paddingBottom: 40 }}>
      <div className="row-between" style={{ marginTop: 12 }}>
        <h2>🔐 অ্যাডমিন প্যানেল</h2>
        <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}>লগআউট</button>
      </div>
      {data.admin && <p className="small">{data.admin.email} {data.admin.isMain && "(মেইন অ্যাডমিন)"}</p>}

      <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "14px 0", paddingBottom: 4 }}>
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => loadTab(k)}
            style={{ whiteSpace: "nowrap", padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: tab === k ? "#e91e63" : "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13 }}>
            {label}
            {k === "payments" && s?.pendingPay > 0 && ` (${s.pendingPay})`}
            {k === "withdrawals" && s?.pendingWd > 0 && ` (${s.pendingWd})`}
          </button>
        ))}
      </div>

      {loading && <p className="center">লোড হচ্ছে...</p>}

      {tab === "stats" && s && (
        <>
          <div className="stat-grid">
            <div className="card stat"><div className="num">{s.totalUsers}</div><div className="lbl">মোট সদস্য</div></div>
            <div className="card stat"><div className="num">{s.premium}</div><div className="lbl">প্রিমিয়াম</div></div>
            <div className="card stat"><div className="num">{s.maleUsers} / {s.femaleUsers}</div><div className="lbl">ছেলে / মেয়ে</div></div>
            <div className="card stat"><div className="num">৳{s.revenue}</div><div className="lbl">মোট আয়</div></div>
            <div className="card stat"><div className="num">{s.todayCalls}</div><div className="lbl">আজকের কল</div></div>
            <div className="card stat"><div className="num">{Math.round(s.todaySecs / 60)}</div><div className="lbl">মোট মিনিট (আজ)</div></div>
          </div>
          <div className="card">
            <h3>📢 নোটিফিকেশন পাঠান</h3>
            <input placeholder="শিরোনাম" value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })} />
            <textarea placeholder="মেসেজ" value={notif.body} onChange={(e) => setNotif({ ...notif, body: e.target.value })} rows={2} />
            <button className="btn" onClick={() => action("send_notification", notif)}>সবাইকে পাঠান</button>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="card">
          <div className="row">
            <input placeholder="নাম/মোবাইল/ইমেইল দিয়ে খুঁজুন" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
            <button className="btn" style={{ width: 100, marginBottom: 0 }} onClick={() => loadTab("users")}>খুঁজুন</button>
          </div>
          <div style={{ overflowX: "auto" }} className="mt">
            <table className="admin-tbl">
              <tr><th>নাম</th><th>মোবাইল</th><th>লিঙ্গ</th><th>প্রিমিয়াম</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr>
              {(data.users || []).map((u: any) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.mobile}</td><td>{u.gender === "male" ? "👨" : "👩"}</td>
                  <td>{u.has_premium > 0 ? "✅" : "—"}</td><td>{u.status}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button onClick={() => { window.location.href = `/partners/${u.id}`; }} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>👁 প্রোফাইল</button>
                    <button onClick={() => { window.location.href = `/chat?with=${u.id}`; }} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>💬 মেসেজ</button>
                    <button onClick={() => { window.location.href = `/chat?with=${u.id}&call=audio`; }} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>📞 কল</button>
                    <button onClick={() => { window.location.href = `/chat?with=${u.id}&call=video`; }} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>📹 ভিডিও</button>
                    <button onClick={() => action("verify_user", { user_id: u.id })} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>✓ ভেরিফাই</button>
                    {u.status === "active" ? (
                      <button onClick={() => action("suspend_user", { user_id: u.id, days: 2 })} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>⏸ স্থগিত</button>
                    ) : (
                      <button onClick={() => action("unsuspend_user", { user_id: u.id })} style={{ fontSize: 11, padding: "4px 8px", margin: 2 }}>▶ চালু</button>
                    )}
                    <button onClick={() => action("ban_user", { user_id: u.id })} style={{ fontSize: 11, padding: "4px 8px", margin: 2, background: "#f44336", border: "none", borderRadius: 6, color: "#fff" }}>ব্যান</button>
                  </td>
                </tr>
              ))}
            </table>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="card">
          <h3>পেন্ডিং পেমেন্ট ({(data.payments || []).length})</h3>
          {(data.payments || []).map((p: any) => (
            <div key={p.id} className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="row-between"><strong>{p.user_name}</strong><span className="badge" style={{ background: p.ai_check === "likely_valid" ? "#4caf50" : "#f5a623" }}>AI: {p.ai_check}</span></div>
              <div className="small">{p.mobile} | {p.package_name} | ৳{p.amount} | {p.method}</div>
              <div className="small">সেন্ডার: {p.sender_number} | TrxID: {p.trx_id}</div>
              <div className="row mt">
                <button className="btn" style={{ marginBottom: 0, background: "#4caf50" }} onClick={() => action("approve_payment", { id: p.id })}>✅ অনুমোদন</button>
                <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => action("reject_payment", { id: p.id })}>❌ বাতিল</button>
              </div>
            </div>
          ))}
          {(data.payments || []).length === 0 && <p className="small">কোনো পেন্ডিং পেমেন্ট নেই</p>}
        </div>
      )}

      {tab === "withdrawals" && (
        <div className="card">
          <h3>পেন্ডিং উত্তোলন</h3>
          {(data.withdrawals || []).map((w: any) => (
            <div key={w.id} className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="row-between"><strong>{w.user_name}</strong><strong style={{ color: "#f5a623" }}>৳{w.amount}</strong></div>
              <div className="small">{w.method}: {w.number}</div>
              <div className="row mt">
                <button className="btn" style={{ marginBottom: 0, background: "#4caf50" }} onClick={() => action("approve_withdrawal", { id: w.id })}>✅ সম্পন্ন</button>
                <button className="btn btn-outline" style={{ marginBottom: 0 }} onClick={() => action("reject_withdrawal", { id: w.id })}>❌ বাতিল</button>
              </div>
            </div>
          ))}
          {(data.withdrawals || []).length === 0 && <p className="small">কোনো পেন্ডিং উত্তোলন নেই</p>}
        </div>
      )}

      {tab === "calls" && (
        <div className="card">
          <h3>📞 আজকের কল রিপোর্ট</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-tbl">
              <tr><th>কলার</th><th>রিসিভার</th><th>ধরন</th><th>সময়কাল</th><th>শুরু</th></tr>
              {(data.calls || []).map((c: any) => (
                <tr key={c.id}>
                  <td>{c.caller_name}</td><td>{c.receiver_name}</td>
                  <td>{c.call_type === "video" ? "📹" : "🎙"}</td>
                  <td>{Math.round(c.duration_sec / 60)} মিনিট</td>
                  <td className="small">{new Date(c.started_at).toLocaleString("bn-BD")}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="card">
          <h3>🚩 রিপোর্ট</h3>
          {(data.reports || []).map((r: any) => (
            <div key={r.id} className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <strong>{r.reporter_name}</strong> → <strong>{r.reported_name}</strong>
              <div className="small">কারণ: {r.reason}</div>
              <div className="small">{r.details}</div>
              <button className="btn btn-outline mt" onClick={() => action("suspend_user", { user_id: r.reported_id, days: 2 })}>স্থগিত করুন</button>
            </div>
          ))}
          {(data.reports || []).length === 0 && <p className="small">কোনো রিপোর্�்ட নেই</p>}
        </div>
      )}

      {tab === "verify" && (
        <VerifyTab />
      )}

      {tab === "settings" && (
        <>
          <div className="card">
            <h3>💳 পেমেন্ট নম্বর</h3>
            {["bkash_number", "nagad_number", "rocket_number"].map((k) => (
              <div key={k} className="row">
                <span className="small" style={{ width: 120 }}>{k}</span>
                <input defaultValue={data.settings?.[k] || ""} id={"set-" + k} style={{ marginBottom: 0 }} />
                <button className="btn" style={{ width: 80, marginBottom: 0 }} onClick={() => {
                  const v = (document.getElementById("set-" + k) as HTMLInputElement).value;
                  action("update_setting", { key: k, value: v });
                }}>সেভ</button>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>📦 প্যাকেজ মূল্য</h3>
            {(data.packages || []).map((p: any) => (
              <div key={p.id} className="row">
                <span style={{ width: 120 }}>{p.name}</span>
                <input type="number" defaultValue={p.price} id={"pkg-" + p.id} style={{ marginBottom: 0 }} />
                <button className="btn" style={{ width: 80, marginBottom: 0 }} onClick={() => {
                  const v = (document.getElementById("pkg-" + p.id) as HTMLInputElement).value;
                  action("update_package", { id: p.id, price: parseInt(v) });
                }}>সেভ</button>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>👥 অ্যাডমিন ম্যানেজ</h3>
            <p className="small">মেইন অ্যাডমিন: sj2114273@gmail.com</p>
            <div className="row">
              <input placeholder="নতুন অ্যাডমিন জিমেইল" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} style={{ marginBottom: 0 }} />
              <button className="btn" style={{ width: 100, marginBottom: 0 }} onClick={() => action("add_admin", newAdmin)}>যোগ করুন</button>
            </div>
          </div>
          <div className="card">
            <h3>🖼 সাইট লোগো</h3>
            {data.settings?.site_logo && <img src={data.settings.site_logo} style={{ width: 80, height: 80, borderRadius: 12, marginBottom: 10 }} />}
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                  const c = document.createElement("canvas");
                  c.width = 200; c.height = 200;
                  c.getContext("2d")!.drawImage(img, 0, 0, 200, 200);
                  action("update_setting", { key: "site_logo", value: c.toDataURL("image/png") });
                };
                img.src = reader.result as string;
              };
              reader.readAsDataURL(f);
            }} />
            <p className="small">লোগো আপলোড করলে সাইটে দেখাবে</p>
          </div>
          <div className="card">
            <h3>⚙️ অন্যান্য সেটিংস</h3>
            <input placeholder="key (যেমন: site_tagline)" value={settingKey} onChange={(e) => setSettingKey(e.target.value)} />
            <input placeholder="value" value={settingVal} onChange={(e) => setSettingVal(e.target.value)} />
            <button className="btn" onClick={() => action("update_setting", { key: settingKey, value: settingVal })}>সেভ</button>
          </div>
        </>
      )}
    </div>
  );
}

function VerifyTab() {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("wedgo_admin_token");
    fetch("/api/verify", { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setPending(d.pending || []));
  }, []);

  async function decide(user_id: number, status: string) {
    const token = localStorage.getItem("wedgo_admin_token");
    await fetch("/api/verify", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ user_id, status }),
    });
    setPending(pending.filter((p) => p.id !== user_id));
  }

  return (
    <div className="card">
      <h3>✅ ভেরিফিকেশন অনুরোধ</h3>
      {pending.map((p: any) => (
        <div key={p.id} className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
          <strong>{p.name}</strong>
          <div className="row mt">
            <div style={{ flex: 1 }}>
              <div className="small">সেলফি</div>
              <img src={p.selfie_photo} style={{ width: "100%", borderRadius: 10 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="small">প্রোফাইল ছবি</div>
              {p.photo1 ? <img src={p.photo1} style={{ width: "100%", borderRadius: 10 }} /> : <p className="small">নেই</p>}
            </div>
          </div>
          <div className="row mt">
            <button className="btn" style={{ marginBottom: 0, background: "#4caf50" }} onClick={() => decide(p.id, "approved")}>✅ অনুমোদন</button>
            <button className="btn" style={{ marginBottom: 0, background: "#f44336" }} onClick={() => decide(p.id, "rejected")}>❌ বাতিল</button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <p className="small">কোনো অনুরোধ নেই</p>}
    </div>
  );
}
