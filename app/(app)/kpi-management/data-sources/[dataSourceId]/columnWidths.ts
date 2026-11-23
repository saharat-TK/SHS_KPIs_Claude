// Content-fit column widths for EntriesTable.
//
// EntriesTable is two `table-fixed` tables (sticky header + scrolling body) that
// must share one <colgroup>, so the browser's own auto-sizing is off the table:
// the widths are measured here with canvas and handed to both.

import type { DataSourceColumn, DataSourceEntry } from "@/lib/types";
import { isHttpUrl } from "@/lib/kpi/dataSources";

/** A cell wraps at about this many characters per line (it then clips at 3 lines). */
const MAX_CHARS = 30;
/** Header labels wrap to this many lines, never clipped. */
const HEADER_LINES = 2;
/** Left + right padding of a cell (`!px-sm` on every Th/Td in the table). */
export const CELL_PAD_X = 12;
/** Extra left padding on the first (Period) column: 20px instead of the usual 6px.
 *  Must match FIRST_COL in EntriesTable.tsx. */
export const FIRST_COLUMN_EXTRA_LEFT = 14;
/** Sort arrow (14px) + the gap-xs (4px) before it. */
const SORT_ICON = 18;
/** Row icons (note, link) are 18px glyphs. */
const ICON_CELL = 18;
const ACTIONS_WIDTH = 88;
const MIN_COLUMN = 48;
/** Sub-pixel rounding guard so a line that just fits doesn't wrap. */
const SLACK = 3;

const BODY_SIZE = 16.25; // text-body-sm
const HEADER_SIZE = 13.75; // text-caption-sm
const HEADER_TRACKING = HEADER_SIZE * 0.05; // tracking-wider

export type ColumnLayout = {
  period: number;
  columns: number[];
  note: number;
  createdAt: number;
  actions: number;
  total: number;
};

export type LayoutInput = {
  fontFamily: string;
  columns: DataSourceColumn[];
  entries: DataSourceEntry[];
  canRecord: boolean;
  periodText: (entry: DataSourceEntry) => string;
  createdText: (entry: DataSourceEntry) => string;
  cellText: (column: DataSourceColumn, entry: DataSourceEntry) => string;
};

function makeMeasurer(font: string) {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache = new Map<string, number>();
  if (ctx) ctx.font = font;
  return (text: string) => {
    let width = cache.get(text);
    if (width === undefined) {
      // Without a canvas, a rough per-character guess still beats a collapsed column.
      width = ctx ? ctx.measureText(text).width : text.length * 8;
      cache.set(text, width);
    }
    return width;
  };
}

/** Smallest width at which `words` greedy-wrap into at most `lines` lines. */
function minWidthForLines(wordWidths: number[], spaceWidth: number, lines: number) {
  if (wordWidths.length === 0) return 0;
  const longest = Math.max(...wordWidths);
  const total = wordWidths.reduce((sum, w) => sum + w, 0) + spaceWidth * (wordWidths.length - 1);
  if (lines <= 1) return total;

  const fits = (width: number) => {
    let used = 0;
    let count = 1;
    for (const w of wordWidths) {
      if (used === 0) used = w;
      else if (used + spaceWidth + w <= width) used += spaceWidth + w;
      else {
        count += 1;
        used = w;
      }
    }
    return count <= lines;
  };

  let lo = Math.ceil(longest);
  let hi = Math.ceil(total);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function computeColumnLayout(input: LayoutInput): ColumnLayout {
  const { fontFamily, columns, entries, canRecord } = input;
  const body = makeMeasurer(`400 ${BODY_SIZE}px ${fontFamily}`);
  const bodyMedium = makeMeasurer(`500 ${BODY_SIZE}px ${fontFamily}`);
  const header = makeMeasurer(`500 ${HEADER_SIZE}px ${fontFamily}`);

  /** Width a header needs to show `label` on at most two lines, sort arrow included. */
  const headerNeed = (label: string, sortable = true) => {
    const words = label.toUpperCase().split(/\s+/).filter(Boolean);
    const widths = words.map((w) => header(w) + w.length * HEADER_TRACKING);
    const space = header(" ") + HEADER_TRACKING;
    return minWidthForLines(widths, space, HEADER_LINES) + (sortable ? SORT_ICON : 0);
  };

  /** Width of one cell's first line: at most MAX_CHARS characters of its text. */
  const lineWidth = (measure: (t: string) => number, text: string) =>
    measure(text.replace(/\s+/g, " ").slice(0, MAX_CHARS));

  const finish = (content: number) =>
    Math.max(MIN_COLUMN, Math.ceil(content + CELL_PAD_X + SLACK));

  const period =
    finish(
      Math.max(
        headerNeed("Period"),
        ...entries.map((entry) => bodyMedium(input.periodText(entry))),
      ),
    ) + FIRST_COLUMN_EXTRA_LEFT;

  const columnWidths = columns.map((column) => {
    let content = 0;
    for (const entry of entries) {
      const text = input.cellText(column, entry);
      content = Math.max(
        content,
        column.dataType === "url" && isHttpUrl(text) ? ICON_CELL : lineWidth(body, text),
      );
    }
    const label = column.unit ? `${column.label} (${column.unit})` : column.label;
    return finish(Math.max(headerNeed(label), content));
  });

  const note = finish(Math.max(headerNeed("Note"), ICON_CELL));

  // "23 Nov 2026, 14:05" wraps onto two lines rather than costing ~140px.
  const widestCreated = entries
    .map((entry) => input.createdText(entry))
    .reduce((widest, text) => (body(text) > body(widest) ? text : widest), "");
  const createdWords = widestCreated.split(/\s+/).filter(Boolean).map((w) => body(w));
  const createdContent = minWidthForLines(createdWords, body(" "), 2);
  const createdAt = finish(Math.max(headerNeed("Created at"), createdContent));

  const actions = canRecord ? ACTIONS_WIDTH : 0;
  const total =
    period + columnWidths.reduce((sum, w) => sum + w, 0) + note + createdAt + actions;

  return { period, columns: columnWidths, note, createdAt, actions, total };
}

/** Placeholder until fonts are known, so the first paint isn't zero-width. */
export function fallbackColumnLayout(columnCount: number, canRecord: boolean): ColumnLayout {
  const columns = Array.from({ length: columnCount }, () => 112);
  const actions = canRecord ? ACTIONS_WIDTH : 0;
  return {
    period: 80 + FIRST_COLUMN_EXTRA_LEFT,
    columns,
    note: 56,
    createdAt: 112,
    actions,
    total: 80 + FIRST_COLUMN_EXTRA_LEFT + 56 + 112 + actions + columns.reduce((sum, w) => sum + w, 0),
  };
}
