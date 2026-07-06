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
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { cn, formatNumber } from "@/lib/utils";
import { percentOfTarget, HEALTH_TONE } from "@/lib/kpi/progress";
import { isPeriodOpen, openQuartersForYear } from "@/lib/kpi/performancePeriods";
import type { AnnualTarget, PerformancePeriod, QuarterProgress } from "@/lib/types";

const QUARTERS = [1, 2, 3, 4];
const YEARS = [1, 2, 3, 4, 5];

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
  quarterContent?: React.ReactNode;
  rightColumnContent?: React.ReactNode;
  onSave: (
    yearNo: number,
    quarterNo: number,
    data: { progressValue: number | null; issue: string; solution: string },
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
  periods,
  periodsLoading = false,
  saving,
  year: yearProp,
  onYearChange,
  quarter: quarterProp,
  onQuarterChange,
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
  // Accumulated quarter target: running sum of (yearTarget / 4) through quarter q.
  const quarterTarget = (q: number) => (yearTarget == null ? null : (yearTarget * q) / 4);
  const progressFor = (q: number) =>
    progress.find((p) => p.yearNo === year && p.quarterNo === q);
  const periodLocked = periods ? !isPeriodOpen(periods, year, quarter) : false;
  const effectiveReadOnly = readOnly || periodsLoading || periodLocked;
  // Only decorate quarter tabs once real period data has loaded (20 rows).
  const hasPeriods = !!periods && periods.length > 0 && !periodsLoading;
  const openThisYear = hasPeriods ? openQuartersForYear(periods!, year) : [];
  const openQuarterLabel = openThisYear.length
    ? `Open this year: ${openThisYear.map((q) => `Q${q}`).join(", ")}`
    : "No quarters open this year — ask an admin to open one.";
  const readOnlyMessage = periodsLoading
    ? "Recording period status is loading. Data entry is temporarily disabled."
    : periodLocked
      ? `Year ${year} Quarter ${quarter} is closed for recording. Ask an admin to open it to enter progress.`
      : undefined;

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
                    {closed && <Icon name="lock" size={14} />}
                    Quarter {q}
                    {closed && <span className="opacity-80">· Closed</span>}
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
            existing={progressFor(quarter)}
            valueEditable={valueEditable}
            unit={unit}
            readOnly={effectiveReadOnly}
            readOnlyMessage={readOnlyMessage}
            saving={saving}
            onSave={(data) => onSave(year, quarter, data)}
          />

          {quarterContent}
        </Card>
      </div>

      <div className="flex flex-col gap-lg">
        <Card>
          <CardHeader title="Threshold" subtitle={`Year ${year}`} />
          <CardBody className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Annual target</span>
              <span className="text-body-strong text-on-surface">
                {yearTarget == null ? "—" : `${formatNumber(yearTarget, 2)} ${unit ?? ""}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Current value</span>
              <span className="text-heading-md text-on-surface">
                {current == null ? "—" : `${formatNumber(current, 2)} ${unit ?? ""}`}
              </span>
            </div>

            <div className="flex flex-col gap-xs pt-xs border-t border-hairline">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-mute">Progress</span>
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
              {hasThresholds && pct != null ? (
                <div className="pt-tiny">
                  <Badge tone={HEALTH_TONE[healthOf(pct, { green: thresholdGreen, amber: thresholdAmber })]}>
                    {HEALTH_LABEL[healthOf(pct, { green: thresholdGreen, amber: thresholdAmber })]}
                  </Badge>
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

export function QuarterEntry({
  quarter,
  target,
  existing,
  valueEditable,
  unit,
  readOnly,
  readOnlyMessage,
  saving,
  onSave,
}: {
  quarter: number;
  target: number | null;
  existing?: QuarterProgress;
  valueEditable: boolean;
  unit: string | null;
  readOnly: boolean;
  readOnlyMessage?: string;
  saving: boolean;
  onSave: (data: { progressValue: number | null; issue: string; solution: string }) => void;
}) {
  const [value, setValue] = useState<string>(
    existing?.progressValue != null ? String(existing.progressValue) : "",
  );
  const [issue, setIssue] = useState(existing?.issue ?? "");
  const [solution, setSolution] = useState(existing?.solution ?? "");

  const canSave = !readOnly && issue.trim().length > 0 && solution.trim().length > 0;

  return (
    <CardBody className="flex flex-col gap-lg border-b border-hairline bg-surface-soft">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-md text-on-surface">Q{quarter} Data Entry</h3>
          <p className="text-caption-sm text-mute mt-tiny">
            {target == null ? "No target" : `Cumulative Target: ${formatNumber(target, 2)} ${unit ?? ""}`}
          </p>
        </div>

        {!readOnly && (
          <Button
            icon="save"
            disabled={!canSave || saving}
            onClick={() =>
              onSave({
                progressValue:
                  valueEditable && value !== "" ? Number(value) : existing?.progressValue ?? null,
                issue: issue.trim(),
                solution: solution.trim(),
              })
            }
          >
            {saving ? "Saving…" : `Save Q${quarter}`}
          </Button>
        )}
      </div>

      {readOnlyMessage && (
        <div className="rounded border border-hairline bg-surface-soft px-md py-sm text-body-sm text-mute">
          {readOnlyMessage}
        </div>
      )}

      <div className="flex flex-col gap-xs">
        <span className="text-label-md text-on-surface">
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
          <div className="flex h-[36px] items-center rounded-DEFAULT border border-hairline bg-surface-soft px-md text-body-sm text-mute">
            {existing?.progressValue == null
              ? "— (awaiting sub-KPI data)"
              : `${formatNumber(existing.progressValue, 2)} ${unit ?? ""}`}
          </div>
        )}
      </div>

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
