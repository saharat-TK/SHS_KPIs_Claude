import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  canDeleteSet,
  canEditStartYear,
  deleteBlockReason,
  deletionConfirmed,
  describeSetDeletion,
  startYearLockReason,
} from "../lib/kpi/setRules.ts";

test("a draft set with no performance record can be deleted and re-dated", () => {
  const set = { status: "draft", performanceRecordCount: 0 };
  assert.equal(canDeleteSet(set), true);
  assert.equal(canEditStartYear(set), true);
  assert.equal(deleteBlockReason(set), null);
  assert.equal(startYearLockReason(set), null);
});

test("a missing record count is treated as none", () => {
  assert.equal(canDeleteSet({ status: "draft" }), true);
});

test("active and archived sets cannot be deleted", () => {
  for (const status of ["active", "archived"]) {
    assert.equal(canDeleteSet({ status, performanceRecordCount: 0 }), false);
    assert.equal(
      deleteBlockReason({ status, performanceRecordCount: 0 }),
      "Only draft sets can be deleted",
    );
    assert.equal(canEditStartYear({ status, performanceRecordCount: 0 }), false);
  }
});

test("a draft set that was already activated is locked, whatever its status", () => {
  const set = { status: "draft", performanceRecordCount: 2 };
  assert.equal(canDeleteSet(set), false);
  assert.equal(deleteBlockReason(set), "Already activated in Performance");
  assert.equal(startYearLockReason(set), "Already activated in Performance");
  // The activation reason wins over the status reason.
  assert.equal(
    deleteBlockReason({ status: "active", performanceRecordCount: 1 }),
    "Already activated in Performance",
  );
});

test("deletion copy pluralises and states it cannot be undone", () => {
  assert.match(describeSetDeletion("Set A", 1, 1), /1 KPI, 1 sub-KPI,/);
  assert.match(describeSetDeletion("Set A", 3, 0), /3 KPIs, 0 sub-KPIs,/);
  assert.match(describeSetDeletion("Set A", 0, 0), /can't be undone/);
});

test("deletion needs the exact set name typed", () => {
  assert.equal(deletionConfirmed("SHS Set", "SHS Set"), true);
  assert.equal(deletionConfirmed("  SHS Set ", "SHS Set"), true);
  assert.equal(deletionConfirmed("shs set", "SHS Set"), false);
  assert.equal(deletionConfirmed("", ""), false);
});

// The route is the real gate — the UI only explains. Source-level checks, since
// the handlers need a database.
const route = readFileSync(
  new URL("../app/api/strategic-sets/[id]/route.ts", import.meta.url),
  "utf8",
);

test("DELETE only removes a draft set with no performance record, atomically", () => {
  const del = route.slice(route.indexOf("export async function DELETE"));
  assert.match(del, /status = 'draft'/);
  assert.match(del, /NOT EXISTS \(SELECT 1 FROM performance_record/);
  assert.match(del, /status: 409/);
});

test("PATCH guards the start year and reports a duplicate year as 409", () => {
  const patch = route.slice(
    route.indexOf("export async function PATCH"),
    route.indexOf("export async function DELETE"),
  );
  assert.match(patch, /startYearLockReason/);
  assert.match(patch, /ER_DUP_ENTRY/);
  assert.match(patch, /NOT EXISTS \(SELECT 1 FROM performance_record/);
});
