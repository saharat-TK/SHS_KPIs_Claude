import assert from "node:assert/strict";
import test from "node:test";
import { describeKpiDeletion } from "../lib/kpi/deletion.ts";

test("a leaf KPI has no sub-KPI clause", () => {
  const msg = describeKpiDeletion("Clinical Placement Rate", 0);
  assert.ok(!msg.includes("sub-KPI"));
  assert.match(msg, /annual targets will be removed/);
});

test("one sub-KPI reads as singular", () => {
  assert.match(describeKpiDeletion("X", 1), /Its 1 sub-KPI and all annual targets/);
});

test("several sub-KPIs read as plural", () => {
  assert.match(describeKpiDeletion("X", 8), /Its 8 sub-KPIs and all annual targets/);
});

test("the name appears verbatim in quotes", () => {
  assert.ok(describeKpiDeletion("Clinical Placement Rate", 2).includes('"Clinical Placement Rate"'));
});

// Most KPIs in this system are named in Thai; the copy must not mangle them.
test("a Thai name survives intact", () => {
  const name = "K2-1 สัดส่วนผลงานวิจัยที่ได้รับการตีพิมพ์";
  assert.ok(describeKpiDeletion(name, 8).includes(`"${name}"`));
});

// The reassuring half matters as much as the warning: closed records are never
// pruned by syncActiveRecordsForSet, so their history genuinely survives.
test("every variant promises closed records keep their history", () => {
  for (const n of [0, 1, 8]) {
    assert.match(describeKpiDeletion("X", n), /Closed records keep their history/);
  }
});

test("every variant warns the action is irreversible", () => {
  for (const n of [0, 1, 8]) {
    assert.match(describeKpiDeletion("X", n), /can't be undone/);
  }
});
