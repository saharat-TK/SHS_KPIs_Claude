import assert from "node:assert/strict";
import test from "node:test";
import {
  PERIOD_FIELD,
  aggregate,
  describeMapping,
  matchesFilters,
  operatorsFor,
  periodOrdinal,
  validateMappings,
} from "../lib/kpi/dataSourceFilters.ts";

const COLUMNS = [
  { colKey: "quartile", label: "Quartile", dataType: "select", options: ["Q1", "Q2"] },
  { colKey: "citations", label: "Citations", dataType: "number" },
  { colKey: "reviews", label: "Reviews", dataType: "number" },
  { colKey: "pub_date", label: "Published", dataType: "date" },
  { colKey: "author", label: "Author", dataType: "faculty" },
  { colKey: "title", label: "Title", dataType: "text" },
];

const entry = (over = {}) => ({
  id: 1,
  year: 2568,
  quarter: 1,
  values: { quartile: "Q1", citations: 10, pub_date: "2568-03-15", author: "fac-002", title: "A" },
  ...over,
});

const F = (field, operator, value, valueTo) => ({ field, operator, value, valueTo });

// ── operators offered ───────────────────────────────────────────────────────

test("operatorsFor is minimal and type-appropriate", () => {
  assert.deepEqual(operatorsFor("number"), ["eq", "gte", "lte", "between"]);
  assert.deepEqual(operatorsFor("date"), ["between"]);
  // Choice-like columns get "is any of"; free text and booleans do not.
  assert.deepEqual(operatorsFor("select"), ["eq", "in"]);
  assert.deepEqual(operatorsFor("faculty"), ["eq", "in"]);
  assert.deepEqual(operatorsFor("program"), ["eq", "in"]);
  assert.deepEqual(operatorsFor("text"), ["eq"]);
  assert.deepEqual(operatorsFor("boolean"), ["eq"]);
});

// ── matching ────────────────────────────────────────────────────────────────

test("eq matches on choice, faculty code and text", () => {
  assert.equal(matchesFilters(entry(), COLUMNS, [F("quartile", "eq", "Q1")]), true);
  assert.equal(matchesFilters(entry(), COLUMNS, [F("quartile", "eq", "Q2")]), false);
  // Faculty filters compare the stored code, not the display name.
  assert.equal(matchesFilters(entry(), COLUMNS, [F("author", "eq", "fac-002")]), true);
  assert.equal(matchesFilters(entry(), COLUMNS, [F("author", "eq", "fac-001")]), false);
});

test("numeric comparisons work, including string operands", () => {
  assert.equal(matchesFilters(entry(), COLUMNS, [F("citations", "gte", 10)]), true);
  assert.equal(matchesFilters(entry(), COLUMNS, [F("citations", "gte", "11")]), false);
  assert.equal(matchesFilters(entry(), COLUMNS, [F("citations", "lte", 10)]), true);
  assert.equal(matchesFilters(entry(), COLUMNS, [F("citations", "eq", 10)]), true);
});

test("between is inclusive at both bounds", () => {
  const at = (n) => entry({ values: { ...entry().values, citations: n } });
  assert.equal(matchesFilters(at(5), COLUMNS, [F("citations", "between", 5, 10)]), true);
  assert.equal(matchesFilters(at(10), COLUMNS, [F("citations", "between", 5, 10)]), true);
  assert.equal(matchesFilters(at(4), COLUMNS, [F("citations", "between", 5, 10)]), false);
  assert.equal(matchesFilters(at(11), COLUMNS, [F("citations", "between", 5, 10)]), false);
});

test("date ranges compare chronologically and are inclusive", () => {
  const on = (d) => entry({ values: { ...entry().values, pub_date: d } });
  const range = F("pub_date", "between", "2568-01-01", "2568-12-31");
  assert.equal(matchesFilters(on("2568-01-01"), COLUMNS, [range]), true);
  assert.equal(matchesFilters(on("2568-12-31"), COLUMNS, [range]), true);
  assert.equal(matchesFilters(on("2569-01-01"), COLUMNS, [range]), false);
  assert.equal(matchesFilters(on("2567-12-31"), COLUMNS, [range]), false);
});

