"use client";

import {
  useEffect,
  useLayoutEffect,
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
import { groupEntries, perRowColKeys, type EntryGroupRows } from "@/lib/kpi/entryGroups";
import type { DataSourceColumn, DataSourceEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  computeColumnLayout,
  fallbackColumnLayout,
  type ColumnLayout,
} from "./columnWidths";

/** Cell/header spacing. Must match CELL_PAD_X in columnWidths.ts (6px a side). */
const CELL = "!px-sm !py-xs !align-top";
const HEAD = "bg-surface-lowest !px-sm !py-xs !align-top";
/** First (Period) column: 20px left padding. Must equal 6px + FIRST_COLUMN_EXTRA_LEFT
 *  in columnWidths.ts; written as a literal so Tailwind's scanner emits it. */
const FIRST_COL = "!pl-[20px]";
/** First visible row: 12px top padding, 8px more than the 4px base, so it doesn't
 *  sit right under the header line. */
const FIRST_ROW = "!pt-[12px]";

/** Stored as numbers: right-aligned and sorted numerically. */
const NUMERIC_TYPES = new Set<string>(["number", "year_be", "month"]);

export function EntriesTable({
  columns,
  entries,
  canRecord,
  dataSourceId,
  cellLabels,
  query,
  onEdit,
  heightClass = "max-h-[60vh]",
}: {
  columns: DataSourceColumn[];
  entries: DataSourceEntry[];
  canRecord: boolean;
  dataSourceId: number;
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
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = useColumnLayout(rootRef, columns, entries, canRecord, cellLabels);

  // A multiple-input source stores one row per value; regroup them into the
  // entries they came from. Without a multiple column every group is one row.
  const groups = useMemo(() => groupEntries(entries, columns), [entries, columns]);
  const perRowKeys = useMemo(() => perRowColKeys(columns), [columns]);

  // A group stays whole: it shows when any of its rows matches, so searching for
  // one author still shows the paper's other authors.
  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return groups;

    const matches = (entry: DataSourceEntry) =>
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
        .includes(needle);
    return groups.filter((group) => group.rows.some(matches));
  }, [cellLabels, columns, groups, query]);

  // Sorting orders whole groups by their first row, so an entry never splits.
  const visibleGroups = useMemo(() => {
    if (!sort) return filteredGroups;
    return [...filteredGroups].sort((left, right) => {
      const [a, b] = [left.rows[0], right.rows[0]];
      const comparison = compareEntries(a, b, sort.key, columns, cellLabels);
      const directed = sort.direction === "asc" ? comparison : -comparison;
      return directed || a.id - b.id;
    });
  }, [cellLabels, columns, filteredGroups, sort]);

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
    <div ref={rootRef}>
      {visibleGroups.length === 0 ? (
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
            className="!border-separate border-spacing-0 table-fixed text-body-sm"
            style={{ width: `${layout.total}px` }}
          >
            <DataTableColumnGroup columns={columns} layout={layout} canRecord={canRecord} />
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
          className="!border-separate border-spacing-0 table-fixed text-body-sm"
          style={{ width: `${layout.total}px` }}
        >
          <DataTableColumnGroup columns={columns} layout={layout} canRecord={canRecord} />
          {visibleGroups.map((group, groupIndex) => (
            <GroupBody
              key={group.key}
              group={group}
              groupIndex={groupIndex}
              columns={columns}
              perRowKeys={perRowKeys}
              canRecord={canRecord}
              cellLabels={cellLabels}
              tooltipEvents={tooltipEvents}
              onEdit={onEdit}
              onDelete={async (e) => {
                const ok = await confirm({
                  title: "Delete this entry?",
                  message: `The ${formatEntryPeriod(e.year, e.quarter)} row will be permanently removed.`,
                  tone: "danger",
                  confirmLabel: "Delete",
                });
                if (ok) remove.mutate({ dataSourceId, entryId: e.id });
              }}
            />
          ))}
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
    </div>
  );
}

/** One entry (a group of rows). Columns the rows share are drawn once in the
 *  first row and span the group; per-row columns and Actions repeat on each row. */
function GroupBody({
  group,
  groupIndex,
  columns,
  perRowKeys,
  canRecord,
  cellLabels,
  tooltipEvents,
  onEdit,
  onDelete,
}: {
  group: EntryGroupRows;
  groupIndex: number;
  columns: DataSourceColumn[];
  perRowKeys: Set<string>;
  canRecord: boolean;
  cellLabels: Record<string, string>;
  tooltipEvents: (text: string) => TooltipEvents;
  onEdit: (entry: DataSourceEntry) => void;
  onDelete: (entry: DataSourceEntry) => void;
}) {
  const span = group.rows.length > 1 ? group.rows.length : undefined;

  return (
    <tbody className="group hover:bg-surface-soft">
      {group.rows.map((e, rowIndex) => {
        const first = rowIndex === 0;
        const last = rowIndex === group.rows.length - 1;
        // Only the table's very first row gets the extra top padding.
        const rowPad = groupIndex === 0 && first ? FIRST_ROW : undefined;
        // Inside a group the divider between rows is lighter than between groups.
        const inner = last ? undefined : "!border-dashed";

        const valueCell = (c: DataSourceColumn) => {
          const text = formatCellValue(c, e.values[c.colKey] ?? null, cellLabels);
          const perRow = perRowKeys.has(c.colKey);
          return (
            <Td
              key={c.id}
              rowSpan={perRow ? undefined : span}
              className={cn(CELL, rowPad, perRow && inner)}
              align={NUMERIC_TYPES.has(c.dataType) ? "right" : "left"}
            >
              {c.dataType === "url" ? (
                <UrlCell value={text} tooltipEvents={tooltipEvents} />
              ) : (
                <CellPreview text={text} {...tooltipEvents(text)} />
              )}
            </Td>
          );
        };

        return (
          <tr key={e.id}>
            {first && (
              <Td
                rowSpan={span}
                className={cn(CELL, FIRST_COL, rowPad, "whitespace-nowrap font-medium")}
              >
                <CellPreview
                  text={formatEntryPeriod(e.year, e.quarter)}
                  {...tooltipEvents(formatEntryPeriod(e.year, e.quarter))}
                />
              </Td>
            )}
            {columns
              .filter((c) => first || perRowKeys.has(c.colKey))
              .map(valueCell)}
            {first && (
              <>
                <Td rowSpan={span} className={cn(CELL, rowPad, "text-mute")}>
                  <NoteCell note={e.note} tooltipEvents={tooltipEvents} />
                </Td>
                <Td rowSpan={span} className={cn(CELL, rowPad, "text-mute")}>
                  <CellPreview
                    text={formatEntryCreatedAt(e.createdAt)}
                    {...tooltipEvents(formatEntryCreatedAt(e.createdAt))}
                  />
                </Td>
              </>
            )}
            {canRecord && (
              <Td
                align="right"
                className={cn(
                  rowPad,
                  inner,
                  "sticky right-0 z-10 !px-md !py-xs border-l border-hairline bg-surface-lowest shadow-[-8px_0_12px_-10px_rgb(0_0_0_/_0.35)] transition-colors group-hover:bg-surface-soft",
                )}
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
                    onClick={() => onDelete(e)}
                    className="grid h-7 w-7 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                </div>
              </Td>
            )}
          </tr>
        );
      })}
    </tbody>
  );
}

function DataTableColumnGroup({
  columns,
  layout,
  canRecord,
}: {
  columns: DataSourceColumn[];
  layout: ColumnLayout;
  canRecord: boolean;
}) {
  return (
    <colgroup>
      <col style={{ width: `${layout.period}px` }} />
      {columns.map((column, index) => (
        <col key={column.id} style={{ width: `${layout.columns[index]}px` }} />
      ))}
      <col style={{ width: `${layout.note}px` }} />
      <col style={{ width: `${layout.createdAt}px` }} />
      {canRecord && <col style={{ width: `${layout.actions}px` }} />}
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
          wrap
          className={cn(HEAD, FIRST_COL)}
        >
          Period
        </Th>
        {columns.map((column) => (
          <Th
            key={column.id}
            sortable
            sortDir={sort?.key === columnSortKey(column) ? sort.direction : null}
            onSort={() => onSort(columnSortKey(column))}
            align={NUMERIC_TYPES.has(column.dataType) ? "right" : "left"}
            wrap
            className={HEAD}
          >
            {column.label}
            {column.unit ? ` (${column.unit})` : ""}
          </Th>
        ))}
        <Th
          sortable
          sortDir={sort?.key === "__note" ? sort.direction : null}
          onSort={() => onSort("__note")}
          wrap
          className={HEAD}
        >
          Note
        </Th>
        <Th
          sortable
          sortDir={sort?.key === "__createdAt" ? sort.direction : null}
          onSort={() => onSort("__createdAt")}
          wrap
          className={HEAD}
        >
          Created at
        </Th>
        {canRecord && (
          <Th
            align="right"
            className="sticky right-0 z-10 !px-md !align-top border-l border-hairline bg-surface-lowest shadow-[-8px_0_12px_-10px_rgb(0_0_0_/_0.35)]"
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

  if (NUMERIC_TYPES.has(column.dataType)) return Number(leftValue) - Number(rightValue);
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

function CellPreview({
  text,
  className,
  ...events
}: { text: string; className?: string } & TooltipEvents) {
  return (
    <span
      tabIndex={0}
      className={cn(
        "max-w-full line-clamp-3 break-words leading-[1.15] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-container",
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

/** Measures content-fit column widths in the table's real font, and again once
 *  webfonts finish loading (the first measure may have used the fallback face).
 *  Built from every entry, not the filtered ones, so searching never resizes columns. */
function useColumnLayout(
  rootRef: RefObject<HTMLElement>,
  columns: DataSourceColumn[],
  entries: DataSourceEntry[],
  canRecord: boolean,
  cellLabels: Record<string, string>,
): ColumnLayout {
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [fontsTick, setFontsTick] = useState(0);

  useLayoutEffect(() => {
    if (rootRef.current) setFontFamily(getComputedStyle(rootRef.current).fontFamily);
  }, [rootRef]);

  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && setFontsTick((tick) => tick + 1));
    return () => {
      live = false;
    };
  }, []);

  return useMemo(() => {
    if (!fontFamily) return fallbackColumnLayout(columns.length, canRecord);
    return computeColumnLayout({
      fontFamily,
      columns,
      entries,
      canRecord,
      periodText: (entry) => formatEntryPeriod(entry.year, entry.quarter),
      createdText: (entry) => formatEntryCreatedAt(entry.createdAt),
      cellText: (column, entry) =>
        formatCellValue(column, entry.values[column.colKey] ?? null, cellLabels),
    });
    // fontsTick re-runs the measure after webfonts load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontFamily, fontsTick, columns, entries, canRecord, cellLabels]);
}
