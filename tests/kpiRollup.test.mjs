import assert from "node:assert/strict";
import test from "node:test";
import { rollup, rollupParts, rollsUpFromChildren } from "../lib/kpi/performance.ts";

test("percent_of_total pools progress and targets rather than averaging ratios", () => {
  const value = rollup("percent_of_total", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: 75, target: 100 },
  ]);

  // Pooled: 115/150. Deliberately different from the mean of the two ratios
  // (80% and 75% → 77.5), which is what the old unit='Percent' rule returned.
  assert.equal(value, (115 / 150) * 100);
  assert.notEqual(value, 77.5);
});

test("percent_of_total excludes metrics without a usable value or target from both sums", () => {
  const value = rollup("percent_of_total", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: null, target: 100 },
    { weight: 50, value: 20, target: 0 },
  ]);

  // Only the first row is usable — the null value and the zero target drop out
  // of the numerator AND the denominator.
  assert.equal(value, 80);
});

test("percent_of_total falls back to the plain sum of values when no target is usable", () => {
  // No usable target (null value on one row, zero target on the other) → no
  // denominator, so fall back to the plain sum of the present values (the 20).
  // The percent fallback is NOT scaled by 100 — a sum is not a fraction.
  assert.equal(
    rollup("percent_of_total", [
      { weight: 50, value: null, target: 100 },
      { weight: 50, value: 20, target: 0 },
    ]),
    20,
  );
  // Nothing to sum at all → still null.
  assert.equal(rollup("percent_of_total", []), null);
  assert.equal(
    rollup("percent_of_total", [{ weight: 50, value: null, target: 0 }]),
    null,
  );
});

test("ratio_of_total pools progress and targets without scaling to a percentage", () => {
  const value = rollup("ratio_of_total", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: 75, target: 100 },
  ]);

  assert.equal(value, 115 / 150);
});

test("ratio_of_total is exactly percent_of_total / 100 on identical rows", () => {
  const rows = [
    { weight: 30, value: 12, target: 40 },
    { weight: 70, value: 90, target: 110 },
    { weight: 10, value: 5, target: 7 },
  ];

  assert.equal(rollup("percent_of_total", rows), rollup("ratio_of_total", rows) * 100);
});

test("ratio_of_total excludes metrics without a usable value or target from both sums", () => {
  const value = rollup("ratio_of_total", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: null, target: 100 },
    { weight: 50, value: 20, target: 0 },
  ]);

  assert.equal(value, 40 / 50);
});

test("ratio_of_total falls back to the plain sum of values when no target is usable", () => {
  // Same fallback as percent_of_total, without any scaling.
  assert.equal(
    rollup("ratio_of_total", [
      { weight: 50, value: null, target: 100 },
      { weight: 50, value: 20, target: 0 },
    ]),
    20,
  );
  assert.equal(rollup("ratio_of_total", []), null);
  assert.equal(
    rollup("ratio_of_total", [{ weight: 50, value: null, target: 0 }]),
    null,
  );
});

test("pooled fallback sums every present value when all targets are zero", () => {
  // Mirrors the live KPI-14 case: fed metric values, all targets 0.
  const rows = [
    { weight: 20, value: 0.0182, target: 0 },
    { weight: 20, value: 0.0182, target: 0 },
    { weight: 20, value: 0.0364, target: 0 },
    { weight: 20, value: 0.0182, target: 0 },
    { weight: 20, value: 0, target: 0 },
  ];
  assert.equal(rollup("ratio_of_total", rows), 0.0182 + 0.0182 + 0.0364 + 0.0182 + 0);
  // Identical fallback for percent (no ×100).
  assert.equal(rollup("percent_of_total", rows), rollup("ratio_of_total", rows));
});

test("a single usable target keeps the pooled ratio (no fallback)", () => {
  // At least one value+target pair present → pool as usual, ignore the rest.
  assert.equal(
    rollup("ratio_of_total", [
      { weight: 50, value: 40, target: 50 },
      { weight: 50, value: 99, target: 0 },
    ]),
    40 / 50,
  );
});

test("simple_average keeps raw averaging and ignores targets", () => {
  const value = rollup("simple_average", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: 75, target: 100 },
  ]);

  assert.equal(value, 57.5);
});

test("weighted_sum is a percent-weighted sum of raw values", () => {
  const value = rollup("weighted_sum", [
    { weight: 25, value: 40, target: 50 },
    { weight: 75, value: 100, target: 100 },
  ]);

  assert.equal(value, 0.25 * 40 + 0.75 * 100);
});

