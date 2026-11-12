import { Pool } from "pg";
import { DEFAULT_QUESTIONS } from "./questions";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  score INT NOT NULL DEFAULT 0,
  badges INT NOT NULL DEFAULT 0,
  cleared INT NOT NULL DEFAULT 0,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS players_name_idx ON players (session_id, lower(name));
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  encounter TEXT NOT NULL,
  position INT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct INT NOT NULL,
  hint TEXT NOT NULL DEFAULT '',
  explain TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS answers (
  player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  tries INT NOT NULL DEFAULT 0,
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, question_id)
);
CREATE TABLE IF NOT EXISTS music (
  slot TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  filename TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

function connectionString() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Neon connection string in Vercel > Settings > Environment Variables, then redeploy.");
  return url;
}
function pool() {
  if (!globalThis.__ffPool) globalThis.__ffPool = new Pool({ connectionString: connectionString(), max: 5, idleTimeoutMillis: 10000 });
  return globalThis.__ffPool;
}

export async function query(text, params = []) {
  await ensureSchema();
  return (await pool().query(text, params)).rows;
}
export async function one(text, params = []) {
  return (await query(text, params))[0] || null;
}

export async function insertDefaultQuestions(client, overwrite) {
  for (const q of DEFAULT_QUESTIONS) {
    await client.query(
      `INSERT INTO questions (id, encounter, position, prompt, options, correct, hint, explain)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       ON CONFLICT (id) DO ${overwrite ? "UPDATE SET prompt = EXCLUDED.prompt, options = EXCLUDED.options, correct = EXCLUDED.correct, hint = EXCLUDED.hint, explain = EXCLUDED.explain, updated_at = now()" : "NOTHING"}`,
      [q.id, q.encounter, q.position, q.prompt, JSON.stringify(q.options), q.correct, q.hint, q.explain]
    );
  }
}

async function ensureSchema() {
  if (!globalThis.__ffSchema) {
    globalThis.__ffSchema = (async () => {
      const client = await pool().connect();
      try {
        await client.query("SELECT pg_advisory_lock(727402)");
        await client.query(SCHEMA);
        await insertDefaultQuestions(client, false);
      } finally {
        await client.query("SELECT pg_advisory_unlock(727402)").catch(() => {});
        client.release();
      }
    })().catch((e) => { globalThis.__ffSchema = null; throw e; });
  }
  return globalThis.__ffSchema;
}

export async function rawClient() {
  await ensureSchema();
  return pool().connect();
}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}
