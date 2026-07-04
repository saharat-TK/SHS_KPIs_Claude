"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader, Button, QueryBoundary } from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerfMetric,
  usePerfKpi,
  usePerformanceRecord,
  useSaveMetricProgress,
} from "@/lib/data/hooks";
import { ProgressPanel } from "../../ProgressPanel";

export default function PerfMetricProgressPage() {
  return (
    <RequirePermission action="submit_metrics">
      <PerfMetricProgress />
    </RequirePermission>
  );
}

function PerfMetricProgress() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams<{ recordId: string; perfKpiId: string; perfMetricId: string }>();
  const recordId = Number(params.recordId);
  const perfKpiId = Number(params.perfKpiId);
  const perfMetricId = Number(params.perfMetricId);

  const metricQ = usePerfMetric(perfMetricId);
  const recordQ = usePerformanceRecord(recordId);
  const kpiQ = usePerfKpi(perfKpiId);
  const save = useSaveMetricProgress(perfMetricId, perfKpiId);

  // Re-register the whole crumb chain (this page unmounts the KPI page's labels).
  useBreadcrumbLabel(`/kpi-management/performance/${recordId}`, recordQ.data?.name);
  useBreadcrumbLabel(`/kpi-management/performance/${recordId}/kpis`, "KPIs");
  useBreadcrumbLabel(`/kpi-management/performance/${recordId}/kpis/${perfKpiId}`, kpiQ.data?.name);
  useBreadcrumbLabel(
    `/kpi-management/performance/${recordId}/kpis/${perfKpiId}/metrics`,
    "Sub-KPIs",
  );
  useBreadcrumbLabel(
    `/kpi-management/performance/${recordId}/kpis/${perfKpiId}/metrics/${perfMetricId}`,
    metricQ.data?.name,
  );

  const metric = metricQ.data;

  return (
    <>
      <PageHeader
        title={metric?.name ?? "Sub-KPI Progress"}
        description={metric ? `Sub-KPI · weight ${metric.weight}%` : "Loading…"}
        actions={
          <Button
            variant="ghost"
            icon="arrow_back"
            onClick={() =>
              router.push(`/kpi-management/performance/${recordId}/kpis/${perfKpiId}`)
            }
          >
            Back to KPI
          </Button>
        }
      />

      <QueryBoundary isLoading={metricQ.isLoading || !metric} isError={metricQ.isError}>
        {metric && (
          <ProgressPanel
            startYear={metric.startYear}
            annualTargets={metric.annualTargets}
            progress={metric.progress}
            thresholdGreen={metric.thresholdGreen}
            thresholdAmber={metric.thresholdAmber}
            unit={metric.unit}
            valueEditable
            saving={save.isPending}
            onSave={(yearNo, quarterNo, data) =>
              save.mutate({ ...data, yearNo, quarterNo, recordedBy: user?.email })
            }
          />
        )}
      </QueryBoundary>
    </>
  );
}
