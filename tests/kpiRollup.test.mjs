import assert from "node:assert/strict";
import test from "node:test";
import { rollup } from "../lib/kpi/performance.ts";

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
