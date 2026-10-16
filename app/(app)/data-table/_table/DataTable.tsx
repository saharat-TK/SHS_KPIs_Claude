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
import { usePerfMetricsByRecord } from "@/lib/data/hooks";
import { downloadCsv } from "@/lib/csv";
import { HEALTH_TONE } from "@/lib/kpi/progress";
import {
  DATA_TABLE_YEARS,
  allExpandableKeys,
  buildDataTable,
  buildDataTableCsv,
  groupKey,
  kpiKey,
  metricsByKpi,
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

/**
 * The dashboard's filtered KPIs as one table: Group → KPI → sub-KPI rows, a
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
  const table = useMemo(
    () =>
      buildDataTable({
        kpis: scoped,
        groups,
        categories,
        metrics: metricsByKpi(metricsQ.data ?? []),
        quarter,
      }),
    [scoped, groups, categories, metricsQ.data, quarter],
  );

  // Groups open, KPIs closed: the first view is every KPI, without the
  // sub-KPI detail. Keys absent from the set are collapsed.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [openKpis, setOpenKpis] = useState<Set<string>>(new Set());
  const expanded = useMemo(() => {
    const keys = new Set(openKpis);
    for (const g of table) if (!collapsedGroups.has(groupKey(g.id))) keys.add(groupKey(g.id));
    return keys;
  }, [table, collapsedGroups, openKpis]);

  const toggle = (key: string) => {
    if (key.startsWith("g:")) {
      setCollapsedGroups((s) => flip(s, key));
    } else {
      setOpenKpis((s) => flip(s, key));
    }
  };
  const expandAll = () => {
    setCollapsedGroups(new Set());
    setOpenKpis(new Set(allExpandableKeys(table).filter((k) => k.startsWith("k:"))));
  };
  const collapseAll = () => {
    setCollapsedGroups(new Set(table.map((g) => groupKey(g.id))));
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
                      return (
                        <Fragment key={g.id}>
                          <tr className="bg-surface-soft">
                            <td className="sticky left-0 z-[1] border-b border-hairline bg-surface-soft px-md py-xs">
                              <ToggleName
                                open={gOpen}
                                onToggle={() => toggle(groupKey(g.id))}
                                label={g.label}
                                className="font-bold uppercase text-label-md"
                                suffix={`· ${g.kpis.length} KPI${g.kpis.length === 1 ? "" : "s"}`}
                              />
                            </td>
                            <td className="border-b border-hairline" />
                            {g.years.map((c) => (
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
                          {gOpen &&
                            g.kpis.map((k) => {
                              const hasSubs = k.subKpis.length > 0;
                              const kOpen = expanded.has(kpiKey(k.id));
                              return (
                                <Fragment key={k.id}>
                                  <DataRow
                                    row={k}
                                    year={year}
                                    name={
                                      <span className="flex items-center gap-xs pl-md">
                                        {hasSubs ? (
                                          <ChevronButton
                                            open={kOpen}
                                            onClick={() => toggle(kpiKey(k.id))}
                                            label={k.name}
                                          />
                                        ) : (
                                          <span className="w-6 shrink-0" />
                                        )}
                                        <button
                                          type="button"
                                          className="text-left font-medium text-on-surface hover:underline"
                                          onClick={() => setSelectedKpiId(k.id)}
                                        >
                                          {k.name}
                                        </button>
                                        {hasSubs && (
                                          <span className="shrink-0 text-caption-sm text-mute">
                                            ({k.subKpis.length})
                                          </span>
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
                                        muted
                                        name={
                                          <span className="block pl-[64px] text-on-surface-variant">
                                            {m.name}
                                          </span>
                                        }
                                      />
                                    ))}
                                </Fragment>
                              );
                            })}
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
      className="grid h-6 w-6 shrink-0 place-items-center rounded text-mute hover:bg-surface-container-high hover:text-on-surface"
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
  muted,
}: {
  row: DataTableRow;
  year: number;
  name: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <tr className={cn("hover:bg-surface-soft/60", muted && "text-on-surface-variant")}>
      <td className="sticky left-0 z-[1] border-b border-hairline bg-surface-lowest px-md py-xs">
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
