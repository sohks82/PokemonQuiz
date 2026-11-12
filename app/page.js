"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";

export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return (
    <main className="wrap narrow">
      <Brand />
      <form className="panel stack" onSubmit={(e) => { e.preventDefault(); if (clean.length === 6) router.push(`/play/${clean}`); }}>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 38px)" }}>Join your class</h1>
        <p className="muted" style={{ margin: 0 }}>Enter the 6-character code your teacher shows on the screen.</p>
        <div className="field">
          <label htmlFor="code">Class code</label>
          <input id="code" className="input code-input" value={clean} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" autoComplete="off" autoCapitalize="characters" />
        </div>
        <button className="btn primary big" disabled={clean.length !== 6}>Play</button>
      </form>
      <p className="muted small" style={{ textAlign: "center", margin: 0 }}>Teacher? <Link href="/admin">Open the admin panel</Link></p>
    </main>
  );
}
