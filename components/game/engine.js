// The game engine: world movement, dialogue, battles and saving. Draws to a 240x160 buffer.
import { MAPS, WARPS, NPCS, ENCOUNTERS, GATES, SIGNS, nextGoal } from "@/lib/world";
import { mk, R, E, renderMap, personSprites, bigPerson, CREATURES, drawPC, battleBackground, playerBack } from "./art";

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: "down", down: "up", left: "right", right: "left" };
const WALK = new Set(["g", "k", "f", "p", "x", ".", "r", "m", "D"]);
const BY_ID = Object.fromEntries(ENCOUNTERS.map((e) => [e.id, e]));
const ME_MAX = 30, HURT = 6;
const ROWAN_INTRO = [
  "Welcome to Workshop Town! I'm Rowan, the town technician.",
  "Fault creatures are breaking every PC between here and the gyms.",
  "Head east to Route 1. Fix each fault by choosing the right repair move.",
  "A right answer first time scores 100 points. Wrong moves cost energy, so think it through!",
  "Fix Route 1, then win badges at the Process Gym and the Hardware Clinic.",
  "Tap START any time to see your goal, your score and the sound settings. Good luck!",
];

export class Engine {
  constructor({ canvas, data, sound, api, onUI, reduce }) {
    this.canvas = canvas; this.data = data; this.sound = sound; this.api = api; this.onUI = onUI; this.reduce = reduce;
    this.buf = mk(240, 160); this.g = this.buf.getContext("2d");
    this.sprites = {}; this.mapCache = {}; this.bgCache = {};
    this.pBack = playerBack();
    const p = data.player.progress;
    this.defeated = new Set(p.defeated);
    this.answered = { ...data.answered };
    this.score = data.player.score; this.badges = data.player.badges;
    this.seenIntro = p.seenIntro;
    this.ui = { dialog: null, battle: null, menu: false, finish: null, banner: null, toast: null, fade: false };
    this.time = 0; this.held = null; this.lastSave = 0; this.dirty = false; this.closed = false;
    this.loadMap(p.map, p.x, p.y, p.dir);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    if (!this.seenIntro) setTimeout(() => this.rowanIntro(), 500);
  }

