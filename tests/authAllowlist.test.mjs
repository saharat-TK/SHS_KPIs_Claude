import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEmail, isAllowedDomain } from "../lib/auth/allowlist.ts";

test("normalizeEmail lowercases and trims to the stored form", () => {
  // scripts/migrate-app-roles.mjs stores LOWER(TRIM(email)), and the sign-in
  // lookup compares against that — the two have to agree exactly.
  assert.equal(normalizeEmail("  Saharat.Arr@MFU.ac.th "), "saharat.arr@mfu.ac.th");
  assert.equal(normalizeEmail("a@b.c"), "a@b.c");
});

test("normalizeEmail fails closed on anything that isn't an address", () => {
  for (const bad of [undefined, null, 42, {}, [], "", "   ", "not-an-email"]) {
    assert.equal(normalizeEmail(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

test("isAllowedDomain accepts the university domain", () => {
  assert.ok(isAllowedDomain("saharat.arr@mfu.ac.th", "mfu.ac.th"));
  assert.ok(isAllowedDomain("a@mfu.ac.th", "MFU.ac.th"), "domain arg is case-insensitive");
});

test("isAllowedDomain rejects other domains", () => {
  assert.equal(isAllowedDomain("someone@gmail.com", "mfu.ac.th"), false);
  assert.equal(isAllowedDomain("someone@sub.mfu.ac.th", "mfu.ac.th"), false);
});

test("isAllowedDomain is not fooled by a domain that merely ends in ours", () => {
  // The whole reason the check is endsWith("@" + domain) rather than
  // endsWith(domain): these are different organisations entirely, and a bare
  // suffix match would hand them accounts.
  assert.equal(isAllowedDomain("attacker@evil-mfu.ac.th", "mfu.ac.th"), false);
  assert.equal(isAllowedDomain("attacker@notmfu.ac.th", "mfu.ac.th"), false);
  assert.equal(isAllowedDomain("attacker@xmfu.ac.th", "mfu.ac.th"), false);
});
