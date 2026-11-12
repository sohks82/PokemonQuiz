import { put, del } from "@vercel/blob";
import { handler, json, fail } from "@/lib/http";
import { one, query } from "@/lib/db";
import { MUSIC_SLOTS } from "@/lib/world";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept uploads up to about 4.5 MB
const TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav", "audio/webm"];

function validSlot(slot) {
  return MUSIC_SLOTS.some((s) => s.slot === slot);
}

export const POST = handler(async (req, { slot }) => {
  if (!validSlot(slot)) return fail("Unknown music slot.", 404);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return fail("Music storage isn't set up yet. In Vercel, open Storage > Create Database > Blob, connect it to this project, then redeploy.", 500);
  }
  let form;
  try {
    form = await req.formData();
  } catch {
    return fail("That upload didn't come through. Files must be under 4 MB.", 400);
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return fail("Choose an audio file to upload.");
  if (file.size > MAX_BYTES) return fail("That file is over 4 MB. Export a shorter or lower-bitrate MP3 (128 kbps is plenty).");
  const type = file.type || "audio/mpeg";
  if (!TYPES.includes(type) && !/\.(mp3|m4a|ogg|wav)$/i.test(file.name || "")) return fail("Upload an MP3 (or M4A, OGG, WAV) audio file.");
  const blob = await put(`music/${slot}-${(file.name || "track.mp3").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-60)}`, file, {
    access: "public", contentType: type, addRandomSuffix: true,
  });
  const prev = await one(`SELECT url FROM music WHERE slot = $1`, [slot]);
  await query(
    `INSERT INTO music (slot, url, filename) VALUES ($1, $2, $3)
     ON CONFLICT (slot) DO UPDATE SET url = EXCLUDED.url, filename = EXCLUDED.filename, updated_at = now()`,
    [slot, blob.url, String(file.name || "track").slice(0, 120)]
  );
  if (prev && prev.url !== blob.url) await del(prev.url).catch(() => {});
  return json({ ok: true, url: blob.url });
}, { admin: true });

export const DELETE = handler(async (req, { slot }) => {
  if (!validSlot(slot)) return fail("Unknown music slot.", 404);
  const prev = await one(`DELETE FROM music WHERE slot = $1 RETURNING url`, [slot]);
  if (prev && process.env.BLOB_READ_WRITE_TOKEN) await del(prev.url).catch(() => {});
  return json({ ok: true });
}, { admin: true });
