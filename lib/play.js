import { one, query } from "./db";
import { ENCOUNTERS, ENCOUNTER_IDS, LEADERS, MAPS, START } from "./world";

export const POINTS = [100, 50, 25, 10]; // first try, second, third, later
export const TOTAL_ENCOUNTERS = ENCOUNTERS.length;

export async function getSession(code) {
  return one(`SELECT * FROM sessions WHERE code = $1`, [String(code || "").toUpperCase().trim()]);
}
export function publicSession(s) {
  return { code: s.code, title: s.title, status: s.status };
}
export async function getPlayer(sessionId, token) {
  if (!token) return null;
  return one(`SELECT * FROM players WHERE session_id = $1 AND token = $2`, [sessionId, token]);
}
export function tokenFrom(req) {
  return req.headers.get("x-player-token") || "";
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// The same option order every time for one player and question, so the correct answer isn't always first.
export function permutation(n, seedText) {
  let s = hash(seedText) || 1;
  const rand = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return p;
}

export async function getMusic() {
  const rows = await query(`SELECT slot, url FROM music`);
  return Object.fromEntries(rows.map((r) => [r.slot, r.url]));
}

export async function gameState(session, player) {
  const qs = await query(`SELECT id, encounter, position, prompt, options FROM questions ORDER BY encounter, position, id`);
  const ans = await query(`SELECT question_id, tries, correct FROM answers WHERE player_id = $1`, [player.id]);
  const questions = {};
  for (const q of qs) {
    const perm = permutation(q.options.length, `${player.id}:${q.id}`);
    (questions[q.encounter] = questions[q.encounter] || []).push({ id: q.id, prompt: q.prompt, options: perm.map((i) => q.options[i]) });
  }
  return {
    session: publicSession(session),
    player: { name: player.name, score: player.score, badges: player.badges, progress: sanitizeProgress(player.progress, player.progress.defeated || []) },
    questions,
    answered: Object.fromEntries(ans.map((a) => [a.question_id, { tries: a.tries, correct: a.correct }])),
    music: await getMusic(),
  };
}

export function sanitizeProgress(p, defeated) {
  const map = MAPS[p && p.map] ? p.map : START.map;
  const tiles = MAPS[map].tiles;
  let x = Number.isInteger(p && p.x) ? p.x : START.x;
  let y = Number.isInteger(p && p.y) ? p.y : START.y;
  if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) { x = START.x; y = START.y; }
  const dir = ["up", "down", "left", "right"].includes(p && p.dir) ? p.dir : "down";
  return { map: MAPS[p && p.map] ? map : START.map, x, y, dir, defeated: defeated.filter((d) => ENCOUNTER_IDS.includes(d)), seenIntro: Boolean(p && p.seenIntro) };
}

export async function answerQuestion(player, questionId, choice) {
  const q = await one(`SELECT * FROM questions WHERE id = $1`, [String(questionId)]);
  if (!q) return { error: "That question no longer exists. Reload the game.", status: 404 };
  const prev = await one(`SELECT * FROM answers WHERE player_id = $1 AND question_id = $2`, [player.id, q.id]);
  if (prev && prev.correct) return { correct: true, points: 0, text: q.explain, score: player.score, already: true };
  const perm = permutation(q.options.length, `${player.id}:${q.id}`);
  const pos = Number(choice);
  if (!Number.isInteger(pos) || pos < 0 || pos >= perm.length) return { error: "Pick one of the answers.", status: 400 };
  const correct = perm[pos] === q.correct;
  const tries = (prev ? prev.tries : 0) + 1;
  const points = correct ? POINTS[Math.min(tries - 1, POINTS.length - 1)] : 0;
  await query(
    `INSERT INTO answers (player_id, question_id, tries, correct, points) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (player_id, question_id) DO UPDATE SET tries = EXCLUDED.tries, correct = EXCLUDED.correct, points = EXCLUDED.points, updated_at = now()`,
    [player.id, q.id, tries, correct, points]
  );
  const s = await one(
    `UPDATE players SET score = (SELECT COALESCE(SUM(points), 0) FROM answers WHERE player_id = $1), updated_at = now() WHERE id = $1 RETURNING score`,
    [player.id]
  );
  return { correct, points, tries, text: correct ? q.explain : q.hint, score: s.score };
}

// Saves position and works out which encounters really are beaten (every question answered correctly).
export async function saveProgress(player, input) {
  const claimed = Array.isArray(input.defeated) ? input.defeated.filter((d) => ENCOUNTER_IDS.includes(d)) : [];
  let defeated = player.progress.defeated || [];
  if (claimed.length) {
    const rows = await query(
      `SELECT q.encounter, bool_and(COALESCE(a.correct, false)) AS done
         FROM questions q LEFT JOIN answers a ON a.question_id = q.id AND a.player_id = $1
        GROUP BY q.encounter`,
      [player.id]
    );
    const done = new Set(rows.filter((r) => r.done).map((r) => r.encounter));
    defeated = [...new Set([...defeated, ...claimed.filter((d) => done.has(d))])];
  }
  const progress = sanitizeProgress({ ...input, seenIntro: input.seenIntro || player.progress.seenIntro }, defeated);
  const badges = LEADERS.filter((l) => defeated.includes(l)).length;
  const finished = badges === LEADERS.length;
  const row = await one(
    `UPDATE players SET progress = $2::jsonb, badges = $3, cleared = $4, updated_at = now(),
            finished_at = CASE WHEN $5 AND finished_at IS NULL THEN now() ELSE finished_at END
      WHERE id = $1 RETURNING score, badges, finished_at`,
    [player.id, JSON.stringify(progress), badges, defeated.length, finished]
  );
  return { progress, score: row.score, badges: row.badges, finished: Boolean(row.finished_at) };
}

export async function leaderboard(session) {
  const rows = await query(
    `SELECT name, score, badges, cleared, finished_at FROM players WHERE session_id = $1
      ORDER BY score DESC, badges DESC, finished_at ASC NULLS LAST, created_at ASC`,
    [session.id]
  );
  return {
    session: publicSession(session),
    total: TOTAL_ENCOUNTERS,
    players: rows.map((r, i) => ({ rank: i + 1, name: r.name, score: r.score, badges: r.badges, cleared: r.cleared, finished: Boolean(r.finished_at) })),
  };
}
