import assert from "node:assert/strict";
import test from "node:test";
import {
  monthLabel,
  monthShortLabel,
  normalizeCellInput,
  parseDate,
  parseMonth,
  currentBEYear,
  parseYearBE,
} from "../lib/kpi/cellFormats.ts";

test("a BE year is a 4-digit number between 2400 and 2999", () => {
  assert.equal(parseYearBE("2569"), 2569);
  assert.equal(parseYearBE(" 2400 "), 2400);
  assert.equal(parseYearBE(2999), 2999);
  for (const bad of ["69", "25690", "2569.5", "abc", "1899", "3000", ""]) {
    assert.throws(() => parseYearBE(bad), /4-digit BE year, e\.g\. 2569/, bad);
  }
});

test("a CE year is rejected with its BE year, never converted", () => {
  assert.throws(() => parseYearBE("2026"), /2026, which looks like a CE year — the BE year is 2569/);
  assert.throws(() => parseYearBE("2399"), /the BE year is 2942/);
  assert.throws(() => parseYearBE("1900"), /the BE year is 2443/);
});

test("currentBEYear is this year plus 543", () => {
  assert.equal(currentBEYear(new Date(2026, 10, 22)), 2569);
  assert.equal(currentBEYear(), new Date().getFullYear() + 543);
});

test("a month accepts numbers and English or Thai names", () => {
  assert.equal(parseMonth("3"), 3);
  assert.equal(parseMonth("03"), 3);
  assert.equal(parseMonth(12), 12);
  assert.equal(parseMonth("3.0"), 3);
  for (const s of ["March", "march", "Mar", "Mar.", " MAR ", "มีนาคม", "มี.ค.", "มีค"]) {
    assert.equal(parseMonth(s), 3, s);
  }
  assert.equal(parseMonth("Sept"), 9);
  assert.equal(parseMonth("ธ.ค."), 12);
  for (const bad of ["0", "13", "Marc", "1.5", "x"]) {
    assert.throws(() => parseMonth(bad), /month 1–12, e\.g\. 3 \(March\)/, bad);
  }
});

test("month labels", () => {
  assert.equal(monthLabel(3), "3 — March (มี.ค.)");
  assert.equal(monthShortLabel(11), "11 — Nov");
  assert.equal(monthShortLabel(13), "13");
});

test("a date accepts ISO and day-first slashes, dashes and dots", () => {
  assert.equal(parseDate("2026-03-15"), "2026-03-15");
  assert.equal(parseDate("2026-3-5"), "2026-03-05");
  assert.equal(parseDate("15/03/2026"), "2026-03-15");
  assert.equal(parseDate("5/3/2026"), "2026-03-05");
  assert.equal(parseDate("15-03-2026"), "2026-03-15");
  assert.equal(parseDate("15.03.2026"), "2026-03-15");
  // Day first, always: 03/04 is 3 April.
  assert.equal(parseDate("03/04/2026"), "2026-04-03");
});

test("an impossible date is rejected, leap years included", () => {
  assert.equal(parseDate("29/02/2024"), "2024-02-29");
  assert.throws(() => parseDate("29/02/2026"), /not a real date/);
  assert.throws(() => parseDate("31/04/2026"), /not a real date/);
  // A US-style month-first date fails instead of being misread.
  assert.throws(() => parseDate("03/15/2026"), /not a real date/);
  assert.throws(() => parseDate("2026-13-01"), /not a real date/);
});

test("a BE year inside a date is rejected with the CE version", () => {
  assert.throws(() => parseDate("15/03/2569"), /Buddhist-era year — write 15\/03\/2026/);
  assert.throws(() => parseDate("2569-03-15"), /write 15\/03\/2026/);
});

test("an Excel date serial is read; other junk is not", () => {
  assert.equal(parseDate("46096"), "2026-03-15");
  for (const bad of ["15 March 2026", "2026/03/15", "123", "", "15/03/26"]) {
    assert.throws(() => parseDate(bad), /must be a date like 2026-03-15 or 15\/03\/2026/, bad);
  }
});

test("normalizeCellInput shows what will be saved, and leaves bad input alone", () => {
  assert.equal(normalizeCellInput("date", "15/03/2026"), "2026-03-15");
  assert.equal(normalizeCellInput("month", "มี.ค."), "3");
  assert.equal(normalizeCellInput("year_be", " 2569 "), "2569");
  assert.equal(normalizeCellInput("date", "31/02/2026"), "31/02/2026");
  assert.equal(normalizeCellInput("year_be", "2026"), "2026");
  assert.equal(normalizeCellInput("text", "15/03/2026"), "15/03/2026");
  assert.equal(normalizeCellInput("date", ""), "");
});
