"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Tabs,
  Select,
  QueryBoundary,
  EmptyState,
  CountUp,
  AchievementTrendChart,
  GroupAchievementChart,
  HealthDonut,
  TargetVsActualChart,
} from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerformanceRecords,
  usePerfKpis,
  useKpiCategories,
  usePerformancePeriods,
} from "@/lib/data/hooks";
import {
  categorySeries,
  groupsInUse,
  healthMix,
  kpisInGroup,
  pickActiveRecord,
  quarterSeries,
  statusesAsOf,
  summarize,
  yearSeries,
  type DashboardKpi,
} from "@/lib/kpi/dashboard";
import { openQuartersForYear, yearForYearNo } from "@/lib/kpi/performancePeriods";
import { formatDate } from "@/lib/utils";
import type { PerformanceRecord, PerformanceStatus } from "@/lib/types";
import { DashboardFilterBar } from "./DashboardFilterBar";
import { useDashboardFilters } from "./useDashboardFilters";
import { HeadlineStats } from "./HeadlineStats";
import { KpiDetailTable } from "./KpiDetailTable";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  completed: "warning",
};

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const recordsQ = usePerformanceRecords();

  const { recordId, year, quarter, group, setFilters } = useDashboardFilters();

  const activeRecords = useMemo(
    () => (recordsQ.data ?? []).filter((r) => r.status === "active"),
    [recordsQ.data],
  );
  // Which record is on screen: the one the URL pins, else the active one that is
  // actually being recorded into. The id is never written back on mount, so a
  // link without ?record= keeps following whatever is active today.
  const autoRecord = useMemo(() => pickActiveRecord(recordsQ.data ?? []), [recordsQ.data]);
  const record: PerformanceRecord | null =
    (recordsQ.data ?? []).find((r) => r.id === recordId) ?? autoRecord;

  const kpisQ = usePerfKpis(record?.id ?? 0);
  const categoriesQ = useKpiCategories(record?.sourceSetId, { enabled: !!record });
  const periodsQ = usePerformancePeriods(record?.id ?? 0);

  const kpis = useMemo<DashboardKpi[]>(() => kpisQ.data ?? [], [kpisQ.data]);
  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const periods = periodsQ.data ?? [];

  const groups = useMemo(() => groupsInUse(kpis, categories), [kpis, categories]);
  // A group the record no longer has (after switching records) would silently
  // filter everything away, so fall back to All.
  const activeGroup = group !== "all" && !groups.some((g) => g.id === group) ? "all" : group;
  const scoped = useMemo(
    () => (activeGroup === "all" ? kpis : kpisInGroup(kpis, activeGroup, categories)),
    [kpis, activeGroup, categories],
  );

  const statuses = useMemo(() => statusesAsOf(scoped, year, quarter), [scoped, year, quarter]);
  const summary = useMemo(() => summarize(statuses), [statuses]);
  // Passing [] for categories on a group tab is deliberate: groupsInUse then
  // finds every KPI orphaned, returns a single bucket, and quarterSeries emits
  // the overall line only — which is what a single-group view wants.
  const trend = useMemo(
    () => quarterSeries(scoped, activeGroup === "all" ? categories : [], year),
    [scoped, categories, activeGroup, year],
  );
  const byCategory = useMemo(
    () => categorySeries(kpis, categories, year, quarter),
    [kpis, categories, year, quarter],
  );
  const byYear = useMemo(
    () => yearSeries(scoped, quarter, record?.startYear ?? 0),
    [scoped, quarter, record?.startYear],
  );

  const openQuarters = openQuartersForYear(periods, year);
  const loading = recordsQ.isLoading || kpisQ.isLoading;

  if (!recordsQ.isLoading && !recordsQ.isError && !record) {
    return (
      <>
        <PageHeader
          title={`Welcome, ${user.name.split(" ").slice(-1)[0]}`}
          description="School of Health Sciences — performance at a glance."
        />
        <Card>
          <EmptyState
            icon="assessment"
            title="No active performance record"
            message="Activate a strategic set to start recording quarterly performance — this dashboard reads the active record."
            action={
              <Button
                icon="arrow_forward"
                onClick={() => router.push("/kpi-management/performance")}
              >
                Performance Records
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const openKpi = (kpiId: number) =>
    record && router.push(`/kpi-management/performance/${record.id}/kpis/${kpiId}`);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ").slice(-1)[0]}`}
        description={
          record
            ? `${record.name} · ${record.startYear}–${record.endYear}${
                record.lastSyncedAt ? ` · synced ${formatDate(record.lastSyncedAt)}` : ""
              }`
            : "Loading…"
        }
        actions={
          <div className="flex items-center gap-sm">
            {record && <Badge tone={STATUS_TONE[record.status]}>{record.status}</Badge>}
            {activeRecords.length > 1 && (
              <Select
                aria-label="Performance record"
                value={String(record?.id ?? "")}
                onChange={(e) => setFilters({ recordId: Number(e.target.value) })}
                className="w-auto min-w-[220px] max-w-[320px]"
              >
                {activeRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            )}
            <Button
              variant="outline"
              iconRight="chevron_right"
              onClick={() => record && router.push(`/kpi-management/performance/${record.id}`)}
            >
              Open Record
            </Button>
          </div>
        }
      />

      <DashboardFilterBar
        year={year}
        quarter={quarter}
        startYear={record?.startYear}
        openQuarters={openQuarters}
        onChange={setFilters}
      />

      <QueryBoundary isLoading={loading} isError={recordsQ.isError || kpisQ.isError}>
        {kpis.length === 0 ? (
          <Card>
            <EmptyState
              icon="stacked_bar_chart"
              title="This record has no KPIs"
              message="It was activated from a strategic set with no KPIs, or the sync has not run yet."
            />
          </Card>
        ) : (
          <>
            <Tabs
              items={[
                { id: "all", label: "All Groups", count: kpis.length },
                ...groups.map((g) => ({
                  id: g.id,
                  label: g.label,
                  count: kpisInGroup(kpis, g.id, categories).length,
                })),
              ]}
              active={activeGroup}
              onChange={(g) => setFilters({ group: g })}
            />

            <HeadlineStats summary={summary} />

            <div className="grid grid-cols-1 gap-lg lg:grid-cols-[1fr_340px]">
              <Card className="animate-fade-up">
                <CardHeader
                  title="Achievement by Quarter"
                  subtitle={`Year ${year}${record ? ` · ${yearForYearNo(record.startYear, year)}` : ""} — % of each quarter's target, averaged`}
                />
                <CardBody className="pt-0">
                  <AchievementTrendChart data={trend.rows} xKey="quarter" lines={trend.lines} />
                </CardBody>
              </Card>

              <Card className="animate-fade-up [animation-delay:60ms]">
                <CardHeader title="Health Mix" subtitle={`As of Q${quarter}`} />
                <CardBody className="pt-0">
                  <HealthDonut
                    data={healthMix(summary)}
                    centre={
                      <>
                        <span className="text-display-md leading-none text-on-surface tabular-nums">
                          <CountUp value={summary.pctOnTarget ?? 0} suffix="%" />
                        </span>
                        <span className="text-caption-sm text-mute">on target</span>
                      </>
                    }
                  />
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
              <Card className="animate-fade-up">
                <CardHeader
                  title="By Strategic Group"
                  subtitle="Average achievement of each group, coloured by its worst KPI"
                />
                <CardBody className="pt-0">
                  {byCategory.length === 0 ? (
                    <EmptyState title="No groups in this record" />
                  ) : (
                    <GroupAchievementChart data={byCategory} />
                  )}
                </CardBody>
              </Card>

              <Card className="animate-fade-up [animation-delay:60ms]">
                <CardHeader
                  title="Five-Year Trajectory"
                  subtitle={`Achievement at Q${quarter} of each year, against the 100% target line`}
                />
                <CardBody className="pt-0">
                  <TargetVsActualChart data={byYear} />
                </CardBody>
              </Card>
            </div>

            <Card className="overflow-hidden animate-fade-up">
              <CardHeader
                title="KPI Detail"
                subtitle={`${statuses.length} KPI(s) · Year ${year} as of Q${quarter}`}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight="chevron_right"
                    onClick={() =>
                      record && router.push(`/kpi-management/performance/${record.id}`)
                    }
                  >
                    Record progress
                  </Button>
                }
              />
              <KpiDetailTable
                statuses={statuses}
                groups={groups}
                quarter={quarter}
                onOpenKpi={openKpi}
              />
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
