import { handler, json } from "@/lib/http";
import { resetQuestions, listQuestions } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Puts every question back to the original Chapter 4 wording.
export const POST = handler(async () => {
  await resetQuestions();
  return json({ encounters: await listQuestions() });
}, { admin: true });
