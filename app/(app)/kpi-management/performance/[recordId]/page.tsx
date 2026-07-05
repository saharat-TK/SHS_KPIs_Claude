"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  Tabs,
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerformanceRecord,
  usePerfKpis,
  useKpiCategories,
  usePerformancePeriods,
  useSyncPerformanceRecord,
} from "@/lib/data/hooks";
import {
  openPeriodSummary,
  openQuartersForYear,
  PERFORMANCE_YEAR_COUNT,
} from "@/lib/kpi/performancePeriods";
import { formatDate } from "@/lib/utils";
import type { KpiType, PerformanceStatus } from "@/lib/types";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  closed: "neutral",
  archived: "warning",
};
const TYPE_TONE: Record<KpiType, "primary" | "info" | "neutral"> = {
  strategic: "primary",
  operational: "info",
  routine: "neutral",
};

export default function PerformanceRecordPage() {
  return (
    <RequirePermission action="view_dashboards">
      <PerformanceRecordDetail />
    </RequirePermission>
  );
}

function PerformanceRecordDetail() {
  const router = useRouter();
  const { can } = useAuth();
  const params = useParams<{ recordId: string }>();
  const recordId = Number(params.recordId);

  const recordQ = usePerformanceRecord(recordId);
  const kpisQ = usePerfKpis(recordId);
  const categoriesQ = useKpiCategories();
  const periodsQ = usePerformancePeriods(recordId);
  const sync = useSyncPerformanceRecord();

  useBreadcrumbLabel(`/kpi-management/performance/${recordId}`, recordQ.data?.name);

  const [cat, setCat] = useState<string>("all");

  const record = recordQ.data;
  const categories = categoriesQ.data ?? [];
  const kpis = kpisQ.data ?? [];
  const isAdmin = can("configure_kpis");

  const periods = periodsQ.data ?? [];
  const { openCount } = openPeriodSummary(periods);
  const openByYear = Array.from({ length: PERFORMANCE_YEAR_COUNT }, (_, i) => i + 1)
    .map((yearNo) => {
      const qs = openQuartersForYear(periods, yearNo);
      return qs.length ? `Y${yearNo} ${qs.map((q) => `Q${q}`).join(", ")}` : null;
    })
    .filter(Boolean)
    .join(" · ");

  const tabs = [
    { id: "all", label: "All", count: kpis.length },
    ...categories.map((c) => ({
      id: c.id,
      label: c.label,
      count: kpis.filter((k) => k.categoryId === c.id).length,
    })),
  ];
  const rows = useMemo(
    () => (cat === "all" ? kpis : kpis.filter((k) => k.categoryId === cat)),
    [kpis, cat],
  );

  return (
    <>
      <PageHeader
        title={record ? record.name : "Performance Record"}
        description={
          record
            ? `${record.startYear}–${record.endYear} · ${record.status}${
                record.lastSyncedAt ? ` · synced ${formatDate(record.lastSyncedAt)}` : ""
              }`
            : "Loading…"
        }
        actions={
          <>
            <Button
              variant="ghost"
              icon="arrow_back"
              onClick={() => router.push("/kpi-management/performance")}
            >
              All Records
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                icon="sync"
                disabled={sync.isPending}
                onClick={() => sync.mutate(recordId)}
              >
                {sync.isPending ? "Syncing…" : "Sync from Library"}
              </Button>
            )}
          </>
        }
      />

      <div className="flex items-start gap-sm rounded-lg border border-hairline bg-surface-soft px-md py-sm text-body-sm text-mute">
        <Icon name="lock" size={18} className="mt-tiny text-stone" />
        <p>
          KPI and sub-KPI definitions here are read-only. Edit them in the{" "}
          <button
            className="text-link-blue hover:underline"
            onClick={() => router.push("/kpi-management/library")}
          >
            KPIs Library
          </button>
          , then use <span className="font-medium">Sync from Library</span> to pull the changes in
          (entered progress is preserved).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-sm rounded-lg border border-hairline bg-surface-lowest px-md py-sm text-body-sm">
        <Icon name="event_available" size={18} className="text-stone" />
        <Badge tone={openCount > 0 ? "success" : "neutral"}>{openCount} / 20 open</Badge>
        <span className="text-mute">
          {openCount > 0
            ? `Recording open: ${openByYear}`
            : "No recording periods are open."}
        </span>
        {isAdmin && (
          <span className="text-caption-sm text-stone">
            Manage open/closed quarters from the Records list → Recording periods.
          </span>
        )}
      </div>

      <Tabs items={tabs} active={cat} onChange={setCat} />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={kpisQ.isLoading} isError={kpisQ.isError}>
          {rows.length === 0 ? (
            <EmptyState
              title="No KPIs in this record"
              message="This record was activated from a set with no KPIs, or none match this category."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>KPI Name</Th>
                  <Th align="center">Type</Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Sub-KPIs</Th>
                  <Th align="center">Roll-up</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <Tr
                    key={k.id}
                    onClick={() =>
                      router.push(`/kpi-management/performance/${recordId}/kpis/${k.id}`)
                    }
                  >
                    <Td className="font-medium">{k.name}</Td>
                    <Td align="center">
                      <Badge tone={TYPE_TONE[k.kpiType]}>{k.kpiType}</Badge>
                    </Td>
                    <Td align="center">{k.weight}%</Td>
                    <Td align="center">{k.metricCount ?? 0}</Td>
                    <Td align="center">
                      <Badge tone={k.hasChildren ? "info" : "neutral"}>
                        {k.hasChildren ? "computed" : "direct entry"}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconRight="chevron_right"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/kpi-management/performance/${recordId}/kpis/${k.id}`);
                        }}
                      >
                        Record progress
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
