"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminTop from "./AdminTop";
import { api } from "./api";

const AREAS = { route1: "Route 1 · 4.3 Troubleshooting Process", gym1: "Gym 1 · The Process Gym", route2: "Route 2 · 4.4 Common Problems", gym2: "Gym 2 · The Hardware Clinic" };
const KIND = { fault: "Fault", customer: "Customer", trainer: "Gym trainer", leader: "Gym leader" };

export default function QuestionsAdmin() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  useEffect(() => {
    api("/api/admin/questions").then((d) => setData(d.encounters)).catch((e) => (e.status === 401 ? router.replace("/admin/login") : setErr(e.message)));
  }, [router]);
  function flash(t) { setNote(t); setErr(""); setTimeout(() => setNote(""), 2500); }

  return (
    <main className="wrap">
      <AdminTop />
      {err && <p className="notice bad" role="alert">{err}</p>}
      {note && <p className="notice good" role="status">{note}</p>}
      <section className="panel stack">
        <div className="row between">
          <div className="stack" style={{ gap: 4 }}>
            <h1 style={{ fontSize: 28 }}>Questions</h1>
            <p className="muted" style={{ margin: 0 }}>30 questions across 13 encounters. Students see the answers in a shuffled order, so the correct one can sit anywhere.</p>
          </div>
          <button className="btn ghost danger" onBlur={() => setConfirm(false)} onClick={async () => {
            if (!confirm) { setConfirm(true); return; }
            setConfirm(false);
            try { const d = await api("/api/admin/questions/reset", { method: "POST" }); setData(d.encounters); flash("All questions are back to the original Chapter 4 wording."); } catch (e) { setErr(e.message); }
          }}>{confirm ? "Tap again to restore all" : "Restore original questions"}</button>
        </div>
        <p className="muted small" style={{ margin: 0 }}>The hint shows after a wrong answer. The explanation shows after the right one, so mention the slide number there.</p>
      </section>
      {!data ? <div className="panel"><p className="muted" style={{ margin: 0 }}>Loading…</p></div> :
        Object.entries(AREAS).map(([area, label]) => (
          <section key={area} className="panel stack">
            <h2 style={{ fontSize: 22 }}>{label}</h2>
            {data.filter((e) => e.area === area).map((e) => (
              <div key={e.id} className="stack" style={{ gap: 10 }}>
                <p className="eyebrow">{KIND[e.kind]} · {e.name}</p>
                <div className="grid2">
                  {e.questions.map((q) => <QuestionCard key={`${q.id}|${q.prompt}|${q.options.join("|")}|${q.correct}`} q={q} onSaved={() => flash("Question saved.")} onError={setErr} />)}
                </div>
              </div>
            ))}
          </section>
        ))}
    </main>
  );
}

function QuestionCard({ q, onSaved, onError }) {
  const [v, setV] = useState({ prompt: q.prompt, options: q.options.slice(), correct: q.correct, hint: q.hint, explain: q.explain });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch) => { setV((x) => ({ ...x, ...patch })); setDirty(true); };
  async function save() {
    setBusy(true);
    try { await api(`/api/admin/questions/${q.id}`, { method: "PUT", body: v }); setDirty(false); onSaved(); }
    catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="qcard">
      <div className="field">
        <label htmlFor={`${q.id}-p`}>Question {q.position + 1}</label>
        <textarea id={`${q.id}-p`} className="input" rows={2} value={v.prompt} maxLength={200} onChange={(e) => set({ prompt: e.target.value })} />
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
        <legend className="label" style={{ marginBottom: 6 }}>Answers (tick the correct one)</legend>
        {v.options.map((o, i) => (
          <div key={i} className="opt-row">
            <input type="radio" name={`${q.id}-c`} checked={v.correct === i} onChange={() => set({ correct: i })} aria-label={`Answer ${i + 1} is correct`} />
            <input className="input" value={o} maxLength={70} aria-label={`Answer ${i + 1}`} onChange={(e) => { const opts = v.options.slice(); opts[i] = e.target.value; set({ options: opts }); }} />
          </div>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor={`${q.id}-h`}>Hint (after a wrong answer)</label>
        <input id={`${q.id}-h`} className="input" value={v.hint} maxLength={200} onChange={(e) => set({ hint: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor={`${q.id}-x`}>Explanation (after the right answer)</label>
        <textarea id={`${q.id}-x`} className="input" rows={2} value={v.explain} maxLength={240} onChange={(e) => set({ explain: e.target.value })} />
      </div>
      <div><button className="btn primary" onClick={save} disabled={busy || !dirty}>{busy ? "Saving…" : dirty ? "Save question" : "Saved"}</button></div>
    </div>
  );
}
