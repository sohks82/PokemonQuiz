// All pixel art is drawn in code: characters, fault creatures, tiles, buildings and battle scenes.

export function mk(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
export function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
export function E(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    g.fillRect(cx - dx, cy + y, dx * 2 + 1, 1);
  }
}
export function outline(src, col) {
  const w = src.width, h = src.height, out = mk(w, h), g = out.getContext("2d");
  const d = src.getContext("2d").getImageData(0, 0, w, h).data;
  const a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  g.fillStyle = col;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) g.fillRect(x, y, 1, 1);
  g.drawImage(src, 0, 0);
  return out;
}
function mirror(src) { const c = mk(src.width, src.height), g = c.getContext("2d"); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- people ---------- */
const EYE = "#202028", BLUSH = "#f19b8f";
export const PALETTES = {
  player: { skin: "#f6c8a0", hair: "#6b4226", cap: "#26a69a", capDark: "#1b766e", capLight: "#6fd6c8", shirt: "#f4f4f4", pants: "#3a66c8", shoes: "#3a2c2c" },
  rowan: { skin: "#e8b48e", hair: "#c9c9c4", shirt: "#efe4cc", pants: "#6b4f2f", vest: "#2f8a4c", shoes: "#2c2420", moustache: true },
  tan: { skin: "#f1c9a5", hair: "#2b2220", shirt: "#d8579b", pants: "#4b4f7a", shoes: "#2c2420", bun: true },
  lim: { skin: "#e9bf95", hair: "#1e1a18", shirt: "#f0c94a", pants: "#5a5f68", shoes: "#2c2420", glasses: true },
  fionn: { skin: "#f6d2b4", hair: "#d06a2a", shirt: "#f4f4f4", vest: "#2c6e96", pants: "#333b44", shoes: "#222222" },
  maeve: { skin: "#f3cfb3", hair: "#a8322a", shirt: "#6b3fa0", pants: "#4c2c78", shoes: "#2a1d3a", longHair: true },
  brigid: { skin: "#f6d8bd", hair: "#e8c870", shirt: "#3a9c8c", pants: "#2f3e4a", shoes: "#222222", longHair: true },
  cormac: { skin: "#e0a982", hair: "#3a2a1e", shirt: "#b8433a", vest: "#2b2b2b", pants: "#3b3b3b", shoes: "#1e1e1e", moustache: true, beard: true },
};

function person(o, dir, step) {
  const c = mk(16, 18), g = c.getContext("2d");
  const top = o.cap || o.hair, topDark = o.cap ? o.capDark : o.hair;
  if (dir === "down") {
    if (o.bun) R(g, 6, 0, 4, 2, o.hair);
    R(g, 5, 1, 6, 1, top); R(g, 4, 2, 8, 3, top); R(g, 3, 5, 10, 1, topDark);
    if (o.capLight) R(g, 6, 2, 2, 1, o.capLight);
    R(g, 4, 6, 8, 5, o.skin); R(g, 3, 6, 1, 3, o.hair); R(g, 12, 6, 1, 3, o.hair);
    if (o.longHair) { R(g, 3, 6, 1, 7, o.hair); R(g, 12, 6, 1, 7, o.hair); R(g, 2, 8, 1, 4, o.hair); R(g, 13, 8, 1, 4, o.hair); }
    if (o.glasses) { R(g, 4, 7, 3, 2, "#bfe3f2"); R(g, 9, 7, 3, 2, "#bfe3f2"); R(g, 7, 7, 2, 1, "#2a2a2a"); }
    R(g, 5, 7, 1, 2, EYE); R(g, 10, 7, 1, 2, EYE);
    if (o.beard) R(g, 5, 9, 6, 2, o.hair); else if (o.moustache) R(g, 6, 9, 4, 1, o.hair); else { R(g, 4, 9, 1, 1, BLUSH); R(g, 11, 9, 1, 1, BLUSH); }
    R(g, 5, 11, 6, 1, o.shirt); R(g, 4, 12, 8, 3, o.shirt);
    if (o.vest) { R(g, 4, 11, 2, 4, o.vest); R(g, 10, 11, 2, 4, o.vest); }
    else if (o.cap) { R(g, 5, 12, 6, 3, o.pants); R(g, 5, 11, 1, 1, o.pants); R(g, 10, 11, 1, 1, o.pants); }
    R(g, 3, 12, 1, 2, o.vest || o.shirt); R(g, 12, 12, 1, 2, o.vest || o.shirt); R(g, 3, 14, 1, 1, o.skin); R(g, 12, 14, 1, 1, o.skin);
  } else if (dir === "up") {
    if (o.bun) R(g, 6, 0, 4, 2, o.hair);
    R(g, 5, 1, 6, 1, top); R(g, 4, 2, 8, 4, top); if (o.cap) R(g, 4, 5, 8, 1, o.capDark);
    R(g, 4, 6, 8, o.longHair ? 7 : 4, o.hair); R(g, 3, 6, 1, 3, o.hair); R(g, 12, 6, 1, 3, o.hair);
    if (!o.longHair) R(g, 6, 10, 4, 1, o.skin);
    R(g, 4, o.longHair ? 13 : 11, 8, o.longHair ? 2 : 4, o.vest || o.shirt);
    if (o.cap) { R(g, 5, 11, 1, 3, o.pants); R(g, 10, 11, 1, 3, o.pants); R(g, 5, 14, 6, 1, o.pants); }
    R(g, 3, 12, 1, 2, o.vest || o.shirt); R(g, 12, 12, 1, 2, o.vest || o.shirt); R(g, 3, 14, 1, 1, o.skin); R(g, 12, 14, 1, 1, o.skin);
  } else {
    if (o.bun) R(g, 4, 1, 3, 3, o.hair);
    R(g, 5, 1, 6, 1, top); R(g, 4, 2, 8, 3, top); R(g, o.cap ? 6 : 4, 5, 8, 1, topDark);
    if (o.capLight) R(g, 7, 2, 2, 1, o.capLight);
    R(g, 5, 6, 7, 5, o.skin); R(g, 4, 6, 2, o.longHair ? 7 : 4, o.hair);
    if (o.glasses) { R(g, 9, 7, 3, 2, "#bfe3f2"); R(g, 7, 7, 2, 1, "#2a2a2a"); }
    R(g, 10, 7, 1, 2, EYE);
    if (o.beard) R(g, 8, 9, 4, 2, o.hair); else if (o.moustache) R(g, 9, 9, 3, 1, o.hair); else R(g, 11, 9, 1, 1, BLUSH);
    R(g, 5, 11, 6, 4, o.shirt);
    if (o.vest) R(g, 5, 11, 3, 4, o.vest); else if (o.cap) R(g, 6, 12, 5, 3, o.pants);
    R(g, 7, 12, 2, 2, o.vest || o.shirt); R(g, 7, 14, 2, 1, o.skin);
  }
  if (dir === "left" || dir === "right") {
    if (step === 0) { R(g, 6, 15, 4, 1, o.pants); R(g, 6, 16, 5, 1, o.shoes); }
    else { R(g, 5, 15, 2, 1, o.pants); R(g, 9, 15, 2, 1, o.pants); R(g, 4, 16, 3, 1, o.shoes); R(g, 9, 16, 3, 1, o.shoes); }
  } else {
    const lUp = step === 1, rUp = step === 2;
    R(g, 5, 15, 3, 1, lUp ? o.shoes : o.pants); if (!lUp) R(g, 5, 16, 3, 1, o.shoes);
    R(g, 8, 15, 3, 1, rUp ? o.shoes : o.pants); if (!rUp) R(g, 8, 16, 3, 1, o.shoes);
  }
  return c;
}
export function personSprites(key) {
  const o = PALETTES[key], s = {};
  for (const d of ["down", "up", "right"]) s[d] = [0, 1, 2].map((st) => outline(person(o, d, st), "#1f2128"));
  s.left = s.right.map(mirror);
  return s;
}
export function bigPerson(key) {
  const src = outline(person(PALETTES[key], "down", 0), "#1f2128");
  const c = mk(48, 54), g = c.getContext("2d");
  g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, 48, 54);
  return c;
}

