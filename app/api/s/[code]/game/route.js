import { handler, json, fail } from "@/lib/http";
import { getSession, getPlayer, gameState, publicSession, tokenFrom, getMusic } from "@/lib/play";

export const dynamic = "force-dynamic";

export const GET = handler(async (req, { code }) => {
  const s = await getSession(code);
  if (!s) return fail("No class has that code. Check it with your teacher.", 404);
  const player = await getPlayer(s.id, tokenFrom(req));
  if (!player) return json({ joined: false, session: publicSession(s), music: await getMusic() });
  return json({ joined: true, ...(await gameState(s, player)) });
});