test("custom_formula is not auto-computed", () => {
  assert.equal(rollup("custom_formula", [{ weight: 100, value: 40, target: 50 }]), null);
});

// ── combined_percent / combined_ratio ───────────────────────────────────────
//
// Pooling what the CHILDREN divided, for parents whose children are themselves
// fractions. *_of_total divides progress by target, which is meaningless on a
// percentage: it is what made K1-1 "% of graduates employed" report 109.88%.

// The live K1-1 case, record 2 Y1Q3: four curricula, each a percent_of link
// carrying the employed/graduates pair it divided.
const K1_1 = [
  { weight: 25, value: 76.8116, target: 70, v1: 53, v2: 69 },
  { weight: 25, value: 75.8621, target: 70, v1: 22, v2: 29 },
  { weight: 25, value: 75.0, target: 70, v1: 30, v2: 40 },
  { weight: 25, value: 80.0, target: 70, v1: 4, v2: 5 },
];

test("combined_percent pools the children's own numerators and denominators", () => {
  const parts = rollupParts("combined_percent", K1_1);

  assert.equal(parts.variable1, 109); // employed
  assert.equal(parts.variable2, 143); // graduates
  assert.equal(parts.value, (109 / 143) * 100);

  // The regression: percent_of_total summed the four percentages (307.6737)
  // over the four 70% targets (280) and reported 109.88% — a rate above 100%
  // for a quantity that cannot exceed it.
  assert.equal(rollup("percent_of_total", K1_1), (307.6737 / 280) * 100);
  assert.notEqual(parts.value, (307.6737 / 280) * 100);
});

test("combined_ratio is exactly combined_percent / 100 on identical rows", () => {
  assert.equal(
    rollup("combined_percent", K1_1),
    rollup("combined_ratio", K1_1) * 100,
  );
});

test("combined_* ignores target and weight entirely", () => {
  // Same parts, wildly different weights and targets → same answer.
  const skewed = K1_1.map((r, i) => ({ ...r, weight: i * 40, target: i * 999 }));
  assert.equal(rollup("combined_percent", skewed), rollup("combined_percent", K1_1));
});

test("combined_* excludes a child that has a value but no parts from both sums", () => {
  // A hand-entered metric records no numerator/denominator. Counting its value
  // in the numerator with nothing in the denominator would inflate the rate.
  const parts = rollupParts("combined_percent", [
    { weight: 50, value: 80, target: 70, v1: 40, v2: 50 },
    { weight: 50, value: 90, target: 70, v1: null, v2: null },
  ]);

  assert.equal(parts.variable1, 40);
  assert.equal(parts.variable2, 50);
  assert.equal(parts.value, 80);
});

test("combined_* drops a child with a numerator but no denominator", () => {
  const parts = rollupParts("combined_ratio", [
    { weight: 50, value: 80, target: 70, v1: 40, v2: 50 },
    { weight: 50, value: 12, target: 70, v1: 12, v2: null }, // a count, not a fraction
    { weight: 50, value: 0, target: 70, v1: 7, v2: 0 }, // zero denominator
  ]);

  assert.equal(parts.variable1, 40);
  assert.equal(parts.variable2, 50);
});

test("combined_* returns null when no child carries parts — no sum fallback", () => {
  // Unlike the *_of_total types, which fall back to a plain sum of values.
  // A sum of numerators with no denominators is not a rate, and printing one
  // would be the same class of error this type exists to fix.
  const bare = [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: 75, target: 100 },
  ];
  assert.deepEqual(rollupParts("combined_percent", bare), {
    value: null,
    variable1: null,
    variable2: null,
  });
  assert.equal(rollup("combined_ratio", []), null);
});

// ── which engine owns the value ─────────────────────────────────────────────

test("only a childed KPI with no link of its own is rolled up", () => {
  assert.equal(rollsUpFromChildren({ hasChildren: true, fedDirectly: false }), true);

  // A link outranks the roll-up. K2-1 is the case: "publications (Scopus Q1-Q2)
  // per faculty member" divides by the staff roster and excludes two of its own
  // sub-KPIs, so rolling it up from them answered a different question — it
  // reported 6, 14, 20, 23 (raw cumulative counts) where the answer is 0.11.
  assert.equal(rollsUpFromChildren({ hasChildren: true, fedDirectly: true }), false);

  // A leaf is never rolled up either way: fed by a link, or entered by hand.
  assert.equal(rollsUpFromChildren({ hasChildren: false, fedDirectly: true }), false);
  assert.equal(rollsUpFromChildren({ hasChildren: false, fedDirectly: false }), false);
});
