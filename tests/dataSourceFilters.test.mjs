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

test("validateMappings rejects two mappings feeding the same slot", () => {
  assert.throws(
    () => validateMappings(COLUMNS, "quarterly", [mapping(), mapping()]),
    /Two mappings both feed "value"/,
  );
  // Two different slots are the percent/ratio case and must be allowed.
  const ok = validateMappings(COLUMNS, "quarterly", [
    mapping({ slot: "variable1" }),
    mapping({ slot: "variable2" }),
  ]);
  assert.equal(ok.length, 2);
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