/* ---------- fault creatures (48x48) ---------- */
function creature(draw, line) { const c = mk(48, 48); draw(c.getContext("2d")); return outline(c, line); }
export const CREATURES = {
  bunny: () => creature((g) => {
    E(g, 15, 12, 4, 10, "#8d877f"); E(g, 32, 10, 4, 10, "#8d877f"); E(g, 15, 13, 2, 7, "#e8a0a8"); E(g, 32, 11, 2, 7, "#e8a0a8");
    E(g, 24, 31, 16, 14, "#8d877f");
    for (let a = 0; a < 12; a++) { const an = (a / 12) * Math.PI * 2; E(g, Math.round(24 + Math.cos(an) * 15), Math.round(31 + Math.sin(an) * 13), 3, 3, "#8d877f"); }
    E(g, 23, 29, 14, 12, "#aaa49b"); E(g, 18, 23, 6, 4, "#c8c2b8"); E(g, 16, 21, 2, 1, "#e6e1d8");
    E(g, 17, 45, 4, 2, "#7a746c"); E(g, 31, 45, 4, 2, "#7a746c");
    E(g, 18, 30, 3, 4, "#ffffff"); E(g, 30, 30, 3, 4, "#ffffff"); R(g, 18, 30, 2, 3, "#1e1c1a"); R(g, 29, 30, 2, 3, "#1e1c1a");
    R(g, 14, 24, 2, 1, "#3e3a36"); R(g, 16, 25, 2, 1, "#3e3a36"); R(g, 18, 26, 3, 1, "#3e3a36"); R(g, 34, 24, 2, 1, "#3e3a36"); R(g, 32, 25, 2, 1, "#3e3a36"); R(g, 29, 26, 3, 1, "#3e3a36");
    R(g, 20, 37, 8, 1, "#3a2a2a"); R(g, 21, 38, 1, 2, "#ffffff"); R(g, 26, 38, 1, 2, "#ffffff"); R(g, 12, 34, 3, 1, "#e8a0a8"); R(g, 33, 34, 3, 1, "#e8a0a8");
  }, "#3e3a36"),
  wraith: () => creature((g) => {
    E(g, 24, 18, 14, 13, "#dfe9f5"); R(g, 10, 18, 29, 20, "#dfe9f5");
    for (let i = 0; i < 5; i++) E(g, 12 + i * 6, 38, 3, 3, "#dfe9f5");
    R(g, 31, 18, 8, 20, "#bccbe0"); E(g, 18, 12, 4, 3, "#ffffff");
    E(g, 19, 20, 2, 4, "#2a3550"); E(g, 29, 20, 2, 4, "#2a3550"); E(g, 24, 29, 2, 2, "#2a3550");
    R(g, 5, 14, 2, 3, "#63d36b"); R(g, 41, 22, 2, 3, "#63d36b"); R(g, 3, 28, 2, 2, "#63d36b"); R(g, 43, 32, 2, 2, "#63d36b"); R(g, 7, 34, 1, 3, "#63d36b");
    R(g, 8, 24, 4, 6, "#5e6b80"); R(g, 9, 25, 2, 2, "#c9d3e2");
  }, "#40506a"),
  goblin: () => creature((g) => {
    for (let i = 0; i < 6; i++) { R(g, 7 + i, 12 + i, 3, 2, "#6aa84a"); R(g, 38 - i, 12 + i, 3, 2, "#6aa84a"); }
    E(g, 24, 32, 13, 11, "#7cbc5a"); E(g, 24, 19, 11, 10, "#7cbc5a"); E(g, 24, 34, 8, 7, "#a6d887");
    E(g, 19, 18, 3, 3, "#f8e04e"); E(g, 29, 18, 3, 3, "#f8e04e"); R(g, 19, 18, 2, 2, "#1e1c1a"); R(g, 29, 18, 2, 2, "#1e1c1a");
    R(g, 18, 25, 12, 1, "#2e4a1e"); R(g, 19, 26, 1, 2, "#ffffff"); R(g, 28, 26, 1, 2, "#ffffff");
    R(g, 31, 30, 13, 10, "#f3e7c8"); R(g, 31, 30, 13, 1, "#d6c69c"); R(g, 33, 32, 9, 1, "#8a7a5a"); R(g, 33, 34, 7, 1, "#c8463c"); R(g, 33, 36, 8, 1, "#8a7a5a"); R(g, 33, 38, 5, 1, "#8a7a5a");
    E(g, 18, 44, 4, 2, "#5c8f40"); E(g, 30, 44, 4, 2, "#5c8f40");
  }, "#2c4a20"),
  gremlin: () => creature((g) => {
    for (let i = 0; i < 6; i++) { R(g, 14 + Math.floor(i / 2), 6 + i, 3 - Math.floor(i / 3), 1, "#f2c230"); R(g, 31 - Math.floor(i / 2), 6 + i, 3 - Math.floor(i / 3), 1, "#f2c230"); }
    E(g, 24, 28, 15, 14, "#8b6cc8"); E(g, 20, 22, 6, 4, "#a68ad9");
    E(g, 18, 23, 4, 4, "#ffffff"); E(g, 30, 23, 4, 4, "#ffffff"); R(g, 18, 23, 2, 2, "#d33a3a"); R(g, 30, 23, 2, 2, "#d33a3a");
    for (let i = 0; i < 6; i++) R(g, 24 - i, 30 + i, i * 2 + 1, 1, "#f8d24a");
    R(g, 24, 31, 1, 3, "#3a2a1a"); R(g, 24, 35, 1, 1, "#3a2a1a");
    R(g, 17, 38, 14, 1, "#4a3270");
    E(g, 16, 43, 4, 2, "#6b4fa8"); E(g, 32, 43, 4, 2, "#6b4fa8"); E(g, 8, 30, 3, 4, "#8b6cc8"); E(g, 40, 30, 3, 4, "#8b6cc8");
  }, "#3a2860"),
  snake: () => creature((g) => {
    for (let t = 0; t <= 1.0001; t += 0.04) { const x = Math.round(6 + t * 30), y = Math.round(38 + Math.sin(t * Math.PI * 2) * 5); E(g, x, y, 4, 4, "#3d3f46"); E(g, x - 1, y - 1, 2, 1, "#6b6e78"); }
    for (let i = 0; i < 10; i++) E(g, 36 + Math.round(Math.sin(i / 3) * 2), 36 - i * 1.6 | 0, 4, 3, "#3d3f46");
    R(g, 33, 8, 13, 15, "#2b2d33"); R(g, 34, 9, 11, 3, "#4a4d56");
    R(g, 35, 23, 9, 3, "#d9b13b"); R(g, 36, 24, 1, 1, "#8a6a1a"); R(g, 38, 24, 1, 1, "#8a6a1a"); R(g, 40, 24, 1, 1, "#8a6a1a"); R(g, 42, 24, 1, 1, "#8a6a1a");
    R(g, 35, 14, 3, 3, "#ff4a3a"); R(g, 41, 14, 3, 3, "#ff4a3a"); R(g, 36, 15, 1, 1, "#ffd0c8"); R(g, 42, 15, 1, 1, "#ffd0c8");
    R(g, 37, 19, 5, 1, "#ff8a7a");
  }, "#1a1b20"),
  boar: () => creature((g) => {
    E(g, 14, 9, 4, 3, "rgba(150,150,158,0.9)"); E(g, 20, 5, 3, 3, "rgba(170,170,178,0.9)");
    R(g, 6, 16, 32, 26, "#9aa0a8"); R(g, 6, 16, 32, 3, "#c3c8ce"); R(g, 35, 16, 3, 26, "#7c828a");
    E(g, 16, 30, 7, 7, "#5b6168"); E(g, 16, 30, 6, 6, "#40454b"); R(g, 15, 24, 2, 12, "#7c828a"); R(g, 10, 29, 12, 2, "#7c828a"); E(g, 16, 30, 1, 1, "#c3c8ce");
    for (let i = 0; i < 4; i++) R(g, 26, 22 + i * 3, 9, 1, "#5b6168");
    R(g, 27, 36, 3, 4, "#f2c230"); R(g, 28, 34, 3, 3, "#f2c230"); R(g, 29, 32, 2, 2, "#f2c230");
    E(g, 41, 28, 6, 5, "#e8a0a8"); R(g, 39, 27, 1, 2, "#8a4a52"); R(g, 43, 27, 1, 2, "#8a4a52");
    R(g, 37, 33, 2, 4, "#fff8e8"); R(g, 44, 33, 2, 4, "#fff8e8");
    R(g, 24, 19, 3, 3, "#ffffff"); R(g, 31, 19, 3, 3, "#ffffff"); R(g, 25, 20, 2, 2, "#d33a3a"); R(g, 32, 20, 2, 2, "#d33a3a"); R(g, 23, 17, 4, 1, "#2a2a2a"); R(g, 31, 17, 4, 1, "#2a2a2a");
    R(g, 9, 42, 4, 4, "#5b6168"); R(g, 30, 42, 4, 4, "#5b6168");
  }, "#2a2d33"),
  moth: () => creature((g) => {
    E(g, 13, 20, 11, 13, "#5ad1e6"); E(g, 35, 20, 11, 13, "#e65ad1"); E(g, 15, 36, 7, 6, "#3fb3c8"); E(g, 33, 36, 7, 6, "#c43fb0");
    for (let y = 9; y < 32; y += 4) { R(g, 4, y, 18, 1, "rgba(255,255,255,0.55)"); R(g, 26, y + 2, 18, 1, "rgba(0,0,0,0.25)"); }
    R(g, 8, 14, 4, 3, "#f8e04e"); R(g, 36, 22, 4, 3, "#3ad15a"); R(g, 10, 26, 3, 2, "#ff4a3a"); R(g, 34, 12, 3, 2, "#4a7aff");
    E(g, 24, 26, 4, 13, "#3a2f4a"); E(g, 24, 15, 5, 4, "#4a3d5e");
    R(g, 21, 14, 2, 2, "#ffffff"); R(g, 26, 14, 2, 2, "#ffffff");
    R(g, 20, 7, 1, 6, "#3a2f4a"); R(g, 19, 5, 1, 2, "#3a2f4a"); R(g, 28, 7, 1, 6, "#3a2f4a"); R(g, 29, 5, 1, 2, "#3a2f4a");
  }, "#241c30"),
};

