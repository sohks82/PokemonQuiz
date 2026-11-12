"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTop from "./AdminTop";
import { api } from "./api";

const STATUS = { draft: "Draft", open: "Open", closed: "Closed" };

export default function AdminHome() {
  const [list, setList] = useState(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    api("/api/admin/sessions").then((d) => setList(d.sessions)).catch((e) => (e.status === 401 ? router.replace("/admin/login") : setErr(e.message)));
  }, [router]);

  async function create(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { const d = await api("/api/admin/sessions", { method: "POST", body: { title } }); router.push(`/admin/s/${d.id}`); }
    catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <main className="wrap">
      <AdminTop />
      {err && <p className="notice bad" role="alert">{err}</p>}
      <section className="panel stack">
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ fontSize: 28 }}>Class sessions</h1>
          <p className="muted" style={{ margin: 0 }}>Each session has its own join code and leaderboard. Every session plays the same game and questions.</p>
        </div>
        {!list ? <p className="muted" style={{ margin: 0 }}>Loading…</p> : list.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No sessions yet. Create one for your class below.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Session</th><th>Code</th><th>Status</th><th className="num">Players</th><th></th></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/admin/s/${s.id}`} style={{ fontWeight: 600 }}>{s.title}</Link></td>
                    <td style={{ fontFamily: "var(--display)", fontWeight: 700, letterSpacing: "0.08em" }}>{s.code}</td>
                    <td><span className={"pill " + s.status}>{STATUS[s.status]}</span></td>
                    <td className="num">{s.players}</td>
                    <td><Link className="btn" href={`/admin/s/${s.id}`}>Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <form className="panel stack" onSubmit={create}>
        <h2 style={{ fontSize: 22 }}>New class session</h2>
        <div className="field">
          <label htmlFor="title">Name</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class 2A – Thursday" maxLength={100} required />
        </div>
        <div><button className="btn primary" disabled={busy || !title.trim()}>{busy ? "Creating…" : "Create session"}</button></div>
        <p className="muted small" style={{ margin: 0 }}>New sessions start as drafts. Students can't join until you open them.</p>
      </form>
    </main>
  );
}
