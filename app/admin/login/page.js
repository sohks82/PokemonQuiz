"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { api } from "@/components/api";

export default function Login() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      await api("/api/admin/login", { method: "POST", body: { password } });
      router.replace("/admin"); router.refresh();
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }
  return (
    <main className="wrap narrow">
      <Brand sub="Teacher admin" />
      <form className="panel stack" onSubmit={submit}>
        <h1 style={{ fontSize: 28 }}>Teacher login</h1>
        <div className="field">
          <label htmlFor="password">Admin password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus />
        </div>
        {err && <p className="notice bad" role="alert">{err}</p>}
        <button className="btn primary big" disabled={busy}>{busy ? "Checking…" : "Log in"}</button>
      </form>
    </main>
  );
}
