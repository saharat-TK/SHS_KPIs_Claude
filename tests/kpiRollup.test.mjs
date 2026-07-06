import assert from "node:assert/strict";
import test from "node:test";
import { rollup } from "../lib/kpi/performance.ts";

test("percent KPIs average metric progress percentages instead of raw metric values", () => {
  const value = rollup("simple_average", "Percent", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: 75, target: 100 },
  ]);

  assert.equal(value, 77.5);
});

test("percent KPI roll-up excludes metrics without a computable progress percent", () => {
  const value = rollup("simple_average", "Percent", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: null, target: 100 },
    { weight: 50, value: 20, target: 0 },
  ]);

  assert.equal(value, 80);
});

test("non-percent KPI roll-up keeps existing raw simple average behavior", () => {
  const value = rollup("simple_average", "Number", [
    { weight: 50, value: 40, target: 50 },
    { weight: 50, value: 75, target: 100 },
  ]);

  assert.equal(value, 57.5);
});
