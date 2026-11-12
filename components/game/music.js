// Built-in Celtic chiptune soundtrack + playback of uploaded tracks. Browser-only.

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) { const m = /^([A-G])(#|b)?(\d)$/.exec(n); return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0); }
function hz(n) { return 440 * Math.pow(2, (midi(n) - 69) / 12); }
const CHORDS = {
  G: { root: "G2", fifth: "D3", tones: ["B3", "D4"] }, C: { root: "C3", fifth: "G2", tones: ["C4", "E4"] },
  D: { root: "D3", fifth: "A2", tones: ["A3", "F#4"] }, Em: { root: "E2", fifth: "B2", tones: ["G3", "B3"] },
  Am: { root: "A2", fifth: "E3", tones: ["C4", "E4"] }, A: { root: "A2", fifth: "E3", tones: ["A3", "C#4"] },
  Bm: { root: "B2", fifth: "F#3", tones: ["D4", "F#4"] },
};
function scaleUp(note, scale) {
  const m = midi(note); let best = null;
  for (let o = 2; o <= 7; o++) for (const s of scale) { const v = midi(s + o); if (v > m && (best === null || v < best)) best = v; }
  return 440 * Math.pow(2, (best - 69) / 12);
}

const TRACK_DEFS = {
  // Workshop Town: Celtic jig in G major, 6/8
  town: (() => {
    const A1 = ["G4:2 B4:1 D5:2 B4:1", "C5:2 A4:1 B4:2 G4:1", "A4:1 B4:1 C5:1 D5:2 E5:1", "D5:3 B4:3"];
    const A2 = ["G4:2 B4:1 D5:2 G5:1", "F#5:1 E5:1 D5:1 E5:2 C5:1", "B4:1 D5:1 B4:1 A4:2 F#4:1", "G4:3 G4:3"];
    const B1 = ["G5:2 F#5:1 E5:2 D5:1", "E5:1 F#5:1 G5:1 A5:2 G5:1", "F#5:2 D5:1 E5:2 C5:1", "D5:3 B4:2 D5:1"];
    const B2 = ["G5:2 F#5:1 E5:2 D5:1", "C5:1 E5:1 C5:1 B4:1 D5:1 B4:1", "A4:1 B4:1 C5:1 B4:2 A4:1", "G4:3 G4:3"];
    const cA1 = ["G", "C", "D", "G"], cA2 = ["G", "D", "D", "G"], cB = ["Em", "C", "D", "G"];
    return { step: 60 / 100 / 3, barLen: 6, style: "jig", drone: ["G2", "D3"], scale: ["G", "A", "B", "C", "D", "E", "F#"],
      bars: [...A1, ...A2, ...A1, ...A2, ...B1, ...B2, ...B1, ...B2], chords: [...cA1, ...cA2, ...cA1, ...cA2, ...cB, ...cB, ...cB, ...cB] };
  })(),
  // Fault battle: Celtic reel in E minor
  battle: (() => {
    const bars = ["E4:1 B4:1 B4:1 A4:1 B4:2 E5:1 B4:1", "A4:1 B4:1 G4:1 A4:1 F#4:1 D4:1 F#4:1 A4:1", "E4:1 B4:1 B4:1 A4:1 B4:1 C#5:1 D5:1 E5:1", "F#5:1 E5:1 D5:1 F#5:1 E5:2 B4:2",
      "E5:1 F#5:1 G5:1 E5:1 F#5:1 E5:1 D5:1 B4:1", "A4:1 B4:1 C#5:1 A4:1 B4:1 A4:1 F#4:1 A4:1", "G4:1 B4:1 A4:1 G4:1 F#4:1 A4:1 D5:1 F#5:1", "E5:2 B4:1 G4:1 E4:4"];
    const chords = ["Em", "D", "Em", "Em", "Em", "A", "D", "Em"];
    return { step: 60 / 168 / 2, barLen: 8, style: "reel", scale: ["E", "F#", "G", "A", "B", "C#", "D"], bars: [...bars, ...bars], chords: [...chords, ...chords] };
  })(),
  // Title: slow air in D major, 3/4
  title: { step: 60 / 84 / 2, barLen: 6, style: "waltz", scale: ["D", "E", "F#", "G", "A", "B", "C#"], drone: ["D2", "A2"],
    bars: ["A4:2 D5:3 E5:1", "F#5:4 E5:1 D5:1", "E5:2 C#5:2 A4:2", "B4:4 A4:2", "A4:2 D5:3 E5:1", "F#5:2 A5:3 G5:1", "F#5:2 E5:2 C#5:2", "D5:6"],
    chords: ["D", "D", "A", "G", "D", "Bm", "A", "D"] },
  // Gym 1: march-like hornpipe in A minor
  gym1: { step: 60 / 120 / 2, barLen: 8, style: "reel", scale: ["A", "B", "C", "D", "E", "F", "G"],
    bars: ["A4:1 E5:1 E5:1 D5:1 E5:2 A4:2", "G4:1 B4:1 D5:1 B4:1 G4:2 B4:2", "A4:1 E5:1 E5:1 D5:1 E5:1 F5:1 G5:1 E5:1", "D5:1 B4:1 G4:1 B4:1 A4:4",
      "C5:1 E5:1 A5:1 E5:1 C5:1 E5:1 A5:1 G5:1", "F5:2 D5:2 G5:2 E5:2", "C5:1 B4:1 A4:1 G4:1 E4:1 G4:1 B4:1 D5:1", "C5:2 B4:2 A4:4"],
    chords: ["Am", "G", "Am", "Am", "Am", "G", "C", "Am"] },
  // Gym 2: bright jig in D mixolydian
  gym2: { step: 60 / 116 / 3, barLen: 6, style: "jig", drone: ["D2", "A2"], scale: ["D", "E", "F#", "G", "A", "B", "C"],
    bars: ["D5:2 F#5:1 A5:2 F#5:1", "G5:2 E5:1 C5:2 E5:1", "D5:2 F#5:1 A5:1 B5:1 A5:1", "G5:1 E5:1 C5:1 D5:3",
      "A4:2 D5:1 F#5:2 D5:1", "E5:1 D5:1 C5:1 A4:2 G4:1", "F#4:1 A4:1 D5:1 C5:2 E5:1", "D5:3 D5:3"],
    chords: ["D", "C", "D", "C", "D", "C", "D", "D"] },
};

function buildEvents(tr) {
  const ev = [];
  const bars = tr.bars.map((b) => b.split(" ").map((t) => { const [n, l] = t.split(":"); return { n, len: +l }; }));
  bars.forEach((bar, bi) => {
    const start = bi * tr.barLen;
    let pos = 0;
    for (const n of bar) {
      const e = { t: start + pos, d: n.len, f: hz(n.n), v: 0.15, w: "lead" };
      if (n.len >= 2) e.grace = scaleUp(n.n, tr.scale);
      ev.push(e);
      pos += n.len;
    }
    const ch = CHORDS[tr.chords[bi]];
    if (tr.style === "jig") {
      ev.push({ t: start, d: 2, f: hz(ch.root), v: 0.32, w: "bass" }, { t: start + 3, d: 2, f: hz(ch.fifth), v: 0.28, w: "bass" });
      for (const k of [1, 2, 4, 5]) for (const tn of ch.tones) ev.push({ t: start + k, d: 0.7, f: hz(tn), v: 0.042, w: "harm" });
      tr.drone.forEach((dn, i) => ev.push({ t: start, d: 6, f: hz(dn), v: i ? 0.035 : 0.045, w: "drone" }));
      ev.push({ t: start, kind: "bodhran" }, { t: start + 3, kind: "bodhran2" }, { t: start + 2, kind: "tap" }, { t: start + 5, kind: "tap" });
    } else if (tr.style === "waltz") {
      ev.push({ t: start, d: 2, f: hz(ch.root), v: 0.3, w: "bass" });
      for (const k of [2, 4]) for (const tn of ch.tones) ev.push({ t: start + k, d: 1.6, f: hz(tn), v: 0.04, w: "harm" });
      tr.drone.forEach((dn, i) => ev.push({ t: start, d: 6, f: hz(dn), v: i ? 0.03 : 0.04, w: "drone" }));
      ev.push({ t: start, kind: "bodhran2" });
    } else {
      for (let k = 0; k < 8; k++) ev.push({ t: start + k, d: 0.85, f: hz(ch.root) * (k % 2 ? 2 : 1), v: 0.26, w: "bass" });
      for (const k of [1, 3, 5, 7]) for (const tn of ch.tones) ev.push({ t: start + k, d: 0.45, f: hz(tn), v: 0.045, w: "harm" });
      ev.push({ t: start, kind: "kick" }, { t: start + 4, kind: "kick" }, { t: start + 2, kind: "snare" }, { t: start + 6, kind: "snare" });
      for (let h = 0; h < 8; h++) ev.push({ t: start + h, kind: "hat" });
    }
  });
  ev.forEach((e) => { e.t *= tr.step; if (e.d) e.d *= tr.step; });
  ev.sort((a, b) => a.t - b.t);
  return { events: ev, length: bars.length * tr.barLen * tr.step };
}

export function createSound() {
  let AC = null, master = null, sfxBus = null, waves = {}, noiseBuf = null;
  let current = null; // chip playback
  let audioEl = null, audioSlot = null; // uploaded playback
  const built = {};
  const state = { musicOn: false, sfxOn: false, slot: null, uploads: {}, volume: 0.6 };

  function ensure() {
    if (!AC) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      AC = new Ctx();
      master = AC.createGain(); master.gain.value = state.volume * 0.5; master.connect(AC.destination);
      sfxBus = AC.createGain(); sfxBus.gain.value = 0.35; sfxBus.connect(AC.destination);
      const pulse = (duty) => { const n = 40, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); return AC.createPeriodicWave(re, im); };
      waves.lead = pulse(0.25); waves.harm = pulse(0.125);
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (AC.state === "suspended") AC.resume();
    return true;
  }
  function tone(bus, e, t) {
    const one = (f, start, dur, vol) => {
      const o = AC.createOscillator(), g = AC.createGain();
      if (e.w === "bass" || e.w === "drone") o.type = "triangle"; else o.setPeriodicWave(waves[e.w] || waves.lead);
      o.frequency.setValueAtTime(f, start);
      const end = start + Math.max(0.03, dur * 0.9);
      g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + 0.006);
      if (e.w === "lead") g.gain.setTargetAtTime(vol * 0.7, start + 0.02, 0.12);
      g.gain.setTargetAtTime(0, end, e.w === "drone" ? 0.06 : 0.018);
      o.connect(g); g.connect(bus); o.start(start); o.stop(end + 0.3);
    };
    if (e.grace) { one(e.grace, t, 0.045, e.v * 0.9); one(e.f, t + 0.045, e.d - 0.045, e.v); } else one(e.f, t, e.d, e.v);
  }
  function drum(bus, kind, t) {
    const cfg = { bodhran: ["lowpass", 260, 0.5, 0.16, 95], bodhran2: ["lowpass", 320, 0.32, 0.12, 110], tap: ["bandpass", 2400, 0.08, 0.04, 0],
      kick: ["lowpass", 180, 0.45, 0.12, 120], snare: ["bandpass", 1500, 0.22, 0.1, 0], hat: ["highpass", 7000, 0.05, 0.03, 0] }[kind];
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    src.buffer = noiseBuf; f.type = cfg[0]; f.frequency.value = cfg[1];
    g.gain.setValueAtTime(cfg[2], t); g.gain.exponentialRampToValueAtTime(0.001, t + cfg[3]);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random() * 0.5); src.stop(t + cfg[3] + 0.02);
    if (cfg[4]) {
      const o = AC.createOscillator(), og = AC.createGain(); o.type = "sine";
      o.frequency.setValueAtTime(cfg[4], t); o.frequency.exponentialRampToValueAtTime(cfg[4] * 0.45, t + cfg[3]);
      og.gain.setValueAtTime(cfg[2] * 0.9, t); og.gain.exponentialRampToValueAtTime(0.001, t + cfg[3]);
      o.connect(og); og.connect(bus); o.start(t); o.stop(t + cfg[3] + 0.02);
    }
  }
  function schedule() {
    if (!current) return;
    const c = current, ahead = AC.currentTime + 0.18;
    let guard = 0;
    while (guard++ < 400) {
      const e = c.tr.events[c.i], t = c.start + c.loop * c.tr.length + e.t;
      if (t > ahead) break;
      if (t >= AC.currentTime - 0.02) { if (e.kind) drum(c.bus, e.kind, t); else tone(c.bus, e, t); }
      c.i++; if (c.i >= c.tr.events.length) { c.i = 0; c.loop++; }
    }
  }
  function stopChip() {
    if (!current) return;
    clearInterval(current.timer);
    const bus = current.bus; bus.gain.setTargetAtTime(0, AC.currentTime, 0.05);
    setTimeout(() => { try { bus.disconnect(); } catch {} }, 400);
    current = null;
  }
  function stopUpload() {
    if (!audioEl) return;
    const el = audioEl; audioEl = null; audioSlot = null;
    try { el.pause(); el.src = ""; } catch {}
  }
  function startSlot(slot) {
    stopChip(); stopUpload();
    if (!slot || !state.musicOn) return;
    const url = state.uploads[slot];
    if (url) {
      audioEl = new Audio(url); audioEl.loop = true; audioEl.volume = state.volume; audioSlot = slot;
      audioEl.play().catch(() => {});
      return;
    }
    if (!TRACK_DEFS[slot] || !ensure()) return;
    built[slot] = built[slot] || buildEvents(TRACK_DEFS[slot]);
    const bus = AC.createGain(); bus.gain.value = 1; bus.connect(master);
    current = { slot, tr: built[slot], bus, start: AC.currentTime + 0.08, i: 0, loop: 0 };
    current.timer = setInterval(schedule, 25); schedule();
  }

  const api = {
    state,
    setUploads(u) { state.uploads = u || {}; },
    unlock() { ensure(); }, // call from a tap so phones allow audio later
    setTrack(slot) {
      if (state.slot === slot) return;
      state.slot = slot;
      startSlot(slot);
    },
    setMusic(on) {
      state.musicOn = on;
      if (on) ensure();
      startSlot(state.slot);
    },
    setSfx(on) { state.sfxOn = on; if (on) ensure(); },
    sfx(kind) {
      if (!state.sfxOn || !ensure()) return;
      const seq = { select: [["E6", 0.04]], talk: [["A5", 0.03]], hit: [["C6", 0.05], ["G5", 0.05], ["C5", 0.08]], hurt: [["E4", 0.07], ["C4", 0.12]],
        bump: [["C3", 0.06]], door: [["G4", 0.05], ["C5", 0.08]], badge: [["G5", 0.1], ["B5", 0.1], ["D6", 0.1], ["G6", 0.3]] }[kind];
      if (!seq) return;
      let t = AC.currentTime + 0.01;
      for (const [n, d] of seq) { tone(sfxBus, { w: "lead", f: hz(n), d, v: 0.25 }, t); t += d; }
    },
    victory() {
      if (!state.musicOn) { api.sfx("badge"); return; }
      const resume = state.slot;
      const url = state.uploads.victory;
      stopChip(); stopUpload();
      if (url) {
        const el = new Audio(url); el.volume = state.volume;
        const back = () => { if (state.slot === resume) startSlot(resume); };
        el.addEventListener("ended", back, { once: true });
        el.play().catch(back);
        setTimeout(() => { if (!el.ended) { el.pause(); back(); } }, 12000);
        return;
      }
      if (!ensure()) return;
      let t = AC.currentTime + 0.05;
      for (const [n, d] of [["G5", 0.12], ["G5", 0.12], ["G5", 0.12], ["B5", 0.36], ["A5", 0.12], ["B5", 0.12], ["D6", 0.7]]) {
        tone(master, { w: "lead", f: hz(n), d, v: 0.16, grace: null }, t);
        tone(master, { w: "bass", f: hz(n) / 4, d, v: 0.25 }, t);
        t += d;
      }
      setTimeout(() => { if (state.slot === resume) startSlot(resume); }, 1900);
    },
    stopAll() { stopChip(); stopUpload(); },
  };
  return api;
}
