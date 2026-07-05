"use client";

import { useEffect, useRef, useState } from "react";
import {
  Modal,
  CardHeader,
  CardBody,
  Badge,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { cn, formatNumber } from "@/lib/utils";
import { targetForYear, percentOfTarget, HEALTH_TONE } from "@/lib/kpi/progress";
import { firstOpenQuarter, isPeriodOpen } from "@/lib/kpi/performancePeriods";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSaveMetricProgress } from "@/lib/data/hooks";
import type { PerformancePeriod, PerfMetric } from "@/lib/types";
import { QuarterEntry } from "./ProgressPanel";

const QUARTERS = [1, 2, 3, 4];

export function MetricProgressModal({
  metric,
  perfKpiId,
  year,
  onClose,
  periods,
  periodsLoading = false,
}: {
  metric: PerfMetric;
  perfKpiId: number;
  year: number;
  onClose: () => void;
  periods?: PerformancePeriod[];
  periodsLoading?: boolean;
}) {
  const { user } = useAuth();
  // Land on the first OPEN quarter for this year (fallback Q1) so users don't
  // open onto a locked quarter. Only auto-select until the user manually picks.
  const [quarter, setQuarter] = useState(
    () => (periods ? firstOpenQuarter(periods, year) : null) ?? 1,
  );
  const userPickedQuarter = useRef(false);
  useEffect(() => {
    if (userPickedQuarter.current) return;
    const firstOpen = periods ? firstOpenQuarter(periods, year) : null;
    if (firstOpen != null) setQuarter(firstOpen);
  }, [periods, year]);
  const pickQuarter = (q: number) => {
    userPickedQuarter.current = true;
    setQuarter(q);
  };
  const save = useSaveMetricProgress(metric.id, perfKpiId);

  const yearTarget = targetForYear(metric.annualTargets, year);
  // Accumulated quarter target: running sum of (yearTarget / 4) through quarter q —
  // same formula as the full-page ProgressPanel.
  const quarterTarget = (q: number) => (yearTarget == null ? null : (yearTarget * q) / 4);
  const progressFor = (q: number) =>
    metric.progress?.find((p) => p.yearNo === year && p.quarterNo === q);

  // Threshold section is scoped to the selected quarter (not "latest in year") —
  // the pop-up only shows one quarter at a time.
  const target = quarterTarget(quarter);
  const current = progressFor(quarter)?.progressValue ?? null;
  const pct = percentOfTarget(current, target);
  const hasThresholds = metric.thresholdGreen != null && metric.thresholdAmber != null;
  const periodLocked = periods ? !isPeriodOpen(periods, year, quarter) : false;
  const hasPeriods = !!periods && periods.length > 0 && !periodsLoading;
  const readOnlyMessage = periodsLoading
    ? "Recording period status is loading. Data entry is temporarily disabled."
    : periodLocked
      ? `Year ${year} Quarter ${quarter} is closed for recording. Ask an admin to open it to enter progress.`
      : undefined;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={metric.name}
      subtitle={`Quarterly progress · Year ${year}`}
    >
      <div className="flex flex-col gap-lg">
        <div className="overflow-hidden rounded-lg border border-hairline">
          {/* Boxed quarter tabs, matching the full-page ProgressPanel. */}
          <div className="flex">
            {QUARTERS.map((q, i) => {
              const closed = hasPeriods && !isPeriodOpen(periods!, year, q);
              return (
                <button
                  key={q}
                  type="button"
                  aria-selected={q === quarter}
                  onClick={() => pickQuarter(q)}
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

          <QuarterEntry
            key={quarter}
            quarter={quarter}
            target={target}
            existing={progressFor(quarter)}
            valueEditable
            unit={metric.unit}
            readOnly={periodsLoading || periodLocked}
            readOnlyMessage={readOnlyMessage}
            saving={save.isPending}
            onSave={(data) =>
              save.mutate({ ...data, yearNo: year, quarterNo: quarter, recordedBy: user?.email })
            }
          />
        </div>

        <div className="rounded-lg border border-hairline overflow-hidden">
          <CardHeader title="Threshold Setting" subtitle={`Quarter ${quarter}`} />
          <CardBody className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Quarter target</span>
              <span className="text-body-strong text-on-surface">
                {target == null ? "—" : `${formatNumber(target, 2)} ${metric.unit ?? ""}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Current value</span>
              <span className="text-heading-md text-on-surface">
                {current == null ? "—" : `${formatNumber(current, 2)} ${metric.unit ?? ""}`}
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
                  thresholds={{ green: metric.thresholdGreen!, amber: metric.thresholdAmber! }}
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
                  <Badge
                    tone={
                      HEALTH_TONE[
                        healthOf(pct, { green: metric.thresholdGreen!, amber: metric.thresholdAmber! })
                      ]
                    }
                  >
                    {
                      HEALTH_LABEL[
                        healthOf(pct, { green: metric.thresholdGreen!, amber: metric.thresholdAmber! })
                      ]
                    }
                  </Badge>
                </div>
              ) : (
                <p className="text-caption-sm text-mute">
                  {pct == null ? "No data recorded yet." : "No thresholds configured."}
                </p>
              )}
            </div>
          </CardBody>
        </div>
      </div>
    </Modal>
  );
}
