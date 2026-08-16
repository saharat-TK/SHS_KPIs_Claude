"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Drawer,
  QueryBoundary,
  StatusPill,
  ThresholdBar,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { usePerfKpi, usePerfMetricsByKpi, useKpiApproval } from "@/lib/data/hooks";
import {
  targetForYear,
  quarterTargetFor,
  percentOfTarget,
  valueAsOfQuarter,
  healthOf,
  HEALTH_TONE,
  HEALTH_LABEL,
} from "@/lib/kpi/progress";
import type { ApprovalState, PerfKpi, PerfMetric, QuarterProgress } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { AnnualQuarterProgressMatrix } from "@/app/(app)/kpi-management/performance/[recordId]/kpis/[perfKpiId]/AnnualQuarterProgressMatrix";

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-md">
      <span className="text-body-sm text-mute">{label}</span>
      <span className={strong ? "text-heading-md text-on-surface" : "text-body-strong text-on-surface"}>
        {value}
      </span>
    </div>
  );
}

function amount(value: number | null, unit: string | null | undefined): string {
  return value == null ? "—" : `${formatNumber(value, 2)} ${unit ?? ""}`.trim();
}

function ProgressReadout({
  pct,
  thresholdGreen,
  thresholdAmber,
}: {
  pct: number | null;
  thresholdGreen: number | null | undefined;
  thresholdAmber: number | null | undefined;
}) {
  const hasThresholds = thresholdGreen != null && thresholdAmber != null;
  const health =
    hasThresholds && pct != null ? healthOf(pct, { green: thresholdGreen, amber: thresholdAmber }) : null;

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-mute">Progress</span>
        <span className="text-body-strong text-on-surface">
          {pct == null ? "—" : `${formatNumber(pct, 0)}% of target`}
        </span>
      </div>
      {hasThresholds && pct != null ? (
        <ThresholdBar value={pct} max={100} thresholds={{ green: thresholdGreen, amber: thresholdAmber }} />
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
  );
}

function quarterRow(
  progress: QuarterProgress[] | undefined,
  year: number,
  quarter: number,
): QuarterProgress | null {
  return progress?.find((p) => p.yearNo === year && p.quarterNo === quarter) ?? null;
}

function TargetVsActual({ kpi, year, quarter }: { kpi: PerfKpi; year: number; quarter: number }) {
  const annualTarget = targetForYear(kpi.annualTargets, year);
  const quarterTarget = quarterTargetFor(annualTarget, quarter, kpi.quarterlyTargetMode);

  const exact = quarterRow(kpi.progress, year, quarter)?.progressValue ?? null;
  const carried = exact == null ? valueAsOfQuarter(kpi.progress, year, quarter) : null;
  const pct = percentOfTarget(exact ?? carried, quarterTarget);

  return (
    <Card>
      <CardHeader title="Target vs actual" subtitle={`Year ${year} · Q${quarter}`} />
      <CardBody className="flex flex-col gap-md">
        <Row label={`Annual target (Y${year})`} value={amount(annualTarget, kpi.unit)} />
        <Row label={`Q${quarter} target`} value={amount(quarterTarget, kpi.unit)} />
        <Row label="Recorded value" value={amount(exact, kpi.unit)} strong />
        {carried != null && (
          <p className="-mt-xs text-caption-sm text-mute">
            No value recorded this quarter. Latest reading is {amount(carried, kpi.unit)}, carried
            forward for the progress figure below.
          </p>
        )}
        <div className="border-t border-hairline pt-sm">
          <ProgressReadout
            pct={pct}
            thresholdGreen={kpi.thresholdGreen}
            thresholdAmber={kpi.thresholdAmber}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function IssueAndSolution({ kpi, year, quarter }: { kpi: PerfKpi; year: number; quarter: number }) {
  const row = quarterRow(kpi.progress, year, quarter);
  const issue = row?.issue?.trim();
  const solution = row?.solution?.trim();

  return (
    <Card>
      <CardHeader title="Issue & solution" subtitle={`Recorded for Q${quarter}`} />
      <CardBody className="flex flex-col gap-md">
        {!issue && !solution ? (
          <p className="text-body-sm text-mute">Nothing recorded for this quarter.</p>
        ) : (
          <>
            <div className="flex flex-col gap-xs">
              <p className="text-label-md text-on-surface">Issue</p>
              <p className="text-body-sm text-on-surface whitespace-pre-line">{issue || "—"}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="text-label-md text-on-surface">Solution</p>
              <p className="text-body-sm text-on-surface whitespace-pre-line">{solution || "—"}</p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function SubMetrics({
  kpi,
  metrics,
  year,
  quarter,
}: {
  kpi: PerfKpi;
  metrics: PerfMetric[];
  year: number;
  quarter: number;
}) {
  return (
    <Card>
      <CardHeader title="Sub-KPIs" subtitle={`${metrics.length} contributing`} />
      <CardBody className="flex flex-col gap-sm">
        {metrics.map((m, index) => {
          const annualTarget = targetForYear(m.annualTargets, year);
          const qTarget = quarterTargetFor(annualTarget, quarter, kpi.quarterlyTargetMode);
          const current = quarterRow(m.progress, year, quarter)?.progressValue ?? null;
          const pct = percentOfTarget(current, qTarget);

          return (
            <div key={m.id} className="rounded-lg border border-hairline bg-surface-soft p-md">
              <div className="flex items-start gap-sm">
                <Badge tone="neutral">M{index + 1}</Badge>
                <span className="text-body-sm font-medium text-on-surface">{m.name}</span>
              </div>
              <div className="mt-sm flex flex-col gap-xs">
                <Row label={`Q${quarter} target`} value={amount(qTarget, m.unit)} />
                <Row label="Recorded" value={amount(current, m.unit)} />
              </div>
              <div className="mt-sm">
                <ProgressReadout
                  pct={pct}
                  thresholdGreen={m.thresholdGreen}
                  thresholdAmber={m.thresholdAmber}
                />
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}

export function DashboardKpiDrawer({
  kpiId,
  recordId,
  year,
  quarter,
  onClose,
}: {
  kpiId: number | null;
  recordId: number;
  year: number;
  quarter: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const kpiQ = usePerfKpi(kpiId ?? 0);
  const metricsQ = usePerfMetricsByKpi(kpiId ?? 0);
  const approvalQ = useKpiApproval(kpiId ?? 0, year, quarter);

  const kpi = kpiQ.data;
  const metrics = metricsQ.data ?? [];
  const approval = approvalQ.data?.approval;

  const annualTarget = kpi ? targetForYear(kpi.annualTargets, year) : null;
  const quarterTarget = kpi ? quarterTargetFor(annualTarget, quarter, kpi.quarterlyTargetMode) : null;
  const value = kpi ? valueAsOfQuarter(kpi.progress, year, quarter) : null;
  const pct = percentOfTarget(value, quarterTarget);
  const hasThresholds = kpi?.thresholdGreen != null && kpi?.thresholdAmber != null;
  const health =
    hasThresholds && pct != null
      ? healthOf(pct, { green: kpi!.thresholdGreen!, amber: kpi!.thresholdAmber! })
      : null;

  const recordUrl = kpiId && recordId ? `/kpi-management/performance/${recordId}/kpis/${kpiId}` : null;

  return (
    <Drawer
      open={kpiId != null}
      onClose={onClose}
      title={kpi?.name ?? "KPI Details"}
      subtitle={kpi ? `${kpi.committeeId ? `${kpi.committeeId} · ` : ""}Year ${year} · Q${quarter}` : undefined}
      headerActions={
        recordUrl && (
          <Link
            href={recordUrl}
            aria-label="Open full KPI performance record"
            title="Open full KPI performance record"
            className="text-mute hover:text-on-surface rounded p-xs hover:bg-surface-soft transition-colors"
          >
            <Icon name="open_in_new" size={20} />
          </Link>
        )
      }
      headerExtra={
        kpi && (
          <div className="flex flex-wrap items-center gap-sm">
            {health ? (
              <Badge tone={HEALTH_TONE[health]}>{HEALTH_LABEL[health]}</Badge>
            ) : (
              <span className="text-caption-sm text-mute">
                {value == null ? "No data recorded" : "Ungraded"}
              </span>
            )}
            <StatusPill status={(approval?.state ?? "draft") as ApprovalState} kind="approval" />
          </div>
        )
      }
      footer={
        <div className="flex items-center justify-between gap-md">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {recordUrl && (
            <Button
              iconRight="open_in_new"
              onClick={() => {
                onClose();
                router.push(recordUrl);
              }}
            >
              Open Full Performance Record
            </Button>
          )}
        </div>
      }
    >
      <QueryBoundary
        isLoading={kpiQ.isLoading || metricsQ.isLoading}
        isError={kpiQ.isError || metricsQ.isError}
      >
        {kpi && (
          <div className="flex flex-col gap-lg">
            {kpi.fedBy && (
              <div className="flex items-start gap-sm rounded border border-hairline bg-surface-soft px-md py-sm text-body-sm text-mute">
                <Icon name="database" size={18} className="shrink-0" />
                <span>
                  This value is computed from the data source “{kpi.fedBy.dataSourceName}”, not
                  hand-entered.
                </span>
              </div>
            )}

            <TargetVsActual kpi={kpi} year={year} quarter={quarter} />
            <IssueAndSolution kpi={kpi} year={year} quarter={quarter} />
            <AnnualQuarterProgressMatrix kpi={kpi} metrics={metrics} year={year} />
            {metrics.length > 0 && (
              <SubMetrics kpi={kpi} metrics={metrics} year={year} quarter={quarter} />
            )}
          </div>
        )}
      </QueryBoundary>
    </Drawer>
  );
}
