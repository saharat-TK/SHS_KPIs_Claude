"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Tabs,
  Badge,
  StatCard,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { cn, formatNumber } from "@/lib/utils";
import {
  percentOfTarget,
  quarterTargetFor,
  kpiValueFromVariables,
  unitNeedsDivisor,
  previousQuarterProgress,
  HEALTH_TONE,
  HEALTH_SURFACE,
} from "@/lib/kpi/progress";
import { approvalLockForState, type ApprovalLockInfo } from "@/lib/kpi/approvalWorkflow";
import { isPeriodOpen, openQuartersForYear } from "@/lib/kpi/performancePeriods";
import type {
  AnnualTarget,
  ApprovalState,
  PerformancePeriod,
  QuarterlyTargetMode,
  QuarterProgress,
  Thresholds,
} from "@/lib/types";

const QUARTERS = [1, 2, 3, 4];
const YEARS = [1, 2, 3, 4, 5];

export interface QuarterEntryAction {
  key: string;
  label: string;
  icon?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  title?: string;
  requiresSavedData?: boolean;
  onClick: () => void;
}

export interface ProgressPanelProps {
  startYear?: number;
  annualTargets?: AnnualTarget[];
  progress?: QuarterProgress[];
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  unit: string | null;
  /** true → user enters the value; false → value is roll-up-computed (read-only). */
  valueEditable: boolean;
  computedNote?: string;
  readOnly?: boolean;
  /** Explains a record-level read-only state such as inactive/completed. */
  readOnlyReason?: string;
  /** Approval state for the selected quarter, used to lock data while under review. */
  approvalState?: ApprovalState;
  /** Approval states for the selected year, keyed by quarter number. */
  approvalStatesByQuarter?: Partial<Record<number, ApprovalState>>;
  periods?: PerformancePeriod[];
  periodsLoading?: boolean;
  saving: boolean;
  /** Optional controlled year selection (so a parent can keep a sub-KPIs table
   *  in sync). When omitted, the panel manages the year internally. */
  year?: number;
  onYearChange?: (year: number) => void;
  /** Optional controlled quarter selection for quarter-scoped child content. */
  quarter?: number;
  onQuarterChange?: (quarter: number) => void;
  /** How quarterly targets are derived (defaults to cumulative divide_equally). */
  quarterlyTargetMode?: QuarterlyTargetMode;
  /** Roll-up rule, used to label the numerator/denominator shown on a computed
   *  quarter (the pair means something different per calculation type). */
  calculationType?: string | null;
  /** KPI-variable definitions (leaf KPIs); when variable1Name is set the value
   *  is entered as V1 (+V2 for Percent/Ratio) instead of a single field. */
  variable1Name?: string | null;
  variable1Unit?: string | null;
  variable2Name?: string | null;
  variable2Unit?: string | null;
  approvalActionsBeforeSave?: QuarterEntryAction[];
  approvalActionsAfterSave?: QuarterEntryAction[];
  hideApprovalLockMessage?: boolean;
  allowApprovalLockedEditing?: boolean;
  quarterContent?: React.ReactNode;
  rightColumnContent?: React.ReactNode;
  onSave: (
    yearNo: number,
    quarterNo: number,
    data: {
      progressValue: number | null;
      variable1Value?: number | null;
      variable2Value?: number | null;
      issue: string;
      solution: string;
    },
  ) => void;
}

