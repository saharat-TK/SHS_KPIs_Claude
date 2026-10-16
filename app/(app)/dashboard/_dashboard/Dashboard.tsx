"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  QueryBoundary,
  EmptyState,
  CountUp,
  Icon,
  AchievementTrendChart,
  RecordingDonut,
  TargetVsActualChart,
} from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  categoryDetail,
  issuesAsOf,
  quarterOverQuarterDelta,
  quarterSeries,
  recordingMix,
  recordingSlices,
  statusesAsOf,
  summarize,
  targetsMet,
  yearSeries,
} from "@/lib/kpi/dashboard";
import { formatDate } from "@/lib/utils";
import { DashboardFilterBar } from "./DashboardFilterBar";
import { useDashboardScope } from "./useDashboardScope";
import { GroupTabs, RecordPicker } from "./RecordPicker";
import { HeadlineStats } from "./HeadlineStats";
import { KpiDetailTable } from "./KpiDetailTable";
import { IssuesTable } from "./IssuesTable";
import { StrategyScorecards } from "./StrategyScorecards";
import { DashboardKpiDrawer } from "./DashboardKpiDrawer";

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const scope = useDashboardScope();
  const {
    year,
    quarter,
    groupBy,
    setFilters,
    recordsQ,
    record,
    kpis,
    kpiTypeItems,
    activeType,
    typed,
    categories,
    groups,
    activeGroup,
    scoped,
    openQuarters,
    loading,
    isError,
  } = scope;

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
  const byYear = useMemo(
    () => yearSeries(scoped, quarter, record?.startYear ?? 0),
    [scoped, quarter, record?.startYear],
  );

  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);
  const openKpi = (kpiId: number) => setSelectedKpiId(kpiId);

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

  // Split into consts (rather than inlined below) only so JSX order stays
  // easy to scan next to the rest of the render.
  const currentQuarterAchievement = trend.rows.find((r) => r.quarter === `Q${quarter}`)?.overall;
  const achievementDelta = quarterOverQuarterDelta(trend.rows, quarter);
  const achievementByQuarterCard = (
    <Card className="animate-fade-up shadow-chrome !border-0">
      <CardHeader title="Achievement by Quarter" />
      <CardBody className="pt-0">
        <div className="mb-md flex flex-wrap items-end gap-sm">
          <span className="text-display-lg font-bold leading-none text-on-surface tabular-nums">
            {typeof currentQuarterAchievement === "number" ? (
              <CountUp value={currentQuarterAchievement} suffix="%" />
            ) : (
              "—"
            )}
          </span>
          {achievementDelta != null && (
            <span className="inline-flex items-center gap-xs rounded-full bg-on-surface px-sm py-tiny text-caption-sm font-medium">
              <Icon
                name={achievementDelta >= 0 ? "trending_up" : "trending_down"}
                size={14}
                className={achievementDelta >= 0 ? "text-success" : "text-error"}
              />
              <span className={achievementDelta >= 0 ? "text-success" : "text-error"}>
                {achievementDelta >= 0 ? "+" : ""}
                {achievementDelta}%
              </span>
            </span>
          )}
          <span className="text-caption-sm text-mute">
            {quarter === 1
              ? "First quarter of the year"
              : achievementDelta != null
                ? `vs Q${quarter - 1}`
                : "No prior data to compare"}
          </span>
        </div>
        <AchievementTrendChart
          data={trend.rows}
          xKey="quarter"
          lines={trend.lines}
          activeKey={`Q${quarter}`}
        />
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
            <RecordPicker scope={scope} />
            <Button
              variant="outline"
              iconRight="chevron_right"
              className="!h-[28px] rounded-lg"
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
        groupBy={groupBy}
        // Same reason: a category id means nothing as an EdPEx group.
        onGroupByChange={(gb) => setFilters({ groupBy: gb, group: "all" })}
      />

      <QueryBoundary isLoading={loading} isError={isError}>
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
            <GroupTabs scope={scope} />

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

            <div className="grid grid-cols-1 gap-md lg:grid-cols-[1fr_1fr_340px]">
              {achievementByQuarterCard}
              {fiveYearTrajectoryCard}
              {recordingStatusCard}
            </div>

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

            <DashboardKpiDrawer
              kpiId={selectedKpiId}
              recordId={record?.id ?? 0}
              year={year}
              quarter={quarter}
              onClose={() => setSelectedKpiId(null)}
            />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
