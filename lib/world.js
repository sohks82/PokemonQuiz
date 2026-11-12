// The game world, shared by the browser (to draw and play it) and the server (to check progress).

export const MUSIC_SLOTS = [
  { slot: "title", label: "Title", plays: "Start and join screen" },
  { slot: "town", label: "Town & routes", plays: "Walking around outside" },
  { slot: "battle", label: "Fault battle", plays: "Battles on the routes" },
  { slot: "gym1", label: "Gym 1: Process Gym", plays: "Inside Gym 1, including its leader battle" },
  { slot: "gym2", label: "Gym 2: Hardware Clinic", plays: "Inside Gym 2, including its leader battle" },
  { slot: "victory", label: "Victory", plays: "Short jingle after a battle or badge" },
];

// ---- Map builder -------------------------------------------------------------
function blank(w, h, fill) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}
function rect(g, x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = c;
}
function border(g, c) {
  const h = g.length, w = g[0].length;
  for (let i = 0; i < w; i++) { g[0][i] = c; g[h - 1][i] = c; }
  for (let j = 0; j < h; j++) { g[j][0] = c; g[j][w - 1] = c; }
}
const rows = (g) => g.map((r) => r.join(""));

// Tiles: T tree, g grass, k tall grass, f flowers, p path, w water, s standing stone, S sign,
// B building, d house door (locked), D gym door, P fault PC, x exit, # wall, . floor, r carpet,
// c counter, o plant, h bookshelf, m exit mat
function buildTown() {
  return [
    "TTTTTTTTTTTTTTT",
    "TBBBBBgfgBBBBgT",
    "TBBBBBggfBBBBgT",
    "TBBdBBgggBdBBgT",
    "TgfpggggggpggST",
    "Tgpppppppppppppx".slice(0, 14) + "x",
    "TggpgggfgggssgT",
    "TfgpggggggwwsgT",
    "TggpggggfgwwggT",
    "TTTTTTTTTTTTTTT",
  ];
}
function buildRoute(n) {
  const w = 32, h = 10, g = blank(w, h, "g");
  border(g, "T");
  rect(g, 0, 5, w, 1, "p");
  g[5][0] = "x"; g[5][w - 1] = n === 1 ? "x" : "T";
  rect(g, 24, 1, 6, 3, "B"); g[3][26] = "D"; g[4][26] = "p";
  if (n === 1) {
    rect(g, 3, 7, 4, 2, "k"); rect(g, 13, 2, 4, 2, "k"); rect(g, 19, 7, 3, 2, "k");
    [[9, 2], [10, 2], [9, 3], [16, 7], [16, 8], [21, 2], [28, 7], [29, 7], [29, 8]].forEach(([x, y]) => (g[y][x] = "T"));
    rect(g, 10, 7, 3, 2, "w");
    [[2, 2], [7, 3], [18, 3], [23, 7], [26, 8]].forEach(([x, y]) => (g[y][x] = "f"));
    g[4][2] = "S";
    g[4][6] = "P"; g[6][12] = "P"; g[4][18] = "P";
  } else {
    rect(g, 2, 7, 4, 2, "k"); rect(g, 8, 2, 3, 2, "k"); rect(g, 17, 7, 4, 2, "k"); rect(g, 21, 2, 2, 2, "k");
    [[13, 7], [14, 7], [13, 8], [6, 2], [27, 7], [28, 8], [29, 7]].forEach(([x, y]) => (g[y][x] = "T"));
    rect(g, 23, 7, 3, 2, "w");
    [[22, 6], [8, 7], [9, 8]].forEach(([x, y]) => (g[y][x] = "s"));
    [[4, 2], [15, 3], [19, 3], [11, 7]].forEach(([x, y]) => (g[y][x] = "f"));
    g[4][2] = "S";
    g[4][5] = "P"; g[6][10] = "P"; g[4][16] = "P"; g[6][20] = "P";
  }
  return rows(g);
}
function buildGym() {
  const w = 15, h = 10, g = blank(w, h, ".");
  rect(g, 0, 0, w, 2, "#"); rect(g, 0, 0, 1, h, "#"); rect(g, w - 1, 0, 1, h, "#"); rect(g, 0, h - 1, w, 1, "#");
  rect(g, 2, 1, 3, 1, "h"); rect(g, 10, 1, 3, 1, "h");
  rect(g, 7, 2, 1, 7, "r");
  rect(g, 1, 6, 6, 1, "c"); rect(g, 8, 6, 6, 1, "c");
  g[2][1] = "o"; g[2][13] = "o"; g[8][1] = "o"; g[8][13] = "o";
  g[9][7] = "m";
  return rows(g);
}

