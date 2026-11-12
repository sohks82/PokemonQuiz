import { handler, json, fail, body } from "@/lib/http";
import { query } from "@/lib/db";
import { getSessionById } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const GET = handler(async (req, { id }) => {
  const s = await getSessionById(id);
  if (!s) return fail("Class session not found.", 404);
  return json({ session: s });
}, { admin: true });

export const PATCH = handler(async (req, { id }) => {
  const s = await getSessionById(id);
  if (!s) return fail("Class session not found.", 404);
  const b = await body(req);
  if ("title" in b) {
    const t = String(b.title || "").trim().slice(0, 100);
    if (!t) return fail("Give the class session a name.");
    await query(`UPDATE sessions SET title = $2 WHERE id = $1`, [s.id, t]);
  }
  if ("status" in b) {
    if (!["draft", "open", "closed"].includes(b.status)) return fail("Unknown status.");
    await query(`UPDATE sessions SET status = $2 WHERE id = $1`, [s.id, b.status]);
  }
  return json({ session: await getSessionById(s.id) });
}, { admin: true });

export const DELETE = handler(async (req, { id }) => {
  await query(`DELETE FROM sessions WHERE id = $1`, [Number(id)]);
  return json({ ok: true });
}, { admin: true });
