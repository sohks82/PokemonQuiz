"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api, storage } from "./api";
import { createSound } from "./game/music";
import { Engine } from "./game/engine";
import { renderMap, CREATURES } from "./game/art";
import { MAPS } from "@/lib/world";

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => { try { setR(window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch {} }, []);
  return r;
}

export default function Game({ code }) {
  const tokenKey = `ff-token-${code}`;
  const [phase, setPhase] = useState("loading");
  const [boot, setBoot] = useState(null);
  const [error, setError] = useState("");
  const [ui, setUi] = useState(null);
  const [music, setMusic] = useState(false);
  const [sfx, setSfx] = useState(false);
  const canvasRef = useRef(null), engineRef = useRef(null), soundRef = useRef(null), tokenRef = useRef(null);
  const reduce = useReduced();

  const load = useCallback(async (tok) => {
    try {
      const d = await api(`/api/s/${code}/game`, { token: tok });
      if (!d.joined && tok) { storage(tokenKey, null); tokenRef.current = null; }
      setBoot(d); soundRef.current.setUploads(d.music);
      setPhase((p) => (p === "play" ? p : "title"));
    } catch (e) {
      setError(e.message); setPhase("error");
    }
  }, [code, tokenKey]);

  useEffect(() => {
    soundRef.current = createSound();
    const m = storage("ff-music") === "1", s = storage("ff-sfx") === "1";
    setMusic(m); setSfx(s); soundRef.current.state.musicOn = m; soundRef.current.state.sfxOn = s;
    tokenRef.current = storage(tokenKey) || null;
    load(tokenRef.current);
    return () => soundRef.current && soundRef.current.stopAll();
  }, [load, tokenKey]);

  // Waiting for the teacher to open the session: check every 5 s.
  useEffect(() => {
    if (phase !== "title" || !boot || boot.session.status !== "draft") return;
    const id = setInterval(() => load(tokenRef.current), 5000);
    return () => clearInterval(id);
  }, [phase, boot, load]);

  // Title screen backdrop.
  useEffect(() => {
    if (phase !== "title" || !canvasRef.current) return;
    const c = canvasRef.current, bg = renderMap(MAPS.town), r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = Math.max(240, Math.round(r.width * dpr)); c.height = Math.round((c.width * 2) / 3);
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(bg, 0, 0, c.width, c.height);
    const bunny = CREATURES.bunny(), s = c.width / 240; x.drawImage(bunny, 176 * s, 92 * s, 48 * s, 48 * s);
    soundRef.current.setTrack("title");
  }, [phase, boot]);

  // Start the engine.
  useEffect(() => {
    if (phase !== "play" || !boot || !boot.joined) return;
    const eng = new Engine({
      canvas: canvasRef.current, data: boot, sound: soundRef.current, onUI: setUi, reduce,
      api: {
        answer: (questionId, choice) => api(`/api/s/${code}/answer`, { method: "POST", token: tokenRef.current, body: { questionId, choice } }),
        progress: (b) => api(`/api/s/${code}/progress`, { method: "POST", token: tokenRef.current, body: b }),
      },
    });
    engineRef.current = eng;
    return () => { eng.destroy(); engineRef.current = null; };
  }, [phase, boot, code, reduce]);

  // Keyboard controls.
  useEffect(() => {
    if (phase !== "play") return;
    const KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    function down(e) {
      const eng = engineRef.current; if (!eng || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.matches && e.target.matches("input, textarea, select")) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (eng.bt && /^[1-4]$/.test(k)) { e.preventDefault(); eng.choose(Number(k) - 1); return; }
      if (KEYS[k]) { e.preventDefault(); eng.press(KEYS[k], true); return; }
      if (k === "z" || k === " " || k === "Enter") { if (e.target.matches && e.target.matches("button, a")) return; e.preventDefault(); eng.pressA(); }
      else if (k === "x" || k === "Backspace") { e.preventDefault(); eng.pressB(); }
      else if (k === "Escape" || k === "m") { e.preventDefault(); eng.toggleMenu(); }
    }
    function up(e) { const eng = engineRef.current; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (eng && KEYS[k]) eng.press(KEYS[k], false); }
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [phase]);

  function toggleMusic() {
    const on = !music; setMusic(on); storage("ff-music", on ? "1" : "0"); soundRef.current.setMusic(on);
  }
  function toggleSfx() {
    const on = !sfx; setSfx(on); storage("ff-sfx", on ? "1" : "0"); soundRef.current.setSfx(on); if (on) soundRef.current.sfx("select");
  }
  function begin(state) {
    soundRef.current.unlock();
    if (state) setBoot(state);
    setPhase("play");
  }

  if (phase === "loading") return <Shell><p className="g-note">Loading…</p></Shell>;
  if (phase === "error") return <Shell><div className="g-card"><h1>Can't open this game</h1><p>{error}</p><a className="g-btn" href="/">Enter a different code</a></div></Shell>;

  if (phase === "title") {
    return (
      <Shell>
        <div className="g-screen"><canvas ref={canvasRef} aria-hidden="true" /><div className="g-logo"><span>Fault</span><span>Finders</span></div></div>
        <TitleCard boot={boot} code={code} tokenKey={tokenKey} tokenRef={tokenRef} onStart={begin} music={music} toggleMusic={toggleMusic} />
      </Shell>
    );
  }

  const u = ui || {};
  const eng = engineRef.current;
  return (
    <Shell>
      <div className="g-screen" onPointerDown={() => soundRef.current.unlock()}>
        <canvas ref={canvasRef} aria-label="Game screen" role="img" />
        {u.banner && !u.battle && <div className="g-banner">{u.banner}</div>}
        {!u.battle && (
          <div className="g-hud" aria-label={`${u.score || 0} points, ${u.badges || 0} badges`}>
            <span>★ {u.score || 0}</span><Badges n={u.badges || 0} />
          </div>
        )}
        {u.battle && <HpPanels b={u.battle} />}
        {u.dialog && (
          <button className="g-dialog" onClick={() => eng && eng.pressA()} aria-live="polite">
            {u.dialog.name && <span className="g-who">{u.dialog.name}</span>}
            <span className="g-text">{u.dialog.text}</span>
            {u.dialog.done && <span className="g-more" aria-hidden="true">▼</span>}
          </button>
        )}
        <div className={"g-fade" + (u.fade ? " on" : "")} aria-hidden="true" />
        {u.toast && <div className="g-toast" role="status">{u.toast}</div>}
      </div>

      {u.battle ? <BattlePanel b={u.battle} eng={eng} /> : <Controls eng={eng} music={music} toggleMusic={toggleMusic} />}

      {u.menu && <Menu u={u} code={code} music={music} sfx={sfx} toggleMusic={toggleMusic} toggleSfx={toggleSfx} close={() => eng && eng.toggleMenu(false)} />}
      {u.finish && <Finish code={code} name={boot && boot.player && boot.player.name} score={u.score} close={() => { if (eng) { eng.ui.finish = null; eng.emit(); } }} />}
    </Shell>
  );
}

function Shell({ children }) {
  return <main className="g-app">{children}</main>;
}

function Badges({ n }) {
  return (
    <span className="g-badges">
      <i className={n >= 1 ? "on b1" : "b1"} title="Process Badge" />
      <i className={n >= 2 ? "on b2" : "b2"} title="Clinic Badge" />
    </span>
  );
}

function TitleCard({ boot, code, tokenKey, tokenRef, onStart, music, toggleMusic }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const s = boot.session;
  async function join(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const d = await api(`/api/s/${code}/join`, { method: "POST", body: { name } });
      storage(tokenKey, d.token); tokenRef.current = d.token;
      onStart(d.state);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }
  return (
    <div className="g-card">
      <p className="g-eyebrow">{s.title} · code {s.code}</p>
      {boot.joined ? (
        <>
          <h1>Welcome back, {boot.player.name}!</h1>
          <p>You have {boot.player.score} points and {boot.player.badges} of 2 badges. Your progress is saved.</p>
          <button className="g-btn primary" onClick={() => onStart()} autoFocus>Continue</button>
        </>
      ) : s.status === "draft" ? (
        <><h1>Almost ready</h1><p>Your teacher hasn't opened this game yet. Keep this page open and it will let you in.</p></>
      ) : s.status === "closed" ? (
        <><h1>This session has closed</h1><p>You can still see the final leaderboard.</p><a className="g-btn" href={`/board/${code}`}>Leaderboard</a></>
      ) : (
        <form onSubmit={join} className="g-form">
          <h1>Become a Fault Finder</h1>
          <p>Fix faulty PCs, help customers and win two gym badges. About 25 minutes.</p>
          <label htmlFor="ff-name">Your name</label>
          <input id="ff-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="off" placeholder="e.g. Aisyah T" required />
          {err && <p className="g-err" role="alert">{err}</p>}
          <button className="g-btn primary" disabled={busy}>{busy ? "Starting…" : "Start"}</button>
        </form>
      )}
      <button className="g-pill" aria-pressed={music} onClick={toggleMusic}>♪ Music {music ? "on" : "off"}</button>
    </div>
  );
}

function Controls({ eng, music, toggleMusic }) {
  function bind(dir) {
    return {
      onPointerDown: (e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} eng && eng.press(dir, true); },
      onPointerUp: () => eng && eng.press(dir, false),
      onPointerCancel: () => eng && eng.press(dir, false),
      onLostPointerCapture: () => eng && eng.press(dir, false),
      onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); eng && eng.press(dir, true); setTimeout(() => eng && eng.press(dir, false), 150); } },
    };
  }
  return (
    <div className="g-controls">
      <div className="g-dpad" aria-label="Direction pad">
        <button className="up" aria-label="Up" {...bind("up")}>▲</button>
        <button className="left" aria-label="Left" {...bind("left")}>◀</button>
        <span className="mid" aria-hidden="true" />
        <button className="right" aria-label="Right" {...bind("right")}>▶</button>
        <button className="dn" aria-label="Down" {...bind("down")}>▼</button>
      </div>
      <div className="g-mid">
        <button className="g-pill" onClick={() => eng && eng.toggleMenu()}>Start</button>
        <button className="g-pill" aria-pressed={music} onClick={toggleMusic}>♪ {music ? "On" : "Off"}</button>
      </div>
      <div className="g-ab">
        <button className="b" aria-label="B: back" onClick={() => eng && eng.pressB()}>B</button>
        <button className="a" aria-label="A: talk, inspect or continue" onClick={() => eng && eng.pressA()}>A</button>
      </div>
    </div>
  );
}