export const MAPS = {
  town: { name: "Workshop Town", music: "town", tiles: buildTown(), theme: "outdoor",
    buildings: [{ kind: "house", x: 1, y: 1, w: 5, h: 3, roof: "#4a78d0", door: 3, workshop: true }, { kind: "house", x: 9, y: 1, w: 4, h: 3, roof: "#d65a4a", door: 10 }] },
  route1: { name: "Route 1 · Troubleshooting Road", music: "town", tiles: buildRoute(1), theme: "outdoor",
    buildings: [{ kind: "gym", x: 24, y: 1, w: 6, h: 3, roof: "#2f7a52", door: 26, label: 1 }] },
  gym1: { name: "The Process Gym", music: "gym1", tiles: buildGym(), theme: "gym1", buildings: [] },
  route2: { name: "Route 2 · Hardware Hollow", music: "town", tiles: buildRoute(2), theme: "outdoor",
    buildings: [{ kind: "gym", x: 24, y: 1, w: 6, h: 3, roof: "#6a4fa0", door: 26, label: 2 }] },
  gym2: { name: "The Hardware Clinic", music: "gym2", tiles: buildGym(), theme: "gym2", buildings: [] },
};

// Where exits and doors lead: "map:x,y" -> [map, x, y, facing]
export const WARPS = {
  "town:14,5": ["route1", 1, 5, "right"],
  "route1:0,5": ["town", 13, 5, "left"],
  "route1:31,5": ["route2", 1, 5, "right"],
  "route2:0,5": ["route1", 30, 5, "left"],
  "route1:26,3": ["gym1", 7, 8, "up"],
  "gym1:7,9": ["route1", 26, 4, "down"],
  "route2:26,3": ["gym2", 7, 8, "up"],
  "gym2:7,9": ["route2", 26, 4, "down"],
};

export const START = { map: "town", x: 3, y: 4, dir: "down" };

// People. palette keys are drawn by the client.
export const NPCS = [
  { id: "rowan", map: "town", x: 5, y: 7, dir: "down", palette: "rowan", name: "ROWAN" },
  { id: "tan", map: "route1", x: 22, y: 6, dir: "up", palette: "tan", name: "MRS TAN", encounter: "tan" },
  { id: "fionn", map: "gym1", x: 7, y: 6, dir: "down", palette: "fionn", name: "FIONN", encounter: "fionn", stepAside: [5, 7] },
  { id: "maeve", map: "gym1", x: 7, y: 2, dir: "down", palette: "maeve", name: "MAEVE", encounter: "maeve" },
  { id: "lim", map: "route2", x: 13, y: 4, dir: "down", palette: "lim", name: "MR LIM", encounter: "lim" },
  { id: "brigid", map: "gym2", x: 7, y: 6, dir: "down", palette: "brigid", name: "BRIGID", encounter: "brigid", stepAside: [9, 7] },
  { id: "cormac", map: "gym2", x: 7, y: 2, dir: "down", palette: "cormac", name: "CORMAC", encounter: "cormac" },
];