test("a blank cell never matches", () => {
  const blank = entry({ values: { ...entry().values, quartile: null, citations: null } });
  assert.equal(matchesFilters(blank, COLUMNS, [F("quartile", "eq", "Q1")]), false);
  assert.equal(matchesFilters(blank, COLUMNS, [F("citations", "gte", 0)]), false);
});

test("a filter on a deleted column matches nothing rather than widening", () => {
  assert.equal(matchesFilters(entry(), COLUMNS, [F("gone", "eq", "x")]), false);
});

test("multiple filters are ANDed", () => {
  const both = [F("quartile", "eq", "Q1"), F("citations", "gte", 5)];
  assert.equal(matchesFilters(entry(), COLUMNS, both), true);
  const one = [F("quartile", "eq", "Q1"), F("citations", "gte", 50)];
  assert.equal(matchesFilters(entry(), COLUMNS, one), false);
  // No filters = everything matches.
  assert.equal(matchesFilters(entry(), COLUMNS, []), true);
});

// ── "is any of" (OR within one field) ───────────────────────────────────────

const IN = (field, values) => ({ field, operator: "in", values });

test("in matches when the cell is any of the listed values", () => {
  const q1 = entry();
  const q2 = entry({ values: { ...entry().values, quartile: "Q2" } });
  const both = IN("quartile", ["Q1", "Q2"]);
  assert.equal(matchesFilters(q1, COLUMNS, [both]), true);
  assert.equal(matchesFilters(q2, COLUMNS, [both]), true);
});

test("in rejects a cell outside the list", () => {
  const q2 = entry({ values: { ...entry().values, quartile: "Q2" } });
  assert.equal(matchesFilters(q2, COLUMNS, [IN("quartile", ["Q1"])]), false);
});

test("in compares faculty codes, not display names", () => {
  const e = entry();
  assert.equal(matchesFilters(e, COLUMNS, [IN("author", ["fac-002", "fac-009"])]), true);
  assert.equal(matchesFilters(e, COLUMNS, [IN("author", ["fac-001", "fac-003"])]), false);
});

test("a blank cell never matches in, and an empty list matches nothing", () => {
  const blank = entry({ values: { ...entry().values, quartile: null } });
  assert.equal(matchesFilters(blank, COLUMNS, [IN("quartile", ["Q1"])]), false);
  // Guard only — validateMappings rejects an empty list before it can be stored.
  assert.equal(matchesFilters(entry(), COLUMNS, [IN("quartile", [])]), false);
});

test("in still ANDs with conditions on other fields", () => {
  const both = [IN("quartile", ["Q1", "Q2"]), F("citations", "gte", 50)];
  assert.equal(matchesFilters(entry(), COLUMNS, both), false);
});

// ── period pseudo-field ─────────────────────────────────────────────────────

test("periodOrdinal orders across a year boundary", () => {
  assert.equal(periodOrdinal(2568, 4) < periodOrdinal(2569, 1), true);
  assert.equal(periodOrdinal(2568, 1) < periodOrdinal(2568, 2), true);
  // An annual entry sorts as Q1 of its year.
  assert.equal(periodOrdinal(2568, null), periodOrdinal(2568, 1));
});

test("period filters bound the entry's own year/quarter", () => {
  const at = (y, q) => entry({ year: y, quarter: q });
  const range = F(PERIOD_FIELD, "between", "2568-2", "2569-1");
  assert.equal(matchesFilters(at(2568, 2), COLUMNS, [range]), true);
  assert.equal(matchesFilters(at(2569, 1), COLUMNS, [range]), true);
  assert.equal(matchesFilters(at(2568, 1), COLUMNS, [range]), false);
  assert.equal(matchesFilters(at(2569, 2), COLUMNS, [range]), false);
});

