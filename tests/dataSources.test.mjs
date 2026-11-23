import assert from "node:assert/strict";
import test from "node:test";
import {
  coerceCellValue,
  countableEntries,
  describeEntryForConfirm,
  isEntryComplete,
  missingRequired,
  valuesForSubmit,
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

test("coerceCellValue takes dates in BE, stores them as CE ISO, and rejects CE years", () => {
  const c = col({ dataType: "date", label: "Recorded on" });
  assert.equal(coerceCellValue(c, "18/07/2569"), "2026-07-18");
  assert.equal(coerceCellValue(c, "2569-07-18"), "2026-07-18");
  assert.throws(() => coerceCellValue(c, "2569-13-40"), /"Recorded on" is 2569-13-40, which is not a real date/);
  assert.throws(() => coerceCellValue(c, "18/07/2026"), /"Recorded on" .*looks like a CE year — write 18\/07\/2569/);
  assert.throws(() => coerceCellValue(c, "July 18"), /"Recorded on" must be a date like 15\/03\/2569/);
});

test("formatCellValue shows a stored CE date in BE", () => {
  const c = col({ dataType: "date", label: "Recorded on" });
  assert.equal(formatCellValue(c, "2026-07-18"), "18/07/2569");
  assert.equal(formatCellValue(c, null), "—");
});

test("coerceCellValue validates Year (BE) and Month and stores numbers", () => {
  const y = col({ dataType: "year_be", label: "Publication year (BE)" });
  assert.equal(coerceCellValue(y, "2569"), 2569);
  assert.throws(() => coerceCellValue(y, "2026"), /"Publication year \(BE\)" is 2026, which looks like a CE year — the BE year is 2569/);
  assert.throws(() => coerceCellValue(y, "69"), /4-digit BE year, e\.g\. 2569/);
  const m = col({ dataType: "month", label: "Month" });
  assert.equal(coerceCellValue(m, "3"), 3);
  assert.equal(coerceCellValue(m, "มี.ค."), 3);
  assert.throws(() => coerceCellValue(m, "13"), /"Month" must be a month 1–12/);
});

test("coerceCellValue accepts HTTP(S) URLs and rejects unsafe or malformed URLs", () => {
  const c = col({ dataType: "url", label: "Evidence" });
  assert.equal(coerceCellValue(c, "https://example.com/report?q=1"), "https://example.com/report?q=1");
  assert.equal(coerceCellValue(c, " http://example.com "), "http://example.com");
  assert.throws(() => coerceCellValue(c, "ftp://example.com"), /valid HTTP or HTTPS URL/);
  assert.throws(() => coerceCellValue(c, "javascript:alert(1)"), /valid HTTP or HTTPS URL/);
  assert.throws(() => coerceCellValue(c, "not a URL"), /valid HTTP or HTTPS URL/);
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
  assert.throws(() => normalizeEntryPeriod("annual", null, null), /valid year/);
  assert.throws(() => normalizeEntryPeriod("annual", 12, null), /Year must be a 4-digit BE year/);
});

test("normalizeEntryPeriod takes a Buddhist-era year and rejects a CE one", () => {
  assert.deepEqual(normalizeEntryPeriod("quarterly", "2569", "1"), { year: 2569, quarter: 1 });
  assert.throws(
    () => normalizeEntryPeriod("quarterly", 2026, 1),
    /Year is 2026, which looks like a CE year — the BE year is 2569/,
  );
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

const entryOf = (values, year = 2569, quarter = 1) => ({ year, quarter, values });
const titleCol = col({ colKey: "title", label: "Title", dataType: "text" });

test("describeEntryForConfirm names an entry by its second-column value, quoted", () => {
  assert.equal(
    describeEntryForConfirm([titleCol], entryOf({ title: "  Deep   learning\nfor X " })),
    '"Deep learning for X"',
  );
});

test("describeEntryForConfirm cuts long values and formats dates in BE", () => {
  const long = "a".repeat(80);
  assert.equal(describeEntryForConfirm([titleCol], entryOf({ title: long })), `"${"a".repeat(60)}…"`);
  const dateCol = col({ colKey: "d", label: "Date", dataType: "date" });
  assert.equal(describeEntryForConfirm([dateCol], entryOf({ d: "2026-03-15" })), '"15/03/2569"');
});

test("describeEntryForConfirm falls back to the period when there is nothing to name", () => {
  assert.equal(describeEntryForConfirm([titleCol], entryOf({ title: null })), "2569 Q1");
  assert.equal(describeEntryForConfirm([titleCol], entryOf({ title: "   " }, 2569, null)), "2569");
  assert.equal(describeEntryForConfirm([], entryOf({})), "2569 Q1");
});

test("describeEntryForConfirm needs labels to name a derived-option column", () => {
  const program = col({ colKey: "program", label: "Program", dataType: "program" });
  const entry = entryOf({ program: "12" });
  assert.equal(describeEntryForConfirm([program], entry), "2569 Q1");
  assert.equal(describeEntryForConfirm([program], entry, { 12: "Nursing" }), '"Nursing"');
});

// ── Derived-option column types (faculty / program) ─────────────────────────

const facultyCol = (over = {}) =>
  col({ colKey: "owner", label: "Owner", dataType: "faculty", ...over });

const programCol = (over = {}) =>
  col({ colKey: "prog", label: "Program", dataType: "program", ...over });

test("faculty columns accept an id present in the resolved option set", () => {
  const c = facultyCol({ options: ["fac-001", "fac-002"] });
  assert.equal(coerceCellValue(c, "fac-002"), "fac-002");
});

test("faculty columns reject an id outside the roster, naming the source", () => {
  const c = facultyCol({ options: ["fac-001", "fac-002"] });
  assert.throws(
    () => coerceCellValue(c, "fac-999"),
    /"Owner": "fac-999" is not a valid choice\. Options come from the faculty roster/,
  );
});

test("faculty columns accept anything when options were not resolved", () => {
  // Guards the ordering contract: if resolveColumnOptions is ever skipped we fall
  // open rather than rejecting every write.
  assert.equal(coerceCellValue(facultyCol(), "fac-123"), "fac-123");
});

test("program columns validate against the five program codes", () => {
  const c = programCol({ options: ["PH", "SHS", "OHS", "EnvH", "BM"] });
  assert.equal(coerceCellValue(c, "EnvH"), "EnvH");
  assert.throws(
    () => coerceCellValue(c, "BioMed"),
    /"Program": "BioMed" is not a valid choice\. Options are the academic programs in the catalog/,
  );
});

test("validateEntryValues enforces required on derived types", () => {
  const columns = [facultyCol({ isRequired: true, options: ["fac-001"] })];
  assert.throws(() => validateEntryValues(columns, {}), /"Owner" is required/);
  assert.deepEqual(validateEntryValues(columns, { owner: "fac-001" }), {
    owner: "fac-001",
  });
});

test("formatCellValue resolves derived codes through the supplied label map", () => {
  const labels = {
    PH: "สาขาวิชาสาธารณสุขศาสตร์",
    "fac-002": "ผศ.ดร.จงกล สายสิงห์",
  };
  assert.equal(formatCellValue(programCol(), "PH", labels), "สาขาวิชาสาธารณสุขศาสตร์");
  assert.equal(formatCellValue(facultyCol(), "fac-002", labels), "ผศ.ดร.จงกล สายสิงห์");
});

test("formatCellValue falls back to the raw value when a lookup misses", () => {
  // A person who left the roster must not make historical rows unreadable.
  assert.equal(formatCellValue(facultyCol(), "fac-999", {}), "fac-999");
  assert.equal(formatCellValue(facultyCol(), "fac-999"), "fac-999");
  assert.equal(formatCellValue(programCol(), "LEGACY", {}), "LEGACY");
  // Blank is still blank, not a stray code.
  assert.equal(formatCellValue(facultyCol(), null, {}), "—");
});

test("formatCellValue leaves non-derived types alone", () => {
  const labels = { "12": "should not be used" };
  assert.equal(formatCellValue(col(), 12, labels), "12");
});

test("validateEntryValues can accept an empty required value when asked", () => {
  const columns = [
    col({ isRequired: true }),
    col({ colKey: "seen_on", label: "Seen on", dataType: "date" }),
  ];
  assert.throws(() => validateEntryValues(columns, {}), /"Count" is required/);
  assert.deepEqual(validateEntryValues(columns, {}, { allowIncomplete: true }), {
    count: null,
    seen_on: null,
  });
  // The opt-in covers empty required cells only; a wrong value still fails.
  assert.throws(
    () => validateEntryValues(columns, { seen_on: "2026-03-15" }, { allowIncomplete: true }),
    /Buddhist|CE year|not a real date|Seen on/,
  );
  assert.throws(
    () => validateEntryValues(columns, { nope: 1 }, { allowIncomplete: true }),
    /Unknown column "nope"/,
  );
});

test("an entry is incomplete while a required column is empty", () => {
  const columns = [
    col({ colKey: "title", label: "Title", dataType: "text", isRequired: true }),
    col({ colKey: "count", label: "Count", isRequired: true }),
    col({ colKey: "note", label: "Remark", dataType: "text" }),
  ];
  assert.deepEqual(missingRequired(columns, { title: "A", count: 3 }), []);
  assert.deepEqual(missingRequired(columns, { title: null, count: 3 }), ["Title"]);
  // A key the row never stored counts as empty (a column made required later).
  assert.deepEqual(missingRequired(columns, { title: "A" }), ["Count"]);
  // Zero and false are values, not gaps.
  assert.equal(isEntryComplete(columns, { title: "A", count: 0 }), true);
  assert.equal(isEntryComplete(columns, { title: null, count: 1 }), false);
});

test("countableEntries holds flagged rows back from KPI calculations", () => {
  const rows = [
    { id: 1, isIncomplete: false },
    { id: 2, isIncomplete: true },
    { id: 3 },
  ];
  assert.deepEqual(
    countableEntries(rows).map((r) => r.id),
    [1, 3],
  );
});

test("a required column added later does not flag rows recorded before it", () => {
  // Incompleteness is a stored flag, decided when a row is written. A row that
  // lacks a now-required value is still counted until someone saves it flagged.
  const columns = [col({ colKey: "date", label: "Date", dataType: "date", isRequired: true })];
  const legacy = { id: 9, values: {}, isIncomplete: false };
  assert.deepEqual(missingRequired(columns, legacy.values), ["Date"]);
  assert.deepEqual(countableEntries([legacy]).map((r) => r.id), [9]);
});

test("valuesForSubmit hands dates back in BE so the API accepts what the preview held", () => {
  const columns = [
    col({ colKey: "seen_on", label: "Seen on", dataType: "date" }),
    col({ isRequired: true }),
  ];
  const parsed = { seen_on: coerceCellValue(columns[0], "15/03/2569"), count: 3 };
  assert.equal(parsed.seen_on, "2026-03-15"); // the preview holds stored CE
  // Sending that CE string straight back is refused...
  assert.throws(() => validateEntryValues(columns, parsed), /CE year/);
  // ...the submit form round-trips to the same stored value.
  assert.deepEqual(validateEntryValues(columns, valuesForSubmit(columns, parsed)), parsed);
  // Empty dates and other types pass through untouched.
  assert.deepEqual(valuesForSubmit(columns, { seen_on: null, count: 3 }), { seen_on: null, count: 3 });
});
