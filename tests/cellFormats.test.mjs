import assert from "node:assert/strict";
import test from "node:test";
import {
  monthLabel,
  monthShortLabel,
  normalizeCellInput,
  parseDate,
  parseMonth,
  parseYearCE,
} from "../lib/kpi/cellFormats.ts";

test("a CE year is a 4-digit number between 1900 and 2399", () => {
  assert.equal(parseYearCE("2026"), 2026);
  assert.equal(parseYearCE(" 1900 "), 1900);
  assert.equal(parseYearCE(2399), 2399);
  for (const bad of ["26", "20266", "2026.5", "abc", "1899", ""]) {
    assert.throws(() => parseYearCE(bad), /4-digit CE year, e\.g\. 2026/, bad);
  }
});

test("a BE year is rejected with its CE year, never converted", () => {
  assert.throws(() => parseYearCE("2569"), /2569, which looks like a Buddhist-era year — the CE year is 2026/);
  assert.throws(() => parseYearCE("2400"), /the CE year is 1857/);
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
  assert.equal(normalizeCellInput("year_ce", " 2026 "), "2026");
  assert.equal(normalizeCellInput("date", "31/02/2026"), "31/02/2026");
  assert.equal(normalizeCellInput("year_ce", "2569"), "2569");
  assert.equal(normalizeCellInput("text", "15/03/2026"), "15/03/2026");
  assert.equal(normalizeCellInput("date", ""), "");
});
