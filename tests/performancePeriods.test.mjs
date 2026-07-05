import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPerformancePeriodMatrix,
  isPeriodOpen,
  normalizePerformancePeriodInput,
} from "../lib/kpi/performancePeriods.ts";

test("buildPerformancePeriodMatrix returns twenty closed periods by default", () => {
  const periods = buildPerformancePeriodMatrix([]);

  assert.equal(periods.length, 20);
  assert.deepEqual(periods[0], { yearNo: 1, quarterNo: 1, isOpen: false });
  assert.deepEqual(periods[19], { yearNo: 5, quarterNo: 4, isOpen: false });
  assert.equal(isPeriodOpen(periods, 1, 1), false);
});

test("buildPerformancePeriodMatrix preserves stored open periods", () => {
  const periods = buildPerformancePeriodMatrix([
    { yearNo: 2, quarterNo: 3, isOpen: 1 },
    { yearNo: 4, quarterNo: 1, isOpen: true },
  ]);

  assert.equal(isPeriodOpen(periods, 2, 3), true);
  assert.equal(isPeriodOpen(periods, 4, 1), true);
  assert.equal(isPeriodOpen(periods, 2, 4), false);
});

test("normalizePerformancePeriodInput accepts exactly valid year-quarter periods", () => {
  const input = [
    { yearNo: "1", quarterNo: "1", isOpen: true },
    { yearNo: 5, quarterNo: 4, isOpen: 0 },
  ];

  assert.deepEqual(normalizePerformancePeriodInput(input), [
    { yearNo: 1, quarterNo: 1, isOpen: true },
    { yearNo: 5, quarterNo: 4, isOpen: false },
  ]);
});

test("normalizePerformancePeriodInput rejects invalid period coordinates", () => {
  assert.throws(
    () => normalizePerformancePeriodInput([{ yearNo: 6, quarterNo: 1, isOpen: true }]),
    /Invalid yearNo\/quarterNo/,
  );
});