export function ProgressPanel({
  startYear,
  annualTargets = [],
  progress = [],
  thresholdGreen,
  thresholdAmber,
  unit,
  valueEditable,
  computedNote,
  readOnly = false,
  readOnlyReason,
  approvalState,
  approvalStatesByQuarter = {},
  periods,
  periodsLoading = false,
  saving,
  year: yearProp,
  onYearChange,
  quarter: quarterProp,
  onQuarterChange,
  quarterlyTargetMode = "divide_equally",
  calculationType,
  variable1Name,
  variable1Unit,
  variable2Name,
  variable2Unit,
  approvalActionsBeforeSave = [],
  approvalActionsAfterSave = [],
  hideApprovalLockMessage = false,
  allowApprovalLockedEditing = false,
  quarterContent,
  rightColumnContent,
  onSave,
}: ProgressPanelProps) {
  const [internalYear, setInternalYear] = useState(1);
  const year = yearProp ?? internalYear;
  const setYear = onYearChange ?? setInternalYear;
  const [internalQuarter, setInternalQuarter] = useState(1);
  const quarter = quarterProp ?? internalQuarter;
  const setQuarter = onQuarterChange ?? setInternalQuarter;

  const yearTarget = annualTargets.find((t) => t.yearNo === year)?.targetValue ?? null;
  // Quarter target per the KPI's mode: cumulative annual*q/4, or the full annual.
  const quarterTarget = (q: number) => quarterTargetFor(yearTarget, q, quarterlyTargetMode);
  const targetLabel = quarterlyTargetMode === "use_annual" ? "Annual Target" : "Cumulative Target";
  // Leaf KPIs with a defined Variable 1 enter their value via variables.
  const variables =
    valueEditable && variable1Name
      ? {
          needsDivisor: unitNeedsDivisor(unit),
          v1Name: variable1Name,
          v1Unit: variable1Unit ?? null,
          v2Name: variable2Name ?? null,
          v2Unit: variable2Unit ?? null,
          kpiUnit: unit,
        }
      : null;
  const progressFor = (q: number) =>
    progress.find((p) => p.yearNo === year && p.quarterNo === q);
  // A computed quarter also stores what its engine divided. Label that pair by
  // provenance: a data source fed the KPI's own declared variables, while the
  // roll-up totalled sub-KPIs in whatever way calculationType prescribes.
  const computedVariablesFor = (row: QuarterProgress | undefined) => {
    if (valueEditable || !row || row.variable1Value == null) return null;
    if (row.valueSource === "data_source") {
      return {
        v1Label: variable1Name ?? "Numerator",
        v2Label: variable2Name ?? "Denominator",
      };
    }
    switch (calculationType) {
      // The combined types total what the sub-KPIs themselves divided, so the
      // pair IS this KPI's own Variable 1 ÷ Variable 2 — label it the way a
      // directly-fed row is labelled, not as progress-against-target.
      case "combined_percent":
      case "combined_ratio":
        return {
          v1Label: variable1Name ?? "Numerator",
          v2Label: variable2Name ?? "Denominator",
        };
      case "percent_of_total":
      case "ratio_of_total":
        return {
          v1Label: "Total sub-KPI progress",
          v2Label: "Total sub-KPI target",
          reverseCards: true,
        };
      case "simple_average":
        return { v1Label: "Total sub-KPI progress", v2Label: "Sub-KPIs with data" };
      case "weighted_sum":
        return { v1Label: "Weighted total", v2Label: "Divisor" };
      default:
        return { v1Label: "Numerator", v2Label: "Denominator" };
    }
  };
  const periodLocked = periods ? !isPeriodOpen(periods, year, quarter) : false;
  const approvalLock = approvalLockForState(approvalState);
  const effectiveReadOnly =
    readOnly || periodsLoading || periodLocked || (!!approvalLock?.locked && !allowApprovalLockedEditing);
  // Only decorate quarter tabs once real period data has loaded (20 rows).
  const hasPeriods = !!periods && periods.length > 0 && !periodsLoading;
  const openThisYear = hasPeriods ? openQuartersForYear(periods!, year) : [];
  const openQuarterLabel = openThisYear.length
    ? `Open this year: ${openThisYear.map((q) => `Q${q}`).join(", ")}`
    : "No quarters open this year — ask an admin to open one.";
  const readOnlyMessage = readOnlyReason ?? (approvalLock?.locked
    ? approvalLock.label
    : periodsLoading
      ? "Recording period status is loading. Data entry is temporarily disabled."
      : periodLocked
        ? `Year ${year} Quarter ${quarter} is closed for recording. Ask an admin to open it to enter progress.`
        : undefined);

  // Current value = latest quarter with an entered/computed value this year.
  const current = [...QUARTERS]
    .reverse()
    .map((q) => progressFor(q)?.progressValue)
    .find((v) => v != null);
  const pct = percentOfTarget(current ?? null, yearTarget);

  const yearTabs = YEARS.map((y) => ({
    id: String(y),
    label: startYear ? `Year ${y} · ${startYear + y - 1}` : `Year ${y}`,
  }));

  const hasThresholds = thresholdGreen != null && thresholdAmber != null;
  // Tint the Threshold card by this same annual pct — computed once and reused
  // by the card surface, the labels, and the status pill below.
  const health =
    hasThresholds && pct != null
      ? healthOf(pct, { green: thresholdGreen!, amber: thresholdAmber! })
      : null;
  const surface = health ? HEALTH_SURFACE[health] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-lg">
      <div className="flex flex-col gap-lg min-w-0">
        <Tabs items={yearTabs} active={String(year)} onChange={(id) => setYear(Number(id))} />

        {computedNote && (
          <div className="flex items-center gap-sm rounded-lg border border-hairline bg-surface-soft px-md py-sm text-caption-sm text-mute">
            <Badge tone="info">auto</Badge>
            {computedNote}
          </div>
        )}

        <Card className="overflow-hidden">
          {/* Boxed quarter tabs across the top of the single card. */}
          <div className="flex">
            {QUARTERS.map((q, i) => {
              const closed = hasPeriods && !isPeriodOpen(periods!, year, q);
              const quarterApprovalLock = approvalLockForState(approvalStatesByQuarter[q]);
              return (
                <button
                  key={q}
                  type="button"
                  aria-pressed={q === quarter}
                  onClick={() => setQuarter(q)}
                  className={cn(
                    "flex-1 px-md py-sm text-label-md text-center border-b border-hairline transition-colors",
                    i > 0 && "border-l border-hairline",
                    q === quarter
                      ? "bg-primary text-on-primary border-b-primary"
                      : closed
                        ? "bg-surface-soft text-mute hover:bg-surface-container-high"
                        : "bg-surface-lowest text-on-surface hover:bg-surface-soft",
                  )}
                >
                  <span className="inline-flex items-center justify-center gap-tiny">
                    {quarterApprovalLock?.locked ? (
                      <Icon name={quarterApprovalLock.icon} size={14} />
                    ) : closed ? (
                      <Icon name="lock" size={14} />
                    ) : null}
                    Quarter {q}
                    {quarterApprovalLock?.locked ? (
                      <span className="opacity-80">· {quarterApprovalLock.tabLabel}</span>
                    ) : closed ? (
                      <span className="opacity-80">· Closed</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {hasPeriods && (
            <div className="border-b border-hairline bg-surface-lowest px-md py-tiny text-caption-sm text-mute">
              {openQuarterLabel}
            </div>
          )}

          <QuarterEntry
            key={`${year}-${quarter}`}
            quarter={quarter}
            target={quarterTarget(quarter)}
            targetLabel={targetLabel}
            existing={progressFor(quarter)}
            prefill={previousQuarterProgress(progress, year, quarter)}
            valueEditable={valueEditable}
            unit={unit}
            variables={variables}
            computedVariables={computedVariablesFor(progressFor(quarter))}
            thresholds={
              hasThresholds ? { green: thresholdGreen!, amber: thresholdAmber! } : null
            }
            readOnly={effectiveReadOnly}
            readOnlyMessage={readOnlyMessage}
            approvalLock={approvalLock?.locked ? approvalLock : null}
            approvalActionsBeforeSave={approvalActionsBeforeSave}
            approvalActionsAfterSave={approvalActionsAfterSave}
            hideApprovalLockMessage={hideApprovalLockMessage}
            saving={saving}
            onSave={(data) => onSave(year, quarter, data)}
          />

          {quarterContent}
        </Card>
      </div>

      <div className="flex flex-col gap-lg">
        <Card className={surface?.card}>
          <CardHeader title="Threshold" subtitle={`Year ${year}`} className={surface?.card} />
          <CardBody className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <span className={cn("text-body-sm", surface?.muted ?? "text-mute")}>Annual target</span>
              <span className="text-body-strong text-on-surface">
                {yearTarget == null ? "—" : `${formatNumber(yearTarget, 2)} ${unit ?? ""}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-body-sm", surface?.muted ?? "text-mute")}>Current value</span>
              <span className="text-heading-md text-on-surface">
                {current == null ? "—" : `${formatNumber(current, 2)} ${unit ?? ""}`}
              </span>
            </div>

            <div className="flex flex-col gap-xs pt-xs border-t border-hairline">
              <div className="flex items-center justify-between">
                <span className={cn("text-body-sm", surface?.muted ?? "text-mute")}>Progress</span>
                <span className="text-body-strong text-on-surface">
                  {pct == null ? "—" : `${formatNumber(pct, 0)}% of target`}
                </span>
              </div>
              {hasThresholds ? (
                <ThresholdBar
                  value={pct ?? 0}
                  max={100}
                  thresholds={{ green: thresholdGreen, amber: thresholdAmber }}
                />
              ) : (
                <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-container"
                    style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
                  />
                </div>
              )}
              {health ? (
                <div className="pt-tiny">
                  <Badge tone={HEALTH_TONE[health]}>{HEALTH_LABEL[health]}</Badge>
                </div>
              ) : (
                <p className="text-caption-sm text-mute">
                  {pct == null ? "No data recorded yet." : "No thresholds configured."}
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {rightColumnContent}
      </div>
    </div>
  );
}

export interface QuarterEntryVariables {
  needsDivisor: boolean;
  v1Name: string;
  v1Unit: string | null;
  v2Name: string | null;
  v2Unit: string | null;
  kpiUnit: string | null;
}

/** Read-only labels for the numerator/denominator stored on a computed quarter.
 *  Display only — the values come from the saved row, never from this form. */
export interface QuarterEntryComputedVariables {
  v1Label: string;
  v2Label: string;
  /** Present the denominator-style target before the progress total. */
  reverseCards?: boolean;
}

export function QuarterEntry({
  quarter,
  target,
  targetLabel = "Cumulative Target",
  existing,
  prefill,
  valueEditable,
  unit,
  variables,
  computedVariables,
  thresholds,
  readOnly,
  readOnlyMessage,
  approvalLock,
  approvalActionsBeforeSave = [],
  approvalActionsAfterSave = [],
  hideApprovalLockMessage = false,
  saving,
  onSave,
}: {
  quarter: number;
  target: number | null;
  targetLabel?: string;
  existing?: QuarterProgress;
  /** Previous saved quarter (same year) used to pre-fill empty fields as an
   *  unsaved draft. Ignored when the field already has saved data or read-only. */
  prefill?: QuarterProgress | null;
  valueEditable: boolean;
  unit: string | null;
  /** When set (leaf KPI with defined variables), value is entered as V1 (+V2). */
  variables?: QuarterEntryVariables | null;
  /** When set (computed quarter with stored variables), show them read-only. */
  computedVariables?: QuarterEntryComputedVariables | null;
  /** Percent cutoffs used to colour the computed value by status. Null when the
   *  KPI has none configured. */
  thresholds?: Thresholds | null;
  readOnly: boolean;
  readOnlyMessage?: string;
  approvalLock?: ApprovalLockInfo | null;
  approvalActionsBeforeSave?: QuarterEntryAction[];
  approvalActionsAfterSave?: QuarterEntryAction[];
  hideApprovalLockMessage?: boolean;
  saving: boolean;
  onSave: (data: {
    progressValue: number | null;
    variable1Value?: number | null;
    variable2Value?: number | null;
    issue: string;
    solution: string;
  }) => void;
}) {
  // Pre-fill empty fields from the previous saved quarter (unsaved draft). Never
  // seed a locked/closed quarter. `existing` remains the real saved row for all
  // "matches saved" checks below, so Save/Submit gating is unaffected.
  const seedFrom = readOnly ? null : prefill ?? null;
  const seedNum = (own: number | null | undefined, fallback: number | null | undefined) =>
    own != null ? String(own) : fallback != null ? String(fallback) : "";
  const seedText = (own: string | null | undefined, fallback: string | null | undefined) =>
    own?.trim() ? own : fallback ?? "";

  const [value, setValue] = useState<string>(
    seedNum(existing?.progressValue, seedFrom?.progressValue),
  );
  const [var1Str, setVar1Str] = useState<string>(
    seedNum(existing?.variable1Value, seedFrom?.variable1Value),
  );
  const [var2Str, setVar2Str] = useState<string>(
    seedNum(existing?.variable2Value, seedFrom?.variable2Value),
  );
  const [issue, setIssue] = useState(seedText(existing?.issue, seedFrom?.issue));
  const [solution, setSolution] = useState(seedText(existing?.solution, seedFrom?.solution));

  // True when the previous quarter actually populated a currently-unsaved field.
  const prefilledFromQuarter =
    seedFrom &&
    ((!existing?.issue?.trim() && !!seedFrom.issue?.trim()) ||
      (!existing?.solution?.trim() && !!seedFrom.solution?.trim()) ||
      (valueEditable &&
        existing?.progressValue == null &&
        (seedFrom.progressValue != null ||
          seedFrom.variable1Value != null ||
          seedFrom.variable2Value != null)))
      ? seedFrom.quarterNo
      : null;

  const normalizeSavedNumber = (n: number | null | undefined) => n ?? null;
  const numbersMatch = (a: number | null, b: number | null | undefined) =>
    a === normalizeSavedNumber(b);

  const v1Num = var1Str === "" ? null : Number(var1Str);
  const v2Num = var2Str === "" ? null : Number(var2Str);
  const computedValue = variables ? kpiValueFromVariables(variables.kpiUnit, v1Num, v2Num) : null;

  // Colour the computed result by how far this quarter got against its OWN
  // target — the same legend as the Threshold card and the quarter matrix, which
  // also divides by the quarter target. healthOf is not null-safe, so guard
  // first (mirrors healthForPercent in AnnualQuarterProgressMatrix).
  const computedPct = percentOfTarget(existing?.progressValue ?? null, target);
  const computedHealth =
    thresholds && computedPct != null ? healthOf(computedPct, thresholds) : null;

  const variablesFilled =
    !variables ||
    (var1Str.trim() !== "" && (!variables.needsDivisor || var2Str.trim() !== ""));
  const canSave =
    !readOnly && issue.trim().length > 0 && solution.trim().length > 0 && variablesFilled;
  const textMatchesSaved =
    issue.trim() === (existing?.issue ?? "").trim() &&
    solution.trim() === (existing?.solution ?? "").trim();
  const valuesMatchSaved = variables
    ? numbersMatch(v1Num, existing?.variable1Value) &&
      (!variables.needsDivisor || numbersMatch(v2Num, existing?.variable2Value))
    : !valueEditable || numbersMatch(value === "" ? null : Number(value), existing?.progressValue);
  const savedDataComplete =
    !!existing &&
    (existing.issue ?? "").trim().length > 0 &&
    (existing.solution ?? "").trim().length > 0 &&
    (!variables ||
      (existing.variable1Value != null &&
        (!variables.needsDivisor || existing.variable2Value != null)));
  const readyForApprovalAction = savedDataComplete && textMatchesSaved && valuesMatchSaved;

  const emitSave = () =>
    onSave(
      variables
        ? {
            progressValue: computedValue,
            variable1Value: v1Num,
            variable2Value: variables.needsDivisor ? v2Num : null,
            issue: issue.trim(),
            solution: solution.trim(),
          }
        : {
            progressValue:
              valueEditable && value !== "" ? Number(value) : existing?.progressValue ?? null,
            issue: issue.trim(),
            solution: solution.trim(),
          },
    );
  const renderAction = (action: QuarterEntryAction) => {
    const needsSavedData = action.requiresSavedData && !readyForApprovalAction;
    return (
      <Button
        key={action.key}
        icon={action.icon}
        variant={action.variant ?? "outline"}
        className={action.className}
        disabled={action.disabled || needsSavedData}
        title={needsSavedData ? "Save the current quarter data before submitting." : action.title}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    );
  };
  const hasApprovalActions =
    approvalActionsBeforeSave.length > 0 || approvalActionsAfterSave.length > 0;

  return (
    <CardBody className="flex flex-col gap-lg border-b border-hairline bg-surface-soft">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-md text-on-surface">Q{quarter} Data Entry</h3>
          <p className="text-caption-sm text-mute mt-tiny">
            {target == null ? "No target" : `${targetLabel}: ${formatNumber(target, 2)} ${unit ?? ""}`}
          </p>
        </div>

        {(approvalLock?.locked || !readOnly || hasApprovalActions) && (
          <div className="flex max-w-full flex-wrap items-center justify-end gap-sm sm:max-w-[680px]">
            {approvalActionsBeforeSave.map(renderAction)}
            {approvalLock?.locked && !hideApprovalLockMessage ? (
              <div
                className={cn(
                  "inline-flex max-w-full items-center gap-sm rounded-DEFAULT bg-surface-soft px-md py-sm text-body-sm sm:max-w-[420px] sm:text-right",
                  approvalLock.tone === "success" ? "text-[#2f6500]" : "text-[#8a4b00]",
                )}
              >
                <Icon name={approvalLock.icon} size={18} className="shrink-0" />
                <span>{approvalLock.label}</span>
              </div>
            ) : !readOnly ? (
              <Button
                icon="save"
                className="rounded-xl bg-sky-400 text-slate-950 hover:bg-sky-500 disabled:bg-sky-400 disabled:text-slate-950 disabled:opacity-60"
                disabled={!canSave || saving}
                onClick={emitSave}
              >
                {saving ? "Saving…" : `Save Q${quarter}`}
              </Button>
            ) : null}
            {approvalActionsAfterSave.map(renderAction)}
          </div>
        )}
      </div>

      {readOnlyMessage && (!approvalLock?.locked || readOnlyMessage !== approvalLock.label) && (
        <div className="rounded border border-hairline bg-surface-soft px-md py-sm text-body-sm text-mute">
          {readOnlyMessage}
        </div>
      )}

      {prefilledFromQuarter != null && (
        <div className="flex items-center gap-sm rounded-DEFAULT border border-hairline bg-surface-soft px-md py-sm text-caption-sm text-mute">
          <Badge tone="info">draft</Badge>
          Pre-filled from Q{prefilledFromQuarter} — review, adjust, and Save. Nothing is
          recorded until you save.
        </div>
      )}

      {variables ? (
        <div className="flex flex-col gap-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            <div className="flex flex-col gap-xs">
              <span className="text-label-md text-on-surface">
                {variables.v1Name}
                {variables.v1Unit ? ` (${variables.v1Unit})` : ""}
              </span>
              <Input
                type="number"
                step="0.01"
                value={var1Str}
                disabled={readOnly}
                onChange={(e) => setVar1Str(e.target.value)}
                placeholder="Enter Variable 1"
              />
            </div>
            {variables.needsDivisor && (
              <div className="flex flex-col gap-xs">
                <span className="text-label-md text-on-surface">
                  {variables.v2Name ?? "Variable 2"}
                  {variables.v2Unit ? ` (${variables.v2Unit})` : ""}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={var2Str}
                  disabled={readOnly}
                  onChange={(e) => setVar2Str(e.target.value)}
                  placeholder="Enter Variable 2"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-DEFAULT border border-hairline bg-surface-lowest px-md py-sm">
            <span className="text-body-sm text-mute">Computed value (Cumulative)</span>
            <span className="text-body-strong text-on-surface">
              {computedValue == null ? "—" : `${formatNumber(computedValue, 2)} ${unit ?? ""}`}
            </span>
          </div>
        </div>
      ) : computedVariables && existing?.variable1Value != null ? (
        // A computed quarter shows what its engine divided alongside the result,
        // so the value reads as "319 of 300" rather than a bare number. The
        // divisor is absent for calculations that have none (weighted_sum).
        <div
          className={cn(
            "grid gap-lg",
            existing.variable2Value != null
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {computedVariables.reverseCards && existing.variable2Value != null && (
            <StatCard
              tone="soft"
              className="shadow-chrome"
              label={computedVariables.v2Label}
              value={formatNumber(existing.variable2Value, 2)}
            />
          )}
          <StatCard
            tone="soft"
            className="shadow-chrome"
            label={computedVariables.v1Label}
            value={formatNumber(existing.variable1Value, 2)}
          />
          {!computedVariables.reverseCards && existing.variable2Value != null && (
            <StatCard
              tone="soft"
              className="shadow-chrome"
              label={computedVariables.v2Label}
              value={formatNumber(existing.variable2Value, 2)}
            />
          )}
          <StatCard
            // No thresholds, no target or no value => status unknown, so stay
            // neutral rather than asserting "On Target" without evidence.
            tone={computedHealth ?? "default"}
            className="shadow-chrome"
            label="Computed value (Cumulative)"
            value={
              existing.progressValue == null ? "—" : formatNumber(existing.progressValue, 2)
            }
            unit={existing.progressValue == null ? undefined : unit ?? undefined}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-xs text-right">
          <span className="text-body-sm font-bold text-on-surface">
            {valueEditable ? "Progress value (Cumulative)" : "Computed value (Cumulative)"}
          </span>
          {valueEditable ? (
            <Input
              type="number"
              step="0.01"
              value={value}
              disabled={readOnly}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter recorded value"
            />
          ) : (
            <div className="flex h-[36px] items-center justify-end rounded-DEFAULT border border-hairline bg-surface-soft px-md text-body-md font-bold text-on-surface">
              {existing?.progressValue == null
                ? "— (awaiting sub-KPI data)"
                : `${formatNumber(existing.progressValue, 2)} ${unit ?? ""}`}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <RequiredArea
          label="Issue / difficulty"
          value={issue}
          onChange={setIssue}
          readOnly={readOnly}
          placeholder="Problem or difficulty getting this data"
        />
        <RequiredArea
          label="Solution"
          value={solution}
          onChange={setSolution}
          readOnly={readOnly}
          placeholder="How it will be addressed"
        />
      </div>
    </CardBody>
  );
}

function RequiredArea({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface">{label}</span>
        <span className="text-caption-sm text-error">*Required</span>
      </div>
      <textarea
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-md py-sm bg-surface-lowest rounded-DEFAULT border border-hairline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none text-body-sm text-on-surface placeholder:text-stone disabled:bg-surface-soft"
        placeholder={placeholder}
      />
    </div>
  );
}
