import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_THRESHOLDS,
  healthOf,
  percentOfTarget,
} from "../lib/kpi/progress.ts";

test("the standard band is on-target 100, watch 70", () => {
  assert.deepEqual(DEFAULT_THRESHOLDS, { green: 100, amber: 70 });
});

test("hitting the target exactly is healthy", () => {
  assert.equal(healthOf(100, DEFAULT_THRESHOLDS), "healthy");
});

test("over-achievement stays healthy", () => {
  assert.equal(healthOf(120, DEFAULT_THRESHOLDS), "healthy");
});

test("short of the target but at or above 70 is watch", () => {
  assert.equal(healthOf(99.9, DEFAULT_THRESHOLDS), "watch");
  assert.equal(healthOf(70, DEFAULT_THRESHOLDS), "watch");
});

test("below 70 is at risk", () => {
  assert.equal(healthOf(69.9, DEFAULT_THRESHOLDS), "at_risk");
  assert.equal(healthOf(0, DEFAULT_THRESHOLDS), "at_risk");
});

// The band is percent-of-target, so it reads the same whatever the KPI's unit —
// which is what makes a single 100/70 default defensible across the library.
test("the band is unit-blind: a Ratio and a Count at target both read healthy", () => {
  assert.equal(healthOf(percentOfTarget(0.25, 0.25), DEFAULT_THRESHOLDS), "healthy");
  assert.equal(healthOf(percentOfTarget(315, 315), DEFAULT_THRESHOLDS), "healthy");
});

// This is the case the Threshold Settings preview bar renders: "if you hit your
// 5-year target, what colour are you?" — value 100, not the raw target.
test("a sub-100 target hit in full is healthy, not at risk", () => {
  assert.equal(percentOfTarget(0.25, 0.25), 100);
  assert.equal(healthOf(100, DEFAULT_THRESHOLDS), "healthy");
});
