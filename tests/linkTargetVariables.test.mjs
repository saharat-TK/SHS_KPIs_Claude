import assert from "node:assert/strict";
import test from "node:test";
import { targetAllowsVariables, unitNeedsDivisor } from "../lib/kpi/progress.ts";

// Who may be fed as Variable 1 ÷ Variable 2. Both link modals ask this one
// question, so a mismatch here is a mismatch on both pages.

const kpi = (unit, isEdit) => targetAllowsVariables({ isMetric: false, unit, isEdit });
const metric = (unit, isEdit) => targetAllowsVariables({ isMetric: true, unit, isEdit });

test("a percent or ratio KPI may be fed as two variables", () => {
  assert.equal(kpi("Percent"), true);
  assert.equal(kpi("Ratio"), true);
  // Same casing and padding tolerance as unitNeedsDivisor.
  assert.equal(kpi("  percent  "), true);
  assert.equal(kpi("RATIO"), true);
});

test("a metric is never fed as two variables, whatever its unit", () => {
  // The regression this guards: library_metric has no variable definitions and
  // the feed writes only the "value" slot for a metric, so a variable mapping
  // would save and then store NULL for every quarter.
  assert.equal(metric("Percent"), false);
  assert.equal(metric("Ratio"), false);
  assert.equal(metric("percent"), false);
});

test("a unit with no divisor is a single value on either target", () => {
  for (const unit of ["Item", "Persons", "%", "", null]) {
    assert.equal(kpi(unit), false, `kpi ${unit}`);
    assert.equal(metric(unit), false, `metric ${unit}`);
  }
});

test("editing an existing link never offers variables", () => {
  // A link's slots are settled once it exists — its unique key is its target.
  assert.equal(kpi("Percent", true), false);
  assert.equal(kpi("Ratio", true), false);
  assert.equal(metric("Percent", true), false);
});

test("the KPI case tracks unitNeedsDivisor exactly", () => {
  // Guard against the two drifting: the only extra conditions are isMetric and
  // isEdit, so with both false the answers must agree unit for unit.
  for (const unit of ["Percent", "Ratio", "Item", "Persons", "%", null]) {
    assert.equal(kpi(unit), unitNeedsDivisor(unit), `unit ${unit}`);
  }
});
