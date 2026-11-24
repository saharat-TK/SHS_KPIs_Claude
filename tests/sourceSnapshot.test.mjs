import assert from "node:assert/strict";
import test from "node:test";
import {
  columnDiff,
  keepColumnValues,
  linkAction,
  planEntries,
  resolveLinkTarget,
  stableStringify,
} from "../lib/kpi/sourceSnapshot.ts";

const col = (over = {}) => ({
  colKey: "title",
  label: "Title",
  dataType: "text",
  unit: null,
  options: null,
  refColKey: null,
  isMultiple: false,
  autoFill: null,
  isRequired: false,
  sortOrder: 0,
  ...over,
});

const entry = (values, over = {}) => ({
  year: 2569,
  quarter: 2,
  values,
  note: null,
  isIncomplete: false,
  recordedBy: null,
  createdAt: null,
  updatedAt: null,
  ...over,
});

test("stableStringify ignores key order and undefined", () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: undefined } }),
    stableStringify({ a: { d: [1, { x: 1, y: 2 }] }, b: 1 }),
  );
  assert.notEqual(stableStringify({ a: 1 }), stableStringify({ a: 2 }));
});

test("keepColumnValues drops values for columns that no longer exist", () => {
  const values = { title: "A", author_position: 3, fraction: 0.5 };
  assert.deepEqual(
    keepColumnValues(values, [{ colKey: "title" }, { colKey: "fraction" }]),
    { title: "A", fraction: 0.5 },
  );
});

test("columnDiff reports missing, changed and extra columns", () => {
  const wanted = [
    col({ colKey: "title", isRequired: true }),
    col({ colKey: "quartile", dataType: "select", options: ["Q1", "Q2"], sortOrder: 1 }),
    col({ colKey: "pub_month", dataType: "month", sortOrder: 2 }),
  ];
  const existing = [
    col({ colKey: "title", isRequired: false }),
    col({ colKey: "quartile", dataType: "select", options: ["Q1", "Q2"], sortOrder: 1 }),
    col({ colKey: "author_position", dataType: "number", sortOrder: 9 }),
  ];
  const diff = columnDiff(existing, wanted);
  assert.deepEqual(diff.missing.map((c) => c.colKey), ["pub_month"]);
  assert.deepEqual(diff.changed.map((c) => [c.wanted.colKey, c.fields]), [["title", ["isRequired"]]]);
  assert.deepEqual(diff.extra.map((c) => c.colKey), ["author_position"]);
});

test("columnDiff treats equal options and a matching definition as unchanged", () => {
  const same = [col({ colKey: "q", dataType: "select", options: ["A", "B"] })];
  const diff = columnDiff(structuredClone(same), same);
  assert.deepEqual([diff.missing, diff.changed, diff.extra], [[], [], []]);
  const reordered = [col({ colKey: "q", dataType: "select", options: ["B", "A"] })];
  assert.deepEqual(columnDiff(reordered, same).changed[0].fields, ["options"]);
});

test("planEntries inserts only what is missing and counts duplicates as a multiset", () => {
  const columns = [col({ colKey: "title" }), col({ colKey: "faculty", dataType: "faculty" })];
  const a = entry({ title: "Paper A", faculty: "fac-001" });
  const b = entry({ title: "Paper B", faculty: "fac-002" });
  const twin = entry({ title: "Test13", faculty: "fac-003" });

  // Nothing in the target yet: everything is inserted.
  assert.equal(planEntries(columns, [], [a, b]).toInsert.length, 2);

  // Already there: nothing to do, and key order in values doesn't matter.
  const there = planEntries(
    columns,
    [{ year: 2569, quarter: 2, values: { faculty: "fac-001", title: "Paper A" } }],
    [a],
  );
  assert.deepEqual([there.toInsert.length, there.present], [0, 1]);

  // Three identical rows wanted, two present: exactly one more is inserted.
  const plan = planEntries(
    columns,
    [
      { year: 2569, quarter: 2, values: twin.values },
      { year: 2569, quarter: 2, values: twin.values },
    ],
    [twin, twin, twin],
  );
  assert.deepEqual([plan.toInsert.length, plan.present], [1, 2]);

  // The same values in another quarter are a different row.
  assert.equal(
    planEntries(columns, [{ year: 2569, quarter: 3, values: a.values }], [a]).toInsert.length,
    1,
  );
});

const library = {
  kpis: [
    { id: 11, setName: "SHS Strategic Set 2565-2569", name: "K2-1 Q1-Q2 ratio" },
    { id: 12, setName: "SHS Strategic Set 2573-2577 (clone)", name: "K2-1 Q1-Q2 ratio" },
    { id: 13, setName: "SHS Strategic Set 2565-2569", name: "K9 other" },
  ],
  metrics: [
    { id: 45, kpiId: 11, name: "Papers Q1-Tier1" },
    { id: 46, kpiId: 11, name: "Papers Q1" },
    { id: 90, kpiId: 12, name: "Papers Q1" },
    { id: 91, kpiId: 13, name: "Papers Q1" },
  ],
};

test("resolveLinkTarget finds a KPI and its metric by name, using the set to break ties", () => {
  const set = "SHS Strategic Set 2565-2569";
  assert.deepEqual(
    resolveLinkTarget({ setName: set, kpiName: "K2-1 Q1-Q2 ratio", metricName: null }, library),
    { ok: true, libraryKpiId: 11, libraryMetricId: null },
  );
  assert.deepEqual(
    resolveLinkTarget({ setName: set, kpiName: "K2-1 Q1-Q2 ratio", metricName: "Papers Q1" }, library),
    { ok: true, libraryKpiId: null, libraryMetricId: 46 },
  );
});

test("resolveLinkTarget refuses a missing or ambiguous name instead of guessing", () => {
  const missingKpi = resolveLinkTarget({ setName: "x", kpiName: "Nope", metricName: null }, library);
  assert.equal(missingKpi.ok, false);
  assert.match(missingKpi.reason, /was not found/);

  const wrongSet = resolveLinkTarget(
    { setName: "A set that does not exist", kpiName: "K2-1 Q1-Q2 ratio", metricName: null },
    library,
  );
  assert.equal(wrongSet.ok, false);
  assert.match(wrongSet.reason, /matches 2 KPIs/);

  const missingMetric = resolveLinkTarget(
    { setName: "SHS Strategic Set 2565-2569", kpiName: "K2-1 Q1-Q2 ratio", metricName: "Papers Q9" },
    library,
  );
  assert.equal(missingMetric.ok, false);
  assert.match(missingMetric.reason, /metric "Papers Q9"/);
});

test("linkAction creates, keeps, or flags a link whose mappings differ", () => {
  const mappings = [{ aggregation: "count_distinct", columnKey: "title", filters: [{ field: "quartile", operator: "eq", value: "Q1" }] }];
  assert.equal(linkAction(null, mappings), "create");
  // Same mappings, different key order: still the same link.
  assert.equal(
    linkAction([{ filters: [{ value: "Q1", operator: "eq", field: "quartile" }], columnKey: "title", aggregation: "count_distinct" }], mappings),
    "present",
  );
  assert.equal(linkAction([{ aggregation: "sum" }], mappings), "differs");
});
