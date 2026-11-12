import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message, status = 400) {
  return json({ error: message }, status);
}

export async function body(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// Wraps a route handler: catches errors and, when admin is true, rejects anyone not logged in.
export function handler(fn, { admin = false } = {}) {
  return async (req, ctx) => {
    try {
      if (admin && !(await isAdmin())) return fail("Please log in to the admin panel.", 401);
      const params = ctx && ctx.params ? await ctx.params : {};
      return await fn(req, params);
    } catch (e) {
      console.error(e);
      const msg = /DATABASE_URL/.test(String(e && e.message)) ? e.message : "Something went wrong on the server. Try again in a moment.";
      return fail(msg, 500);
    }
  };
}
