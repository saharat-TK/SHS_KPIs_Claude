"use client";

import {
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type RefObject,
  type UIEvent,
} from "react";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Button,
  Badge,
  Tabs,
  QueryBoundary,
  EmptyState,
  SearchInput,
  useConfirm,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useDataSource,
  useDataSourceColumns,
  useDataSourceEntries,
  useDataSourceLinks,
  useDeleteDataSourceEntry,
  useDeleteDataSourceLink,
  useFacultyRecords,
} from "@/lib/data/hooks";
import {
  formatCellValue,
  formatEntryPeriod,
  isHttpUrl,
} from "@/lib/kpi/dataSources";
import { describeMapping } from "@/lib/kpi/dataSourceFilters";
import { buildCellLabels } from "@/lib/kpi/programs";
import { downloadCsv, toCsv } from "@/lib/csv";
import { Icon } from "@/components/ui/Icon";
import type { DataSourceColumn, DataSourceEntry, DataSourceLink } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EntryModal } from "./EntryModal";
import { LinkKpiModal } from "./LinkKpiModal";
import { ManageColumnsModal } from "./ManageColumnsModal";

const DATA_TABLE_COLUMN_WIDTHS = {
  period: 80,
  custom: 112,
  note: 56,
  createdAt: 112,
  actions: 88,
  titleMinimum: 180,
  tableMinimum: 640,
} as const;
const TITLE_COLUMN_SHARE = 0.18;

export default function DataSourceDetailPage({
  params,
}: {
  params: { dataSourceId: string };
}) {
  return (
    <RequirePermission action="view_dashboards">
      <DataSourceDetail id={Number(params.dataSourceId)} />
    </RequirePermission>
  );
}