// ── aggregation ─────────────────────────────────────────────────────────────

test("count ignores the column and treats zero rows as a real zero", () => {
  assert.equal(aggregate("count", null, [entry(), entry()]), 2);
  assert.equal(aggregate("count", null, []), 0);
});

test("sum and avg skip blank cells and return null when nothing is usable", () => {
  const rows = [
    entry({ id: 1, values: { citations: 10 } }),
    entry({ id: 2, values: { citations: 20 } }),
    entry({ id: 3, values: { citations: null } }),
  ];
  assert.equal(aggregate("sum", "citations", rows), 30);
  assert.equal(aggregate("avg", "citations", rows), 15);
  // Nothing recorded is "—", not a misleading 0.
  assert.equal(aggregate("sum", "citations", []), null);
  assert.equal(aggregate("avg", "citations", [entry({ values: { citations: null } })]), null);
});

test("latest takes the newest period, breaking ties by id", () => {
  const rows = [
    entry({ id: 1, year: 2568, quarter: 1, values: { citations: 5 } }),
    entry({ id: 2, year: 2568, quarter: 3, values: { citations: 9 } }),
    entry({ id: 3, year: 2568, quarter: 3, values: { citations: 7 } }),
    entry({ id: 4, year: 2567, quarter: 4, values: { citations: 99 } }),
  ];
  assert.equal(aggregate("latest", "citations", rows), 7);
  assert.equal(aggregate("latest", "citations", []), null);
});

// ── proportions ─────────────────────────────────────────────────────────────

// A population of 4, of which 1 is in the numerator.
const POP = [
  entry({ id: 1, values: { quartile: "Q1", citations: 10 } }),
  entry({ id: 2, values: { quartile: "Q2", citations: 20 } }),
  entry({ id: 3, values: { quartile: "Q2", citations: 30 } }),
  entry({ id: 4, values: { quartile: "Q2", citations: 40 } }),
];
const NUM = [POP[0]];

test("percent_of and ratio_of compare row counts when given no column", () => {
  assert.equal(aggregate("percent_of", null, POP, { numerator: NUM }), 25);
  assert.equal(aggregate("ratio_of", null, POP, { numerator: NUM }), 0.25);
});

test("percent_of is exactly ratio_of × 100 on the same rows", () => {
  assert.equal(
    aggregate("percent_of", null, POP, { numerator: NUM }),
    aggregate("ratio_of", null, POP, { numerator: NUM }) * 100,
  );
  assert.equal(
    aggregate("percent_of", "citations", POP, { numerator: NUM }),
    aggregate("ratio_of", "citations", POP, { numerator: NUM }) * 100,
  );
});

test("a column switches the proportion from row counts to that column's totals", () => {
  // 10 of (10+20+30+40) — deliberately different from the 25% by row count.
  assert.equal(aggregate("percent_of", "citations", POP, { numerator: NUM }), 10);
  assert.equal(aggregate("ratio_of", "citations", POP, { numerator: NUM }), 0.1);
});

test("a proportion with nothing to divide by is null, not zero", () => {
  // Empty population.
  assert.equal(aggregate("percent_of", null, [], { numerator: [] }), null);
  // Column present but summing to zero.
  const zeros = [entry({ id: 1, values: { citations: 0 } })];
  assert.equal(aggregate("percent_of", "citations", zeros, { numerator: zeros }), null);
  // No numerator supplied at all — the caller didn't narrow anything.
  assert.equal(aggregate("percent_of", null, POP), null);
});

test("a numerator equal to its population is 100 percent", () => {
  // Documents the case validateMappings rejects at save time.
  assert.equal(aggregate("percent_of", null, POP, { numerator: POP }), 100);
  assert.equal(aggregate("ratio_of", null, POP, { numerator: POP }), 1);
});

