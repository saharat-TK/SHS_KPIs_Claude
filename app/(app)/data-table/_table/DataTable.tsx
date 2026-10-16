"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Icon,
  PageHeader,
  QueryBoundary,
} from "@/components/ui";
import { useEdpexCatalog, usePerfMetricsByRecord } from "@/lib/data/hooks";
import { downloadCsv } from "@/lib/csv";
import { HEALTH_TONE } from "@/lib/kpi/progress";
import {
  DATA_TABLE_YEARS,
  allExpandableKeys,
  areaKey,
  buildDataTable,
  buildDataTableCsv,
  groupKey,
  indicatorKey,
  kpiKey,
  metricsByKpi,
  type DataTableKpi,
  type DataTableRow,
  type GroupYearCell,
  type YearCell,
} from "@/lib/kpi/dataTable";
import { yearForYearNo } from "@/lib/kpi/performancePeriods";
import { useT } from "@/lib/i18n/useT";
import { cn, formatNumber } from "@/lib/utils";
import { DashboardFilterBar } from "../../dashboard/_dashboard/DashboardFilterBar";
import { DashboardKpiDrawer } from "../../dashboard/_dashboard/DashboardKpiDrawer";
import { GroupTabs, RecordPicker } from "../../dashboard/_dashboard/RecordPicker";
import { useDashboardScope } from "../../dashboard/_dashboard/useDashboardScope";

// KPI and sub-KPI row tints: pale navy, then white, below the grey summary
// rows (see SUMMARY_TONE). The sticky
// name cell carries its own opaque copy (it would otherwise let scrolled cells
// show through), so it follows the row's hover through `group-hover`.
const ROW_TONE = {
  kpi: {
    row: "group bg-[#e8eef7] hover:bg-[#dce5f2]",
    sticky: "bg-[#e8eef7] group-hover:bg-[#dce5f2]",
  },
  sub: {
    row: "group text-on-surface-variant hover:bg-surface-soft/60",
    sticky: "bg-surface-lowest group-hover:bg-surface-soft",
  },
} as const;

/**
 * The dashboard's filtered KPIs as one table: Group → KPI → sub-KPI rows
 * (Topic → Area → Indicator code → KPI → sub-KPI under "Group by: EdPEx"), a
 * column per year of the record (each read as of the selected quarter) and the
 * 5-year target. Filters are the dashboard's own, held in the same URL keys,
 * so a filtered dashboard link opens the same slice here.
 */
