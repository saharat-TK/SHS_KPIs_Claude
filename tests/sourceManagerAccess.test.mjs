import assert from "node:assert/strict";
import test from "node:test";

import {
  isAllowedLinkTarget,
  sourceManagerAccess,
  SECRETARY_POSITION,
} from "../lib/kpi/dataSources.ts";

const POSITIONS = [
  "Counselor",
  "Committee Lead",
  "Committee",
  "Committee and Secretary",
  "Counselor and Committee Lead",
  null,
];

test("an admin manages columns whatever their position", () => {
  for (const position of POSITIONS) {
    assert.equal(sourceManagerAccess("admin", position), "admin", String(position));
  }
});

test("a committee-role secretary of the source's committee manages columns", () => {
  assert.equal(SECRETARY_POSITION, "Committee and Secretary");
  assert.equal(sourceManagerAccess("committee", "Committee and Secretary"), "secretary");
});

test("other committee positions do not", () => {
  for (const position of POSITIONS.filter((p) => p !== "Committee and Secretary")) {
    assert.equal(sourceManagerAccess("committee", position), null, String(position));
  }
});

test("the secretary position alone is not enough without the committee role", () => {
  assert.equal(sourceManagerAccess("viewer", "Committee and Secretary"), null);
  assert.equal(sourceManagerAccess("reviewer", "Committee and Secretary"), null);
  assert.equal(sourceManagerAccess(null, "Committee and Secretary"), null);
});

test("an admin (no allow-list) may link any target, assigned or not", () => {
  assert.equal(isAllowedLinkTarget("cmt-any", undefined), true);
  assert.equal(isAllowedLinkTarget(null, undefined), true);
});

test("a secretary may link only their own committees' targets", () => {
  const mine = ["cmt-research-ethics", "cmt-km"];
  assert.equal(isAllowedLinkTarget("cmt-km", mine), true);
  assert.equal(isAllowedLinkTarget("cmt-student-alumni", mine), false);
  // An unassigned KPI or metric belongs to no committee, so to none of theirs.
  assert.equal(isAllowedLinkTarget(null, mine), false);
  assert.equal(isAllowedLinkTarget(undefined, mine), false);
  assert.equal(isAllowedLinkTarget("cmt-km", []), false);
});
