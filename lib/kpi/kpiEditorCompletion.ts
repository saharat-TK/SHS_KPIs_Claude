// Pure, client-safe completeness rules for the library KPI editor. Keep this
// independent from page components so the advisory UI state is testable without
// changing persistence or save validation.
import type { KpiCalculationType, KpiType } from "@/lib/types";

export type KpiEditorCompletionDraft = {
  name: string;
  categoryId: string;
  routineCategoryId: string;
  kpiType: KpiType;
  dataCollectMethod: string;
  collectionPeriod: string;
  dataSourceUrl: string;
  committeeId: string;
  weight: number;
  unit: string;
  fiveYearTarget: number | null;
  calculationType: KpiCalculationType;
  formulaId: number | null;
  variable1Name: string;
  variable2Name: string;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
};

export type KpiEditorSectionCompletion = {
  core: boolean;
  annualTarget: boolean;
  calculationLogic: boolean;
  subKpis: boolean;
  thresholds: boolean;
};

const hasText = (value: string) => value.trim().length > 0;
const isFiniteNumber = (value: number | null): value is number =>
  value != null && Number.isFinite(value);
const needsDivisor = (unit: string) => {
  const normalized = unit.trim().toLowerCase();
  return normalized === "percent" || normalized === "ratio";
};

export function kpiEditorSectionCompletion({
  draft,
  years,
  metricCount,
}: {
  draft: KpiEditorCompletionDraft;
  years: (number | null)[];
  metricCount: number;
}): KpiEditorSectionCompletion {
  const applicableCategory =
    draft.kpiType === "routine" ? draft.routineCategoryId : draft.categoryId;
  const variableNamesComplete =
    hasText(draft.variable1Name) &&
    (!needsDivisor(draft.unit) || hasText(draft.variable2Name));
  const validTargets =
    isFiniteNumber(draft.fiveYearTarget) &&
    years.length === 5 &&
    years.every(
      (target) =>
        isFiniteNumber(target) && target >= 0 && target <= draft.fiveYearTarget!,
    );

  return {
    core:
      hasText(draft.name) &&
      hasText(applicableCategory) &&
      hasText(draft.kpiType) &&
      hasText(draft.collectionPeriod) &&
      hasText(draft.dataCollectMethod) &&
      hasText(draft.dataSourceUrl) &&
      hasText(draft.committeeId),
    annualTarget:
      Number.isFinite(draft.weight) &&
      draft.weight >= 0 &&
      draft.weight <= 100 &&
      hasText(draft.unit) &&
      validTargets,
    calculationLogic:
      hasText(draft.calculationType) &&
      (draft.calculationType !== "custom_formula" || draft.formulaId != null) &&
      variableNamesComplete,
    subKpis: metricCount > 0 || variableNamesComplete,
    thresholds:
      isFiniteNumber(draft.thresholdGreen) &&
      isFiniteNumber(draft.thresholdAmber) &&
      draft.thresholdGreen >= draft.thresholdAmber,
  };
}
