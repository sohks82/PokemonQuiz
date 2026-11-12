import { handler, json, fail, body } from "@/lib/http";
import { getSession, getPlayer, tokenFrom, saveProgress } from "@/lib/play";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, { code }) => {
  const s = await getSession(code);
  if (!s) return fail("No class has that code.", 404);
  const player = await getPlayer(s.id, tokenFrom(req));
  if (!player) return fail("Join the class first.", 401);
  if (s.status !== "open") return fail("This class session is closed. Your score so far is saved.", 403);
  return json(await saveProgress(player, await body(req)));
});
