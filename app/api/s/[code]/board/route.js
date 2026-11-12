import { handler, json, fail } from "@/lib/http";
import { getSession, leaderboard } from "@/lib/play";

export const dynamic = "force-dynamic";

export const GET = handler(async (req, { code }) => {
  const s = await getSession(code);
  if (!s) return fail("No class has that code.", 404);
  if (s.status === "draft") return fail("This class session hasn't opened yet.", 403);
  return json(await leaderboard(s));
});