/* ---------- tiles and maps ---------- */
function grass(g, x, y, seed) {
  R(g, x, y, 16, 16, "#76c656");
  const r = rng(seed);
  for (let i = 0; i < 5; i++) {
    const px = x + Math.floor(r() * 14) + 1, py = y + Math.floor(r() * 13) + 1;
    if (r() < 0.55) { R(g, px, py, 1, 2, "#5aa83e"); R(g, px + 1, py + 1, 1, 1, "#5aa83e"); } else R(g, px, py, 1, 1, "#9fe07a");
  }
}
function tallGrass(g, x, y) {
  R(g, x, y, 16, 16, "#5fb447");
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const bx = x + i * 4 + (j % 2) * 2, by = y + j * 8 + 2;
    R(g, bx, by + 2, 1, 5, "#3f8f34"); R(g, bx + 1, by, 1, 7, "#4ea43c"); R(g, bx + 2, by + 3, 1, 4, "#3f8f34"); R(g, bx + 1, by, 1, 1, "#8fd66a");
  }
}
const THEMES = {
  gym1: { floor: "#d9b27c", floorLine: "#c69a62", wall: "#8a7866", wallDark: "#5e5044", carpet: "#b8433a", carpetEdge: "#e2b54e", mat: "#3b6b9a" },
  gym2: { floor: "#d5dee4", floorLine: "#b4c0c8", wall: "#5b6f7c", wallDark: "#3c4a54", carpet: "#2f8f86", carpetEdge: "#e2b54e", mat: "#6b4fa0" },
};

