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
import { Table, Th, Td, EmptyState, useConfirm } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useDeleteDataSourceEntry } from "@/lib/data/hooks";
import { formatCellValue, formatEntryPeriod, isHttpUrl } from "@/lib/kpi/dataSources";
import type { DataSourceColumn, DataSourceEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export function EntriesTable({
  columns,
  entries,
  canRecord,
  dataSourceId,
  actor,
  cellLabels,
  query,
  onEdit,
  heightClass = "max-h-[60vh]",
}: {
  columns: DataSourceColumn[];
  entries: DataSourceEntry[];
  canRecord: boolean;
  dataSourceId: number;
  actor: { actorId?: string; userRole?: string };
  cellLabels: Record<string, string>;
  query: string;
  onEdit: (entry: DataSourceEntry) => void;
  /** Height of the vertical scroll box. Must be a literal Tailwind class —
   *  arbitrary values have to exist in the source for the scanner to emit them. */
  heightClass?: string;
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
      <div className={cn("overflow-y-auto scroll-thin [scrollbar-gutter:stable]", heightClass)}>
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

export function formatEntryCreatedAt(value: string) {
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