export function DataTable() {
  const t = useT();
  const scope = useDashboardScope();
  const {
    year,
    quarter,
    groupBy,
    setFilters,
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

  const metricsQ = usePerfMetricsByRecord(record?.id ?? 0);
  const edpexQ = useEdpexCatalog();
  // Only the EdPEx view splits its groups (topics) by area and indicator code.
  const edpexCatalog = groupBy === "edpex" ? edpexQ.data : undefined;
  const table = useMemo(
    () =>
      buildDataTable({
        kpis: scoped,
        groups,
        categories,
        metrics: metricsByKpi(metricsQ.data ?? []),
        quarter,
        edpexCatalog,
      }),
    [scoped, groups, categories, metricsQ.data, quarter, edpexCatalog],
  );

  // Groups, areas and indicators open, KPIs closed: the first view is every
  // KPI, without the sub-KPI detail. `collapsed` holds the summary-row keys the
  // user shut; `openKpis` the KPI keys they opened.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [openKpis, setOpenKpis] = useState<Set<string>>(new Set());
  const expanded = useMemo(() => {
    const keys = new Set(openKpis);
    for (const key of allExpandableKeys(table)) {
      if (!key.startsWith("k:") && !collapsed.has(key)) keys.add(key);
    }
    return keys;
  }, [table, collapsed, openKpis]);

  const toggle = (key: string) => {
    if (key.startsWith("k:")) {
      setOpenKpis((s) => flip(s, key));
    } else {
      setCollapsed((s) => flip(s, key));
    }
  };
  const expandAll = () => {
    setCollapsed(new Set());
    setOpenKpis(new Set(allExpandableKeys(table).filter((k) => k.startsWith("k:"))));
  };
  const collapseAll = () => {
    setCollapsed(new Set(allExpandableKeys(table).filter((k) => !k.startsWith("k:"))));
    setOpenKpis(new Set());
  };

  const yearLabels = Array.from({ length: DATA_TABLE_YEARS }, (_, i) =>
    record
      ? `${t("dataTable.year", { n: i + 1 })} · ${yearForYearNo(record.startYear, i + 1)}`
      : t("dataTable.year", { n: i + 1 }),
  );

  const exportCsv = () =>
    downloadCsv(
      `data-table-${record?.startYear ?? ""}-q${quarter}.csv`,
      buildDataTableCsv(table, { expanded, yearLabels }),
    );

  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);
  const kpiCount = table.reduce((n, g) => n + g.kpis.length, 0);
  const colCount = 3 + DATA_TABLE_YEARS;

  return (
    <>
      <PageHeader
        title={t("dataTable.title")}
        description={
          record ? `${record.name} · ${record.startYear}–${record.endYear}` : t("dataTable.loading")
        }
        actions={
          <div className="flex items-center gap-sm">
            <RecordPicker scope={scope} />
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
        onTypeChange={(type) => setFilters({ type, group: "all" })}
        groupBy={groupBy}
        onGroupByChange={(gb) => setFilters({ groupBy: gb, group: "all" })}
      />

      <QueryBoundary isLoading={loading} isError={isError}>
        {!record || kpis.length === 0 || typed.length === 0 ? (
          <Card>
            <EmptyState
              icon="table_chart"
              title={t("dataTable.emptyTitle")}
              message={t("dataTable.emptyMessage")}
            />
          </Card>
        ) : (
          <>
            <GroupTabs scope={scope} />

            <Card className="overflow-hidden shadow-chrome !border-0">
              <CardHeader
                title={t("dataTable.title")}
                subtitle={t("dataTable.subtitle", { count: kpiCount, quarter })}
                actions={
                  <div className="flex flex-wrap items-center gap-xs">
                    <Button size="sm" variant="ghost" icon="unfold_more" onClick={expandAll}>
                      {t("dataTable.expandAll")}
                    </Button>
                    <Button size="sm" variant="ghost" icon="unfold_less" onClick={collapseAll}>
                      {t("dataTable.collapseAll")}
                    </Button>
                    <Button size="sm" variant="outline" icon="download" onClick={exportCsv}>
                      {t("dataTable.exportCsv")}
                    </Button>
                  </div>
                }
              />
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full min-w-[1100px] border-collapse text-body-sm">
                  <thead>
                    <tr>
                      <HeadCell className="sticky left-0 z-10 min-w-[320px] bg-surface-lowest text-left">
                        {t("dataTable.name")}
                      </HeadCell>
                      <HeadCell className="text-left">{t("dataTable.unit")}</HeadCell>
                      {yearLabels.map((label, i) => (
                        <HeadCell
                          key={label}
                          className={cn("text-right", i + 1 === year && "bg-primary/10 text-on-surface")}
                        >
                          {label}
                        </HeadCell>
                      ))}
                      <HeadCell className="text-right">{t("dataTable.fiveYearTarget")}</HeadCell>
                    </tr>
                  </thead>
                  <tbody>
                    {table.length === 0 && (
                      <tr>
                        <td colSpan={colCount} className="px-lg py-lg text-center text-mute">
                          {t("dataTable.noKpisInGroup")}
                        </td>
                      </tr>
                    )}
                    {table.map((g) => {
                      const gOpen = expanded.has(groupKey(g.id));
                      const kpiRows = (kpis: DataTableKpi[], under: KpiParent) => (
                        <KpiRows
                          kpis={kpis}
                          under={under}
                          year={year}
                          expanded={expanded}
                          onToggle={toggle}
                          onOpenKpi={setSelectedKpiId}
                        />
                      );
                      return (
                        <Fragment key={g.id}>
                          <SummaryRow
                            level="group"
                            label={g.label}
                            kpiCount={g.kpis.length}
                            years={g.years}
                            year={year}
                            open={gOpen}
                            onToggle={() => toggle(groupKey(g.id))}
                          />
                          {gOpen &&
                            (g.areas
                              ? g.areas.map((a) => {
                                  const aOpen = expanded.has(areaKey(a.id));
                                  return (
                                    <Fragment key={a.id}>
                                      <SummaryRow
                                        level="area"
                                        label={a.label}
                                        kpiCount={a.kpis.length}
                                        years={a.years}
                                        year={year}
                                        open={aOpen}
                                        onToggle={() => toggle(areaKey(a.id))}
                                      />
                                      {aOpen &&
                                        a.indicators.map((i) => {
                                          const iOpen = expanded.has(indicatorKey(i.id));
                                          return (
                                            <Fragment key={i.id}>
                                              <SummaryRow
                                                level="indicator"
                                                label={i.label}
                                                kpiCount={i.kpis.length}
                                                years={i.years}
                                                year={year}
                                                open={iOpen}
                                                onToggle={() => toggle(indicatorKey(i.id))}
                                              />
                                              {iOpen && kpiRows(i.kpis, "indicator")}
                                            </Fragment>
                                          );
                                        })}
                                    </Fragment>
                                  );
                                })
                              : kpiRows(g.kpis, "group"))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <DashboardKpiDrawer
              kpiId={selectedKpiId}
              recordId={record.id}
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

// Name-column indent by the row a KPI sits under: a group (category view) or
// an EdPEx indicator code. Each summary level sits one chevron-width (24px) in
// from the one above; a KPI 12px past its parent row, a sub-KPI 52px past it.
const KPI_INDENT = { group: "pl-md", indicator: "pl-[60px]" } as const;
const SUB_INDENT = { group: "pl-[64px]", indicator: "pl-[112px]" } as const;
type KpiParent = keyof typeof KPI_INDENT;

const SUMMARY_TONE = {
  group: { bg: "bg-surface-container-highest", indent: "", label: "font-bold uppercase text-label-md" },
  area: { bg: "bg-surface-container", indent: "pl-[24px]", label: "font-semibold" },
  indicator: { bg: "bg-surface-container-low", indent: "pl-[48px]", label: "font-medium" },
} as const;

/** A group, EdPEx-area or indicator-code row: toggle, KPI count and the
 *  yearly average %. */
function SummaryRow({
  level,
  label,
  kpiCount,
  years,
  year,
  open,
  onToggle,
}: {
  level: keyof typeof SUMMARY_TONE;
  label: string;
  kpiCount: number;
  years: GroupYearCell[];
  year: number;
  open: boolean;
  onToggle: () => void;
}) {
  const tone = SUMMARY_TONE[level];
  return (
    <tr className={tone.bg}>
      <td className={cn("sticky left-0 z-[1] border-b border-hairline px-md py-xs", tone.bg)}>
        <span className={cn("block", tone.indent)}>
          <ToggleName
            open={open}
            onToggle={onToggle}
            label={label}
            className={tone.label}
            suffix={`· ${kpiCount} KPI${kpiCount === 1 ? "" : "s"}`}
          />
        </span>
      </td>
      <td className="border-b border-hairline" />
      {years.map((c) => (
        <td
          key={c.yearNo}
          className={cn(
            "border-b border-hairline px-md py-xs text-right",
            c.yearNo === year && "bg-primary/10",
          )}
        >
          <GroupPct cell={c} />
        </td>
      ))}
      <td className="border-b border-hairline" />
    </tr>
  );
}

/** KPI rows, each followed by its sub-KPIs while it is expanded. */
function KpiRows({
  kpis,
  under,
  year,
  expanded,
  onToggle,
  onOpenKpi,
}: {
  kpis: DataTableKpi[];
  under: KpiParent;
  year: number;
  expanded: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onOpenKpi: (kpiId: number) => void;
}) {
  return (
    <>
      {kpis.map((k) => {
        const hasSubs = k.subKpis.length > 0;
        const kOpen = expanded.has(kpiKey(k.id));
        return (
          <Fragment key={k.id}>
            <DataRow
              row={k}
              year={year}
              tone="kpi"
              name={
                <span className={cn("flex items-center gap-xs", KPI_INDENT[under])}>
                  {hasSubs ? (
                    <ChevronButton
                      open={kOpen}
                      onClick={() => onToggle(kpiKey(k.id))}
                      label={k.name}
                    />
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}
                  <button
                    type="button"
                    className="text-left font-medium text-on-surface hover:underline"
                    onClick={() => onOpenKpi(k.id)}
                  >
                    {k.name}
                  </button>
                  {hasSubs && (
                    <span className="shrink-0 text-caption-sm text-mute">({k.subKpis.length})</span>
                  )}
                </span>
              }
            />
            {kOpen &&
              k.subKpis.map((m) => (
                <DataRow
                  key={`m${m.id}`}
                  row={m}
                  year={year}
                  tone="sub"
                  name={
                    <span className={cn("block text-on-surface-variant", SUB_INDENT[under])}>
                      {m.name}
                    </span>
                  }
                />
              ))}
          </Fragment>
        );
      })}
    </>
  );
}

function flip(set: Set<string>, key: string): Set<string> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function HeadCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-hairline px-md py-sm text-caption-sm font-medium uppercase tracking-wider text-mute",
        className,
      )}
    >
      {children}
    </th>
  );
}

function ChevronButton({
  open,
  onClick,
  label,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center rounded text-mute hover:bg-ink/10 hover:text-on-surface"
    >
      <Icon name={open ? "expand_more" : "chevron_right"} size={18} />
    </button>
  );
}

function ToggleName({
  open,
  onToggle,
  label,
  suffix,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className="flex items-center gap-xs">
      <ChevronButton open={open} onClick={onToggle} label={label} />
      <button type="button" onClick={onToggle} className={cn("text-left text-on-surface", className)}>
        {label}
      </button>
      {suffix && <span className="shrink-0 text-caption-sm text-mute">{suffix}</span>}
    </span>
  );
}

function DataRow({
  row,
  year,
  name,
  tone,
}: {
  row: DataTableRow;
  year: number;
  name: React.ReactNode;
  tone: keyof typeof ROW_TONE;
}) {
  return (
    <tr className={ROW_TONE[tone].row}>
      <td className={cn("sticky left-0 z-[1] border-b border-hairline px-md py-xs", ROW_TONE[tone].sticky)}>
        {name}
      </td>
      <td className="whitespace-nowrap border-b border-hairline px-md py-xs text-mute">
        {row.unit ?? "—"}
      </td>
      {row.years.map((c) => (
        <td
          key={c.yearNo}
          className={cn(
            "border-b border-hairline px-md py-xs text-right align-top",
            c.yearNo === year && "bg-primary/10",
          )}
        >
          <YearValue cell={c} />
        </td>
      ))}
      <td className="whitespace-nowrap border-b border-hairline px-md py-xs text-right">
        {row.fiveYearTarget == null ? "—" : formatNumber(row.fiveYearTarget, 2)}
      </td>
    </tr>
  );
}

function YearValue({ cell }: { cell: YearCell }) {
  if (cell.value == null && cell.target == null) {
    return <span className="text-mute">—</span>;
  }
  return (
    <span className="inline-flex flex-col items-end gap-tiny">
      <span className="whitespace-nowrap tabular-nums">
        <span className="font-medium">{cell.value == null ? "—" : formatNumber(cell.value, 2)}</span>
        <span className="text-mute"> / {cell.target == null ? "—" : formatNumber(cell.target, 2)}</span>
      </span>
      {cell.pct != null && <PctPill pct={cell.pct} health={cell.health} />}
    </span>
  );
}

function GroupPct({ cell }: { cell: GroupYearCell }) {
  return cell.pct == null ? (
    <span className="text-mute">—</span>
  ) : (
    <PctPill pct={cell.pct} health={cell.health} />
  );
}

function PctPill({ pct, health }: { pct: number; health: YearCell["health"] }) {
  const text = `${formatNumber(pct, 1)}%`;
  return health ? (
    <Badge tone={HEALTH_TONE[health]}>{text}</Badge>
  ) : (
    <span className="text-caption-sm text-mute tabular-nums">{text}</span>
  );
}
