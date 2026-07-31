"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Badge,
  Button,
  Table,
  Th,
  Td,
  Tr,
  Tabs,
  Field,
  Select,
  QueryBoundary,
  EmptyState,
  CountUp,
  AchievementTrendChart,
  GroupAchievementChart,
  HealthDonut,
  TargetVsActualChart,
  HEALTH_FILL,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
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
  UNCATEGORISED,
  type DashboardKpi,
} from "@/lib/kpi/dashboard";
import { HEALTH_LABEL, HEALTH_TONE } from "@/lib/kpi/progress";
import {
  openQuartersForYear,
  PERFORMANCE_YEAR_COUNT,
  yearForYearNo,
} from "@/lib/kpi/performancePeriods";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PerformanceRecord, PerformanceStatus } from "@/lib/types";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  closed: "neutral",
  archived: "warning",
};

export default function DashboardPage() {
  const { user, can } = useAuth();
  const kpis = useKpis();
  const committees = useCommittees();
  const faculty = useFaculty();
  const performanceRecords = usePerformanceRecords();
  const categoriesQ = useKpiCategories();
  const activeRecord =
    performanceRecords.data?.find((record) => record.status === "active") ??
    performanceRecords.data?.[0];
  const approvals = useRecordApprovals(activeRecord?.id ?? 0, 1, 1);

  const categories = categoriesQ.data ?? KPI_CATEGORIES;

  const loading =
    kpis.isLoading ||
    committees.isLoading ||
    faculty.isLoading ||
    performanceRecords.isLoading ||
    approvals.isLoading;

  const atRisk = useMemo(
    () =>
      (kpis.data ?? []).filter(
        (k) => healthOf(k.currentValue, k.thresholds) !== "healthy",
      ),
    [kpis.data],
  );
}

  const pending = (approvals.data ?? []).filter(
    (approval) => approval.state === "submitted" || approval.state === "forwarded",
  ).length;

  // Which record is on screen. Null until the records land, then the active one
  // that is actually being recorded into; the switcher can override it.
  const [recordId, setRecordId] = useState<number | null>(null);
  const activeRecords = useMemo(
    () => (recordsQ.data ?? []).filter((r) => r.status === "active"),
    [recordsQ.data],
  );
  const autoRecord = useMemo(
    () => pickActiveRecord(recordsQ.data ?? []),
    [recordsQ.data],
  );
  useEffect(() => {
    if (recordId == null && autoRecord) setRecordId(autoRecord.id);
  }, [recordId, autoRecord]);
  const record: PerformanceRecord | null =
    (recordsQ.data ?? []).find((r) => r.id === recordId) ?? autoRecord;

  const kpisQ = usePerfKpis(record?.id ?? 0);
  const categoriesQ = useKpiCategories(record?.sourceSetId, { enabled: !!record });
  const periodsQ = usePerformancePeriods(record?.id ?? 0);

  const [year, setYear] = useState(1);
  const [quarter, setQuarter] = useState(4);
  const [group, setGroup] = useState<string>("all");

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

  const statuses = useMemo(
    () => statusesAsOf(scoped, year, quarter),
    [scoped, year, quarter],
  );
  const summary = useMemo(() => summarize(statuses), [statuses]);
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
                onChange={(e) => setRecordId(Number(e.target.value))}
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
              onClick={() =>
                record && router.push(`/kpi-management/performance/${record.id}`)
              }
            >
              Open Record
            </Button>
          </div>
        }
      />

      {/* Filter bar — the same Year/Quarter controls the record page uses, plus
          the strategic group. Everything below reads from these three. */}
      <div className="flex flex-col gap-md rounded-lg border border-hairline bg-surface-lowest px-md py-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-md">
          <Field label="Year">
            <Select
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              className="min-w-[180px] rounded-xl"
            >
              {Array.from({ length: PERFORMANCE_YEAR_COUNT }, (_, i) => i + 1).map((y) => (
                <option key={y} value={y}>
                  {record ? `Year ${y} · ${yearForYearNo(record.startYear, y)}` : `Year ${y}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quarter">
            <Select
              value={String(quarter)}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="min-w-[150px] rounded-xl"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Quarter {q}
                  {openQuarters.includes(q) ? " · open" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="flex items-center gap-sm text-caption-sm text-mute lg:pb-sm">
          <Icon name="history" size={16} className="text-stone" />
          Values are read as of Q{quarter} — the latest quarter recorded up to that point.
        </p>
      </div>

      <QueryBoundary isLoading={loading} isError={recordsQ.isError || kpisQ.isError}>
        {kpis.length === 0 ? (
          <Card>
            <EmptyState
              icon="stacked_bar_chart"
              title="This record has no KPIs"
              message="It was activated from a strategic set with no KPIs, or the sync has not run yet."
            />
          </Card>

          <Card>
            <CardHeader
              title="Needs Review"
              actions={
                can("record_performance") && (
                  <Link href="/validation">
                    <Button variant="ghost" size="sm" iconRight="chevron_right">
                      Queue
                    </Button>
                  </Link>
                )
              }
            />
            <CardBody className="flex flex-col gap-sm">
              <div className="flex items-center gap-md rounded-lg bg-surface-soft p-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Icon name="pending_actions" size={22} />
                </span>
                <div>
                  <p className="text-heading-md text-on-surface">{pending}</p>
                  <p className="text-caption-sm text-mute">
                    KPI packages awaiting review{activeRecord ? ` · ${activeRecord.name}` : ""}
                  </p>
                </div>
              </div>
              <p className="text-body-sm text-mute">
                {can("record_performance")
                  ? "You have reviewer access — open the queue to act on these."
                  : "Reviewers will action these submissions."}
              </p>
            </CardBody>
          </Card>
        </div>

            <div className="grid grid-cols-2 gap-lg lg:grid-cols-4">
              <StatCard
                label="On Target"
                value={summary.pctOnTarget ?? 0}
                unit="%"
                icon="check_circle"
                animate
                tone={
                  summary.graded === 0
                    ? "default"
                    : summary.pctOnTarget! >= 80
                      ? "healthy"
                      : summary.pctOnTarget! >= 50
                        ? "watch"
                        : "at_risk"
                }
                delta={{
                  value: `${summary.onTarget} of ${summary.graded} graded`,
                  direction: "flat",
                }}
                className="animate-fade-up"
              />
              <StatCard
                label="Avg Achievement"
                value={summary.avgAchievement ?? 0}
                unit="%"
                digits={1}
                icon="speed"
                animate
                tone="soft"
                delta={{
                  value: `${summary.withData} KPI(s) with data`,
                  direction: "flat",
                }}
                className="animate-fade-up [animation-delay:60ms]"
              />
              <StatCard
                label="Tracked KPIs"
                value={summary.total}
                icon="tune"
                animate
                delta={{
                  value: summary.noData > 0 ? `${summary.noData} not recorded` : "all recorded",
                  direction: summary.noData > 0 ? "flat" : "up",
                }}
                className="animate-fade-up [animation-delay:120ms]"
              />
              <StatCard
                label="At Risk"
                value={summary.atRisk}
                icon="warning"
                animate
                tone={summary.atRisk > 0 ? "at_risk" : "default"}
                delta={{
                  value: summary.watch > 0 ? `${summary.watch} on watch` : "none on watch",
                  direction: summary.atRisk > 0 ? "down" : "up",
                }}
                className="animate-fade-up [animation-delay:180ms]"
              />
            </div>

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
              {statuses.length === 0 ? (
                <EmptyState
                  title="No KPIs in this group"
                  message="Pick another strategic group, or clear the filter."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>KPI</Th>
                      <Th>Group</Th>
                      <Th align="right">Q{quarter} Target</Th>
                      <Th align="right">Value</Th>
                      <Th>Achievement</Th>
                      <Th align="center">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {statuses.map((s) => {
                      const groupLabel =
                        groups.find(
                          (g) => g.id === (s.categoryId ?? UNCATEGORISED),
                        )?.label ?? "—";
                      return (
                        <Tr
                          key={s.kpiId}
                          onClick={() =>
                            record &&
                            router.push(
                              `/kpi-management/performance/${record.id}/kpis/${s.kpiId}`,
                            )
                          }
                        >
                          <Td className="font-medium">{s.name}</Td>
                          <Td className="text-mute">{groupLabel}</Td>
                          <Td align="right">
                            {s.quarterTarget == null
                              ? "—"
                              : `${formatNumber(s.quarterTarget, 2)} ${s.unit ?? ""}`}
                          </Td>
                          <Td align="right" className="font-medium">
                            {s.value == null
                              ? "—"
                              : `${formatNumber(s.value, 2)} ${s.unit ?? ""}`}
                          </Td>
                          <Td>
                            <AchievementBar pct={s.pct} health={s.health} />
                          </Td>
                          <Td align="center">
                            {s.health ? (
                              <Badge tone={HEALTH_TONE[s.health]}>
                                {HEALTH_LABEL[s.health]}
                              </Badge>
                            ) : (
                              <span className="text-caption-sm text-mute">
                                {s.value == null ? "No data" : "Ungraded"}
                              </span>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}

/** Achievement as a bar that grows from zero on mount. Capped at 100% wide so an
 *  over-achieving KPI cannot push the column open; the number tells the truth. */
function AchievementBar({
  pct,
  health,
}: {
  pct: number | null;
  health: "healthy" | "watch" | "at_risk" | null;
}) {
  if (pct == null) return <span className="text-caption-sm text-mute">—</span>;
  const width = Math.max(2, Math.min(100, pct));
  return (
    <div className="flex items-center gap-sm">
      <div className="h-2 w-[110px] shrink-0 overflow-hidden rounded-full bg-surface-container-high">
        <div
          className="h-full origin-left rounded-full animate-grow-x"
          style={{ width: `${width}%`, background: HEALTH_FILL[health ?? "no_data"] }}
        />
      </div>
      <span className="text-caption-sm tabular-nums text-on-surface">
        {formatNumber(pct, 0)}%
      </span>
    </div>
  );
}