test("a fixed denominator divides the matched rows by a headcount", () => {
  // POP is the numerator outright here — the mapping's filters selected it.
  assert.equal(aggregate("ratio_of", null, POP, { denominator: 8 }), 0.5);
  assert.equal(aggregate("percent_of", null, POP, { denominator: 8 }), 50);
  // With a column it divides that column's total instead of the row count.
  assert.equal(aggregate("ratio_of", "citations", POP, { denominator: 10 }), 10);
});

test("a fixed denominator of zero or null is null, not a division by zero", () => {
  assert.equal(aggregate("ratio_of", null, POP, { denominator: 0 }), null);
  assert.equal(aggregate("ratio_of", null, POP, { denominator: null }), null);
});

test("a fixed denominator wins over a numerator subset", () => {
  // Guard: the two are mutually exclusive, and faculty-mode never sets numerator.
  assert.equal(aggregate("ratio_of", null, POP, { denominator: 8, numerator: NUM }), 0.5);
});

// Both sides of the fraction as two number columns of the SAME row — the
// "96 employed of 120 graduates" shape, which narrowing rows cannot express.
const TWO_COL = [
  entry({ id: 1, values: { quartile: "Q1", citations: 120, reviews: 96 } }),
  entry({ id: 2, values: { quartile: "Q2", citations: 80, reviews: 20 } }),
];

test("a numerator column totals the top on a different column from the bottom", () => {
  const one = [TWO_COL[0]];
  assert.equal(
    aggregate("percent_of", "citations", one, { numerator: one, numeratorColumnKey: "reviews" }),
    80,
  );
  assert.equal(
    aggregate("ratio_of", "citations", one, { numerator: one, numeratorColumnKey: "reviews" }),
    0.8,
  );
});

test("a numerator column composes with a narrowed numerator subset", () => {
  // 96 (row 1's reviews) of 200 (both rows' citations) — the subset narrows the
  // rows, the column switches what is totalled over them.
  assert.equal(
    aggregate("percent_of", "citations", TWO_COL, {
      numerator: [TWO_COL[0]],
      numeratorColumnKey: "reviews",
    }),
    48,
  );
});

test("two independent columns carry no ceiling of 100 percent", () => {
  const one = [TWO_COL[0]];
  // 120 of 96. Unlike the single-column case, the two sides are unrelated
  // quantities, so this is real data rather than something to clamp.
  assert.equal(
    aggregate("percent_of", "reviews", one, { numerator: one, numeratorColumnKey: "citations" }),
    125,
  );
});

test("an absent numerator column leaves both sides on the same column", () => {
  assert.equal(
    aggregate("percent_of", "citations", POP, { numerator: NUM, numeratorColumnKey: null }),
    aggregate("percent_of", "citations", POP, { numerator: NUM }),
  );
});

// ── validation ──────────────────────────────────────────────────────────────

const mapping = (over = {}) => ({
  slot: "value",
  aggregation: "count",
  columnKey: null,
  filters: [],
  ...over,
});

test("validateMappings accepts a well-formed mapping and normalises it", () => {
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({ filters: [F("quartile", "eq", "Q1")] }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].aggregation, "count");
  assert.deepEqual(out[0].filters[0], { field: "quartile", operator: "eq", value: "Q1" });
});

test("validateMappings requires a numeric column for sum but not for count", () => {
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ aggregation: "sum" })]),
    /needs a column to aggregate/,
  );
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ aggregation: "sum", columnKey: "title" })]),
    /"Title" is not a number column/,
  );
  // count drops any column it was handed rather than storing something misleading.
  assert.equal(
    validateMappings(COLUMNS, "quarterly", [mapping({ columnKey: "citations" })])[0].columnKey,
    null,
  );
});

test("validateMappings rejects unknown columns and unsupported operators", () => {
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [F("nope", "eq", 1)] })]),
    /Unknown column "nope"/,
  );
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [F("quartile", "gte", "Q1")] })]),
    /"Quartile" does not support/,
  );
});

