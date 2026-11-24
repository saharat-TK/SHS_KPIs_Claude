import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Middleware only proves there is a signed session cookie. Every route handler
// must also confirm the caller is still an active faculty member
// (requireActor), and every write must apply the same can() action the UI
// gates on (requirePermission) — the UI hides, the route refuses.
//
// This reads the route sources rather than running them, so it needs no
// database. It is deliberately blunt: a handler that delegates its guard to a
// helper should still name requireActor/requirePermission in its own body.

const API_DIR = fileURLToPath(new URL("../app/api", import.meta.url));

// Auth.js's own endpoints and the impersonation switch, which checks the *real*
// signed-in row itself (see that route's header for why it can't use
// getSessionActor).
const EXEMPT = [`auth${sep}`];

function routeFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return name === "route.ts" ? [path] : [];
  });
}

/** Splits a route module into { method, body } per exported handler. */
function handlers(source) {
  const re = /export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\b/g;
  const marks = [...source.matchAll(re)];
  return marks.map((m, i) => ({
    method: m[1],
    body: source.slice(m.index, marks[i + 1]?.index ?? source.length),
  }));
}

const files = routeFiles(API_DIR)
  .map((path) => ({ path, rel: relative(API_DIR, path) }))
  .filter(({ rel }) => !EXEMPT.some((prefix) => rel.startsWith(prefix)));

test("finds the API routes", () => {
  assert.ok(files.length > 40, `only found ${files.length} route files`);
});

test("every handler confirms the caller is an active faculty member", () => {
  const missing = files.flatMap(({ path, rel }) =>
    handlers(readFileSync(path, "utf8"))
      .filter(({ body }) => !/require(Actor|Permission)\(/.test(body))
      .map(({ method }) => `${method} ${rel}`),
  );
  assert.deepEqual(missing, [], `unguarded handlers:\n  ${missing.join("\n  ")}`);
});

// Resource-scoped checks that stand in for requirePermission: they decide
// per-committee, which a flat can() action cannot. Both live in
// lib/kpi/dataSourcesServer.ts: checkEntryWriteAccess lets an admin, or a
// committee member on the source's own committee, record entries;
// checkSourceManagerAccess lets an admin, or that committee's Committee and
// Secretary, manage the source's columns and KPI links. denyLinkWrite
// (app/api/data-source-links/[id]/route.ts) wraps checkSourceManagerAccess for
// a link's own source.
const WRITE_CHECK =
  /requirePermission\(|checkEntryWriteAccess\(|checkSourceManagerAccess\(|denyLinkWrite\(/;

test("every write checks a can() action, not just sign-in", () => {
  const missing = files.flatMap(({ path, rel }) =>
    handlers(readFileSync(path, "utf8"))
      .filter(({ method, body }) => method !== "GET" && !WRITE_CHECK.test(body))
      .map(({ method }) => `${method} ${rel}`),
  );
  assert.deepEqual(missing, [], `writes without requirePermission:\n  ${missing.join("\n  ")}`);
});
