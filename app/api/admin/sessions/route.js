import { handler, json, fail, body } from "@/lib/http";
import { listSessions, createSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const GET = handler(async () => json({ sessions: await listSessions() }), { admin: true });

export const POST = handler(async (req) => {
  const b = await body(req);
  const title = String(b.title || "").trim().slice(0, 100);
  if (!title) return fail("Give the class session a name, e.g. \"Class 2A – Thursday\".");
  return json({ id: await createSession(title) });
}, { admin: true });