test("validateMappings enforces both bounds on a range, in order", () => {
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [F("citations", "between", 1)] })]),
    /range end needs a value/,
  );
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [F("citations", "between", 10, 1)] })]),
    /range starts after it ends/,
  );
});

test("validateMappings requires a non-empty list for in", () => {
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [IN("quartile", [])] })]),
    /"Quartile" needs at least one value to match/,
  );
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ filters: [{ field: "quartile", operator: "in" }] }),
      ]),
    /needs at least one value to match/,
  );
});

test("validateMappings dedupes in values and validates each against the options", () => {
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({ filters: [IN("quartile", ["Q1", "Q2", "Q1"])] }),
  ]);
  assert.deepEqual(out[0].filters[0], {
    field: "quartile",
    operator: "in",
    values: ["Q1", "Q2"],
  });
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [IN("quartile", ["Q1", "Q9"])] })]),
    /must be one of: Q1, Q2/,
  );
});

test("validateMappings refuses in on a column type that does not support it", () => {
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [IN("title", ["A", "B"])] })]),
    /"Title" does not support "is any of"/,
  );
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ filters: [IN("citations", [1, 2])] })]),
    /"Citations" does not support "is any of"/,
  );
});

test("validateMappings rejects a second mapping", () => {
  // One mapping in, one number out. A fraction lives inside a percent_of /
  // ratio_of mapping, not across two — see tests/linkMappingShape.test.mjs.
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping(), mapping()]),
    /single mapping/,
  );
});

test("validateMappings widens a period range to whole years for annual sources", () => {
  // Annual entries all sort as Q1, so a Q2-Q4 range would otherwise match nothing.
  const out = validateMappings(COLUMNS, "annual", [
    mapping({ filters: [F(PERIOD_FIELD, "between", "2568-2", "2569-3")] }),
  ]);
  assert.deepEqual(out[0].filters[0], {
    field: PERIOD_FIELD,
    operator: "between",
    value: "2568-1",
    valueTo: "2569-4",
  });
});

test("validateMappings treats a column as optional for the proportion kinds", () => {
  const numer = { numeratorFilters: [F("quartile", "eq", "Q1")] };
  // No column is fine — it counts rows.
  assert.equal(
    validateMappings(COLUMNS, "quarterly", [mapping({ aggregation: "percent_of", ...numer })])[0]
      .columnKey,
    null,
  );
  // A column is kept, and still has to be numeric.
  assert.equal(
    validateMappings(COLUMNS, "quarterly", [
      mapping({ aggregation: "ratio_of", columnKey: "citations", ...numer }),
    ])[0].columnKey,
    "citations",
  );
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "percent_of", columnKey: "title", ...numer }),
      ]),
    /"Title" is not a number column/,
  );
});

test("validateMappings rejects a proportion with no numerator condition", () => {
  // Without one the numerator is the whole population — always 100%.
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping({ aggregation: "percent_of" })]),
    /at least one condition saying which rows to count/,
  );
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "ratio_of", numeratorFilters: [] }),
      ]),
    /at least one condition saying which rows to count/,
  );
});

test("validateMappings accepts a numerator column in place of a numerator condition", () => {
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({
      aggregation: "percent_of",
      columnKey: "citations",
      numeratorColumnKey: "reviews",
      filters: [F("quartile", "eq", "Q1")],
    }),
  ]);
  assert.equal(out[0].numeratorColumnKey, "reviews");
  assert.deepEqual(out[0].numeratorFilters, []);
});

test("validateMappings drops a numerator column that repeats the denominator's", () => {
  // Same column on both sides is no second quantity — so with nothing narrowing
  // the rows either, the mapping is back to always 100%.
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({
          aggregation: "percent_of",
          columnKey: "citations",
          numeratorColumnKey: "citations",
        }),
      ]),
    /needs a numerator column, or at least one condition/,
  );
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({
      aggregation: "percent_of",
      columnKey: "citations",
      numeratorColumnKey: "citations",
      numeratorFilters: [F("quartile", "eq", "Q1")],
    }),
  ]);
  assert.equal(out[0].numeratorColumnKey, undefined);
});