export function renderMap(map) {
  const T = map.tiles, h = T.length, w = T[0].length;
  const c = mk(w * 16, h * 16), g = c.getContext("2d");
  const at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w ? "T" : T[y][x]);
  const th = THEMES[map.theme];
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const ch = T[ty][tx], x = tx * 16, y = ty * 16, seed = ty * 97 + tx * 13 + 7 + w;
    if (th) { interiorTile(g, ch, x, y, tx, ty, th, at); continue; }
    const isPath = (k) => k === "p" || k === "x" || k === "d" || k === "D";
    if (ch === "p" || ch === "x") {
      R(g, x, y, 16, 16, "#e8d09a");
      const r = rng(seed); for (let i = 0; i < 4; i++) R(g, x + Math.floor(r() * 15), y + Math.floor(r() * 15), 1, 1, "#d2b67c");
      if (!isPath(at(tx, ty - 1))) R(g, x, y, 16, 1, "#c4a56a");
      if (!isPath(at(tx, ty + 1))) R(g, x, y + 15, 16, 1, "#c4a56a");
      if (!isPath(at(tx - 1, ty)) && tx > 0) R(g, x, y, 1, 16, "#c4a56a");
      if (!isPath(at(tx + 1, ty)) && tx < w - 1) R(g, x + 15, y, 1, 16, "#c4a56a");
    } else if (ch === "w") R(g, x, y, 16, 16, "#4aa3e8");
    else if (ch === "k") tallGrass(g, x, y);
    else grass(g, x, y, seed);
    if (ch === "f") {
      [[4, 5, "#f25c5c"], [10, 9, "#f8e04e"], [6, 11, "#ffffff"]].forEach(([fx, fy, col]) => {
        R(g, x + fx - 1, y + fy, 3, 1, col); R(g, x + fx, y + fy - 1, 1, 3, col); R(g, x + fx, y + fy, 1, 1, "#f6b733"); R(g, x + fx, y + fy + 2, 1, 2, "#3f8f34");
      });
    }
    if (ch === "T") {
      const t = mk(16, 16), tt = t.getContext("2d");
      R(tt, 6, 11, 4, 5, "#7a5230"); R(tt, 6, 11, 1, 5, "#5e3d22");
      E(tt, 8, 7, 7, 7, "#2f7d3a"); E(tt, 7, 6, 6, 5, "#3f9a48"); E(tt, 6, 4, 3, 2, "#6cc060"); R(tt, 10, 8, 2, 1, "#57ae4f");
      g.drawImage(outline(t, "#1b4a23"), x, y);
    }
    if (ch === "s") {
      const s = mk(16, 16), sg = s.getContext("2d");
      R(sg, 5, 3, 6, 11, "#a9abb4"); R(sg, 6, 2, 4, 1, "#a9abb4"); R(sg, 10, 3, 1, 11, "#8a8c96"); R(sg, 5, 3, 2, 9, "#c8cad2");
      R(sg, 7, 6, 2, 1, "#5f616a"); R(sg, 8, 7, 1, 2, "#5f616a"); R(sg, 6, 8, 2, 1, "#5f616a"); R(sg, 6, 7, 1, 1, "#5f616a");
      R(g, x + 4, y + 13, 9, 2, "#4f9a3c"); g.drawImage(outline(s, "#44464e"), x, y);
    }
    if (ch === "S") {
      const sn = mk(16, 16), sg = sn.getContext("2d");
      R(sg, 7, 9, 2, 6, "#7a5230"); R(sg, 2, 3, 12, 7, "#c8945a"); R(sg, 4, 5, 8, 1, "#7a5230"); R(sg, 4, 7, 6, 1, "#7a5230");
      g.drawImage(outline(sn, "#4a2f18"), x, y);
    }
  }
  for (const b of map.buildings || []) (b.kind === "gym" ? gym : house)(g, b);
  return c;
}

