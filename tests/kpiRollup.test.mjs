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

test("percent_of_total returns null when no metric is usable", () => {
  assert.equal(
    rollup("percent_of_total", [
      { weight: 50, value: null, target: 100 },
      { weight: 50, value: 20, target: 0 },
    ]),
    null,
  );
  assert.equal(rollup("percent_of_total", []), null);
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

test("ratio_of_total returns null when no metric is usable", () => {
  assert.equal(
    rollup("ratio_of_total", [
      { weight: 50, value: null, target: 100 },
      { weight: 50, value: 20, target: 0 },
    ]),
    null,
  );
  assert.equal(rollup("ratio_of_total", []), null);
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
