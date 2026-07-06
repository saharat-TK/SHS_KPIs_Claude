"use client";

import {
  Modal,
  CardHeader,
  CardBody,
  Badge,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import { targetForYear, percentOfTarget, quarterTargetFor, HEALTH_TONE } from "@/lib/kpi/progress";
import { isPeriodOpen } from "@/lib/kpi/performancePeriods";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSaveMetricProgress } from "@/lib/data/hooks";
import type { PerformancePeriod, PerfMetric, QuarterlyTargetMode } from "@/lib/types";
import { QuarterEntry } from "./ProgressPanel";

export function MetricProgressModal({
  metric,
  perfKpiId,
  year,
  quarter,
  quarterlyTargetMode = "divide_equally",
  onClose,
  periods,
  periodsLoading = false,
}: {
  metric: PerfMetric;
  perfKpiId: number;
  year: number;
  quarter: number;
  /** Inherited from the parent KPI — governs how the quarter target is derived. */
  quarterlyTargetMode?: QuarterlyTargetMode;
  onClose: () => void;
  periods?: PerformancePeriod[];
  periodsLoading?: boolean;
}) {
  const { user } = useAuth();
  const save = useSaveMetricProgress(metric.id, perfKpiId);

  const yearTarget = targetForYear(metric.annualTargets, year);
  // Quarter target per the parent KPI's mode: cumulative annual*q/4 or full annual.
  const quarterTarget = (q: number) => quarterTargetFor(yearTarget, q, quarterlyTargetMode);
  const targetLabel = quarterlyTargetMode === "use_annual" ? "Annual Target" : "Cumulative Target";
  const progressFor = (q: number) =>
    metric.progress?.find((p) => p.yearNo === year && p.quarterNo === q);

  // Threshold section is scoped to the selected quarter (not "latest in year") —
  // the pop-up only shows one quarter at a time.
  const target = quarterTarget(quarter);
  const current = progressFor(quarter)?.progressValue ?? null;
  const pct = percentOfTarget(current, target);
  const hasThresholds = metric.thresholdGreen != null && metric.thresholdAmber != null;
  const periodLocked = periods ? !isPeriodOpen(periods, year, quarter) : false;
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
      subtitle={`Quarterly progress · Year ${year} · Quarter ${quarter}`}
    >
      <div className="flex flex-col gap-lg">
        <div className="overflow-hidden rounded-lg border border-hairline">
          <div className="border-b border-hairline bg-surface-lowest px-md py-sm">
            <span className="text-label-md text-on-surface">Quarter {quarter}</span>
          </div>

          <QuarterEntry
            key={`${year}-${quarter}`}
            quarter={quarter}
            target={target}
            targetLabel={targetLabel}
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