function interiorTile(g, ch, x, y, tx, ty, th, at) {
  // floor base
  R(g, x, y, 16, 16, th.floor);
  if (th === THEMES.gym1) { R(g, x, y + 7, 16, 1, th.floorLine); R(g, x, y + 15, 16, 1, th.floorLine); R(g, x + ((ty % 2) ? 4 : 11), y, 1, 7, th.floorLine); R(g, x + ((ty % 2) ? 11 : 4), y + 8, 1, 7, th.floorLine); }
  else { R(g, x, y, 16, 1, th.floorLine); R(g, x, y, 1, 16, th.floorLine); }
  if (ch === "#") {
    if (ty <= 1 && tx > 0 && tx < 14) {
      R(g, x, y, 16, 16, th.wall);
      for (let r = 0; r < 4; r++) { R(g, x, y + r * 4 + 3, 16, 1, th.wallDark); R(g, x + ((r % 2) ? 3 : 10), y + r * 4, 1, 3, th.wallDark); }
      if (ty === 1) { R(g, x, y + 13, 16, 3, th.wallDark); }
      if (ty === 0 && tx % 4 === 2) { R(g, x + 4, y + 4, 8, 6, "#e2b54e"); R(g, x + 6, y + 6, 4, 2, th.wallDark); R(g, x + 7, y + 5, 2, 4, th.wallDark); }
    } else R(g, x, y, 16, 16, th.wallDark);
  } else if (ch === "h") {
    R(g, x, y, 16, 16, "#6b4423"); R(g, x + 1, y + 1, 14, 6, "#3b2414"); R(g, x + 1, y + 8, 14, 6, "#3b2414");
    const cols = ["#c8463c", "#3a66c8", "#e2b54e", "#2f8a4c", "#8b6cc8", "#e8e0c8"];
    for (let i = 0; i < 6; i++) { R(g, x + 2 + i * 2, y + 2 + (i % 2), 2, 5 - (i % 2), cols[i]); R(g, x + 2 + i * 2, y + 9 + ((i + 1) % 2), 2, 5 - ((i + 1) % 2), cols[(i + 3) % 6]); }
  } else if (ch === "r") {
    R(g, x + 2, y, 12, 16, th.carpet); R(g, x + 2, y, 1, 16, th.carpetEdge); R(g, x + 13, y, 1, 16, th.carpetEdge);
    if (ty % 2 === 0) { R(g, x + 7, y + 6, 2, 4, th.carpetEdge); R(g, x + 6, y + 7, 4, 2, th.carpetEdge); }
  } else if (ch === "c") {
    R(g, x, y + 2, 16, 12, "#7a5230"); R(g, x, y + 2, 16, 3, "#b07a44"); R(g, x, y + 13, 16, 1, "#4a2f18");
    if (at(tx - 1, ty) !== "c") R(g, x, y + 2, 1, 12, "#4a2f18");
    if (at(tx + 1, ty) !== "c") R(g, x + 15, y + 2, 1, 12, "#4a2f18");
  } else if (ch === "o") {
    R(g, x + 4, y + 10, 8, 6, "#b4655a"); R(g, x + 3, y + 10, 10, 2, "#9c5a4e");
    E(g, 8 + x, 6 + y, 6, 5, "#2f7d3a"); E(g, 7 + x, 5 + y, 3, 2, "#57ae4f"); R(g, x + 11, y + 3, 2, 2, "#3f9a48");
  } else if (ch === "m") {
    R(g, x + 1, y + 2, 14, 12, th.mat); for (let i = 0; i < 3; i++) R(g, x + 3, y + 5 + i * 3, 10, 1, "rgba(255,255,255,0.35)");
  }
}