test("validateMappings holds a numerator column to the same rules as any column", () => {
  const bad = (over) => () =>
    validateMappings(COLUMNS, "quarterly", [
      mapping({ aggregation: "percent_of", columnKey: "citations", ...over }),
    ]);
  assert.throws(bad({ numeratorColumnKey: "nope" }), /Unknown column "nope"/);
  assert.throws(bad({ numeratorColumnKey: "title" }), /"Title" is not a number column/);
  // A column total over a bare row count is not a proportion of anything.
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "percent_of", numeratorColumnKey: "reviews" }),
      ]),
    /needs a denominator column to divide by/,
  );
});

test("validateMappings rejects a numerator column where there is no separate numerator", () => {
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "sum", columnKey: "citations", numeratorColumnKey: "reviews" }),
      ]),
    /no separate numerator to total on its own column/,
  );
  // Faculty mode's numerator IS the matched rows on columnKey; a second column
  // there would just be that column, so it is refused rather than reinterpreted.
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({
          aggregation: "ratio_of",
          columnKey: "citations",
          numeratorColumnKey: "reviews",
          denominatorSource: "faculty",
          facultyRanks: ["Lecturer"],
        }),
      ]),
    /no separate numerator to total on its own column/,
  );
});

test("validateMappings keeps numeratorFilters off the non-proportion kinds", () => {
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({ aggregation: "sum", columnKey: "citations", numeratorFilters: [F("quartile", "eq", "Q1")] }),
  ]);
  assert.equal(out[0].numeratorFilters, undefined);
});

test("validateMappings validates numerator conditions like any other", () => {
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({
      aggregation: "percent_of",
      filters: [F("citations", "gte", 5)],
      numeratorFilters: [F("quartile", "eq", "Q1")],
    }),
  ]);
  assert.deepEqual(out[0].numeratorFilters, [
    { field: "quartile", operator: "eq", value: "Q1" },
  ]);
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "percent_of", numeratorFilters: [F("nope", "eq", "x")] }),
      ]),
    /nope/,
  );
});

test("validateMappings requires ranks for a faculty denominator and drops the numerator list", () => {
  const out = validateMappings(COLUMNS, "quarterly", [
    mapping({
      aggregation: "ratio_of",
      denominatorSource: "faculty",
      facultyRanks: ["Lecturer", "Professor"],
      filters: [F("quartile", "eq", "Q1")],
      // Meaningless once the roster supplies the divisor.
      numeratorFilters: [F("citations", "gte", 5)],
    }),
  ]);
  assert.equal(out[0].denominatorSource, "faculty");
  assert.deepEqual(out[0].facultyRanks, ["Lecturer", "Professor"]);
  assert.equal(out[0].numeratorFilters, undefined);
  // The rows-mode "needs a numerator condition" rule must not fire here.
  assert.deepEqual(out[0].filters, [{ field: "quartile", operator: "eq", value: "Q1" }]);

  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "ratio_of", denominatorSource: "faculty", facultyRanks: [] }),
      ]),
    /at least one faculty rank/,
  );
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({
          aggregation: "ratio_of",
          denominatorSource: "faculty",
          facultyRanks: ["Dean"],
        }),
      ]),
    /Unknown faculty rank "Dean"/,
  );
});

test("validateMappings rejects a denominator source on a kind that has no denominator", () => {
  assert.throws(
    () =>
      validateMappings(COLUMNS, "quarterly", [
        mapping({ aggregation: "sum", columnKey: "citations", denominatorSource: "faculty" }),
      ]),
    /no denominator to choose a source for/,
  );
});