function HpPanels({ b }) {
  const pct = (v, m) => Math.max(0, Math.min(100, (v / m) * 100));
  const col = (p) => (p > 50 ? "var(--hp-good)" : p > 20 ? "var(--hp-mid)" : "var(--hp-low)");
  const e = pct(b.hp, b.max), m = pct(b.meHp, b.meMax);
  return (
    <>
      <div className="g-hp enemy">
        <div className="g-hp-name">{b.name} <span>Lv{b.level}</span></div>
        <div className="g-hp-bar"><small>{b.kind === "customer" ? "?" : "HP"}</small><i><b style={{ width: `${e}%`, background: col(e) }} /></i></div>
      </div>
      <div className="g-hp me">
        <div className="g-hp-name">YOU <span>Energy</span></div>
        <div className="g-hp-bar"><small>EN</small><i><b style={{ width: `${m}%`, background: col(m) }} /></i></div>
        <div className="g-hp-num">{b.meHp}/{b.meMax}</div>
      </div>
    </>
  );
}

function BattlePanel({ b, eng }) {
  return (
    <div className="g-battle">
      <button className="g-msg" onClick={() => b.canContinue && eng && eng.pressA()} aria-live="polite" disabled={!b.canContinue}>
        {b.msg}
        {b.canContinue && <span className="g-more" aria-hidden="true">▼</span>}
      </button>
      {b.options && (
        <div className="g-options">
          {b.options.map((o, i) => (
            <button key={i} className={"g-opt " + o.state} disabled={o.disabled || b.busy} onClick={() => eng && eng.choose(i)}>
              <span className="g-key" aria-hidden="true">{i + 1}</span>{o.text}
            </button>
          ))}
        </div>
      )}
      {b.canContinue && <button className="g-btn primary" onClick={() => eng && eng.pressA()}>{b.phase === "won" || b.phase === "fainted" ? "Continue" : "Next"} ▶</button>}
    </div>
  );
}