function house(g, b) {
  const x = b.x * 16, y = b.y * 16, w = b.w * 16, h = b.h * 16, rh = 22;
  const dark = shade(b.roof, -0.18), deep = shade(b.roof, -0.38);
  if (!b.workshop) { R(g, x + w - 16, y - 4, 7, 9, "#9c5a4e"); R(g, x + w - 17, y - 5, 9, 2, "#7a443a"); }
  R(g, x, y, w, rh, b.roof);
  for (let k = 3; k < rh - 2; k += 4) R(g, x, y + k, w, 1, dark);
  R(g, x - 1, y + rh - 2, w + 2, 2, deep); R(g, x, y - 1, w, 1, deep);
  R(g, x + 2, y + rh, w - 4, h - rh, "#f4ead2"); R(g, x + 2, y + h - 3, w - 4, 3, "#d9c8a4");
  R(g, x + 2, y + rh, 1, h - rh, "#c9b48c"); R(g, x + w - 3, y + rh, 1, h - rh, "#c9b48c");
  const dx = b.door * 16 + 3;
  const wins = b.workshop ? [[x + 8, y + 28], [x + w - 22, y + 28]] : [[x + 5, y + 28], [x + w - 22, y + 28]];
  for (const [wx, wy] of wins) {
    R(g, wx - 1, wy - 1, 12, 10, "#6b5a44"); R(g, wx, wy, 10, 8, "#8fd0f4"); R(g, wx + 1, wy + 1, 3, 1, "#d6f1ff"); R(g, wx + 1, wy + 2, 1, 2, "#d6f1ff"); R(g, wx + 4, wy, 1, 8, "#6b5a44");
    if (!b.workshop) { R(g, wx - 1, wy + 9, 12, 2, "#8a5a30"); R(g, wx + 1, wy + 8, 1, 1, "#f25c5c"); R(g, wx + 5, wy + 8, 1, 1, "#f8e04e"); R(g, wx + 8, wy + 8, 1, 1, "#f25c5c"); }
  }
  R(g, dx - 1, y + h - 15, 12, 15, "#5e3d22"); R(g, dx, y + h - 14, 10, 14, "#8a5a30"); R(g, dx + 2, y + h - 12, 6, 4, "#76492a"); R(g, dx + 8, y + h - 7, 1, 1, "#f0c040");
  if (b.workshop) {
    R(g, dx - 4, y + rh + 1, 18, 8, "#6b4423"); R(g, dx - 3, y + rh + 2, 16, 6, "#f6dc7a");
    R(g, dx - 1, y + rh + 6, 1, 1, "#4a3a2a"); R(g, dx, y + rh + 5, 1, 1, "#4a3a2a"); R(g, dx + 1, y + rh + 4, 1, 1, "#4a3a2a"); R(g, dx + 2, y + rh + 3, 2, 1, "#4a3a2a"); R(g, dx + 3, y + rh + 4, 1, 1, "#4a3a2a");
    E(g, dx + 9, y + rh + 5, 2, 2, "#4a3a2a"); R(g, dx + 9, y + rh + 5, 1, 1, "#f6dc7a");
  }
}

