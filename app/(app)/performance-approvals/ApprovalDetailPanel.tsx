"use client";

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
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
import { ACTION_LABELS } from "@/lib/kpi/approvalWorkflow";
import type { ApprovalState, PerfKpi, PerfKpiApproval, PerfMetric, QuarterProgress } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";
// Imported across route folders through the @/ alias, matching the existing
// convention (see LinkedDataSourcesSection importing EntriesTable/EntryModal).
// The matrix is read-only and its props are just {kpi, metrics, year}.
import { AnnualQuarterProgressMatrix } from "@/app/(app)/kpi-management/performance/[recordId]/kpis/[perfKpiId]/AnnualQuarterProgressMatrix";

/** A labelled figure row — the repeated unit of the target-vs-actual block. */
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

/** Percent bar + health badge, or a neutral bar when there is nothing to judge.
 *  Never feeds `pct ?? 0` into ThresholdBar — that paints a red "at risk" bar
 *  for a KPI that simply has no data recorded yet. */
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
  const health = hasThresholds && pct != null ? healthOf(pct, { green: thresholdGreen, amber: thresholdAmber }) : null;

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

  // The queue row shows the *exact* quarter's value, so the panel must lead
  // with the same figure or the two silently disagree. A `use_annual` KPI that
  // only recorded Q3 shows "—" for Q4 in the table; surface the carried value
  // as a secondary note rather than swapping it in as the headline.
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

/** Stacked list, not a table: the KPI detail page's 7-column version needs
 *  ~900px and this panel is 520px. */
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
          // quarterlyTargetMode lives on the KPI — PerfMetric omits targetMode.
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

export function ApprovalDetailPanel({
  row,
  yearLabel,
}: {
  row: PerfKpiApproval;
  yearLabel: string;
}) {
  const year = row.yearNo;
  const quarter = row.quarterNo;

  const kpiQ = usePerfKpi(row.perfKpiId);
  const metricsQ = usePerfMetricsByKpi(row.perfKpiId);
  const approvalQ = useKpiApproval(row.perfKpiId, year, quarter);

  const kpi = kpiQ.data;
  const metrics = metricsQ.data ?? [];
  const events = approvalQ.data?.events ?? [];

  return (
    <div className="flex flex-col gap-lg">
      <QueryBoundary
        isLoading={kpiQ.isLoading || metricsQ.isLoading}
        isError={kpiQ.isError || metricsQ.isError}
      >
        {kpi && (
          <>
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
          </>
        )}
      </QueryBoundary>

      <Card>
        <CardHeader title="Approval history" subtitle={`${yearLabel} · Q${quarter}`} />
        <CardBody className="flex flex-col gap-sm">
          <QueryBoundary isLoading={approvalQ.isLoading} isError={approvalQ.isError}>
            {events.length === 0 ? (
              <p className="text-body-sm text-mute">Not yet submitted.</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="rounded-lg border border-hairline bg-surface-soft p-md">
                  <div className="flex flex-wrap items-center gap-sm">
                    <Icon name="account_circle" size={18} className="text-mute" />
                    <span className="text-label-md">{e.actorName ?? "—"}</span>
                    <Badge tone="neutral">{ACTION_LABELS[e.action] ?? e.action}</Badge>
                    {e.actorRole && <span className="text-caption-sm text-mute">{e.actorRole}</span>}
                    <span className="ml-auto text-caption-sm text-mute">
                      {formatDate(e.createdAt)}
                    </span>
                  </div>
                  <p className="mt-xs text-caption-sm text-mute">
                    {e.fromState ?? "draft"} → {e.toState}
                  </p>
                  {e.comment && <p className="mt-xs text-body-sm">{e.comment}</p>}
                </div>
              ))
            )}
          </QueryBoundary>
        </CardBody>
      </Card>
    </div>
  );
}

/** Header status row for the Drawer — kept here so the page stays lean. */
export function ApprovalPanelStatus({ row }: { row: PerfKpiApproval }) {
  return (
    <div className="flex flex-wrap items-center gap-sm">
      <StatusPill status={row.state as ApprovalState} kind="approval" />
      {row.state === "approved" && (
        <span className="inline-flex items-center gap-xs text-caption-sm text-mute">
          <Icon name="lock" size={16} /> Locked after final approval
        </span>
      )}
    </div>
  );
}
