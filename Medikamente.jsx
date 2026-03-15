import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "medikamente_v1";
const WARNING_DAYS = 14;

const defaultMeds = [];

function getDaysLeft(tablets, dailyDose) {
  if (!dailyDose || dailyDose <= 0) return null;
  return Math.floor(tablets / dailyDose);
}

function StatusBadge({ days }) {
  if (days === null) return null;
  if (days <= 0) return <span style={styles.badge.empty}>Aufgebraucht</span>;
  if (days <= WARNING_DAYS) return <span style={styles.badge.warning}>Rezept nötig</span>;
  return <span style={styles.badge.ok}>{days} Tage</span>;
}

const styles = {
  badge: {
    ok: { background: "#d1fae5", color: "#065f46", borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
    warning: { background: "#fef3c7", color: "#92400e", borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
    empty: { background: "#fee2e2", color: "#991b1b", borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 0.3 },
  }
};

export default function App() {
  const [meds, setMeds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultMeds; } catch { return defaultMeds; }
  });
  const [view, setView] = useState("overview"); // overview | add | edit
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", tablets: "", dailyDose: "", unit: "Tabletten", notes: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meds)); } catch {}
  }, [meds]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const warnings = meds.filter(m => {
    const d = getDaysLeft(Number(m.tablets), Number(m.dailyDose));
    return d !== null && d <= WARNING_DAYS;
  });

  const openAdd = () => {
    setForm({ name: "", tablets: "", dailyDose: "", unit: "Tabletten", notes: "" });
    setEditId(null);
    setView("add");
  };

  const openEdit = (med) => {
    setForm({ name: med.name, tablets: String(med.tablets), dailyDose: String(med.dailyDose), unit: med.unit || "Tabletten", notes: med.notes || "" });
    setEditId(med.id);
    setView("edit");
  };

  const saveMed = () => {
    if (!form.name.trim() || !form.tablets || !form.dailyDose) { showToast("Bitte alle Pflichtfelder ausfüllen.", "err"); return; }
    if (view === "edit") {
      setMeds(prev => prev.map(m => m.id === editId ? { ...m, ...form, tablets: Number(form.tablets), dailyDose: Number(form.dailyDose) } : m));
      showToast("Gespeichert ✓");
    } else {
      setMeds(prev => [...prev, { id: Date.now(), ...form, tablets: Number(form.tablets), dailyDose: Number(form.dailyDose) }]);
      showToast("Medikament hinzugefügt ✓");
    }
    setView("overview");
  };

  const deleteMed = (id) => {
    setMeds(prev => prev.filter(m => m.id !== id));
    showToast("Entfernt");
    setView("overview");
  };

  const adjustTablets = (id, delta) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, tablets: Math.max(0, m.tablets + delta) } : m));
  };

  const sorted = [...meds].sort((a, b) => {
    const da = getDaysLeft(a.tablets, a.dailyDose);
    const db = getDaysLeft(b.tablets, b.dailyDose);
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'Georgia', serif", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ background: "#1c3d2e", padding: "20px 20px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16 }}>
            <div>
              <div style={{ color: "#7ec8a0", fontSize: 11, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}>Meine Apotheke</div>
              <h1 style={{ color: "#fff", fontSize: 24, margin: "2px 0 0", fontWeight: 400, letterSpacing: -0.5 }}>Vorrat</h1>
            </div>
            {view === "overview" && (
              <button onClick={openAdd} style={{ background: "#7ec8a0", border: "none", borderRadius: 99, padding: "8px 18px", fontSize: 14, fontWeight: 700, color: "#0f2d1e", cursor: "pointer" }}>
                + Neu
              </button>
            )}
            {view !== "overview" && (
              <button onClick={() => setView("overview")} style={{ background: "transparent", border: "1px solid #7ec8a040", borderRadius: 99, padding: "8px 16px", fontSize: 13, color: "#7ec8a0", cursor: "pointer" }}>
                ← Zurück
              </button>
            )}
          </div>
          {/* Tab bar */}
          {view === "overview" && warnings.length > 0 && (
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ background: "#fef3c7", borderRadius: "8px 8px 0 0", padding: "6px 14px", fontSize: 12, color: "#92400e", fontWeight: 700 }}>
                ⚠ {warnings.length} Rezept{warnings.length > 1 ? "e" : ""} nötig
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "err" ? "#fee2e2" : "#d1fae5", color: toast.type === "err" ? "#991b1b" : "#065f46", padding: "10px 22px", borderRadius: 99, fontSize: 14, fontWeight: 600, zIndex: 100, boxShadow: "0 4px 20px #0002", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        {/* OVERVIEW */}
        {view === "overview" && (
          <>
            {meds.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
                <div style={{ fontSize: 16, marginBottom: 6 }}>Noch keine Medikamente</div>
                <div style={{ fontSize: 13 }}>Tippe auf „+ Neu" um zu beginnen.</div>
              </div>
            )}
            {sorted.map(med => {
              const days = getDaysLeft(med.tablets, med.dailyDose);
              const isWarn = days !== null && days <= WARNING_DAYS;
              const pct = days !== null ? Math.min(100, Math.round((days / 30) * 100)) : 100;
              const barColor = days === null ? "#7ec8a0" : days <= 0 ? "#fca5a5" : days <= WARNING_DAYS ? "#fcd34d" : "#7ec8a0";
              return (
                <div key={med.id} onClick={() => openEdit(med)} style={{ background: isWarn ? "#fffbeb" : "#fff", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: isWarn ? "0 0 0 2px #fcd34d" : "0 2px 12px #0000000a", cursor: "pointer", transition: "transform 0.1s", border: "1px solid " + (isWarn ? "#fde68a" : "#f0ede8") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{med.name}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{med.dailyDose} {med.unit}/Tag</div>
                    </div>
                    <StatusBadge days={days} />
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: "#f0ede8", borderRadius: 99, height: 6, marginBottom: 10 }}>
                    <div style={{ background: barColor, width: pct + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, color: "#555" }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{med.tablets}</span> {med.unit} übrig
                    </div>
                    {/* Quick adjust */}
                    <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => adjustTablets(med.id, -1)} style={{ width: 30, height: 30, borderRadius: 99, border: "1px solid #e5e2dd", background: "#f8f7f4", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <button onClick={() => adjustTablets(med.id, 1)} style={{ width: 30, height: 30, borderRadius: 99, border: "1px solid #e5e2dd", background: "#f8f7f4", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ADD / EDIT FORM */}
        {(view === "add" || view === "edit") && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 20px #0000000d", border: "1px solid #f0ede8" }}>
            <h2 style={{ margin: "0 0 20px", fontWeight: 400, fontSize: 20 }}>
              {view === "add" ? "Medikament hinzufügen" : "Bearbeiten"}
            </h2>
            {[
              { label: "Name *", key: "name", type: "text", placeholder: "z.B. Metformin 500mg" },
              { label: "Aktueller Vorrat (Stück) *", key: "tablets", type: "number", placeholder: "z.B. 60" },
              { label: "Tagesdosis (Stück) *", key: "dailyDose", type: "number", placeholder: "z.B. 2" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontFamily: "monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  type={f.type}
                  placeholder={f.placeholder}
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e2dd", fontSize: 15, fontFamily: "Georgia, serif", background: "#fafaf8", outline: "none" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontFamily: "monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>Einheit</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e2dd", fontSize: 15, fontFamily: "Georgia, serif", background: "#fafaf8" }}>
                {["Tabletten", "Kapseln", "Tropfen", "Sprühstöße", "ml", "Einheiten"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontFamily: "monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>Notiz (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="z.B. morgens zum Frühstück" rows={2} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e2dd", fontSize: 14, fontFamily: "Georgia, serif", background: "#fafaf8", resize: "none" }} />
            </div>
            <button onClick={saveMed} style={{ width: "100%", background: "#1c3d2e", color: "#7ec8a0", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
              Speichern
            </button>
            {view === "edit" && (
              <button onClick={() => deleteMed(editId)} style={{ width: "100%", background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer" }}>
                Medikament löschen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
