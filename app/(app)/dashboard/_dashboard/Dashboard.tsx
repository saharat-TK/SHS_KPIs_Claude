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
  RecordingDonut,
  TargetVsActualChart,
} from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerformanceRecords,
  usePerfKpis,
  useKpiCategories,
  useKpiTypes,
  usePerformancePeriods,
} from "@/lib/data/hooks";
import { KPI_TYPES } from "@/lib/types";
import {
  categoryDetail,
  categorySeries,
  countByType,
  groupsInUse,
  kpisOfType,
  issuesAsOf,
  kpisInGroup,
  pickActiveRecord,
  quarterSeries,
  recordingMix,
  recordingSlices,
  statusesAsOf,
  summarize,
  targetsMet,
  yearSeries,
  type DashboardKpi,
} from "@/lib/kpi/dashboard";
import { openQuartersForYear, yearForYearNo } from "@/lib/kpi/performancePeriods";
import { formatDate } from "@/lib/utils";
import type { PerformanceRecord, PerformanceStatus } from "@/lib/types";
import { DashboardFilterBar } from "./DashboardFilterBar";
import { DEFAULT_KPI_TYPE, useDashboardFilters } from "./useDashboardFilters";
import { HeadlineStats } from "./HeadlineStats";
import { KpiDetailTable } from "./KpiDetailTable";
import { IssuesTable } from "./IssuesTable";
import { StrategyScorecards } from "./StrategyScorecards";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  completed: "warning",
};

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const recordsQ = usePerformanceRecords();

  const { recordId, year, quarter, group, type, setFilters } = useDashboardFilters();
  const kpiTypesQ = useKpiTypes();

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

  // The three toggle options come from the kpi_type table rather than a constant
  // so a type added there gets an option instead of vanishing from every view.
  // KPI_TYPES is the loading fallback, the same idiom the library editor uses.
  const kpiTypeOptions = useMemo(
    () =>
      kpiTypesQ.data
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((t) => ({ id: t.id, label: t.kpiTypeName })) ?? KPI_TYPES,
    [kpiTypesQ.data],
  );
  // Counts read the WHOLE record — they are what tells you a type is empty.
  const typeCounts = useMemo(() => countByType(kpis), [kpis]);
  const kpiTypeItems = useMemo(
    () =>
      kpiTypeOptions.map((t) => ({
        id: t.id,
        label: t.label,
        count: typeCounts[t.id] ?? 0,
        disabled: (typeCounts[t.id] ?? 0) === 0,
      })),
    [kpiTypeOptions, typeCounts],
  );
  // A ?t= naming a type this deployment does not have would scope the page to
  // nothing, so fall back rather than render an empty dashboard.
  const activeType = kpiTypeOptions.some((t) => t.id === type) ? type : DEFAULT_KPI_TYPE;

  // Everything below this line is scoped to one type. `typed` also carries the
  // routine-taxonomy swap, so `categoryId` already means the right column.
  const typed = useMemo(() => kpisOfType(kpis, activeType), [kpis, activeType]);

  const groups = useMemo(() => groupsInUse(typed, categories), [typed, categories]);
  // A group the record no longer has (after switching records or types) would
  // silently filter everything away, so fall back to All.
  const activeGroup = group !== "all" && !groups.some((g) => g.id === group) ? "all" : group;
  const scoped = useMemo(
    () => (activeGroup === "all" ? typed : kpisInGroup(typed, activeGroup, categories)),
    [typed, activeGroup, categories],
  );

  const statuses = useMemo(() => statusesAsOf(scoped, year, quarter), [scoped, year, quarter]);
  const summary = useMemo(() => summarize(statuses), [statuses]);
  const targets = useMemo(() => targetsMet(statuses), [statuses]);
  const recording = useMemo(() => recordingMix(scoped, year, quarter), [scoped, year, quarter]);
  const issues = useMemo(() => issuesAsOf(scoped, year, quarter), [scoped, year, quarter]);
  // Passing [] for categories on a group tab is deliberate: groupsInUse then
  // finds every KPI orphaned, returns a single bucket, and quarterSeries emits
  // the overall line only — which is what a single-group view wants.
  const trend = useMemo(
    () => quarterSeries(scoped, activeGroup === "all" ? categories : [], year),
    [scoped, categories, activeGroup, year],
  );
  // Both read every group of the selected type, never `scoped` — the scorecards
  // are how you get INTO a group, so they have to survive one being selected.
  const byCategoryDetail = useMemo(
    () => categoryDetail(typed, categories, year, quarter),
    [typed, categories, year, quarter],
  );
  const byCategory = useMemo(
    () => categorySeries(typed, categories, year, quarter),
    [typed, categories, year, quarter],
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

  // Split out so the single-group tab can arrange them three-across while
  // "All Groups" keeps its own two-row pairing — same cards, different rows.
  const achievementByQuarterCard = (
    <Card className="animate-fade-up shadow-chrome !border-0">
      <CardHeader
        title="Achievement by Quarter"
        subtitle={`Year ${year}${record ? ` · ${yearForYearNo(record.startYear, year)}` : ""} — % of each quarter's target, averaged`}
      />
      <CardBody className="pt-0">
        <AchievementTrendChart data={trend.rows} xKey="quarter" lines={trend.lines} />
      </CardBody>
    </Card>
  );

  const recordingStatusCard = (
    <Card className="animate-fade-up shadow-chrome !border-0 [animation-delay:60ms]">
      <CardHeader title="Recording Status" subtitle={`Year ${year} · as of Q${quarter}`} />
      <CardBody className="pt-0">
        {recording.total === 0 ? (
          <EmptyState title="Nothing to record" />
        ) : (
          <RecordingDonut
            data={recordingSlices(recording)}
            centre={
              <>
                <span className="text-display-md leading-none text-on-surface tabular-nums">
                  <CountUp value={recording.pctThisQuarter ?? 0} suffix="%" />
                </span>
                <span className="text-caption-sm text-mute">recorded this quarter</span>
              </>
            }
          />
        )}
      </CardBody>
    </Card>
  );

  const fiveYearTrajectoryCard = (
    <Card className="animate-fade-up shadow-chrome !border-0 [animation-delay:60ms]">
      <CardHeader
        title="Five-Year Trajectory"
        subtitle={`Achievement at Q${quarter} of each year, against the 100% target line`}
      />
      <CardBody className="pt-0">
        <TargetVsActualChart data={byYear} />
      </CardBody>
    </Card>
  );

  // byCategory always covers every group, so it would contradict a
  // single-group tab — it belongs to the All view only.
  const byGroupCard = byCategory.length > 0 && (
    <Card className="animate-fade-up shadow-chrome !border-0">
      <CardHeader
        // The grouping axis follows the type, so the title has to as well —
        // routine KPIs are plotted by ด้านที่ area here, not by strategic category.
        title={activeType === "routine" ? "By Routine Area" : "By Strategic Group"}
        subtitle="Average achievement of each group, coloured by its worst KPI"
      />
      <CardBody className="pt-0">
        <GroupAchievementChart data={byCategory} />
      </CardBody>
    </Card>
  );

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
        kpiType={activeType}
        kpiTypeItems={kpiTypeItems}
        onChange={setFilters}
        // A group id belongs to one taxonomy, so it cannot survive a type
        // change. The stale-group guard above would catch the render either
        // way; clearing it here stops a dead ?g= lingering in the URL.
        onTypeChange={(t) => setFilters({ type: t, group: "all" })}
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
        ) : typed.length === 0 ? (
          // The toggle disables empty types, so this needs a hand-edited ?t= to
          // reach — but it must not render a blank page when it is reached.
          <Card>
            <EmptyState
              icon="filter_alt_off"
              title="No KPIs of this type"
              message={`This record has ${kpis.length} KPI(s), none of them ${activeType}. Pick another type above.`}
            />
          </Card>
        ) : (
          <>
            <Tabs
              items={[
                { id: "all", label: "All Groups", count: typed.length },
                ...groups.map((g) => ({
                  id: g.id,
                  label: g.label,
                  count: kpisInGroup(typed, g.id, categories).length,
                })),
              ]}
              active={activeGroup}
              onChange={(g) => setFilters({ group: g })}
              className="rounded-lg !border-b-0 bg-surface-lowest px-sm shadow-chrome"
            />

            <HeadlineStats targets={targets} summary={summary} recording={recording} />

            {/* Scorecards are the way into a strategy on "All Groups"; inside one,
                the KPI Detail table below already covers that group's KPIs, so
                nothing else renders here. */}
            {activeGroup === "all" && byCategoryDetail.length > 0 && (
              <StrategyScorecards
                rows={byCategoryDetail}
                onSelect={(g) => setFilters({ group: g })}
                onOpenKpi={openKpi}
              />
            )}

            {activeGroup === "all" ? (
              <>
                <div className="grid grid-cols-1 gap-md lg:grid-cols-[1fr_340px]">
                  {achievementByQuarterCard}
                  {recordingStatusCard}
                </div>
                <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
                  {byGroupCard}
                  {fiveYearTrajectoryCard}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
                {achievementByQuarterCard}
                {recordingStatusCard}
                {fiveYearTrajectoryCard}
              </div>
            )}

            <Card className="overflow-hidden animate-fade-up shadow-chrome !border-0">
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

            <Card className="overflow-hidden animate-fade-up shadow-chrome !border-0">
              <CardHeader
                title="Issues & Remedies"
                subtitle={`${issues.length} recorded · Year ${year} through Q${quarter}`}
              />
              <IssuesTable rows={issues} onOpenKpi={openKpi} />
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