function DataSourceDetail({ id }: { id: number }) {
  const { can, user } = useAuth();
  const sourceQ = useDataSource(id);
  const columnsQ = useDataSourceColumns(id);
  const linksQ = useDataSourceLinks(id);
  const [tab, setTab] = useState("data");
  const [showColumns, setShowColumns] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [editing, setEditing] = useState<DataSourceEntry | null>(null);
  const [editingLink, setEditingLink] = useState<DataSourceLink | null>(null);
  const [adding, setAdding] = useState(false);
  const [findData, setFindData] = useState("");

  const source = sourceQ.data;
  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const links = linksQ.data ?? [];

  useBreadcrumbLabel(
    `/kpi-management/data-sources/${id}`,
    source?.name ?? undefined,
  );

  const isAdmin = can("configure_kpis");
  // can() already blocks a committee user acting on another committee.
  const canRecord = !!source && can("submit_metrics", { committeeId: source.committeeId });

  const entriesQ = useDataSourceEntries(id);
  const entries = entriesQ.data ?? [];

  // Derived cells store a code (faculty id, program abbr); the table and the CSV
  // both resolve it through this one map so the two always agree.
  const facultyQ = useFacultyRecords();
  const cellLabels = useMemo(
    () => buildCellLabels(facultyQ.data ?? []),
    [facultyQ.data],
  );

  const exportCsv = () => {
    if (!source) return;
    const headers = ["Period", ...columns.map((c) => c.label), "Note", "Created at"];
    const rows = entries.map((e) => [
      formatEntryPeriod(e.year, e.quarter),
      ...columns.map((c) => formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)),
      e.note ?? "",
      formatEntryCreatedAt(e.createdAt),
    ]);
    downloadCsv(`${source.name.replace(/\s+/g, "-").toLowerCase()}.csv`, toCsv(headers, rows));
  };

  return (
    <QueryBoundary isLoading={sourceQ.isLoading} isError={sourceQ.isError}>
      {!source ? null : (
        <>
          <PageHeader
            title={source.name}
            description={
              source.description ??
              `Raw data owned by ${source.committeeName ?? source.committeeId}.`
            }
            actions={
              <div className="flex items-center gap-sm">
                {entries.length > 0 && (
                  <Button variant="ghost" icon="download" onClick={exportCsv}>
                    Export CSV
                  </Button>
                )}
                {tab === "data" && canRecord && columns.length > 0 && (
                  <Button icon="add" onClick={() => setAdding(true)}>
                    Add Entry
                  </Button>
                )}
                {tab === "columns" && isAdmin && (
                  <Button icon="edit" onClick={() => setShowColumns(true)}>
                    Manage Columns
                  </Button>
                )}
                {tab === "links" && isAdmin && (
                  <Button icon="add_link" onClick={() => setShowLink(true)}>
                    Link KPI
                  </Button>
                )}
              </div>
            }
          />

          <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-sm text-body-sm text-mute sm:flex-1 sm:flex-nowrap">
              <Badge className="shrink-0" tone={source.status === "active" ? "success" : "neutral"}>
                {source.status}
              </Badge>
              <span className="min-w-0 truncate">{source.committeeName ?? source.committeeId}</span>
              <span className="shrink-0">·</span>
              <span className="shrink-0">{source.periodGrain} entries</span>
            </div>
            {tab === "data" && columns.length > 0 && (
              <div className="w-full sm:ml-md sm:w-80 sm:shrink-0">
                <SearchInput
                  aria-label="Find data"
                  placeholder="Find data"
                  value={findData}
                  onChange={(event) => setFindData(event.target.value)}
                />
              </div>
            )}
          </div>

          <Tabs
            className="mb-md"
            active={tab}
            onChange={setTab}
            items={[
              { id: "data", label: "Data", count: entries.length },
              { id: "columns", label: "Columns", count: columns.length },
              { id: "links", label: "Linked KPIs", count: links.length },
            ]}
          />

          {tab === "data" && (
            <Card className="overflow-visible">
              <QueryBoundary isLoading={entriesQ.isLoading} isError={entriesQ.isError}>
                {columns.length === 0 ? (
                  <EmptyState
                    icon="view_column"
                    title="No columns defined yet"
                    message="This data source needs columns before anyone can record data against it."
                    action={
                      isAdmin ? (
                        <Button icon="edit" onClick={() => setShowColumns(true)}>
                          Manage Columns
                        </Button>
                      ) : undefined
                    }
                  />
                ) : entries.length === 0 ? (
                  <EmptyState
                    icon="table_rows"
                    title="No data recorded yet"
                    message={
                      canRecord
                        ? "Add the first entry for this data source."
                        : "Only this data source's committee can record entries."
                    }
                    action={
                      canRecord ? (
                        <Button icon="add" onClick={() => setAdding(true)}>
                          Add Entry
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <EntriesTable
                    columns={columns}
                    entries={entries}
                    canRecord={canRecord}
                    dataSourceId={id}
                    actor={{ actorId: user?.facultyId, userRole: user?.role }}
                    cellLabels={cellLabels}
                    query={findData}
                    onEdit={setEditing}
                  />
                )}
              </QueryBoundary>
            </Card>
          )}

          {tab === "columns" && (
            <Card className="overflow-hidden">
              {columns.length === 0 ? (
                <EmptyState
                  icon="view_column"
                  title="No columns defined yet"
                  message="Columns describe what this data source collects."
                  action={
                    isAdmin ? (
                      <Button icon="edit" onClick={() => setShowColumns(true)}>
                        Manage Columns
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Label</Th>
                      <Th>Stored as</Th>
                      <Th align="center">Type</Th>
                      <Th align="center">Unit</Th>
                      <Th align="center">Required</Th>
                      <Th>Options</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((c) => (
                      <tr key={c.id} className="border-t border-hairline">
                        <Td className="font-medium">{c.label}</Td>
                        <Td className="text-mute">
                          <code>{c.colKey}</code>
                        </Td>
                        <Td align="center">{c.dataType}</Td>
                        <Td align="center" className="text-mute">
                          {c.unit ?? "—"}
                        </Td>
                        <Td align="center">{c.isRequired ? "Yes" : "—"}</Td>
                        <Td className="text-mute">{c.options?.join(", ") ?? "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          )}

          {tab === "links" && (
            <Card className="overflow-hidden">
              <QueryBoundary isLoading={linksQ.isLoading} isError={linksQ.isError}>
                {links.length === 0 ? (
                  <EmptyState
                    icon="add_link"
                    title="Not linked to any KPI yet"
                    message="Linking records that this data source is the evidence behind a KPI or metric. It does not feed values into progress — that stays manual."
                    action={
                      isAdmin ? (
                        <Button icon="add_link" onClick={() => setShowLink(true)}>
                          Link KPI
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <LinksTable
                    dataSourceId={id}
                    links={links}
                    columns={columns}
                    cellLabels={cellLabels}
                    isAdmin={isAdmin}
                    onEdit={setEditingLink}
                  />
                )}
              </QueryBoundary>
            </Card>
          )}

          <ManageColumnsModal
            open={showColumns}
            onClose={() => setShowColumns(false)}
            dataSourceId={id}
            columns={columns}
          />

          <LinkKpiModal
            open={showLink || !!editingLink}
            onClose={() => {
              setShowLink(false);
              setEditingLink(null);
            }}
            dataSourceId={id}
            link={editingLink}
          />

          {(adding || editing) && (
            <EntryModal
              open
              onClose={() => {
                setAdding(false);
                setEditing(null);
              }}
              dataSourceId={id}
              periodGrain={source.periodGrain}
              columns={columns}
              entry={editing}
            />
          )}
        </>
      )}
    </QueryBoundary>
  );
}

function EntriesTable({
  columns,
  entries,
  canRecord,
  dataSourceId,
  actor,
  cellLabels,
  query,
  onEdit,
}: {
  columns: DataSourceColumn[];
  entries: DataSourceEntry[];
  canRecord: boolean;
  dataSourceId: number;
  actor: { actorId?: string; userRole?: string };
  cellLabels: Record<string, string>;
  query: string;
  onEdit: (entry: DataSourceEntry) => void;
}) {
  const confirm = useConfirm();
  const remove = useDeleteDataSourceEntry();
  const [sort, setSort] = useState<SortState | null>(null);
  const [tooltip, setTooltip] = useState<CellTooltip | null>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const titleColumnId = columns.find(isTitleColumn)?.id;
  const fixedColumnWidth =
    DATA_TABLE_COLUMN_WIDTHS.period +
    DATA_TABLE_COLUMN_WIDTHS.note +
    DATA_TABLE_COLUMN_WIDTHS.createdAt +
    (canRecord ? DATA_TABLE_COLUMN_WIDTHS.actions : 0) +
    columns.filter((column) => column.id !== titleColumnId).length *
      DATA_TABLE_COLUMN_WIDTHS.custom;
  const tableMinimumWidth = Math.ceil(
    Math.max(
      DATA_TABLE_COLUMN_WIDTHS.tableMinimum,
      titleColumnId
        ? Math.max(
            fixedColumnWidth / (1 - TITLE_COLUMN_SHARE),
            DATA_TABLE_COLUMN_WIDTHS.titleMinimum / TITLE_COLUMN_SHARE,
          )
        : fixedColumnWidth,
    ),
  );

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return entries;

    return entries.filter((entry) =>
      [
        formatEntryPeriod(entry.year, entry.quarter),
        ...columns.map((column) =>
          formatCellValue(column, entry.values[column.colKey] ?? null, cellLabels),
        ),
        entry.note ?? "",
        formatEntryCreatedAt(entry.createdAt),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [cellLabels, columns, entries, query]);

  const visibleEntries = useMemo(() => {
    if (!sort) return filteredEntries;
    return [...filteredEntries].sort((left, right) => {
      const comparison = compareEntries(left, right, sort.key, columns, cellLabels);
      const directed = sort.direction === "asc" ? comparison : -comparison;
      return directed || left.id - right.id;
    });
  }, [cellLabels, columns, filteredEntries, sort]);

  const setSortKey = (key: string) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );

  const showTooltip = (
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    text: string,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      left: Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - 336),
      ),
      top: Math.min(
        rect.bottom + 8,
        Math.max(8, window.innerHeight - 120),
      ),
    });
  };

  const tooltipEvents = (text: string) => ({
    onMouseEnter: (event: MouseEvent<HTMLElement>) => showTooltip(event, text),
    onMouseLeave: () => setTooltip(null),
    onFocus: (event: FocusEvent<HTMLElement>) => showTooltip(event, text),
    onBlur: () => setTooltip(null),
  });

  const syncHorizontalScroll = (
    targetRef: RefObject<HTMLDivElement>,
    event: UIEvent<HTMLDivElement>,
  ) => {
    const target = targetRef.current;
    if (target && target.scrollLeft !== event.currentTarget.scrollLeft) {
      target.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  return (
    <>
      {visibleEntries.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="No matching data"
          message="Try a different search term."
        />
      ) : (
      <>
      <div className="max-h-[60vh] overflow-y-auto scroll-thin [scrollbar-gutter:stable]">
      <div className="sticky top-0 z-20 bg-surface-lowest">
        <div
          ref={headerScrollRef}
          onScroll={(event) => syncHorizontalScroll(bodyScrollRef, event)}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <table
            className="w-full !border-separate border-spacing-0 table-fixed text-body-sm"
            style={{ minWidth: `${tableMinimumWidth}px` }}
          >
            <DataTableColumnGroup
              columns={columns}
              titleColumnId={titleColumnId}
              canRecord={canRecord}
            />
            <DataTableHeader columns={columns} canRecord={canRecord} sort={sort} onSort={setSortKey} />
          </table>
        </div>
      </div>
      <div
        ref={bodyScrollRef}
        onScroll={(event) => syncHorizontalScroll(headerScrollRef, event)}
        className="overflow-x-auto scroll-thin"
      >
        <table
          className="w-full !border-separate border-spacing-0 table-fixed text-body-sm"
          style={{ minWidth: `${tableMinimumWidth}px` }}
        >
          <DataTableColumnGroup
            columns={columns}
            titleColumnId={titleColumnId}
            canRecord={canRecord}
          />
        <tbody>
          {visibleEntries.map((e) => (
            <tr key={e.id} className="group border-t border-hairline hover:bg-surface-soft">
              <Td className="whitespace-nowrap font-medium">
                <CellPreview
                  text={formatEntryPeriod(e.year, e.quarter)}
                  {...tooltipEvents(formatEntryPeriod(e.year, e.quarter))}
                />
              </Td>
              {columns.map((c) => (
                <Td
                  key={c.id}
                  align={c.dataType === "number" ? "right" : "left"}
                >
                  {c.dataType === "url" ? (
                    <UrlCell
                      value={formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)}
                      tooltipEvents={tooltipEvents}
                    />
                  ) : (
                    <CellPreview
                      text={
                        c.id === titleColumnId
                          ? clipText(
                              formatCellValue(c, e.values[c.colKey] ?? null, cellLabels),
                              30,
                            )
                          : formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)
                      }
                      className={
                        c.id === titleColumnId ? "w-full min-w-0 !max-w-full" : undefined
                      }
                      {...tooltipEvents(
                        formatCellValue(c, e.values[c.colKey] ?? null, cellLabels),
                      )}
                    />
                  )}
                </Td>
              ))}
              <Td className="text-mute">
                <NoteCell note={e.note} tooltipEvents={tooltipEvents} />
              </Td>
              <Td className="text-mute">
                <CellPreview
                  text={formatEntryCreatedAt(e.createdAt)}
                  {...tooltipEvents(formatEntryCreatedAt(e.createdAt))}
                />
              </Td>
              {canRecord && (
                <Td
                  align="right"
                  className="sticky right-0 z-10 !px-md border-l border-hairline bg-surface-lowest shadow-[-8px_0_12px_-10px_rgb(0_0_0_/_0.35)] transition-colors group-hover:bg-surface-soft"
                >
                  <div className="inline-flex items-center gap-xxs">
                    <button
                      type="button"
                      aria-label="Edit entry"
                      title="Edit entry"
                      onClick={() => onEdit(e)}
                      className="grid h-7 w-7 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <Icon name="edit" className="text-[18px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete entry"
                      title="Delete entry"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Delete this entry?",
                          message: `The ${formatEntryPeriod(e.year, e.quarter)} row will be permanently removed.`,
                          tone: "danger",
                          confirmLabel: "Delete",
                        });
                        if (ok) remove.mutate({ dataSourceId, entryId: e.id, actor });
                      }}
                      className="grid h-7 w-7 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      </div>
      </>
      )}
      {tooltip && (
        <div
          role="tooltip"
          className="fixed z-50 max-h-48 max-w-sm overflow-auto rounded-md bg-inverse-surface px-sm py-xs text-caption-sm text-inverse-on-surface shadow-lg whitespace-pre-wrap"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}

function DataTableColumnGroup({
  columns,
  titleColumnId,
  canRecord,
}: {
  columns: DataSourceColumn[];
  titleColumnId?: number;
  canRecord: boolean;
}) {
  return (
    <colgroup>
      <col style={{ width: `${DATA_TABLE_COLUMN_WIDTHS.period}px` }} />
      {columns.map((column) => (
        <col
          key={column.id}
          style={{
            width:
              column.id === titleColumnId
                ? `${TITLE_COLUMN_SHARE * 100}%`
                : `${DATA_TABLE_COLUMN_WIDTHS.custom}px`,
          }}
        />
      ))}
      <col style={{ width: `${DATA_TABLE_COLUMN_WIDTHS.note}px` }} />
      <col style={{ width: `${DATA_TABLE_COLUMN_WIDTHS.createdAt}px` }} />
      {canRecord && <col style={{ width: `${DATA_TABLE_COLUMN_WIDTHS.actions}px` }} />}
    </colgroup>
  );
}

function DataTableHeader({
  columns,
  canRecord,
  sort,
  onSort,
}: {
  columns: DataSourceColumn[];
  canRecord: boolean;
  sort: SortState | null;
  onSort: (key: string) => void;
}) {
  return (
    <thead>
      <tr>
        <Th
          sortable
          sortDir={sort?.key === "__period" ? sort.direction : null}
          onSort={() => onSort("__period")}
          className="bg-surface-lowest"
        >
          Period
        </Th>
        {columns.map((column) => (
          <Th
            key={column.id}
            sortable
            sortDir={sort?.key === columnSortKey(column) ? sort.direction : null}
            onSort={() => onSort(columnSortKey(column))}
            align={column.dataType === "number" ? "right" : "left"}
            className="bg-surface-lowest"
          >
            {column.label}
            {column.unit ? ` (${column.unit})` : ""}
          </Th>
        ))}
        <Th
          sortable
          sortDir={sort?.key === "__note" ? sort.direction : null}
          onSort={() => onSort("__note")}
          className="bg-surface-lowest"
        >
          Note
        </Th>
        <Th
          sortable
          sortDir={sort?.key === "__createdAt" ? sort.direction : null}
          onSort={() => onSort("__createdAt")}
          className="bg-surface-lowest"
        >
          Created at
        </Th>
        {canRecord && (
          <Th
            align="right"
            className="sticky right-0 z-10 !px-md border-l border-hairline bg-surface-lowest shadow-[-8px_0_12px_-10px_rgb(0_0_0_/_0.35)]"
          >
            Actions
          </Th>
        )}
      </tr>
    </thead>
  );
}

type SortState = { key: string; direction: "asc" | "desc" };
type CellTooltip = { text: string; left: number; top: number };
type TooltipEvents = {
  onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
};

function columnSortKey(column: DataSourceColumn) {
  return `column:${column.colKey}`;
}

function isTitleColumn(column: DataSourceColumn) {
  return column.label.trim().toLocaleLowerCase() === "title";
}

function formatEntryCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function compareEntries(
  left: DataSourceEntry,
  right: DataSourceEntry,
  key: string,
  columns: DataSourceColumn[],
  cellLabels: Record<string, string>,
) {
  if (key === "__period") {
    return left.year - right.year || (left.quarter ?? 0) - (right.quarter ?? 0);
  }
  if (key === "__createdAt") {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  }
  if (key === "__note") {
    return compareText(left.note ?? "", right.note ?? "");
  }

  const column = columns.find((candidate) => columnSortKey(candidate) === key);
  if (!column) return 0;
  const leftValue = left.values[column.colKey] ?? null;
  const rightValue = right.values[column.colKey] ?? null;
  if (leftValue === null) return rightValue === null ? 0 : 1;
  if (rightValue === null) return -1;

  if (column.dataType === "number") return Number(leftValue) - Number(rightValue);
  if (column.dataType === "date") {
    return new Date(String(leftValue)).getTime() - new Date(String(rightValue)).getTime();
  }
  return compareText(
    formatCellValue(column, leftValue, cellLabels),
    formatCellValue(column, rightValue, cellLabels),
  );
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function clipText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function CellPreview({
  text,
  className,
  ...events
}: { text: string; className?: string } & TooltipEvents) {
  return (
    <span
      tabIndex={0}
      className={cn(
        "block max-w-[12rem] truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-container",
        className,
      )}
      {...events}
    >
      {text}
    </span>
  );
}

function UrlCell({
  value,
  tooltipEvents,
}: {
  value: string;
  tooltipEvents: (text: string) => TooltipEvents;
}) {
  if (!isHttpUrl(value)) {
    return <CellPreview text={value} {...tooltipEvents(value)} />;
  }

  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${value}`}
      className="inline-flex rounded-sm text-mute outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary-container"
      {...tooltipEvents(value)}
    >
      <Icon name="open_in_new" className="text-[18px]" />
    </a>
  );
}

function NoteCell({
  note,
  tooltipEvents,
}: {
  note: string | null;
  tooltipEvents: (text: string) => TooltipEvents;
}) {
  if (!note) return <CellPreview text="—" {...tooltipEvents("—")} />;

  return (
    <span
      tabIndex={0}
      aria-label="View note"
      className="inline-flex rounded-sm text-mute outline-none transition-colors hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary-container"
      {...tooltipEvents(note)}
    >
      <Icon name="sticky_note_2" className="text-[18px]" />
    </span>
  );
}

function LinksTable({
  dataSourceId,
  links,
  columns,
  cellLabels,
  isAdmin,
  onEdit,
}: {
  dataSourceId: number;
  links: DataSourceLink[];
  columns: DataSourceColumn[];
  cellLabels: Record<string, string>;
  isAdmin: boolean;
  onEdit: (link: DataSourceLink) => void;
}) {
  const confirm = useConfirm();
  const remove = useDeleteDataSourceLink();

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <Th>Strategic Set</Th>
            <Th>KPI</Th>
            <Th>Metric</Th>
            <Th>Feeds</Th>
            <Th>Note</Th>
            {isAdmin && <Th align="right">Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id} className="border-t border-hairline">
              <Td className="text-mute">{l.setName ?? "—"}</Td>
              <Td className="font-medium">{l.kpiName ?? "—"}</Td>
              <Td>{l.metricName ?? "—"}</Td>
              <Td>
                {l.mappings.length === 0 ? (
                  <span className="text-caption-sm text-mute">evidence only</span>
                ) : (
                  <div className="flex flex-col gap-xxs">
                    {l.mappings.map((m, i) => (
                      <span key={i} className="text-caption-sm">
                        {m.slot !== "value" && (
                          <Badge tone="neutral">{m.slot}</Badge>
                        )}{" "}
                        {describeMapping(m, columns, cellLabels)}
                      </span>
                    ))}
                  </div>
                )}
              </Td>
              <Td className="text-mute">{l.note ?? "—"}</Td>
              {isAdmin && (
                <Td align="right">
                  <div className="inline-flex items-center gap-xxs">
                    <button
                      type="button"
                      aria-label="Edit link"
                      title="Edit link"
                      onClick={() => onEdit(l)}
                      className="grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <Icon name="edit" className="text-[18px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove link"
                      title="Remove link"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Remove this link?",
                          message:
                            "The raw data stays; only the link to the KPI is removed. Values it already fed keep their last computed number.",
                          tone: "danger",
                          confirmLabel: "Remove",
                        });
                        if (ok) remove.mutate({ dataSourceId, linkId: l.id });
                      }}
                      className="grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
                    >
                      <Icon name="link_off" className="text-[18px]" />
                    </button>
                  </div>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
