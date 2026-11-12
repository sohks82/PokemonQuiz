"use client";

import { useEffect, useState } from "react";
import Brand from "./Brand";
import { api } from "./api";

export default function Board({ code }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [host, setHost] = useState("");
  useEffect(() => {
    setHost(window.location.host);
    let alive = true;
    const tick = () => api(`/api/s/${code}/board`).then((d) => { if (alive) { setData(d); setError(""); } }).catch((e) => alive && setError(e.message));
    tick();
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [code]);

  if (!data) return <main className="wrap"><Brand sub="Live leaderboard" /><div className="panel"><p className="muted" style={{ margin: 0 }}>{error || "Loading the leaderboard…"}</p></div></main>;
  const s = data.session, shown = data.players.slice(0, 30);
  const finished = data.players.filter((p) => p.finished).length;
  return (
    <main className="wrap">
      <div className="topbar">
        <Brand sub="Live leaderboard" />
        <div className="row">
          <span className={"pill " + s.status}>{s.status === "open" ? "Open" : "Closed"}</span>
          <span className="pill">{data.players.length} playing · {finished} finished</span>
        </div>
      </div>
      {error && <p className="notice bad">{error} Showing the last scores received.</p>}
      <section className="panel row between">
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <p className="eyebrow">Fault Finders</p>
          <h1 style={{ fontSize: "clamp(24px, 3.4vw, 36px)" }}>{s.title}</h1>
        </div>
        {s.status === "open" && (
          <div className="stack" style={{ gap: 2, textAlign: "right" }}>
            <span className="muted small">Join at <b style={{ color: "var(--ink)" }}>{host}</b> with code</span>
            <span className="codebig">{s.code}</span>
          </div>
        )}
      </section>
      <section className="panel stack">
        {shown.length === 0 ? <p className="muted" style={{ margin: 0 }}>No one has joined yet. Scores appear here as students answer.</p> : (
          <ol className="rank-list">
            {shown.map((p, i) => (
              <li key={p.name} className={i === 0 && p.score > 0 ? "top" : ""}>
                <span className="rk">{p.rank}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="nm">{p.name}<span className="badge-dots" aria-label={`${p.badges} badges`}><i className={p.badges >= 1 ? "b1" : ""} /><i className={p.badges >= 2 ? "b2" : ""} /></span></span>
                  <span className="bar" aria-label={`${p.cleared} of ${data.total} encounters cleared`}><i style={{ width: `${(100 * p.cleared) / data.total}%` }} /></span>
                </span>
                <span className="sc">{p.score}</span>
              </li>
            ))}
          </ol>
        )}
        {data.players.length > shown.length && <p className="muted small" style={{ margin: 0 }}>+ {data.players.length - shown.length} more players</p>}
      </section>
      <p className="muted small" style={{ margin: 0 }}>Bars show how much of the game each player has cleared. Dots are the Process and Clinic badges. Updates every 3 seconds.</p>
    </main>
  );
}