// Encounters, in the order a student meets them.
export const ENCOUNTERS = [
  { id: "wraith", map: "route1", pc: [6, 4], kind: "fault", name: "DATA WRAITH", sprite: "wraith", level: 4, area: "route1",
    intro: ["The PC's screen flickers... files are vanishing!", "A wild DATA WRAITH appeared!"], win: "The DATA WRAITH fades away. The files are safe." },
  { id: "goblin", map: "route1", pc: [12, 6], kind: "fault", name: "LOG GOBLIN", sprite: "goblin", level: 5, area: "route1",
    intro: ["Error messages keep popping up on this PC...", "A wild LOG GOBLIN appeared!"], win: "The LOG GOBLIN drops its error log and scurries off." },
  { id: "gremlin", map: "route1", pc: [18, 4], kind: "fault", name: "DRIVER GREMLIN", sprite: "gremlin", level: 5, area: "route1",
    intro: ["This PC's webcam and speakers have stopped working...", "A wild DRIVER GREMLIN appeared!"], win: "The DRIVER GREMLIN is gone. All the devices work again." },
  { id: "tan", npc: "tan", map: "route1", kind: "customer", name: "MRS TAN", sprite: "tan", level: 1, area: "route1",
    intro: ["Oh, a technician! My computer is acting very strangely.", "Can you help me work out what's wrong?"], win: "Thank you! You explained it so clearly." },
  { id: "fionn", npc: "fionn", map: "gym1", kind: "trainer", name: "FIONN", sprite: "fionn", level: 8, area: "gym1",
    intro: ["Halt! Only technicians who know the process may face Maeve.", "Show me what you know!"], win: "You know your steps. On you go." },
  { id: "maeve", npc: "maeve", map: "gym1", kind: "leader", name: "MAEVE", sprite: "maeve", level: 12, area: "gym1", badge: "Process Badge",
    intro: ["I'm Maeve, leader of the Process Gym.", "A good technician never skips a step. Let's see if you do!"], win: "Flawless process! Take the PROCESS BADGE." },
  { id: "bunny", map: "route2", pc: [5, 4], kind: "fault", name: "DUST BUNNY", sprite: "bunny", level: 6, area: "route2",
    intro: ["This PC is hot, and its fan is grinding...", "A wild DUST BUNNY appeared!"], win: "The DUST BUNNY is cleaned up. The fan spins freely." },
  { id: "snake", map: "route2", pc: [10, 6], kind: "fault", name: "CABLE SNAKE", sprite: "snake", level: 6, area: "route2",
    intro: ["\"No boot device found\" is on the screen...", "A wild CABLE SNAKE appeared!"], win: "The CABLE SNAKE is plugged back in where it belongs." },
  { id: "boar", map: "route2", pc: [16, 4], kind: "fault", name: "BURNOUT BOAR", sprite: "boar", level: 7, area: "route2",
    intro: ["Something smells like burning...", "A wild BURNOUT BOAR appeared!"], win: "The BURNOUT BOAR cools off. Power is safe again." },
  { id: "moth", map: "route2", pc: [20, 6], kind: "fault", name: "GLITCH MOTH", sprite: "moth", level: 7, area: "route2",
    intro: ["The screen is flickering wildly...", "A wild GLITCH MOTH appeared!"], win: "The GLITCH MOTH flutters off. The picture is steady." },
  { id: "lim", npc: "lim", map: "route2", kind: "customer", name: "MR LIM", sprite: "lim", level: 1, area: "route2",
    intro: ["You're the new technician? Good timing!", "My laptop has two problems. Can you help?"], win: "Wonderful, thank you! I'll tell all my friends." },
  { id: "brigid", npc: "brigid", map: "gym2", kind: "trainer", name: "BRIGID", sprite: "brigid", level: 10, area: "gym2",
    intro: ["Welcome to the Hardware Clinic.", "Cormac only sees technicians who pass my check-up!"], win: "Healthy answers! Cormac is waiting." },
  { id: "cormac", npc: "cormac", map: "gym2", kind: "leader", name: "CORMAC", sprite: "cormac", level: 15, area: "gym2", badge: "Clinic Badge",
    intro: ["I'm Cormac. I've fixed every fault in the county.", "Let's see if you can diagnose like a pro!"], win: "Outstanding! Take the CLINIC BADGE. You're a real Fault Finder!" },
];

export const ENCOUNTER_IDS = ENCOUNTERS.map((e) => e.id);
export const LEADERS = ENCOUNTERS.filter((e) => e.kind === "leader").map((e) => e.id);

// What has to be done before a gym door or road opens.
export const GATES = {
  "route1:26,3": { needs: ["wraith", "goblin", "gremlin", "tan"], text: "The Process Gym is locked. Fix every fault on Route 1 first" },
  "route1:31,5": { needs: ["maeve"], text: "Road works ahead! Win the Process Badge before you go on to Route 2" },
  "route2:26,3": { needs: ["bunny", "snake", "boar", "moth", "lim"], text: "The Hardware Clinic is locked. Fix every fault on Route 2 first" },
  "gym1:7,2": { needs: ["fionn"], text: "" },
  "gym2:7,2": { needs: ["brigid"], text: "" },
};

export function nextGoal(defeated) {
  const d = new Set(defeated || []);
  const r1 = ["wraith", "goblin", "gremlin", "tan"].filter((x) => !d.has(x)).length;
  if (r1) return `Fix the faults on Route 1 (east of town). ${4 - r1} of 4 done.`;
  if (!d.has("fionn")) return "Enter the Process Gym at the end of Route 1 and beat Fionn.";
  if (!d.has("maeve")) return "Challenge Maeve, the Process Gym leader.";
  const r2 = ["bunny", "snake", "boar", "moth", "lim"].filter((x) => !d.has(x)).length;
  if (r2) return `Head east to Route 2 and fix its faults. ${5 - r2} of 5 done.`;
  if (!d.has("brigid")) return "Enter the Hardware Clinic and beat Brigid.";
  if (!d.has("cormac")) return "Challenge Cormac, the Hardware Clinic leader.";
  return "You've earned both badges! Explore, or check the leaderboard.";
}

export const SIGNS = {
  "town:13,4": ["ROUTE 1 → THE PROCESS GYM"],
  "route1:2,4": ["ROUTE 1 · TROUBLESHOOTING ROAD", "Fault PCs ahead! Fix them all to unlock the Process Gym."],
  "route2:2,4": ["ROUTE 2 · HARDWARE HOLLOW", "Fix every fault to unlock the Hardware Clinic."],
};
