import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPerformancePeriodMatrix,
  entriesInWindow,
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

// ── entriesInWindow (decision D5) ───────────────────────────────────────────
//
// The rule behind every fed number: which raw rows count toward one quarter.
// A bug here would not fail, it would quietly attribute data to the wrong
// quarter — so each clause of the rule gets its own case.

const E = (year, quarter, id) => ({ id, year, quarter });

// startYear 2565, so yearNo 1 = 2565, yearNo 2 = 2566.
const ROWS = [
  E(2565, 1, "y1q1"),
  E(2565, 2, "y1q2"),
  E(2565, 3, "y1q3"),
  E(2565, null, "y1annual"),
  E(2566, 1, "y2q1"),
  E(2564, 4, "before"),
];
const ids = (rows) => rows.map((r) => r.id);

test("entriesInWindow accumulates within the year", () => {
  // Q2 sees Q1 and Q2, never Q3 — the quarterly value is cumulative.
  assert.deepEqual(ids(entriesInWindow(ROWS, 2565, 1, 2)), ["y1q1", "y1q2", "y1annual"]);
  assert.deepEqual(ids(entriesInWindow(ROWS, 2565, 1, 1)), ["y1q1", "y1annual"]);
});

test("entriesInWindow counts an annual entry from Q1 onward", () => {
  // No quarter means "the whole year", so it lands in every quarter of it.
  for (const q of [1, 2, 3, 4]) {
    assert.equal(
      ids(entriesInWindow(ROWS, 2565, 1, q)).includes("y1annual"),
      true,
      `Q${q}`,
    );
  }
});

test("entriesInWindow returns the whole year at Q4", () => {
  assert.deepEqual(ids(entriesInWindow(ROWS, 2565, 1, 4)), [
    "y1q1",
    "y1q2",
    "y1q3",
    "y1annual",
  ]);
});

test("entriesInWindow excludes the years either side", () => {
  // 2564 predates the record; 2566 belongs to yearNo 2, not yearNo 1.
  const out = ids(entriesInWindow(ROWS, 2565, 1, 4));
  assert.equal(out.includes("before"), false);
  assert.equal(out.includes("y2q1"), false);
});

test("entriesInWindow maps yearNo through startYear", () => {
  // yearNo 2 of a 2565 record is calendar 2566 — the same arithmetic
  // yearForYearNo does, which is why they live together.
  assert.deepEqual(ids(entriesInWindow(ROWS, 2565, 2, 4)), ["y2q1"]);
  // The same rows read against a 2564 record shift by one year.
  assert.deepEqual(ids(entriesInWindow(ROWS, 2564, 2, 4)), [
    "y1q1",
    "y1q2",
    "y1q3",
    "y1annual",
  ]);
});

test("entriesInWindow returns empty for no rows or an empty year", () => {
  assert.deepEqual(entriesInWindow([], 2565, 1, 4), []);
  // yearNo 5 = 2569, which nothing in ROWS belongs to.
  assert.deepEqual(entriesInWindow(ROWS, 2565, 5, 4), []);
});