function Menu({ u, code, music, sfx, toggleMusic, toggleSfx, close }) {
  return (
    <div className="g-modal" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="g-card">
        <h2>Menu</h2>
        <div className="g-stat"><span>Score</span><b>★ {u.score || 0}</b></div>
        <div className="g-stat"><span>Badges</span><b><Badges n={u.badges || 0} /> {u.badges || 0} of 2</b></div>
        <div className="g-goal"><span className="g-eyebrow">Next goal</span><p>{u.goal}</p></div>
        <div className="g-toggles">
          <button className="g-pill" aria-pressed={music} onClick={toggleMusic}>♪ Music {music ? "on" : "off"}</button>
          <button className="g-pill" aria-pressed={sfx} onClick={toggleSfx}>Sound effects {sfx ? "on" : "off"}</button>
        </div>
        <p className="g-note">Music is best with earphones. Your progress saves as you play.</p>
        <div className="g-row">
          <a className="g-btn" href={`/board/${code}`} target="_blank" rel="noreferrer">Leaderboard</a>
          <button className="g-btn primary" onClick={close} autoFocus>Back to game</button>
        </div>
      </div>
    </div>
  );
}

function Finish({ code, name, score, close }) {
  const [rank, setRank] = useState(null);
  useEffect(() => {
    api(`/api/s/${code}/board`).then((d) => {
      const me = d.players.find((p) => p.name === name);
      if (me) setRank({ rank: me.rank, of: d.players.length });
    }).catch(() => {});
  }, [code, name, score]);
  return (
    <div className="g-modal" role="dialog" aria-modal="true" aria-label="Game complete">
      <div className="g-card center">
        <p className="g-eyebrow">Both badges earned</p>
        <h2>You're a Fault Finder!</h2>
        <p className="g-big">★ {score}</p>
        <Badges n={2} />
        {rank && <p>You're number {rank.rank} of {rank.of} in your class so far.</p>}
        <div className="g-row">
          <a className="g-btn" href={`/board/${code}`} target="_blank" rel="noreferrer">Leaderboard</a>
          <button className="g-btn primary" onClick={close}>Keep exploring</button>
        </div>
      </div>
    </div>
  );
}
