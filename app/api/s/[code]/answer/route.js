import { handler, json, fail, body } from "@/lib/http";
import { getSession, getPlayer, tokenFrom, answerQuestion } from "@/lib/play";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, { code }) => {
  const s = await getSession(code);
  if (!s) return fail("No class has that code.", 404);
  if (s.status !== "open") return fail("This class session is closed. Your score so far is saved.", 403);
  const player = await getPlayer(s.id, tokenFrom(req));
  if (!player) return fail("Join the class first.", 401);
  const b = await body(req);
  const r = await answerQuestion(player, b.questionId, b.choice);
  if (r.error) return fail(r.error, r.status);
  return json(r);
});
