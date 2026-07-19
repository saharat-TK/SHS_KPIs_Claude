import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPerformancePeriodMatrix,
  firstOpenQuarter,
  isPeriodOpen,
  normalizePerformancePeriodInput,
  openPeriodSummary,
  openQuartersForYear,
  yearForYearNo,
  yearNoForYear,
} from "../lib/kpi/performancePeriods.ts";

test("yearForYearNo and yearNoForYear are inverses across the span", () => {
  assert.equal(yearForYearNo(2568, 1), 2568);
  assert.equal(yearForYearNo(2568, 5), 2572);
  assert.equal(yearNoForYear(2568, 2568), 1);
  assert.equal(yearNoForYear(2568, 2572), 5);
});

test("yearNoForYear returns null outside the five-year span", () => {
  assert.equal(yearNoForYear(2568, 2567), null);
  assert.equal(yearNoForYear(2568, 2573), null);
});

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

test("openQuartersForYear returns only that year's open quarters, ascending", () => {
  const periods = buildPerformancePeriodMatrix([
    { yearNo: 1, quarterNo: 3, isOpen: true },
    { yearNo: 1, quarterNo: 1, isOpen: true },
    { yearNo: 2, quarterNo: 1, isOpen: true },
  ]);

  assert.deepEqual(openQuartersForYear(periods, 1), [1, 3]);
  assert.deepEqual(openQuartersForYear(periods, 2), [1]);
  assert.deepEqual(openQuartersForYear(periods, 3), []);
});

test("firstOpenQuarter returns the lowest open quarter or null", () => {
  const periods = buildPerformancePeriodMatrix([
    { yearNo: 1, quarterNo: 3, isOpen: true },
    { yearNo: 1, quarterNo: 2, isOpen: true },
  ]);

  assert.equal(firstOpenQuarter(periods, 1), 2);
  assert.equal(firstOpenQuarter(periods, 5), null);
});

test("openPeriodSummary counts open periods over the full matrix", () => {
  const periods = buildPerformancePeriodMatrix([
    { yearNo: 1, quarterNo: 1, isOpen: true },
    { yearNo: 1, quarterNo: 2, isOpen: true },
    { yearNo: 2, quarterNo: 1, isOpen: true },
  ]);

  assert.deepEqual(openPeriodSummary(periods), { openCount: 3, total: 20 });
  assert.deepEqual(openPeriodSummary(buildPerformancePeriodMatrix([])), {
    openCount: 0,
    total: 20,
  });
});
