import assert from "node:assert/strict";
import test from "node:test";
import { aggregateParts, validateMappings } from "../lib/kpi/dataSourceFilters.ts";

// A data-source link carries ONE mapping producing ONE number, whatever it
// targets — the KPI itself or one of its metrics, percent or not.
//
// Links used to carry a "slot" instead: "value", or the pair "variable1" /
// "variable2" for a percent/ratio KPI. The pair was redundant — percent_of and
// ratio_of already return the value together with the numerator and denominator
// that made it, which is exactly what the progress tables record — and it was a
// trap: every link that ever used it was misconfigured into storing NULL for
// every quarter it claimed to update. See scripts/migrate-link-value-slots.mjs.

const COLUMNS = [
  { colKey: "employed", label: "Employed", dataType: "number" },
  { colKey: "graduates", label: "Graduates", dataType: "number" },
  { colKey: "quartile", label: "Quartile", dataType: "select", options: ["Q1", "Q2"] },
];

const check = (raw) => validateMappings(COLUMNS, "quarterly", raw);

const fraction = (over = {}) => ({
  aggregation: "percent_of",
  columnKey: "graduates",
  filters: [],
  numeratorFilters: [],
  numeratorColumnKey: "employed",
  ...over,
});

test("a link carries a single mapping", () => {
  assert.equal(check([fraction()]).length, 1);
  assert.equal(check([]).length, 0);
  // Empty is legal — that link is evidence only.
  assert.equal(check(null).length, 0);
  assert.throws(
    () => check([fraction(), { aggregation: "count", columnKey: null, filters: [] }]),
    /single mapping/,
  );
});

test("a legacy variable slot is refused, not silently read as the value", () => {
  // Reading it as the value would change what the link means: the whole point
  // of the slot was that this aggregation was only HALF of the answer.
  for (const slot of ["variable1", "variable2"]) {
    assert.throws(() => check([fraction({ slot })]), /no longer take a "variable/, slot);
  }
  // The one slot that always meant "the whole answer" stays readable, so rows
  // written before the migration still validate on their next edit.
  assert.doesNotThrow(() => check([fraction({ slot: "value" })]));
});

test("the stored mapping carries no slot at all", () => {
  const [out] = check([fraction({ slot: "value" })]);
  assert.equal("slot" in out, false);
});

test("one mapping produces the value AND both variables", () => {
  // The reason the pair was redundant: this is what the feed writes into
  // progress_value / variable1_value / variable2_value for a percent KPI.
  const rows = [
    { id: 1, year: 2568, quarter: 1, values: { employed: 96, graduates: 60 } },
    { id: 2, year: 2568, quarter: 1, values: { employed: 24, graduates: 60 } },
  ];
  const parts = aggregateParts("percent_of", "graduates", rows, {
    numerator: rows,
    numeratorColumnKey: "employed",
  });
  assert.deepEqual(parts, { value: 100, numerator: 120, denominator: 120 });

  // ratio_of is the same fraction without the ×100 — the two units a divisor
  // was ever needed for, both expressed in one mapping.
  assert.equal(
    aggregateParts("ratio_of", "graduates", rows, {
      numerator: rows,
      numeratorColumnKey: "employed",
    }).value,
    1,
  );
});

test("a faculty denominator divides by something outside the table", () => {
  // The other half of what the variable pair was reached for: a divisor the
  // data source has no column for.
  const out = check([
    {
      aggregation: "ratio_of",
      columnKey: null,
      filters: [{ field: "quartile", operator: "in", values: ["Q1", "Q2"] }],
      denominatorSource: "faculty",
      facultyRanks: ["Professor", "Lecturer"],
    },
  ]);
  assert.equal(out[0].denominatorSource, "faculty");
  assert.deepEqual(out[0].facultyRanks, ["Professor", "Lecturer"]);
});
