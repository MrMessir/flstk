#!/usr/bin/env node
/**
 * Smoke / security checks against local Next (default http://localhost:3001).
 * Run: npm run test:security
 */
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://localhost:3001";

function safeInternalPath(raw, fallback = "/lessons") {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("@")) return fallback;
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(path)) return fallback;
  return path;
}

assert.equal(safeInternalPath("/lessons"), "/lessons");
assert.equal(safeInternalPath("/duel/abc?x=1"), "/duel/abc?x=1");
assert.equal(safeInternalPath("https://evil.com"), "/lessons");
assert.equal(safeInternalPath("//evil.com"), "/lessons");
assert.equal(safeInternalPath("\\evil"), "/lessons");
console.log("ok safeInternalPath");

async function main() {
  const home = await fetch(`${BASE}/`);
  assert.equal(home.status, 200);

  const login = await fetch(`${BASE}/login`);
  assert.equal(login.status, 200);

  const lessons = await fetch(`${BASE}/lessons`, { redirect: "manual" });
  assert.ok(
    [307, 302, 303].includes(lessons.status),
    `lessons should redirect, got ${lessons.status}`,
  );
  const loc = lessons.headers.get("location") || "";
  assert.ok(loc.includes("/login"), `lessons Location=${loc}`);

  const me = await fetch(`${BASE}/api/me`);
  assert.equal(me.status, 200);
  const meJson = await me.json();
  assert.equal(meJson.user, null);

  for (const [path, method] of [
    ["/api/duel/create", "POST"],
    ["/api/duel/join", "POST"],
    ["/api/progress/complete", "POST"],
    ["/api/admin/stats", "GET"],
    ["/api/admin/users", "GET"],
  ]) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? "{}" : undefined,
      redirect: "manual",
    });
    assert.ok(
      [401, 403, 307, 302].includes(res.status),
      `${path} should be blocked, got ${res.status}`,
    );
  }

  // Security headers on a page response
  const headers = login.headers;
  assert.ok(headers.get("x-content-type-options")?.includes("nosniff"));
  assert.ok(headers.get("x-frame-options")?.toUpperCase().includes("DENY"));
  assert.ok(headers.get("content-security-policy"));

  console.log("ok http smoke against", BASE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
