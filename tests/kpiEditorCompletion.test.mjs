import assert from "node:assert/strict";
import test from "node:test";
import { kpiEditorSectionCompletion } from "../lib/kpi/kpiEditorCompletion.ts";

const completeDraft = () => ({
  name: "Graduate employment",
  categoryId: "student_success",
  routineCategoryId: "routine-education",
  kpiType: "strategic",
  dataCollectMethod: "Registry export",
  collectionPeriod: "every_quarter",
  dataSourceUrl: "https://example.edu/data",
  committeeId: "cmt-students",
  weight: 100,
  unit: "Item",
  fiveYearTarget: 100,
  calculationType: "weighted_sum",
  formulaId: null,
  variable1Name: "Graduates employed",
  variable2Name: "",
  thresholdGreen: 100,
  thresholdAmber: 70,
});

const completion = (patch = {}, years = [20, 40, 60, 80, 100], metricCount = 0) =>
  kpiEditorSectionCompletion({
    draft: { ...completeDraft(), ...patch },
    years,
    metricCount,
  });

test("a fully configured direct-entry KPI completes every section", () => {
  assert.deepEqual(completion(), {
    core: true,
    annualTarget: true,
    calculationLogic: true,
    subKpis: true,
    thresholds: true,
  });
});

test("a routine KPI requires its routine category instead of the strategic category", () => {
  assert.equal(
    completion({ kpiType: "routine", categoryId: "", routineCategoryId: "routine-education" }).core,
    true,
  );
  assert.equal(completion({ kpiType: "routine", routineCategoryId: "" }).core, false);
});

test("zero targets are complete, but missing or over-cap annual targets are incomplete", () => {
  assert.equal(completion({}, [0, 0, 0, 0, 0]).annualTarget, true);
  assert.equal(completion({}, [20, null, 60, 80, 100]).annualTarget, false);
  assert.equal(completion({}, [20, 40, 60, 80, 101]).annualTarget, false);
});

test("custom formulas and divisor units require their applicable inputs", () => {
  assert.equal(completion({ calculationType: "custom_formula", formulaId: null }).calculationLogic, false);
  assert.equal(completion({ calculationType: "custom_formula", formulaId: 12 }).calculationLogic, true);
  assert.equal(completion({ unit: "Percent", variable2Name: "" }).calculationLogic, false);
  assert.equal(
    completion({ unit: "Percent", variable2Name: "Total graduates" }).calculationLogic,
    true,
  );
});

test("sub-KPIs are complete with child metrics or configured direct entry variables", () => {
  assert.equal(completion({ variable1Name: "" }).subKpis, false);
  assert.equal(completion({ variable1Name: "" }, undefined, 1).subKpis, true);
});

test("thresholds require both values in green-to-amber order", () => {
  assert.equal(completion({ thresholdGreen: null }).thresholds, false);
  assert.equal(completion({ thresholdGreen: 60, thresholdAmber: 70 }).thresholds, false);
  assert.equal(completion({ thresholdGreen: 70, thresholdAmber: 70 }).thresholds, true);
});
