import assert from "node:assert/strict";
import test from "node:test";
import {
  coerceCellValue,
  formatCellValue,
  formatEntryPeriod,
  normalizeEntryPeriod,
  slugifyColumnKey,
  uniqueColumnKey,
  validateEntryValues,
} from "../lib/kpi/dataSources.ts";

const col = (over = {}) => ({
  colKey: "count",
  label: "Count",
  dataType: "number",
  isRequired: false,
  options: null,
  ...over,
});

test("slugifyColumnKey produces a stable snake_case key", () => {
  assert.equal(slugifyColumnKey("Student Count"), "student_count");
  assert.equal(slugifyColumnKey("  Graduates (2568) "), "graduates_2568");
  assert.equal(slugifyColumnKey(""), "column");
});

test("slugifyColumnKey prefixes keys that would not start with a letter", () => {
  assert.equal(slugifyColumnKey("2568 intake"), "c_2568_intake");
  assert.equal(slugifyColumnKey("จำนวน"), "column");
});

test("uniqueColumnKey suffixes collisions and respects the 40-char limit", () => {
  assert.equal(uniqueColumnKey("count", []), "count");
  assert.equal(uniqueColumnKey("count", ["count"]), "count_2");
  assert.equal(uniqueColumnKey("count", ["count", "count_2"]), "count_3");

  const long = "a".repeat(40);
  const result = uniqueColumnKey(long, [long]);
  assert.equal(result.length, 40);
  assert.equal(result.endsWith("_2"), true);
});

test("coerceCellValue treats empty input as null", () => {
  assert.equal(coerceCellValue(col(), ""), null);
  assert.equal(coerceCellValue(col(), null), null);
  assert.equal(coerceCellValue(col(), undefined), null);
});

test("coerceCellValue parses numbers and rejects non-numeric input", () => {
  assert.equal(coerceCellValue(col(), "42"), 42);
  assert.equal(coerceCellValue(col(), 7.5), 7.5);
  assert.throws(() => coerceCellValue(col(), "twelve"), /"Count" must be a number/);
  assert.throws(() => coerceCellValue(col(), "Infinity"), /must be a number/);
});

test("coerceCellValue accepts the usual boolean spellings", () => {
  const c = col({ dataType: "boolean", label: "Passed" });
  assert.equal(coerceCellValue(c, true), true);
  assert.equal(coerceCellValue(c, "false"), false);
  assert.equal(coerceCellValue(c, "1"), true);
  assert.equal(coerceCellValue(c, 0), false);
  assert.throws(() => coerceCellValue(c, "maybe"), /"Passed" must be true or false/);
});

test("coerceCellValue requires ISO dates", () => {
  const c = col({ dataType: "date", label: "Recorded on" });
  assert.equal(coerceCellValue(c, "2026-07-18"), "2026-07-18");
  assert.throws(() => coerceCellValue(c, "18/07/2026"), /YYYY-MM-DD/);
  assert.throws(() => coerceCellValue(c, "2026-13-40"), /YYYY-MM-DD/);
});

test("coerceCellValue constrains select columns to their options", () => {
  const c = col({ dataType: "select", label: "Program", options: ["BSc", "MSc"] });
  assert.equal(coerceCellValue(c, "MSc"), "MSc");
  assert.throws(() => coerceCellValue(c, "PhD"), /must be one of: BSc, MSc/);

  // No options configured yet => any string passes.
  const open = col({ dataType: "select", label: "Program", options: [] });
  assert.equal(coerceCellValue(open, "PhD"), "PhD");
});

test("validateEntryValues coerces every column and fills missing ones with null", () => {
  const columns = [
    col({ colKey: "count", dataType: "number" }),
    col({ colKey: "program", label: "Program", dataType: "text" }),
  ];

  assert.deepEqual(validateEntryValues(columns, { count: "12" }), {
    count: 12,
    program: null,
  });
});

test("validateEntryValues rejects unknown columns", () => {
  assert.throws(
    () => validateEntryValues([col()], { count: 1, bogus: "x" }),
    /Unknown column "bogus"/,
  );
});

test("validateEntryValues enforces required columns", () => {
  const columns = [col({ isRequired: true })];
  assert.throws(() => validateEntryValues(columns, {}), /"Count" is required/);
  assert.throws(() => validateEntryValues(columns, { count: "" }), /"Count" is required/);
  assert.deepEqual(validateEntryValues(columns, { count: 0 }), { count: 0 });
});

test("normalizeEntryPeriod requires a quarter for quarterly sources", () => {
  assert.deepEqual(normalizeEntryPeriod("quarterly", 2568, 3), {
    year: 2568,
    quarter: 3,
  });
  assert.deepEqual(normalizeEntryPeriod("quarterly", "2568", "1"), {
    year: 2568,
    quarter: 1,
  });
  assert.throws(() => normalizeEntryPeriod("quarterly", 2568, null), /quarter between 1 and 4/);
  assert.throws(() => normalizeEntryPeriod("quarterly", 2568, 5), /quarter between 1 and 4/);
});

test("normalizeEntryPeriod forbids a quarter on annual sources", () => {
  assert.deepEqual(normalizeEntryPeriod("annual", 2568, null), {
    year: 2568,
    quarter: null,
  });
  assert.deepEqual(normalizeEntryPeriod("annual", 2568, ""), {
    year: 2568,
    quarter: null,
  });
  assert.throws(
    () => normalizeEntryPeriod("annual", 2568, 2),
    /does not take a quarter/,
  );
});

test("normalizeEntryPeriod rejects implausible years", () => {
  assert.throws(() => normalizeEntryPeriod("annual", "", null), /valid year/);
  assert.throws(() => normalizeEntryPeriod("annual", 12, null), /valid year/);
});

test("formatCellValue renders booleans and blanks readably", () => {
  assert.equal(formatCellValue(col({ dataType: "boolean" }), true), "Yes");
  assert.equal(formatCellValue(col({ dataType: "boolean" }), false), "No");
  assert.equal(formatCellValue(col(), null), "—");
  assert.equal(formatCellValue(col(), 0), "0");
});

test("formatEntryPeriod omits the quarter for annual entries", () => {
  assert.equal(formatEntryPeriod(2568, 3), "2568 Q3");
  assert.equal(formatEntryPeriod(2568, null), "2568");
});
