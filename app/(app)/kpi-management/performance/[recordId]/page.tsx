"use client";

import { useCallback, useMemo, useState } from "react";
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
  Field,
  Select,
  healthOf,
  HEALTH_LABEL,
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
  useRecomputeFromDataSources,
  useRecordApprovals,
} from "@/lib/data/hooks";
import { approvalLockForState } from "@/lib/kpi/approvalWorkflow";
import {
  openPeriodSummary,
  openQuartersForYear,
  PERFORMANCE_YEAR_COUNT,
} from "@/lib/kpi/performancePeriods";
import {
  targetForYear,
  currentValueForYear,
  percentOfTarget,
  HEALTH_TONE,
} from "@/lib/kpi/progress";
import { formatDate, formatNumber } from "@/lib/utils";
import type { KpiType, PerformanceStatus } from "@/lib/types";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  completed: "warning",
};
const TYPE_TONE: Record<KpiType, "primary" | "info" | "neutral"> = {
  strategic: "primary",
  operational: "info",
  routine: "neutral",
};
type SortKey = "name" | "type" | "annualTarget" | "currentProgress" | "approvalLock";
type SortState = { key: SortKey; dir: "asc" | "desc" };

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
  const record = recordQ.data;
  const categoriesQ = useKpiCategories(record?.sourceSetId, { enabled: !!record });
  const periodsQ = usePerformancePeriods(recordId);
  const sync = useSyncPerformanceRecord();
  const recompute = useRecomputeFromDataSources();

  useBreadcrumbLabel(`/kpi-management/performance/${recordId}`, recordQ.data?.name);

  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<SortState | null>(null);
  // Drives both the Annual Target / Current Progress columns and the approval
  // lookups below; the quarter selector stays approval-only.
  const [selectedYear, setSelectedYear] = useState(1);
  const [approvalQuarter, setApprovalQuarter] = useState(1);

  const categories = categoriesQ.data ?? [];
  const kpis = useMemo(() => kpisQ.data ?? [], [kpisQ.data]);
  const isAdmin = can("configure_kpis");
  const recordIsActive = record?.status === "active";
  const q1Approvals = useRecordApprovals(recordId, selectedYear, 1);
  const q2Approvals = useRecordApprovals(recordId, selectedYear, 2);
  const q3Approvals = useRecordApprovals(recordId, selectedYear, 3);
  const q4Approvals = useRecordApprovals(recordId, selectedYear, 4);
  const approvalQueries = [q1Approvals, q2Approvals, q3Approvals, q4Approvals];
  const approvalsByQuarter = useMemo(
    () => ({
      1: new Map((q1Approvals.data ?? []).map((a) => [a.perfKpiId, a])),
      2: new Map((q2Approvals.data ?? []).map((a) => [a.perfKpiId, a])),
      3: new Map((q3Approvals.data ?? []).map((a) => [a.perfKpiId, a])),
      4: new Map((q4Approvals.data ?? []).map((a) => [a.perfKpiId, a])),
    }),
    [q1Approvals.data, q2Approvals.data, q3Approvals.data, q4Approvals.data],
  );
  const approvalsLoading = approvalQueries.some((q) => q.isLoading);

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
  const approvalLockForKpi = useCallback((kpiId: number) => {
    const selectedLock = approvalLockForState(
      approvalsByQuarter[approvalQuarter as 1 | 2 | 3 | 4].get(kpiId)?.state,
    );
    if (selectedLock?.locked) return { quarter: approvalQuarter, lock: selectedLock };

    return ([1, 2, 3, 4] as const)
      .filter((quarter) => quarter !== approvalQuarter)
      .map((quarter) => ({
        quarter,
        lock: approvalLockForState(approvalsByQuarter[quarter].get(kpiId)?.state),
      }))
      .find((item) => item.lock?.locked);
  }, [approvalQuarter, approvalsByQuarter]);
  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const valueFor = (kpi: (typeof rows)[number]): string | number | null => {
      switch (sort.key) {
        case "name":
          return kpi.name;
        case "type":
          return kpi.kpiType;
        case "annualTarget":
          return targetForYear(kpi.annualTargets, selectedYear);
        case "currentProgress":
          return currentValueForYear(kpi.progress, selectedYear);
        case "approvalLock": {
          const approvalLock = approvalLockForKpi(kpi.id);
          return approvalLock?.lock?.locked
            ? `${approvalLock.quarter}:${approvalLock.lock.label}`
            : null;
        }
      }
    };

    return [...rows].sort((left, right) => {
      const leftValue = valueFor(left);
      const rightValue = valueFor(right);

      // Missing values always follow populated values, regardless of direction.
      if (leftValue == null) return rightValue == null ? 0 : 1;
      if (rightValue == null) return -1;

      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), undefined, {
              sensitivity: "base",
              numeric: true,
            });
      return sort.dir === "asc" ? comparison : -comparison;
    });
  }, [rows, sort, selectedYear, approvalLockForKpi]);
  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
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
                disabled={sync.isPending || !recordIsActive}
                title={recordIsActive ? undefined : "Only active records can sync from the library"}
                onClick={() => sync.mutate(recordId)}
              >
                {sync.isPending ? "Syncing…" : "Sync from Library"}
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                icon="database"
                disabled={recompute.isPending || !recordIsActive}
                title={
                  recordIsActive
                    ? "Recompute the values that data sources feed into this record"
                    : "Only active records can receive data-source updates"
                }
                onClick={() => recompute.mutate(recordId)}
              >
                {recompute.isPending ? "Recomputing…" : "Recompute from Data Sources"}
              </Button>
            )}
          </>
        }
      />

      <div className="flex items-start gap-sm text-caption-sm text-mute">
        <Icon name="lock" size={16} className="mt-tiny shrink-0 text-stone" />
        <span>
          KPI and sub-KPI definitions here are read-only. Edit them in the{" "}
          <button
            className="text-link-blue hover:underline"
            onClick={() => router.push("/kpi-management/library")}
          >
            KPIs Library
          </button>
          , then use <span className="font-medium">Sync from Library</span> to pull the changes in
          (entered progress is preserved).
        </span>
      </div>

      <div className="flex flex-col gap-md rounded-lg border border-hairline bg-surface-lowest px-md py-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-sm">
          <div className="flex flex-wrap items-center gap-sm text-label-md">
            <Icon name="event_available" size={18} className="text-stone" />
            <Badge tone={openCount > 0 ? "success" : "neutral"}>{openCount} / 20 open</Badge>
            <span className="text-mute">
              {openCount > 0
                ? `Recording open: ${openByYear}`
                : "No recording periods are open."}
            </span>
            {isAdmin && (
              <span className="text-body-sm text-stone">
                Manage open/closed quarters from the Records list → Recording periods.
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-md lg:justify-end">
          <Field label="Year">
            <Select
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="min-w-[160px] rounded-xl"
            >
              {[1, 2, 3, 4, 5].map((yearNo) => (
                <option key={yearNo} value={yearNo}>
                  {record ? `Year ${yearNo} · ${record.startYear + yearNo - 1}` : `Year ${yearNo}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quarter">
            <Select
              value={String(approvalQuarter)}
              onChange={(e) => setApprovalQuarter(Number(e.target.value))}
              className="min-w-[120px] rounded-xl"
            >
              {[1, 2, 3, 4].map((quarterNo) => (
                <option key={quarterNo} value={quarterNo}>
                  Quarter {quarterNo}
                </option>
              ))}
            </Select>
          </Field>
        </div>
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
              <colgroup>
                <col style={{ width: "32%", minWidth: "280px" }} />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <Th
                    sortable
                    sortDir={sort?.key === "name" ? sort.dir : null}
                    onSort={() => toggleSort("name")}
                  >
                    KPI Name
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "type" ? sort.dir : null}
                    onSort={() => toggleSort("type")}
                    align="center"
                  >
                    Type
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "annualTarget" ? sort.dir : null}
                    onSort={() => toggleSort("annualTarget")}
                    align="right"
                  >
                    Annual Target
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "currentProgress" ? sort.dir : null}
                    onSort={() => toggleSort("currentProgress")}
                    align="right"
                  >
                    Current Progress
                  </Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Sub-KPIs</Th>
                  <Th align="center">Roll-up</Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "approvalLock" ? sort.dir : null}
                    onSort={() => toggleSort("approvalLock")}
                  >
                    Approval Lock
                  </Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((k) => {
                  const approvalLock = approvalLockForKpi(k.id);
                  // Target/current for the selected year. Current = the latest
                  // quarter with a value; percent is against the ANNUAL target,
                  // so a mid-year KPI reads proportionally low by design.
                  const annualTarget = targetForYear(k.annualTargets, selectedYear);
                  const current = currentValueForYear(k.progress, selectedYear);
                  const pct = percentOfTarget(current, annualTarget);
                  const hasTh = k.thresholdGreen != null && k.thresholdAmber != null;
                  const health =
                    hasTh && pct != null
                      ? healthOf(pct, {
                          green: k.thresholdGreen!,
                          amber: k.thresholdAmber!,
                        })
                      : null;
                  return (
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
                      <Td align="right">
                        {annualTarget == null
                          ? "—"
                          : `${formatNumber(annualTarget, 2)} ${k.unit ?? ""}`}
                      </Td>
                      <Td align="right">
                        {current == null ? (
                          <span className="text-caption-sm text-mute">—</span>
                        ) : (
                          <div className="flex items-center justify-end gap-sm">
                            <span>{`${formatNumber(current, 2)} ${k.unit ?? ""}`}</span>
                            {pct != null && (
                              // Badge takes no title, so the status label rides
                              // on a wrapper for hover/screen-reader text.
                              <span title={health ? HEALTH_LABEL[health] : undefined}>
                                <Badge tone={health ? HEALTH_TONE[health] : "neutral"}>
                                  {formatNumber(pct, 0)}%
                                </Badge>
                              </span>
                            )}
                          </div>
                        )}
                      </Td>
                      <Td align="center">{k.weight}%</Td>
                      <Td align="center">{k.metricCount ?? 0}</Td>
                      <Td align="center">
                        <Badge tone={k.hasChildren ? "info" : "neutral"}>
                          {k.hasChildren ? "computed" : "direct entry"}
                        </Badge>
                      </Td>
                      <Td>
                        {approvalsLoading ? (
                          <span className="text-caption-sm text-mute">Loading…</span>
                        ) : approvalLock?.lock?.locked ? (
                          <Badge tone={approvalLock.lock.tone}>
                            <Icon name={approvalLock.lock.icon} size={15} />
                            Q{approvalLock.quarter}: {approvalLock.lock.label}
                          </Badge>
                        ) : (
                          <span className="text-caption-sm text-mute">—</span>
                        )}
                      </Td>
                      <Td align="right">
                        <button
                          aria-label={approvalLock?.lock?.locked ? "View progress" : "Record progress"}
                          title={approvalLock?.lock?.locked ? "View progress" : "Record progress"}
                          className="rounded p-xs text-mute hover:bg-surface-soft hover:text-on-surface"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/kpi-management/performance/${recordId}/kpis/${k.id}`);
                          }}
                        >
                          <Icon name={approvalLock?.lock?.locked ? "visibility" : "edit_note"} size={18} />
                        </button>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
