"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Table,
  Th,
  Td,
  Tr,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerfKpi,
  usePerfMetricsByKpi,
  usePerformancePeriods,
  usePerformanceRecord,
  useSaveKpiProgress,
} from "@/lib/data/hooks";
import {
  currentValueForYear,
  targetForYear,
  percentOfTarget,
  HEALTH_TONE,
} from "@/lib/kpi/progress";
import { formatNumber } from "@/lib/utils";
import { ProgressPanel } from "./ProgressPanel";
import { MetricProgressModal } from "./MetricProgressModal";

export default function PerfKpiProgressPage() {
  return (
    <RequirePermission action="submit_metrics">
      <PerfKpiProgress />
    </RequirePermission>
  );
}

function PerfKpiProgress() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams<{ recordId: string; perfKpiId: string }>();
  const recordId = Number(params.recordId);
  const perfKpiId = Number(params.perfKpiId);

  const kpiQ = usePerfKpi(perfKpiId);
  const recordQ = usePerformanceRecord(recordId);
  const periodsQ = usePerformancePeriods(recordId);
  const metricsQ = usePerfMetricsByKpi(perfKpiId);
  const save = useSaveKpiProgress(perfKpiId);

  // Year selection is lifted here so the Sub-KPIs table stays in sync with the
  // ProgressPanel's Year tabs.
  const [year, setYear] = useState(1);
  // Entering progress for a sub-KPI opens a pop-up instead of navigating away.
  // Store only the id (not the metric object) so the pop-up re-derives a fresh
  // metric from `metrics` after a save invalidates the list query — otherwise
  // the pop-up would keep showing the stale value it was opened with.
  const [editingMetricId, setEditingMetricId] = useState<number | null>(null);

  useBreadcrumbLabel(`/kpi-management/performance/${recordId}`, recordQ.data?.name);
  useBreadcrumbLabel(`/kpi-management/performance/${recordId}/kpis`, "KPIs");
  useBreadcrumbLabel(
    `/kpi-management/performance/${recordId}/kpis/${perfKpiId}`,
    kpiQ.data?.name,
  );

  const kpi = kpiQ.data;
  const metrics = metricsQ.data ?? [];

  return (
    <>
      <PageHeader
        title={kpi?.name ?? "KPI Progress"}
        description={kpi ? `${kpi.kpiType} · weight ${kpi.weight}%` : "Loading…"}
        actions={
          <Button
            variant="ghost"
            icon="arrow_back"
            onClick={() => router.push(`/kpi-management/performance/${recordId}`)}
          >
            Back to Record
          </Button>
        }
      />

      <QueryBoundary isLoading={kpiQ.isLoading || !kpi} isError={kpiQ.isError}>
        {kpi && (
          <>
            <ProgressPanel
              startYear={kpi.startYear}
              annualTargets={kpi.annualTargets}
              progress={kpi.progress}
              thresholdGreen={kpi.thresholdGreen}
              thresholdAmber={kpi.thresholdAmber}
              unit={kpi.unit}
              valueEditable={!kpi.hasChildren}
              computedNote={
                kpi.hasChildren
                  ? "This KPI's quarterly value is computed from its sub-KPIs. Enter each sub-KPI's progress below."
                  : undefined
              }
              periods={periodsQ.data ?? []}
              periodsLoading={periodsQ.isLoading}
              saving={save.isPending}
              year={year}
              onYearChange={setYear}
              onSave={(yearNo, quarterNo, data) =>
                save.mutate({ ...data, yearNo, quarterNo, recordedBy: user?.email })
              }
              mainColumnFooter={
                kpi.hasChildren ? (
                  <Card className="overflow-hidden">
                    <CardHeader
                      title="Sub-KPIs"
                      subtitle={`Progress vs target · Year ${year}${kpi.startYear ? ` · ${kpi.startYear + year - 1}` : ""}`}
                    />
                    {metrics.length === 0 ? (
                      <CardBody>
                        <EmptyState title="No sub-KPIs" message="This KPI has no metrics." />
                      </CardBody>
                    ) : (
                      <Table>
                        <thead>
                          <tr>
                            <Th>Sub-KPI</Th>
                            <Th align="right">Annual Target</Th>
                            <Th align="right">Current</Th>
                            <Th>Progress</Th>
                            <Th align="center">Status</Th>
                            <Th align="right">Actions</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m) => {
                            const target = targetForYear(m.annualTargets, year);
                            const current = currentValueForYear(m.progress, year);
                            const pct = percentOfTarget(current, target);
                            const hasTh = m.thresholdGreen != null && m.thresholdAmber != null;
                            const health =
                              hasTh && pct != null
                                ? healthOf(pct, { green: m.thresholdGreen!, amber: m.thresholdAmber! })
                                : null;
                            const go = () => setEditingMetricId(m.id);
                            return (
                              <Tr key={m.id} onClick={go}>
                                <Td className="font-medium">{m.name}</Td>
                                <Td align="right">
                                  {target == null ? "—" : `${formatNumber(target, 2)} ${m.unit ?? ""}`}
                                </Td>
                                <Td align="right">
                                  {current == null ? "—" : `${formatNumber(current, 2)} ${m.unit ?? ""}`}
                                </Td>
                                <Td>
                                  <div className="flex items-center gap-sm">
                                    {hasTh ? (
                                      <ThresholdBar
                                        value={pct ?? 0}
                                        max={100}
                                        thresholds={{ green: m.thresholdGreen!, amber: m.thresholdAmber! }}
                                        className="w-[80px]"
                                      />
                                    ) : (
                                      <div className="h-2 w-[80px] rounded-full bg-surface-container-high overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-primary-container"
                                          style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
                                        />
                                      </div>
                                    )}
                                    <span className="text-caption-sm text-mute">
                                      {pct == null ? "—" : `${formatNumber(pct, 0)}%`}
                                    </span>
                                  </div>
                                </Td>
                                <Td align="center">
                                  {health ? (
                                    <Badge tone={HEALTH_TONE[health]}>{HEALTH_LABEL[health]}</Badge>
                                  ) : (
                                    <span className="text-mute">—</span>
                                  )}
                                </Td>
                                <Td align="right">
                                  <button
                                    type="button"
                                    aria-label="Enter progress"
                                    title="Enter progress"
                                    className="text-mute hover:text-on-surface"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      go();
                                    }}
                                  >
                                    <Icon name="edit_note" size={20} />
                                  </button>
                                </Td>
                              </Tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                  </Card>
                ) : undefined
              }
            />

            {!kpi.hasChildren && (
              <div className="flex items-center gap-sm text-caption-sm text-mute">
                <Badge tone="neutral">leaf KPI</Badge>
                Values are entered directly per quarter above.
              </div>
            )}

            {editingMetricId != null && (() => {
              const editingMetric = metrics.find((m) => m.id === editingMetricId);
              return editingMetric ? (
                <MetricProgressModal
                  key={editingMetric.id}
                  metric={editingMetric}
                  perfKpiId={perfKpiId}
                  year={year}
                  periods={periodsQ.data ?? []}
                  periodsLoading={periodsQ.isLoading}
                  onClose={() => setEditingMetricId(null)}
                />
              ) : null;
            })()}
          </>
        )}
      </QueryBoundary>
    </>
  );
}
