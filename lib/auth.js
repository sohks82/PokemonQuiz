import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "ff_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function passwordMatches(input) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(String(input || "")).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function sessionCookieValue() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export const COOKIE_NAME = COOKIE;

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  const good = sign(exp);
  if (good.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig));
}
