import crypto from "node:crypto";
import { handler, json, fail, body } from "@/lib/http";
import { one } from "@/lib/db";
import { getSession, gameState } from "@/lib/play";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, { code }) => {
  const s = await getSession(code);
  if (!s) return fail("No class has that code.", 404);
  if (s.status !== "open") return fail(s.status === "closed" ? "This class session has closed." : "This class session hasn't opened yet. Wait for your teacher.", 403);
  const b = await body(req);
  const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 20);
  if (name.length < 2) return fail("Enter your name (at least 2 characters).");
  const taken = await one(`SELECT 1 FROM players WHERE session_id = $1 AND lower(name) = lower($2)`, [s.id, name]);
  if (taken) return fail("Someone already joined with that name. Add your surname or initial.", 409);
  const token = crypto.randomBytes(24).toString("base64url");
  let player;
  try {
    player = await one(`INSERT INTO players (session_id, name, token) VALUES ($1, $2, $3) RETURNING *`, [s.id, name, token]);
  } catch (e) {
    if (e && e.code === "23505") return fail("Someone already joined with that name. Add your surname or initial.", 409);
    throw e;
  }
  return json({ token, state: { joined: true, ...(await gameState(s, player)) } });
});
