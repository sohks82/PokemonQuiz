import { handler, json } from "@/lib/http";
import { listQuestions } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const GET = handler(async () => json({ encounters: await listQuestions() }), { admin: true });