function gym(g, b) {
  const x = b.x * 16, y = b.y * 16, w = b.w * 16, h = b.h * 16, rh = 20;
  const dark = shade(b.roof, -0.2), deep = shade(b.roof, -0.4);
  R(g, x - 2, y - 6, w + 4, rh + 6, b.roof);
  for (let k = -3; k < rh - 2; k += 4) R(g, x - 2, y + k, w + 4, 1, dark);
  R(g, x - 3, y + rh - 2, w + 6, 3, deep); R(g, x - 2, y - 7, w + 4, 1, deep);
  R(g, x + 1, y + rh + 1, w - 2, h - rh - 1, "#c9c1b4");
  for (let r = 0; r < 4; r++) for (let cx = 0; cx < w; cx += 8) R(g, x + 1 + cx + (r % 2 ? 4 : 0), y + rh + 2 + r * 7, 1, 6, "#a69d8f");
  for (let r = 0; r < 4; r++) R(g, x + 1, y + rh + 8 + r * 7, w - 2, 1, "#a69d8f");
  for (let i = 0; i < w; i += 4) { R(g, x + i, y + rh + 1, 2, 2, "#e2b54e"); R(g, x + i + 2, y + rh + 1, 2, 2, deep); }
  const dx = (b.door - b.x) * 16 + x;
  R(g, dx - 4, y + h - 18, 24, 18, "#4a2f18"); R(g, dx - 3, y + h - 17, 10, 17, "#8a5a30"); R(g, dx + 9, y + h - 17, 10, 17, "#8a5a30");
  R(g, dx + 6, y + h - 9, 1, 2, "#f0c040"); R(g, dx + 9, y + h - 9, 1, 2, "#f0c040");
  const ex = dx + 8, ey = y + rh - 10;
  E(g, ex, ey, 9, 9, deep); E(g, ex, ey, 8, 8, "#e2b54e"); E(g, ex, ey, 6, 6, b.roof);
  if (b.label === 1) { for (let i = 0; i < 3; i++) R(g, ex - 4 + i * 3, ey + 2 - i * 3, 3, 3 + i * 3, "#f6dc7a"); }
  else { R(g, ex - 1, ey - 4, 3, 9, "#ffffff"); R(g, ex - 4, ey - 1, 9, 3, "#ffffff"); }
  for (const wx of [x + 8, x + w - 20]) { R(g, wx, y + rh + 7, 12, 10, "#5e5044"); R(g, wx + 1, y + rh + 8, 10, 8, "#8fd0f4"); R(g, wx + 6, y + rh + 8, 1, 8, "#5e5044"); R(g, wx + 2, y + rh + 9, 2, 1, "#d6f1ff"); }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
}

