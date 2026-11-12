import { one, query, newCode, rawClient, insertDefaultQuestions } from "./db";
import { ENCOUNTERS } from "./world";
import { TOTAL_ENCOUNTERS } from "./play";

export async function listSessions() {
  return query(
    `SELECT s.id, s.code, s.title, s.status, s.created_at,
            (SELECT count(*)::int FROM players p WHERE p.session_id = s.id) AS players
       FROM sessions s ORDER BY s.created_at DESC`
  );
}

export async function createSession(title) {
  for (let i = 0; i < 10; i++) {
    const code = newCode();
    try {
      const row = await one(`INSERT INTO sessions (code, title) VALUES ($1, $2) RETURNING id`, [code, title]);
      return row.id;
    } catch (e) {
      if (!(e && e.code === "23505")) throw e;
    }
  }
  throw new Error("Could not create a unique code");
}

export async function getSessionById(id) {
  const s = await one(`SELECT * FROM sessions WHERE id = $1`, [Number(id)]);
  if (!s) return null;
  const n = (await one(`SELECT count(*)::int AS n FROM players WHERE session_id = $1`, [s.id])).n;
  return { id: s.id, code: s.code, title: s.title, status: s.status, players: n };
}

export async function results(id) {
  const s = await getSessionById(id);
  if (!s) return null;
  const rows = await query(
    `SELECT p.name, p.score, p.badges, p.cleared, p.created_at, p.finished_at, p.updated_at,
            COALESCE(SUM(CASE WHEN a.correct THEN 1 ELSE 0 END), 0)::int AS correct,
            COALESCE(SUM(GREATEST(a.tries - CASE WHEN a.correct THEN 1 ELSE 0 END, 0)), 0)::int AS wrong
       FROM players p LEFT JOIN answers a ON a.player_id = p.id
      WHERE p.session_id = $1 GROUP BY p.id
      ORDER BY p.score DESC, p.badges DESC, p.finished_at ASC NULLS LAST`,
    [s.id]
  );
  const totalQ = (await one(`SELECT count(*)::int AS n FROM questions`)).n;
  return { session: s, totalEncounters: TOTAL_ENCOUNTERS, totalQuestions: totalQ, rows };
}

function cell(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function resultsCsv(r) {
  const head = ["Rank", "Name", "Score", "Badges", "Encounters cleared", "Questions correct", "Wrong answers", "Finished", "Last active (UTC)"];
  const lines = [head.join(",")];
  r.rows.forEach((p, i) => {
    lines.push([i + 1, p.name, p.score, p.badges, `${p.cleared}/${r.totalEncounters}`, `${p.correct}/${r.totalQuestions}`, p.wrong,
      p.finished_at ? "Yes" : "No", new Date(p.updated_at).toISOString().slice(0, 16).replace("T", " ")].map(cell).join(","));
  });
  return "﻿" + lines.join("\r\n");
}

export async function listQuestions() {
  const qs = await query(`SELECT id, encounter, position, prompt, options, correct, hint, explain FROM questions ORDER BY position, id`);
  return ENCOUNTERS.map((e) => ({
    id: e.id, name: e.name, kind: e.kind, area: e.area,
    questions: qs.filter((q) => q.encounter === e.id).sort((a, b) => a.position - b.position),
  }));
}

export function cleanQuestion(b) {
  const errors = [];
  const prompt = String(b.prompt || "").trim();
  const options = Array.isArray(b.options) ? b.options.map((o) => String(o || "").trim()) : [];
  const correct = Number(b.correct);
  const hint = String(b.hint || "").trim();
  const explain = String(b.explain || "").trim();
  if (!prompt || prompt.length > 200) errors.push("The question needs 1–200 characters.");
  if (options.length !== 4 || options.some((o) => !o || o.length > 70)) errors.push("Give exactly 4 answers, each 1–70 characters.");
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) errors.push("The 4 answers must all be different.");
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) errors.push("Choose which answer is correct.");
  if (hint.length > 200 || explain.length > 240) errors.push("Keep the hint under 200 and the explanation under 240 characters.");
  return { errors, value: { prompt, options, correct, hint, explain } };
}

export async function updateQuestion(id, v) {
  return one(
    `UPDATE questions SET prompt = $2, options = $3::jsonb, correct = $4, hint = $5, explain = $6, updated_at = now() WHERE id = $1 RETURNING id`,
    [id, v.prompt, JSON.stringify(v.options), v.correct, v.hint, v.explain]
  );
}

export async function resetQuestions() {
  const client = await rawClient();
  try {
    await insertDefaultQuestions(client, true);
  } finally {
    client.release();
  }
}
