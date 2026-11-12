import { handler, json, fail } from "@/lib/http";
import { query } from "@/lib/db";
import { getSessionById } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, { id }) => {
  const s = await getSessionById(id);
  if (!s) return fail("Class session not found.", 404);
  await query(`DELETE FROM players WHERE session_id = $1`, [s.id]);
  return json({ session: await getSessionById(s.id) });
}, { admin: true });