/* ---------- PCs (drawn live, since they change when fixed) ---------- */
export function drawPC(g, x, y, fixed, t, reduce) {
  R(g, x + 1, y + 9, 14, 2, "#b07a44"); R(g, x + 1, y + 11, 14, 1, "#8a5a30"); R(g, x + 2, y + 12, 2, 4, "#8a5a30"); R(g, x + 12, y + 12, 2, 4, "#8a5a30");
  R(g, x + 2, y, 12, 9, "#4a3a2a"); R(g, x + 3, y + 1, 10, 7, "#e6dfc8"); R(g, x + 4, y + 2, 8, 5, fixed ? "#2f8a4c" : "#2b3a4a"); R(g, x + 7, y + 8, 2, 1, "#c9c0a8");
  if (fixed) { R(g, x + 5, y + 4, 1, 1, "#d8ffd8"); R(g, x + 6, y + 5, 1, 1, "#d8ffd8"); R(g, x + 7, y + 4, 1, 1, "#d8ffd8"); R(g, x + 8, y + 3, 1, 1, "#d8ffd8"); R(g, x + 9, y + 2, 1, 1, "#d8ffd8"); return; }
  if (Math.floor(t * 4) % 2 === 0) { R(g, x + 7, y + 2, 2, 1, "#f2453a"); R(g, x + 7, y + 3, 1, 2, "#f2453a"); R(g, x + 7, y + 6, 1, 1, "#f2453a"); }
  if (reduce) return;
  const sp = Math.floor(t * 10) % 6;
  if (sp < 3) { R(g, x + 13, y - sp, 1, 1, "#ffe45c"); R(g, x + 14 + sp, y + 1, 1, 1, "#fff2a0"); }
  for (let s = 0; s < 3; s++) {
    const ph = (t * 0.6 + s / 3) % 1, sy = y - 3 - ph * 12, sx = x + 10 + Math.sin((t + s) * 2) * 2;
    E(g, Math.round(sx), Math.round(sy), 1 + Math.round(ph * 2), 1 + Math.round(ph * 2), ph < 0.7 ? "rgba(120,120,128,0.75)" : "rgba(150,150,158,0.45)");
  }
}

/* ---------- battle backgrounds ---------- */
export function battleBackground(theme) {
  const c = mk(240, 160), g = c.getContext("2d");
  if (theme === "gym1" || theme === "gym2") {
    const th = THEMES[theme];
    R(g, 0, 0, 240, 70, th.wall);
    for (let r = 0; r < 10; r++) { R(g, 0, r * 7 + 6, 240, 1, th.wallDark); for (let x = (r % 2) * 8; x < 240; x += 16) R(g, x, r * 7, 1, 6, th.wallDark); }
    for (let i = 0; i < 240; i += 4) { R(g, i, 62, 2, 2, "#e2b54e"); R(g, i + 2, 62, 2, 2, th.wallDark); }
    R(g, 0, 64, 240, 96, th.floor);
    for (let y = 72; y < 160; y += 10) R(g, 0, y, 240, 1, th.floorLine);
    E(g, 176, 66, 44, 11, shade(th.carpet, -0.25)); E(g, 176, 65, 40, 9, th.carpet); E(g, 176, 65, 36, 7, shade(th.carpet, 0.15));
    E(g, 70, 147, 64, 15, shade(th.carpet, -0.25)); E(g, 70, 146, 60, 13, th.carpet); E(g, 70, 146, 55, 11, shade(th.carpet, 0.15));
    return c;
  }
  ["#bfe6fb", "#c8eafb", "#d2eefc", "#ddf3fd"].forEach((col, i) => R(g, 0, i * 18, 240, 18, col));
  R(g, 0, 72, 240, 88, "#b5e08c");
  E(g, 30, 74, 46, 12, "#9bd77c"); E(g, 120, 76, 60, 10, "#8ccb6c"); E(g, 215, 74, 44, 13, "#9bd77c");
  R(g, 0, 76, 240, 84, "#b5e08c");
  for (let y = 84; y < 160; y += 9) R(g, 0, y, 240, 1, "#a8d67f");
  E(g, 176, 66, 44, 11, "#7fbc5c"); E(g, 176, 65, 40, 9, "#a6d982"); E(g, 172, 63, 22, 3, "#bde69b");
  E(g, 70, 147, 64, 15, "#7fbc5c"); E(g, 70, 146, 60, 13, "#a6d982"); E(g, 62, 142, 32, 4, "#bde69b");
  return c;
}

export function playerBack() {
  const c = mk(56, 56), g = c.getContext("2d");
  E(g, 28, 46, 20, 9, "#f4f4f4"); R(g, 8, 46, 41, 10, "#f4f4f4");
  R(g, 14, 44, 28, 12, "#3a66c8"); R(g, 17, 35, 4, 10, "#3a66c8"); R(g, 35, 35, 4, 10, "#3a66c8"); R(g, 21, 48, 14, 6, "#2a4c96");
  R(g, 23, 30, 10, 6, "#e8b48e");
  E(g, 28, 22, 12, 11, "#6b4226"); E(g, 16, 24, 2, 3, "#f6c8a0"); E(g, 40, 24, 2, 3, "#f6c8a0");
  E(g, 28, 15, 12, 8, "#26a69a"); R(g, 16, 15, 25, 4, "#26a69a"); R(g, 17, 18, 23, 2, "#1b766e"); R(g, 26, 18, 5, 2, "#6b4226"); E(g, 24, 11, 4, 2, "#6fd6c8");
  E(g, 47, 46, 3, 3, "#f6c8a0");
  R(g, 44, 41, 11, 9, "#d24a3c"); R(g, 44, 41, 11, 2, "#a8372c"); R(g, 47, 38, 5, 1, "#3a3a3a"); R(g, 47, 38, 1, 3, "#3a3a3a"); R(g, 51, 38, 1, 3, "#3a3a3a"); R(g, 48, 45, 3, 1, "#f0c040");
  return outline(c, "#1f2430");
}
