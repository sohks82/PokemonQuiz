import { handler, json, fail, body } from "@/lib/http";
import { cleanQuestion, updateQuestion } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const PUT = handler(async (req, { id }) => {
  const { errors, value } = cleanQuestion(await body(req));
  if (errors.length) return fail(errors.join(" "));
  const row = await updateQuestion(String(id), value);
  if (!row) return fail("Question not found.", 404);
  return json({ ok: true });
}, { admin: true });
