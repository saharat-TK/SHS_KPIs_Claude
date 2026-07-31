import assert from "node:assert/strict";
import test from "node:test";
import { sameUnit, unitNeedsDivisor } from "../lib/kpi/progress.ts";
import { WEIGHT_ERROR, validateWeight, weightSumWarning } from "../lib/kpi/weight.ts";

// ── sameUnit ────────────────────────────────────────────────────────────────
//
// Gates whether a metric may borrow its parent KPI's target when it has none
// (AnnualQuarterProgressMatrix). Without it, K2-1's Item-counted publications
// were divided by a per-faculty Ratio target of 0.25 and rendered as 400%.

test("sameUnit ignores casing and padding, like unitNeedsDivisor", () => {
  assert.equal(sameUnit("Percent", "percent"), true);
  assert.equal(sameUnit("  Ratio ", "RATIO"), true);
  assert.equal(sameUnit("Item", "Item"), true);
});

test("sameUnit rejects genuinely different units", () => {
  // The two live mismatches: K2-1 and K1-4.
  assert.equal(sameUnit("Item", "Ratio"), false);
  assert.equal(sameUnit("Persons", "Percent"), false);
  // "%" is not the same token as "Percent" — the app stores both, and treating
  // them as equal here would re-open the hole for whichever KPI uses "%".
  assert.equal(sameUnit("%", "Percent"), false);
});

test("sameUnit treats a missing unit as matching nothing", () => {
  // Including another missing one: "unknown" is not a unit two things share, and
  // two untyped rows must not license a comparison.
  assert.equal(sameUnit(null, null), false);
  assert.equal(sameUnit(undefined, undefined), false);
  assert.equal(sameUnit("", ""), false);
  assert.equal(sameUnit("Item", null), false);
  assert.equal(sameUnit(null, "Item"), false);
  assert.equal(sameUnit("Item", "   "), false);
});

test("sameUnit agrees with unitNeedsDivisor on the divisor units", () => {
  // Guard against the two normalising differently over time.
  for (const u of ["Percent", "  ratio  ", "RATIO"]) {
    assert.equal(sameUnit(u, u), true, `${u}`);
    assert.equal(unitNeedsDivisor(u), true, `${u}`);
  }
});

// ── weightSumWarning ────────────────────────────────────────────────────────
//
// Advisory. rollupParts applies each weight as wᵢ/100 and never rescales, so the
// total IS the scale of a weighted_sum KPI's answer.

test("weightSumWarning stays quiet when the weights total 100", () => {
  assert.equal(weightSumWarning([100]), null);
  assert.equal(weightSumWarning([25, 25, 25, 25]), null);
  assert.equal(weightSumWarning([60, 40]), null);
});

test("weightSumWarning names the total and what it does to the answer", () => {
  // The live shape: every metric defaults to 100, so four children total 400 and
  // a weighted sum reads four times the true weighted average.
  const over = weightSumWarning([100, 100, 100, 100]);
  assert.match(over, /400%/);
  assert.match(over, /not 100%/);

  const under = weightSumWarning([50, 30]);
  assert.match(under, /80%/);
});

test("weightSumWarning says nothing about a KPI with no sub-KPIs", () => {
  // A leaf has no weights to total; warning there would be noise.
  assert.equal(weightSumWarning([]), null);
});

test("validateWeight still bounds each weight on its own", () => {
  // The per-weight rule and the total rule are independent: every weight here is
  // individually valid, and the total is still wrong.
  assert.equal(validateWeight(100), 100);
  assert.equal(validateWeight(null), 100);
  assert.deepEqual(validateWeight(0), { error: WEIGHT_ERROR });
  assert.deepEqual(validateWeight(101), { error: WEIGHT_ERROR });
  assert.deepEqual(validateWeight(12.5), { error: WEIGHT_ERROR });
  assert.equal(weightSumWarning([100, 100]) !== null, true);
});