  /* ---------- plumbing ---------- */
  emit() {
    const b = this.bt;
    this.onUI({
      ...this.ui,
      score: this.score, badges: this.badges, goal: nextGoal([...this.defeated]),
      battle: b ? {
        kind: b.enc.kind, name: b.enc.name, level: b.enc.level, hp: b.hp, max: b.max, meHp: b.meHp, meMax: ME_MAX,
        msg: b.msg, canContinue: b.canContinue, busy: b.busy, phase: b.phase,
        options: b.phase === "question" || b.phase === "result" ? b.options.map((t, i) => ({ text: t, disabled: b.disabled.includes(i) || b.phase !== "question", state: b.right === i ? "right" : b.disabled.includes(i) ? "wrong" : "" })) : null,
      } : null,
    });
  }
  destroy() { cancelAnimationFrame(this.raf); this.destroyed = true; }
  frame = (now) => {
    if (this.destroyed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.update(dt); this.draw(); this.present();
    this.raf = requestAnimationFrame(this.frame);
  };
  present() {
    const c = this.canvas; if (!c) return;
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.max(240, Math.round(r.width * dpr)), h = Math.round((w * 2) / 3);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(this.buf, 0, 0, w, h);
  }
  sprite(key) { return (this.sprites[key] = this.sprites[key] || personSprites(key)); }
  toast(text) { this.ui.toast = text; this.emit(); clearTimeout(this.toastT); this.toastT = setTimeout(() => { this.ui.toast = null; this.emit(); }, 4000); }

  /* ---------- world ---------- */
  loadMap(id, x, y, dir) {
    this.mapId = id; this.map = MAPS[id];
    this.mapBg = this.mapCache[id] = this.mapCache[id] || renderMap(this.map);
    this.w = this.map.tiles[0].length; this.h = this.map.tiles.length;
    this.P = { x, y, px: x * 16, py: y * 16, dir, moving: false, tx: x, ty: y, dist: 0 };
    this.npcs = NPCS.filter((n) => n.map === id).map((n) => {
      const moved = n.stepAside && this.defeated.has(n.encounter);
      return { ...n, x: moved ? n.stepAside[0] : n.x, y: moved ? n.stepAside[1] : n.y, face: n.dir };
    });
    this.sound.setTrack(this.map.music);
    this.ui.banner = this.map.name; this.emit();
    clearTimeout(this.bannerT); this.bannerT = setTimeout(() => { this.ui.banner = null; this.emit(); }, 2200);
  }
  tile(x, y) { return y < 0 || y >= this.h || x < 0 || x >= this.w ? "T" : this.map.tiles[y][x]; }
  npcAt(x, y) { return this.npcs.find((n) => n.x === x && n.y === y); }
  walkable(x, y) { return WALK.has(this.tile(x, y)) && !this.npcAt(x, y); }
  pcAt(x, y) { return ENCOUNTERS.find((e) => e.map === this.mapId && e.pc && e.pc[0] === x && e.pc[1] === y); }
  busy() { return this.ui.dialog || this.bt || this.ui.menu || this.ui.finish || this.ui.fade; }

  update(dt) {
    this.time += dt;
    if (this.dlg) this.typeDialog(dt);
    if (this.bt) { this.bt.time += dt; return; }
    if (this.busy()) return;
    const P = this.P;
    if (!P.moving && this.held) {
      P.dir = this.held;
      const [dx, dy] = DIRS[this.held], nx = P.x + dx, ny = P.y + dy, key = `${this.mapId}:${nx},${ny}`;
      if (WARPS[key]) { this.held = null; this.tryWarp(key); return; }
      if (this.walkable(nx, ny)) { P.moving = true; P.tx = nx; P.ty = ny; }
      else if (!this.bumped) { this.sound.sfx("bump"); this.bumped = true; }
    }
    if (!this.held) this.bumped = false;
    if (P.moving) {
      const sp = 72 * dt, gx = P.tx * 16, gy = P.ty * 16;
      P.px += Math.sign(gx - P.px) * Math.min(sp, Math.abs(gx - P.px));
      P.py += Math.sign(gy - P.py) * Math.min(sp, Math.abs(gy - P.py));
      P.dist += sp;
      if (P.px === gx && P.py === gy) { P.x = P.tx; P.y = P.ty; P.moving = false; this.dirty = true; }
    }
    if (this.dirty && this.time - this.lastSave > 20) this.save();
  }

  tryWarp(key) {
    const gate = GATES[key];
    if (gate && !gate.needs.every((d) => this.defeated.has(d))) {
      const done = gate.needs.filter((d) => this.defeated.has(d)).length;
      this.say("", [`${gate.text} (${done}/${gate.needs.length} done).`]);
      return;
    }
    const [map, x, y, dir] = WARPS[key];
    this.sound.sfx("door");
    this.ui.fade = true; this.emit();
    setTimeout(() => {
      this.loadMap(map, x, y, dir);
      setTimeout(() => { this.ui.fade = false; this.emit(); this.save(); }, 120);
    }, 260);
  }

  /* ---------- input ---------- */
  press(dir, down) { if (down) this.held = dir; else if (this.held === dir) this.held = null; }
  pressA() {
    if (this.ui.finish || this.ui.menu || this.ui.fade) return;
    if (this.dlg) { this.advanceDialog(); return; }
    if (this.bt) { if (this.bt.canContinue && !this.bt.busy) this.battleContinue(); return; }
    if (this.P.moving) return;
    const [dx, dy] = DIRS[this.P.dir], fx = this.P.x + dx, fy = this.P.y + dy;
    const npc = this.npcAt(fx, fy);
    if (npc) return this.talk(npc);
    const pc = this.pcAt(fx, fy);
    if (pc) {
      if (this.defeated.has(pc.id)) return this.say("", ["This PC runs smoothly now. Nice work!"]);
      this.sound.sfx("select");
      return this.say("", pc.intro, () => this.startBattle(pc));
    }
    const sign = SIGNS[`${this.mapId}:${fx},${fy}`];
    if (sign) return this.say("", sign);
    const t = this.tile(fx, fy);
    const text = {
      d: fx < 8 ? ["ROWAN'S PC WORKSHOP. It's closed while Rowan is out."] : ["Your house. Your toolkit is already in your bag."],
      w: ["The water is clear and cold. Best keep electronics well away."],
      s: ["Old standing stones, carved with Celtic spirals."],
      h: ["Manuals and repair journals: a technician's personal reference tools."],
      c: ["A workbench covered in screwdrivers, cables and spare RAM."],
      o: ["A well-watered plant. Someone takes good care of this gym."],
    }[t];
    if (text) this.say("", text);
  }
  pressB() {
    if (this.ui.menu) return this.toggleMenu(false);
    if (this.dlg) return this.advanceDialog();
  }
  toggleMenu(open) {
    if (this.bt || this.ui.finish) return;
    this.ui.menu = open === undefined ? !this.ui.menu : open;
    this.held = null; this.emit();
  }

  /* ---------- dialogue ---------- */
  say(name, lines, onEnd) {
    this.dlg = { name, lines, i: 0, shown: 0, onEnd };
    this.held = null;
    this.ui.dialog = { name, text: "", done: false };
    this.emit();
  }
  typeDialog(dt) {
    const d = this.dlg, line = d.lines[d.i];
    if (d.shown >= line.length) return;
    d.shown = Math.min(line.length, d.shown + dt * (this.reduce ? 400 : 50));
    this.ui.dialog = { name: d.name, text: line.slice(0, Math.floor(d.shown)), done: d.shown >= line.length };
    this.emit();
  }
  advanceDialog() {
    const d = this.dlg, line = d.lines[d.i];
    if (d.shown < line.length) { d.shown = line.length; this.ui.dialog = { name: d.name, text: line, done: true }; this.emit(); return; }
    this.sound.sfx("talk");
    if (d.i < d.lines.length - 1) { d.i++; d.shown = 0; this.ui.dialog = { name: d.name, text: "", done: false }; this.emit(); return; }
    this.dlg = null; this.ui.dialog = null; this.emit();
    if (d.onEnd) d.onEnd();
  }
  rowanIntro() {
    this.say("ROWAN", ROWAN_INTRO, () => { this.seenIntro = true; this.save(); });
  }
  talk(npc) {
    npc.face = OPP[this.P.dir];
    if (npc.id === "rowan") {
      if (!this.seenIntro) return this.rowanIntro();
      return this.say("ROWAN", [nextGoal([...this.defeated]), `You have ${this.score} points and ${this.badges} of 2 badges. Keep it up!`], () => { npc.face = npc.dir; });
    }
    const enc = BY_ID[npc.encounter];
    if (!enc) return;
    if (this.defeated.has(enc.id)) {
      const after = { customer: "Thanks again for your help!", trainer: "Good luck with the leader!", leader: `You've earned the ${enc.badge}. Well done, Fault Finder!` }[enc.kind];
      return this.say(enc.name, [after], () => { npc.face = npc.dir; });
    }
    this.sound.sfx("select");
    this.say(enc.name, enc.intro, () => this.startBattle(enc, npc));
  }

  /* ---------- battle ---------- */
  startBattle(enc, npc) {
    const qs = this.data.questions[enc.id] || [];
    const queue = qs.filter((q) => !(this.answered[q.id] && this.answered[q.id].correct));
    const theme = this.map.theme === "outdoor" ? "outdoor" : this.map.theme;
    this.bgCache[theme] = this.bgCache[theme] || battleBackground(theme);
    this.bt = {
      enc, npc, queue, qi: 0, max: Math.max(1, qs.length), hp: queue.length, meHp: ME_MAX, earned: 0, time: 0, flash: 0, faint: 0, hurt: 0,
      phase: "intro", disabled: [], right: -1, options: [], busy: false, canContinue: true,
      enemy: enc.kind === "fault" ? CREATURES[enc.sprite]() : bigPerson(enc.sprite), bg: this.bgCache[theme],
      msg: enc.kind === "fault" ? `A wild ${enc.name} appeared! Choose the right fix.` : enc.kind === "customer" ? `${enc.name} needs help. Choose your words carefully.` : `${enc.name} wants to battle! Answer correctly to win.`,
    };
    this.held = null;
    this.sound.setTrack(this.map.theme === "outdoor" ? "battle" : this.map.music);
    this.emit();
  }
  ask() {
    const b = this.bt, q = b.queue[b.qi];
    b.phase = "question"; b.msg = q.prompt; b.options = q.options; b.disabled = []; b.right = -1; b.canContinue = false;
    this.emit();
  }
  async choose(i) {
    const b = this.bt;
    if (!b || b.phase !== "question" || b.busy || b.disabled.includes(i)) return;
    const q = b.queue[b.qi];
    b.busy = true; this.emit();
    let r;
    try {
      r = await this.api.answer(q.id, i);
    } catch (e) {
      b.busy = false; this.emit();
      if (e.status === 403) this.sessionClosed(); else this.toast(e.message);
      return;
    }
    b.busy = false;
    if (r.correct) {
      this.answered[q.id] = { correct: true, tries: r.tries };
      this.score = r.score; b.earned += r.points || 0; b.hp = Math.max(0, b.hp - 1); b.flash = 0.6; b.right = i;
      this.sound.sfx("hit");
      const good = b.enc.kind === "fault" ? "It's super effective!" : b.enc.kind === "customer" ? "Great answer!" : "Correct!";
      b.msg = `${good} ${r.text}${r.points ? ` +${r.points} points.` : ""}`;
      b.phase = "result"; b.canContinue = true;
    } else {
      b.disabled.push(i); b.meHp = Math.max(0, b.meHp - HURT); b.hurt = 0.4;
      this.sound.sfx("hurt");
      b.msg = `Not quite. ${r.text}`;
      if (b.meHp <= 0) { b.phase = "fainted"; b.msg += " You're out of energy!"; b.canContinue = true; }
    }
    this.emit();
  }
  battleContinue() {
    const b = this.bt;
    if (b.phase === "intro") return b.queue.length ? this.ask() : this.win();
    if (b.phase === "result") { b.qi++; return b.qi < b.queue.length ? this.ask() : this.win(); }
    if (b.phase === "won") return this.endBattle(true);
    if (b.phase === "fainted") return this.endBattle(false);
  }
  win() {
    const b = this.bt, enc = b.enc;
    b.phase = "won"; b.faint = 0.0001; b.canContinue = true;
    this.defeated.add(enc.id);
    this.sound.setTrack(null); this.sound.victory();
    b.msg = `${enc.win}${b.earned ? ` You earned ${b.earned} points.` : ""}`;
    this.emit();
    this.save();
  }
  endBattle(won) {
    const b = this.bt; this.bt = null;
    this.sound.setTrack(this.map.music);
    this.emit();
    if (!won) {
      this.say("ROWAN", ["(on the radio) Out of energy? Take a breath and try again.", "Questions you've already answered stay answered!"]);
      return;
    }
    const enc = b.enc;
    if (b.npc && b.npc.stepAside) { b.npc.x = b.npc.stepAside[0]; b.npc.y = b.npc.stepAside[1]; }
    if (enc.badge) {
      this.sound.sfx("badge");
      this.say("", [`You received the ${enc.badge.toUpperCase()}!`], () => {
        if (enc.id === "cormac") { this.ui.finish = { score: this.score }; this.emit(); }
      });
    }
  }

  async save() {
    if (this.closed) return;
    this.lastSave = this.time; this.dirty = false;
    const P = this.P;
    try {
      const r = await this.api.progress({ map: this.mapId, x: P.moving ? P.tx : P.x, y: P.moving ? P.ty : P.y, dir: P.dir, defeated: [...this.defeated], seenIntro: this.seenIntro });
      this.score = r.score; this.badges = r.badges; this.emit();
    } catch (e) {
      if (e.status === 403) this.sessionClosed();
    }
  }
  sessionClosed() {
    this.closed = true;
    this.toast("Your teacher has closed this session. Your score is saved.");
  }

  /* ---------- drawing ---------- */
  draw() { if (this.bt) this.drawBattle(); else this.drawWorld(); }
  drawWorld() {
    const g = this.g, P = this.P;
    const camX = Math.max(0, Math.min(this.w * 16 - 240, Math.round(P.px) + 8 - 120));
    g.drawImage(this.mapBg, -camX, 0);
    const t = this.time, tx0 = Math.floor(camX / 16), tx1 = Math.min(this.w - 1, tx0 + 15);
    for (let ty = 0; ty < this.h; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const c = this.map.tiles[ty][tx], x = tx * 16 - camX, y = ty * 16;
      if (c === "w") for (let k = 0; k < 3; k++) { const off = Math.floor((t * 6 + k * 5 + tx * 3) % 14); R(g, x + 1 + off, y + 3 + k * 5, 3, 1, "#a9dcfb"); }
      if (c === "P") { const enc = this.pcAt(tx, ty); drawPC(g, x, y, enc && this.defeated.has(enc.id), t, this.reduce); }
    }
    const ents = this.npcs.map((n) => ({ y: n.y * 16, draw: () => this.drawPerson(n.palette, n.face, 0, n.x * 16 - camX, n.y * 16) }));
    let step = 0;
    if (P.moving) step = P.dir === "left" || P.dir === "right" ? (Math.floor(P.dist / 8) % 2 === 0 ? 1 : 0) : (Math.floor(P.dist / 8) % 2 === 0 ? 1 : 2);
    ents.push({ y: P.py, draw: () => this.drawPerson("player", P.dir, step, Math.round(P.px) - camX, Math.round(P.py)) });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
  }
  drawPerson(key, dir, step, x, y) {
    const g = this.g;
    g.fillStyle = "rgba(20,40,20,0.22)"; g.fillRect(x + 3, y + 13, 10, 2); g.fillRect(x + 4, y + 15, 8, 1);
    g.drawImage(this.sprite(key)[dir][step], x, y - 3);
  }
  drawBattle() {
    const g = this.g, b = this.bt;
    g.drawImage(b.bg, 0, 0);
    const bob = this.reduce ? 0 : Math.round(Math.sin(b.time * 3) * 1.5);
    if (b.flash > 0) b.flash -= 1 / 60;
    if (b.hurt > 0) b.hurt -= 1 / 60;
    if (b.faint > 0) b.faint = Math.min(1, b.faint + 1 / 40);
    const visible = !(b.flash > 0 && Math.floor(b.flash * 12) % 2 === 0);
    const person = b.enc.kind !== "fault";
    if (visible && b.faint < 1) {
      g.save(); g.globalAlpha = 1 - b.faint;
      g.drawImage(b.enemy, person ? 152 : 152, (person ? 12 : 18) + bob + Math.round(b.faint * 14));
      g.restore();
    }
    if (!person && !this.reduce && b.faint === 0) {
      for (let i = 0; i < 5; i++) {
        const ph = (b.time * 0.35 + i / 5) % 1;
        R(g, Math.round(150 + ((i * 37) % 52) + Math.sin(b.time * 2 + i) * 3), Math.round(60 - ph * 46), 2, 2, `rgba(150,150,160,${(0.8 - ph * 0.7).toFixed(2)})`);
      }
    }
    const shake = b.hurt > 0 && !this.reduce ? Math.round(Math.sin(b.hurt * 60) * 3) : 0;
    g.drawImage(this.pBack, 40 + shake, 100 + (this.reduce ? 0 : Math.round(Math.sin(b.time * 2.4 + 1))));
  }
}
