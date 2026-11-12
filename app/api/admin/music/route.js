import { handler, json } from "@/lib/http";
import { query } from "@/lib/db";
import { MUSIC_SLOTS } from "@/lib/world";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const rows = await query(`SELECT slot, url, filename, updated_at FROM music`);
  const bySlot = Object.fromEntries(rows.map((r) => [r.slot, r]));
  return json({
    storageReady: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    slots: MUSIC_SLOTS.map((s) => ({ ...s, url: bySlot[s.slot]?.url || null, filename: bySlot[s.slot]?.filename || null })),
  });
}, { admin: true });
