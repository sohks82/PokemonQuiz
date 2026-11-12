import { handler, json, fail } from "@/lib/http";
import { results, resultsCsv } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const GET = handler(async (req, { id }) => {
  const r = await results(id);
  if (!r) return fail("Class session not found.", 404);
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const safe = r.session.title.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "results";
    return new Response(resultsCsv(r), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="fault-finders-${safe}-${r.session.code}.csv"`, "Cache-Control": "no-store" },
    });
  }
  return json(r);
}, { admin: true });
