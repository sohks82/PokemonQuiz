"use client";

// Small fetch helper: returns parsed JSON or throws an Error with the server's message.
export async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["x-player-token"] = token;
  let res;
  try {
    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  } catch {
    throw Object.assign(new Error("Can't reach the server. Check your internet connection and try again."), { status: 0 });
  }
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status}).`), { status: res.status });
  return data;
}

export function storage(key, value) {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {}
  return null;
}
