import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  addMonths,
  daysInMonth,
  isoOf,
  monthGrid,
  partsOfIso,
  shiftMonth,
  todayParts,
} from "../lib/kpi/calendar.ts";

const days = (weeks) => weeks.flat().filter(Boolean);

test("monthGrid lays March 2569 (March 2026) out Sunday-first", () => {
  const weeks = monthGrid(2569, 3);
  // 1 March 2026 is a Sunday, so the first row starts on day 1 with no padding.
  assert.equal(weeks[0][0].day, 1);
  assert.equal(weeks[0][0].iso, "2026-03-01");
  assert.equal(days(weeks).length, 31);
  assert.equal(days(weeks).at(-1).iso, "2026-03-31");
  assert.ok(weeks.every((w) => w.length === 7));
});

test("monthGrid pads the first week when the month starts mid-week", () => {
  // 1 April 2026 is a Wednesday: three empty cells first.
  const weeks = monthGrid(2569, 4);
  assert.deepEqual(weeks[0].slice(0, 3), [null, null, null]);
  assert.equal(weeks[0][3].iso, "2026-04-01");
  assert.equal(days(weeks).length, 30);
});

test("daysInMonth knows leap Februaries in BE years", () => {
  assert.equal(daysInMonth(2567, 2), 29); // 2024
  assert.equal(daysInMonth(2569, 2), 28); // 2026
  assert.equal(daysInMonth(2543, 2), 29); // 2000, divisible by 400
  assert.equal(daysInMonth(2643, 2), 28); // 2100, divisible by 100 only
});

test("isoOf stores the CE year with zero padding", () => {
  assert.equal(isoOf(2569, 3, 5), "2026-03-05");
});

test("shiftMonth wraps across years in both directions", () => {
  assert.deepEqual(shiftMonth(2569, 12, 1), { beYear: 2570, month: 1 });
  assert.deepEqual(shiftMonth(2569, 1, -1), { beYear: 2568, month: 12 });
  assert.deepEqual(shiftMonth(2569, 3, 0), { beYear: 2569, month: 3 });
  assert.deepEqual(shiftMonth(2569, 3, -15), { beYear: 2567, month: 12 });
});

test("todayParts reads the local calendar in the Buddhist era", () => {
  assert.deepEqual(todayParts(new Date(2026, 2, 15)), { beYear: 2569, month: 3, day: 15 });
});

test("partsOfIso reads a stored date back as BE parts, rejecting anything else", () => {
  assert.deepEqual(partsOfIso("2026-03-15"), { beYear: 2569, month: 3, day: 15 });
  assert.equal(partsOfIso("2026-02-30"), null);
  assert.equal(partsOfIso("15/03/2569"), null);
  assert.equal(partsOfIso(""), null);
});

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-03-31", 1), "2026-04-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2026-03-15", 7), "2026-03-22");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
});

test("addMonths clamps to the last day of a shorter month", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2026-03-15", -3), "2025-12-15");
  assert.equal(addMonths("2026-12-10", 1), "2027-01-10");
});
