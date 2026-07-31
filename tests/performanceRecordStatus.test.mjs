import assert from "node:assert/strict";
import test from "node:test";
import {
  PERFORMANCE_RECORD_STATUSES,
  isActivePerformanceRecord,
  isPerformanceStatus,
} from "../lib/kpi/performanceRecordStatus.ts";

test("performance records use the active/inactive/completed lifecycle", () => {
  assert.deepEqual(PERFORMANCE_RECORD_STATUSES, ["active", "inactive", "completed"]);
  assert.equal(isPerformanceStatus("active"), true);
  assert.equal(isPerformanceStatus("inactive"), true);
  assert.equal(isPerformanceStatus("completed"), true);
  assert.equal(isPerformanceStatus("closed"), false);
  assert.equal(isPerformanceStatus("archived"), false);
  assert.equal(isPerformanceStatus(null), false);
});

test("only active performance records accept operational updates", () => {
  assert.equal(isActivePerformanceRecord("active"), true);
  assert.equal(isActivePerformanceRecord("inactive"), false);
  assert.equal(isActivePerformanceRecord("completed"), false);
});