test("validateMappings tolerates an absent mapping list", () => {
  assert.deepEqual(validateMappings(COLUMNS, "quarterly", null), []);
  assert.deepEqual(validateMappings(COLUMNS, "quarterly", undefined), []);
});

// ── description ─────────────────────────────────────────────────────────────

test("describeMapping reads as a sentence and resolves derived codes", () => {
  assert.equal(describeMapping(mapping(), COLUMNS), "Count of rows");
  assert.equal(
    describeMapping(mapping({ aggregation: "sum", columnKey: "citations" }), COLUMNS),
    "Sum of Citations",
  );
  assert.equal(
    describeMapping(
      mapping({ filters: [F("quartile", "eq", "Q1"), F("citations", "gte", 5)] }),
      COLUMNS,
    ),
    "Count of rows where Quartile is Q1 and Citations is at least 5",
  );
  assert.equal(
    describeMapping(mapping({ filters: [F("author", "eq", "fac-002")] }), COLUMNS, {
      "fac-002": "ผศ.ดร.จงกล สายสิงห์",
    }),
    "Count of rows where Author is ผศ.ดร.จงกล สายสิงห์",
  );
});

test("describeMapping spells out both sides of a proportion", () => {
  const numer = { numeratorFilters: [F("quartile", "eq", "Q1")] };
  // No column → the kind is measuring rows themselves.
  assert.equal(
    describeMapping(mapping({ aggregation: "percent_of", ...numer }), COLUMNS),
    "Percent of rows · counting Quartile is Q1",
  );
  assert.equal(
    describeMapping(
      mapping({
        aggregation: "ratio_of",
        filters: [F("citations", "gte", 5)],
        ...numer,
      }),
      COLUMNS,
    ),
    "Ratio of rows where Citations is at least 5 · counting Quartile is Q1",
  );
  // With a column it names the column instead.
  assert.equal(
    describeMapping(
      mapping({ aggregation: "percent_of", columnKey: "citations", ...numer }),
      COLUMNS,
    ),
    "Percent of Citations · counting Quartile is Q1",
  );
});

test("describeMapping names both columns when the numerator has its own", () => {
  assert.equal(
    describeMapping(
      mapping({
        aggregation: "percent_of",
        columnKey: "citations",
        numeratorColumnKey: "reviews",
        filters: [F("quartile", "eq", "Q1")],
        numeratorFilters: [],
      }),
      COLUMNS,
    ),
    "Percent of Reviews out of Citations where Quartile is Q1",
  );
});

test("describeMapping names the roster and its currentness for a faculty denominator", () => {
  const base = {
    aggregation: "ratio_of",
    denominatorSource: "faculty",
    filters: [F("quartile", "eq", "Q1")],
  };
  // The default academic selection reads as an exclusion.
  assert.equal(
    describeMapping(
      mapping({
        ...base,
        facultyRanks: ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"],
      }),
      COLUMNS,
    ),
    "Ratio of rows where Quartile is Q1 · per current active faculty member (excluding Support Staff)",
  );
  // A narrow selection is listed instead.
  assert.equal(
    describeMapping(mapping({ ...base, facultyRanks: ["Lecturer"] }), COLUMNS),
    "Ratio of rows where Quartile is Q1 · per current active faculty member (Lecturer only)",
  );
});

test("describeMapping lists every value of an in filter", () => {
  assert.equal(
    describeMapping(mapping({ filters: [IN("quartile", ["Q1", "Q2"])] }), COLUMNS),
    "Count of rows where Quartile is any of Q1, Q2",
  );
  assert.equal(
    describeMapping(mapping({ filters: [IN("author", ["fac-002", "fac-009"])] }), COLUMNS, {
      "fac-002": "ผศ.ดร.จงกล สายสิงห์",
      "fac-009": "อ.ดร.อ่อน ลายเงิน",
    }),
    "Count of rows where Author is any of ผศ.ดร.จงกล สายสิงห์, อ.ดร.อ่อน ลายเงิน",
  );
});
