"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Field,
  Input,
  Tabs,
  Badge,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import type { AnnualTarget, QuarterProgress } from "@/lib/types";

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
  saving: boolean;
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
  saving,
  onSave,
}: ProgressPanelProps) {
  const [year, setYear] = useState(1);

  const yearTarget = annualTargets.find((t) => t.yearNo === year)?.targetValue ?? null;
  // Accumulated quarter target: running sum of (yearTarget / 4) through quarter q.
  const quarterTarget = (q: number) => (yearTarget == null ? null : (yearTarget * q) / 4);
  const progressFor = (q: number) =>
    progress.find((p) => p.yearNo === year && p.quarterNo === q);

  // Current value = latest quarter with an entered/computed value this year.
  const current = [...QUARTERS]
    .reverse()
    .map((q) => progressFor(q)?.progressValue)
    .find((v) => v != null);

  const tabs = YEARS.map((y) => ({
    id: String(y),
    label: startYear ? `Year ${y} · ${startYear + y - 1}` : `Year ${y}`,
  }));

  const hasThresholds = thresholdGreen != null && thresholdAmber != null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-lg">
      <div className="flex flex-col gap-lg min-w-0">
        <Tabs items={tabs} active={String(year)} onChange={(id) => setYear(Number(id))} />

        {computedNote && (
          <div className="flex items-center gap-sm rounded-lg border border-hairline bg-surface-soft px-md py-sm text-caption-sm text-mute">
            <Badge tone="info">auto</Badge>
            {computedNote}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          {QUARTERS.map((q) => (
            <QuarterCard
              key={`${year}-${q}`}
              quarter={q}
              target={quarterTarget(q)}
              existing={progressFor(q)}
              valueEditable={valueEditable}
              unit={unit}
              readOnly={readOnly}
              saving={saving}
              onSave={(data) => onSave(year, q, data)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-lg">
        <Card>
          <CardHeader title="Threshold Setting" subtitle={`Current value · Year ${year}`} />
          <CardBody className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Current value</span>
              <span className="text-heading-md text-on-surface">
                {current == null ? "—" : `${formatNumber(current, 2)} ${unit ?? ""}`}
              </span>
            </div>
            {hasThresholds ? (
              <>
                <ThresholdBar
                  value={current ?? 0}
                  thresholds={{ green: thresholdGreen, amber: thresholdAmber }}
                />
                <p className="text-caption-sm text-mute">
                  {current == null
                    ? "No data recorded yet."
                    : HEALTH_LABEL[healthOf(current, { green: thresholdGreen, amber: thresholdAmber })]}
                </p>
              </>
            ) : (
              <p className="text-caption-sm text-mute">No thresholds configured for this item.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function QuarterCard({
  quarter,
  target,
  existing,
  valueEditable,
  unit,
  readOnly,
  saving,
  onSave,
}: {
  quarter: number;
  target: number | null;
  existing?: QuarterProgress;
  valueEditable: boolean;
  unit: string | null;
  readOnly: boolean;
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
    <Card>
      <CardHeader
        title={`Quarter ${quarter}`}
        subtitle={target == null ? "No target" : `Target ${formatNumber(target, 2)} ${unit ?? ""}`}
      />
      <CardBody className="flex flex-col gap-md">
        <Field label={valueEditable ? "Progress value" : "Computed value"}>
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
            <div className="flex h-[36px] items-center rounded-DEFAULT border border-hairline bg-surface-soft px-md text-body-sm">
              {existing?.progressValue == null
                ? "— (awaiting sub-KPI data)"
                : `${formatNumber(existing.progressValue, 2)} ${unit ?? ""}`}
            </div>
          )}
        </Field>

        <Field label="Issue / difficulty" hint="Required">
          <textarea
            value={issue}
            disabled={readOnly}
            onChange={(e) => setIssue(e.target.value)}
            rows={2}
            className="w-full px-md py-sm bg-surface-lowest rounded-DEFAULT border border-hairline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none text-body-sm text-on-surface placeholder:text-stone disabled:bg-surface-soft"
            placeholder="Problem or difficulty getting this data"
          />
        </Field>
        <Field label="Solution" hint="Required">
          <textarea
            value={solution}
            disabled={readOnly}
            onChange={(e) => setSolution(e.target.value)}
            rows={2}
            className="w-full px-md py-sm bg-surface-lowest rounded-DEFAULT border border-hairline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none text-body-sm text-on-surface placeholder:text-stone disabled:bg-surface-soft"
            placeholder="How it will be addressed"
          />
        </Field>

        {!readOnly && (
          <div className="flex justify-end">
            <Button
              size="sm"
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
              Save Q{quarter}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
