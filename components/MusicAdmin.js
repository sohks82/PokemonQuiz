"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminTop from "./AdminTop";
import { api } from "./api";

export default function MusicAdmin() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const router = useRouter();
  const load = () => api("/api/admin/music").then(setData).catch((e) => (e.status === 401 ? router.replace("/admin/login") : setErr(e.message)));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function upload(slot, file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setErr("That file is over 4 MB. Export a shorter or 128 kbps MP3 and try again."); return; }
    setBusy(slot); setErr("");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch(`/api/admin/music/${slot}`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Upload failed (${res.status}).`);
      setNote("Uploaded. Students hear it next time they load the game."); setTimeout(() => setNote(""), 3000);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }
  async function remove(slot) {
    setBusy(slot);
    try { await api(`/api/admin/music/${slot}`, { method: "DELETE" }); await load(); setNote("Removed. That slot uses the built-in 8-bit track again."); setTimeout(() => setNote(""), 3000); }
    catch (e) { setErr(e.message); } finally { setBusy(""); }
  }

  return (
    <main className="wrap">
      <AdminTop />
      {err && <p className="notice bad" role="alert">{err}</p>}
      {note && <p className="notice good" role="status">{note}</p>}
      <section className="panel stack">
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ fontSize: 28 }}>Music</h1>
          <p className="muted" style={{ margin: 0 }}>Upload your own track for any slot. Empty slots play the built-in Celtic 8-bit music. Music is off by default on students' phones; they switch it on with the ♪ button.</p>
        </div>
        {data && !data.storageReady && (
          <p className="notice bad" style={{ margin: 0 }}>Uploads need Vercel Blob storage. In Vercel, open <b>Storage</b> › <b>Create Database</b> › <b>Blob</b>, connect it to this project, then redeploy.</p>
        )}
        <p className="muted small" style={{ margin: 0 }}>MP3 works on every phone. Keep each file under 4 MB (128 kbps is plenty). Only use music you made or have permission to use.</p>
      </section>
      <section className="panel stack">
        {!data ? <p className="muted" style={{ margin: 0 }}>Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Slot</th><th>Plays during</th><th>Current track</th><th></th></tr></thead>
              <tbody>
                {data.slots.map((s) => (
                  <tr key={s.slot}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.label}</td>
                    <td className="muted">{s.plays}</td>
                    <td style={{ minWidth: 220 }}>
                      {s.url ? <div className="stack" style={{ gap: 4 }}><span className="small">{s.filename}</span><audio controls preload="none" src={s.url} /></div> : <span className="muted small">Built-in 8-bit track</span>}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
                        <label className="btn" style={{ opacity: !data.storageReady || busy ? 0.55 : 1 }}>
                          {busy === s.slot ? "Uploading…" : s.url ? "Replace" : "Upload"}
                          <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav" hidden disabled={!data.storageReady || Boolean(busy)} onChange={(e) => { upload(s.slot, e.target.files[0]); e.target.value = ""; }} />
                        </label>
                        {s.url && <button className="btn ghost danger" disabled={Boolean(busy)} onClick={() => remove(s.slot)}>Remove</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
