"use client";

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
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerfKpi,
  usePerfMetricsByKpi,
  usePerformanceRecord,
  useSaveKpiProgress,
} from "@/lib/data/hooks";
import { ProgressPanel } from "./ProgressPanel";

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
  const metricsQ = usePerfMetricsByKpi(perfKpiId);
  const save = useSaveKpiProgress(perfKpiId);

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
              saving={save.isPending}
              onSave={(yearNo, quarterNo, data) =>
                save.mutate({ ...data, yearNo, quarterNo, recordedBy: user?.email })
              }
            />

            {kpi.hasChildren && (
              <Card className="overflow-hidden">
                <CardHeader
                  title="Sub-KPIs"
                  subtitle="Enter each sub-KPI's quarterly progress; this KPI rolls them up automatically."
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
                        <Th align="center">Weight</Th>
                        <Th align="center">Unit</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => (
                        <Tr
                          key={m.id}
                          onClick={() =>
                            router.push(
                              `/kpi-management/performance/${recordId}/kpis/${perfKpiId}/metrics/${m.id}`,
                            )
                          }
                        >
                          <Td className="font-medium">{m.name}</Td>
                          <Td align="center">{m.weight}%</Td>
                          <Td align="center">{m.unit ?? "—"}</Td>
                          <Td align="right">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconRight="chevron_right"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/kpi-management/performance/${recordId}/kpis/${perfKpiId}/metrics/${m.id}`,
                                );
                              }}
                            >
                              Enter progress
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            )}

            {!kpi.hasChildren && (
              <div className="flex items-center gap-sm text-caption-sm text-mute">
                <Badge tone="neutral">leaf KPI</Badge>
                Values are entered directly per quarter above.
              </div>
            )}
          </>
        )}
      </QueryBoundary>
    </>
  );
}
