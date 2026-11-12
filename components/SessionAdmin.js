"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminTop from "./AdminTop";
import { api } from "./api";

const STATUS = { draft: "Draft", open: "Open", closed: "Closed" };

export default function SessionAdmin({ id }) {
  const [s, setS] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [confirm, setConfirm] = useState("");
  const [origin, setOrigin] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/admin/sessions/${id}`); setS(d.session); setTitle((t) => t || d.session.title);
      setRes(await api(`/api/admin/sessions/${id}/results`));
    } catch (e) { if (e.status === 401) router.replace("/admin/login"); else setErr(e.message); }
  }, [id, router]);
  useEffect(() => { setOrigin(window.location.origin); load(); }, [load]);
  useEffect(() => {
    if (!s || s.status !== "open") return;
    const t = setInterval(() => api(`/api/admin/sessions/${id}/results`).then(setRes).catch(() => {}), 10000);
    return () => clearInterval(t);
  }, [s, id]);

  function flash(t) { setNote(t); setErr(""); setTimeout(() => setNote(""), 3000); }
  async function patch(body, ok) {
    try { const d = await api(`/api/admin/sessions/${id}`, { method: "PATCH", body }); setS(d.session); if (ok) flash(ok); }
    catch (e) { setErr(e.message); }
  }
  async function twoStep(kind, fn) {
    if (confirm !== kind) { setConfirm(kind); return; }
    setConfirm(""); await fn();
  }

  if (!s) return <main className="wrap"><AdminTop /><div className="panel">{err ? <p className="notice bad">{err}</p> : <p className="muted" style={{ margin: 0 }}>Loading…</p>}</div></main>;
  const joinUrl = `${origin}/play/${s.code}`;
  return (
    <main className="wrap">
      <AdminTop />
      {err && <p className="notice bad" role="alert">{err}</p>}
      {note && <p className="notice good" role="status">{note}</p>}
      <section className="panel stack">
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 6, minWidth: 0 }}>
            <p className="eyebrow">{s.players} players</p>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>{s.title}</h1>
          </div>
          <div className="stack" style={{ gap: 2, alignItems: "flex-end" }}>
            <span className="muted small">Join code</span>
            <span className="codebig" style={{ fontSize: 40 }}>{s.code}</span>
          </div>
        </div>
        <div className="row">
          <span className={"pill " + s.status}>{STATUS[s.status]}</span>
          {s.status !== "open" && <button className="btn primary" onClick={() => patch({ status: "open" }, "Open. Students can join now.")}>Open to students</button>}
          {s.status === "open" && <button className="btn" onClick={() => patch({ status: "closed" }, "Closed. Students can't play, but scores stay on the leaderboard.")}>Close session</button>}
          {s.status === "closed" && <button className="btn ghost" onClick={() => patch({ status: "draft" }, "Moved back to draft.")}>Back to draft</button>}
          <a className="btn" href={`/board/${s.code}`} target="_blank" rel="noreferrer">Open leaderboard</a>
          <a className="btn ghost" href={`/play/${s.code}`} target="_blank" rel="noreferrer">Try as a student</a>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Student link: <b style={{ color: "var(--ink)" }}>{joinUrl}</b>. Students can also go to the home page and type the code.</p>
        <form className="row" onSubmit={(e) => { e.preventDefault(); patch({ title }, "Name saved."); }}>
          <div className="field" style={{ flex: "1 1 260px" }}>
            <label htmlFor="s-title">Session name</label>
            <input id="s-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          </div>
          <button className="btn" style={{ alignSelf: "flex-end" }}>Save name</button>
        </form>
      </section>

      <section className="panel stack">
        <div className="row between">
          <h2 style={{ fontSize: 22 }}>Results</h2>
          <div className="row">
            <button className="btn ghost" onClick={load}>Refresh</button>
            <a className="btn" href={`/api/admin/sessions/${id}/results?format=csv`}>Export CSV</a>
            <button className="btn ghost danger" onBlur={() => setConfirm("")} onClick={() => twoStep("reset", async () => {
              try { const d = await api(`/api/admin/sessions/${id}/reset`, { method: "POST" }); setS(d.session); flash("All players and scores were removed."); load(); } catch (e) { setErr(e.message); }
            })}>{confirm === "reset" ? "Tap again: remove all players" : "Reset scores"}</button>
          </div>
        </div>
        {!res || res.rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No players yet.{s.status === "open" ? " This table refreshes every 10 seconds." : ""}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th className="num">Rank</th><th>Name</th><th className="num">Score</th><th className="num">Badges</th><th className="num">Cleared</th><th className="num">Correct</th><th className="num">Wrong tries</th><th>Status</th></tr></thead>
              <tbody>
                {res.rows.map((r, i) => (
                  <tr key={r.name}>
                    <td className="num">{i + 1}</td><td>{r.name}</td><td className="num" style={{ fontWeight: 700 }}>{r.score}</td>
                    <td className="num">{r.badges}/2</td><td className="num">{r.cleared}/{res.totalEncounters}</td>
                    <td className="num">{r.correct}/{res.totalQuestions}</td><td className="num">{r.wrong}</td>
                    <td>{r.finished_at ? "Finished" : "Playing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small" style={{ margin: 0 }}>"Wrong tries" counts every wrong answer before the right one. It shows which students needed the most help.</p>
      </section>

      <section className="panel row between">
        <div className="stack" style={{ gap: 4 }}>
          <h2 style={{ fontSize: 18 }}>Delete this session</h2>
          <p className="muted small" style={{ margin: 0 }}>Removes its players and scores for good. Export the CSV first if you need the results.</p>
        </div>
        <button className="btn danger" onBlur={() => setConfirm("")} onClick={() => twoStep("delete", async () => {
          try { await api(`/api/admin/sessions/${id}`, { method: "DELETE" }); router.replace("/admin"); } catch (e) { setErr(e.message); }
        })}>{confirm === "delete" ? "Tap again to delete" : "Delete session"}</button>
      </section>
    </main>
  );
}
