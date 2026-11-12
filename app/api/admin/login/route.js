import { NextResponse } from "next/server";
import { adminConfigured, passwordMatches, sessionCookieValue, cookieOptions, COOKIE_NAME } from "@/lib/auth";
import { body } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "ADMIN_PASSWORD isn't set. Add it in Vercel > Settings > Environment Variables, then redeploy." }, { status: 500 });
  }
  const b = await body(req);
  if (!passwordMatches(b.password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionCookieValue(), cookieOptions);
  return res;
}
