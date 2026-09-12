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
  SegmentedControl,
  QueryBoundary,
  EmptyState,
  Field,
  Select,
  SearchInput,
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
  useKpiTypes,
  usePerformancePeriods,
  useSyncPerformanceRecord,
  useRecomputeFromDataSources,
  useRecordApprovals,
  useCommittees,
  useCommitteeMemberships,
} from "@/lib/data/hooks";
import { approvalLockForState } from "@/lib/kpi/approvalWorkflow";
import {
  categoriesOfType,
  categoryIdForKpiType,
  categoryTaxonomyForKpiType,
} from "@/lib/kpi/categories";
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
import { formatDate, formatNumber, cn } from "@/lib/utils";
import { KPI_TYPES, type PerformanceStatus } from "@/lib/types";
import { PerfKpiDetailDrawer } from "./kpis/[perfKpiId]/PerfKpiDetail";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  completed: "warning",
};
// Keyed on the seeded ids; kpi_type is user-extensible now, so unknown ids fall
// back to a neutral tone rather than rendering undefined.
const TYPE_TONE: Record<string, "primary" | "info" | "neutral"> = {
  strategic: "primary",
  operational: "info",
  routine: "neutral",
};
const FALLBACK_TYPE_LABELS = new Map<string, string>(
  KPI_TYPES.map((type) => [type.id, type.label]),
);
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
  const { can, role, user } = useAuth();
  const params = useParams<{ recordId: string }>();
  const recordId = Number(params.recordId);

  const recordQ = usePerformanceRecord(recordId);
  const kpisQ = usePerfKpis(recordId);
  const record = recordQ.data;
  const categoriesQ = useKpiCategories(record?.sourceSetId, { enabled: !!record });
  const kpiTypesQ = useKpiTypes();
  const committeesQ = useCommittees();
  const membershipsQ = useCommitteeMemberships();
  const periodsQ = usePerformancePeriods(recordId);
  const sync = useSyncPerformanceRecord();
  const recompute = useRecomputeFromDataSources();

  useBreadcrumbLabel(`/kpi-management/performance/${recordId}`, recordQ.data?.name);

  const [cat, setCat] = useState<string>("all");
  const [selectedKpiType, setSelectedKpiType] = useState<string>("strategic");
  const [committeeFilter, setCommitteeFilter] = useState<string>("all");
  const [committeeQuery, setCommitteeQuery] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  // Clicking a KPI row opens its full editable detail in a right-side drawer
  // instead of navigating away.
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);
  // Drives both the Annual Target / Current Progress columns and the approval
  // lookups below; the quarter selector stays approval-only.
  const [selectedYear, setSelectedYear] = useState(1);
  const [approvalQuarter, setApprovalQuarter] = useState(1);

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const kpis = useMemo(() => kpisQ.data ?? [], [kpisQ.data]);
  const kpiTypes = useMemo(() => kpiTypesQ.data ?? [], [kpiTypesQ.data]);
  const committees = useMemo(() => committeesQ.data ?? [], [committeesQ.data]);
  const kpiTypeById = useMemo(
    () => new Map(kpiTypes.map((type) => [type.id, type])),
    [kpiTypes],
  );
  const kpiTypeOptions = useMemo(
    () =>
      kpiTypesQ.data
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((type) => ({ id: type.id, label: type.kpiTypeName })) ?? KPI_TYPES,
    [kpiTypesQ.data],
  );
  const activeKpiType = kpiTypeOptions.some((type) => type.id === selectedKpiType)
    ? selectedKpiType
    : "strategic";
  // KPI count per committee across the whole record (before any type/category
  // filtering) so each card's badge stays stable as the table filters change.
  const committeeKpiCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const k of kpis) {
      if (k.committeeId)
        counts.set(k.committeeId, (counts.get(k.committeeId) ?? 0) + 1);
    }
    return counts;
  }, [kpis]);
  // Admins/reviewers/viewers oversee every committee, so the rail stays
  // unrestricted for them. A "committee"-role user only sees the committee(s)
  // they belong to — keyed by facultyId (not the session's single,
  // arbitrarily-picked user.committeeId), mirroring
  // resolvePositionFromMemberships in lib/kpi/approvalWorkflow.ts.
  const isCommitteeRestricted = role === "committee";
  const myCommitteeIds = useMemo(() => {
    if (!isCommitteeRestricted) return null; // null = unrestricted
    return new Set(
      (membershipsQ.data ?? [])
        .filter((m) => m.facultyId === user.facultyId)
        .map((m) => m.committeeId),
    );
  }, [isCommitteeRestricted, membershipsQ.data, user.facultyId]);
  // A committee-role user with no membership rows is a data anomaly, not a
  // normal case — fall back to the unrestricted view rather than leaving them
  // with a broken, empty rail.
  const restrictionActive = isCommitteeRestricted && !!myCommitteeIds && myCommitteeIds.size > 0;
  const defaultRestrictedCommitteeId = useMemo(
    () => [...(myCommitteeIds ?? [])].sort()[0] ?? null,
    [myCommitteeIds],
  );
  // A restricted user must never actually be scoped to "all" — the raw
  // committeeFilter state still defaults to "all" (there's no card to select
  // it from for them), so resolve it to their first committee instead.
  const effectiveCommitteeFilter =
    restrictionActive && committeeFilter === "all"
      ? (defaultRestrictedCommitteeId ?? "all")
      : committeeFilter;
  // Filters only the card rail; the selected committee stays keyed off the full
  // list, so searching never clears the current selection.
  const visibleCommittees = useMemo(() => {
    const base = restrictionActive
      ? committees.filter((c) => myCommitteeIds!.has(c.id))
      : committees;
    const q = committeeQuery.trim().toLowerCase();
    return q ? base.filter((c) => c.name.toLowerCase().includes(q)) : base;
  }, [committees, committeeQuery, restrictionActive, myCommitteeIds]);
  const typeLabel = (id: string) =>
    kpiTypeById.get(id)?.kpiTypeName ?? FALLBACK_TYPE_LABELS.get(id) ?? id;
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

  const activeCategories = useMemo(
    () =>
      categoriesOfType(categories, categoryTaxonomyForKpiType(activeKpiType)),
    [categories, activeKpiType],
  );

  // Committee and KPI type narrow the KPI pool first; the category tabs and
  // their counts operate on that intersection.
  const committeeScoped = useMemo(
    () =>
      effectiveCommitteeFilter === "all"
        ? kpis
        : kpis.filter((k) => k.committeeId === effectiveCommitteeFilter),
    [kpis, effectiveCommitteeFilter],
  );
  const typeScoped = useMemo(
    () => committeeScoped.filter((k) => k.kpiType === activeKpiType),
    [committeeScoped, activeKpiType],
  );
  // KPI-type scope WITHOUT the committee filter — i.e. what "All Committees"
  // already shows. Used only as a stable reference for tab labels/counts so
  // the tab bar's rendered width never changes across committee selections
  // (see `tabs` below).
  const typeOnlyScoped = useMemo(
    () => kpis.filter((k) => k.kpiType === activeKpiType),
    [kpis, activeKpiType],
  );
  // Every category tab always renders (same labels/counts as "All
  // Committees"), so the row's footprint is identical no matter which
  // committee is selected. Categories with no KPIs under the *currently
  // selected* committee are marked hidden — invisible and non-interactive,
  // but still occupying their slot — rather than removed, so the tab bar
  // never shrinks or grows when switching committees. The "All" (category)
  // tab is unaffected: always visible, count reflects the current selection.
  const tabs = useMemo(() => {
    const visibleCategoryIds =
      effectiveCommitteeFilter === "all"
        ? null // null = every category is visible; no need to build the set.
        : new Set(
            activeCategories
              .filter((category) =>
                typeScoped.some(
                  (kpi) => categoryIdForKpiType(kpi, activeKpiType) === category.id,
                ),
              )
              .map((category) => category.id),
          );
    const categoryTabs = activeCategories
      .map((category) => ({
        id: category.id,
        label: category.label,
        count: typeOnlyScoped.filter(
          (kpi) => categoryIdForKpiType(kpi, activeKpiType) === category.id,
        ).length,
        hidden: visibleCategoryIds != null && !visibleCategoryIds.has(category.id),
      }))
      // Visible tabs stay packed to the left, right next to "All"; hidden
      // (empty-for-this-committee) tabs are pushed after them. A stable sort
      // keeps each group in its original category order.
      .sort((a, b) => Number(a.hidden) - Number(b.hidden));
    return [
      { id: "all", label: "All", count: typeScoped.length, hidden: false },
      ...categoryTabs,
    ];
  }, [activeCategories, typeScoped, typeOnlyScoped, activeKpiType, effectiveCommitteeFilter]);
  // Falls back to "all" whenever the active category's tab isn't in the list
  // above, or is present but hidden — e.g. it disappeared after switching to a
  // committee/type with no KPIs left in that category.
  const activeCat = tabs.some((tab) => tab.id === cat && !tab.hidden) ? cat : "all";
  const rows = useMemo(
    () =>
      activeCat === "all"
        ? typeScoped
        : typeScoped.filter(
            (kpi) => categoryIdForKpiType(kpi, activeKpiType) === activeCat,
          ),
    [typeScoped, activeCat, activeKpiType],
  );
  const selectedTypeTotal = useMemo(
    () => kpis.filter((kpi) => kpi.kpiType === activeKpiType).length,
    [kpis, activeKpiType],
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
          // Sort by the type's own order (Strategic → Operational → Routine),
          // not alphabetically by its id.
          return kpiTypeById.get(kpi.kpiType)?.sortOrder ?? 99;
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
  }, [rows, sort, selectedYear, approvalLockForKpi, kpiTypeById]);
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
                className="rounded-lg"
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
                className="rounded-lg"
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

      <div className="flex flex-col gap-md rounded-lg border border-hairline bg-surface-lowest px-md py-sm 2xl:flex-row 2xl:items-center 2xl:justify-between">
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
        {/* Keep the filters on their own full-width row until the viewport is
            wide enough for the recording summary and all four controls. The
            toggle is the last independent flex item, so it wraps last. */}
        <div className="flex w-full flex-wrap items-end gap-md 2xl:w-auto 2xl:shrink-0 2xl:justify-end">
          {/* flex-nowrap: Year and Quarter must stay paired on one row at
              every width, even if Committee wraps to its own line above
              them. */}
          <div className="flex flex-nowrap items-end gap-md">
            <Field label="Year">
              <Select
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="!h-[28px] w-auto min-w-[110px] rounded-lg"
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
                className="!h-[28px] w-auto min-w-[90px] rounded-lg"
              >
                {[1, 2, 3, 4].map((quarterNo) => (
                  <option key={quarterNo} value={quarterNo}>
                    Quarter {quarterNo}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-label-md text-on-surface">KPI Type</span>
            <SegmentedControl
              items={kpiTypeOptions}
              active={activeKpiType}
              onChange={(typeId) => {
                setSelectedKpiType(typeId);
                setCat("all");
              }}
              ariaLabel="KPI type"
              selectionStyle="sliding"
              className="h-[28px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-[246px_1fr]">
        <div className="flex flex-col gap-sm">
          <SearchInput
            placeholder="Search committees…"
            value={committeeQuery}
            onChange={(e) => setCommitteeQuery(e.target.value)}
          />
          <div className="flex flex-col gap-sm overflow-y-auto scroll-thin pr-tiny" style={{ maxHeight: 673 }}>
            {/* Pinned reset card — always shown, unaffected by the search.
                Hidden for a committee-role user restricted to their own
                committee(s): they never see the record's full KPI total. */}
            {!restrictionActive && (
              <button
                onClick={() => setCommitteeFilter("all")}
                className={cn(
                  "shrink-0 rounded-lg border p-md text-left transition-colors",
                  effectiveCommitteeFilter === "all"
                    ? "border-primary-container bg-primary-container text-white shadow-md"
                    : "border-hairline bg-surface-lowest hover:bg-surface-soft",
                )}
              >
                <p
                  className={cn(
                    "text-body-strong",
                    effectiveCommitteeFilter === "all" ? "text-white" : "text-on-surface",
                  )}
                >
                  All Committees
                </p>
                <div
                  className={cn(
                    "mt-sm flex items-center gap-lg text-caption-sm",
                    effectiveCommitteeFilter === "all" ? "text-white/80" : "text-mute",
                  )}
                >
                  <span className="inline-flex items-center gap-xs">
                    <Icon name="assessment" size={16} />
                    {kpis.length} KPIs
                  </span>
                </div>
              </button>
            )}
            {visibleCommittees.length === 0 ? (
              <p className="p-lg text-center text-caption-sm text-mute">No committees match.</p>
            ) : (
              visibleCommittees.map((c) => {
                const on = c.id === effectiveCommitteeFilter;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCommitteeFilter(c.id)}
                    className={cn(
                      "shrink-0 rounded-lg border p-md text-left transition-colors",
                      on
                        ? "border-primary-container bg-primary-container text-white shadow-md"
                        : "border-hairline bg-surface-lowest hover:bg-surface-soft",
                    )}
                  >
                    <p
                      className={cn(
                        "line-clamp-2 leading-tight text-body-strong",
                        on ? "text-white" : "text-on-surface",
                      )}
                    >
                      {c.name}
                    </p>
                    <div
                      className={cn(
                        "mt-sm flex items-center gap-lg text-caption-sm",
                        on ? "text-white/80" : "text-mute",
                      )}
                    >
                      <span className="inline-flex items-center gap-xs">
                        <Icon name="target" size={16} />
                        {c.keyMetric}
                      </span>
                      <span className="inline-flex items-center gap-xs">
                        <Icon name="assessment" size={16} />
                        {committeeKpiCounts.get(c.id) ?? 0} KPIs
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-md">
          <Tabs items={tabs} active={activeCat} onChange={setCat} variant="filled" />

          <Card className="overflow-hidden">
        <QueryBoundary isLoading={kpisQ.isLoading} isError={kpisQ.isError}>
          {rows.length === 0 ? (
            <EmptyState
              title={
                selectedTypeTotal === 0
                  ? `No ${typeLabel(activeKpiType)} KPIs in this record`
                  : "No KPIs match these filters"
              }
              message={
                selectedTypeTotal === 0
                  ? `This performance record contains no KPIs assigned the ${typeLabel(activeKpiType)} type.`
                  : "Try a different committee or category."
              }
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
                    align="center"
                  >
                    Current Progress
                  </Th>
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
                    <Tr key={k.id} onClick={() => setSelectedKpiId(k.id)}>
                      <Td className="font-medium">{k.name}</Td>
                      <Td align="center">
                        <Badge tone={TYPE_TONE[k.kpiType] ?? "neutral"}>
                          {typeLabel(k.kpiType)}
                        </Badge>
                      </Td>
                      <Td align="right">
                        {annualTarget == null
                          ? "—"
                          : `${formatNumber(annualTarget, 2)} ${k.unit ?? ""}`}
                      </Td>
                      <Td align="center">
                        {current == null ? (
                          <span className="text-caption-sm text-mute">—</span>
                        ) : (
                          <div className="flex items-center justify-center gap-sm">
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
                            setSelectedKpiId(k.id);
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
        </div>
      </div>

      <PerfKpiDetailDrawer
        recordId={recordId}
        perfKpiId={selectedKpiId ?? 0}
        open={selectedKpiId != null}
        onClose={() => setSelectedKpiId(null)}
      />
    </>
  );
}
