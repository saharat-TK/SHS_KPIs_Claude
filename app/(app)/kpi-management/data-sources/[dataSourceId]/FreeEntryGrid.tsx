"use client";

import { useMemo, useRef, useState } from "react";
import { Badge, Button, Input, Table, Td, Th } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  DataSourceValidationError,
  buildColumnChoices,
  entryFingerprint,
  validateEntryValues,
  withResolvedOptions,
} from "@/lib/kpi/dataSources";
import {
  entryRowsFromPaste,
  isBlankEntryRow,
  withDegreeLevel,
  type FreeEntryRow,
} from "@/lib/kpi/batchEntry";
import type {
  AcademicCatalog,
  DataSourceColumn,
  DataSourceEntry,
  FacultyRecord,
} from "@/lib/types";
import { CellInput } from "./CellInput";
import { toPayload } from "./BatchEntryGrid";

const INITIAL_ROWS = 5;
/** Matches the bulk endpoint's ceiling (app/api/data-sources/[id]/entries/bulk). */
export const FREE_ROWS_MAX = 1000;

interface KeyedRow extends FreeEntryRow {
  key: number;
}

export interface FreeEntryRowView extends KeyedRow {
  blank: boolean;
  /** First validation problem, or null. Only computed for non-blank rows. */
  error: string | null;
  /** Same period and values as an entry already recorded — a warning only. */
  duplicate: boolean;
}

export interface FreeRowsState {
  rows: FreeEntryRowView[];
  /** The non-blank rows, in grid order — what a submit sends. */
  included: FreeEntryRowView[];
  errorCount: number;
  duplicateCount: number;
  tooMany: boolean;
  canSubmit: boolean;
  setValue: (key: number, colKey: string, value: string) => void;
  setNote: (key: number, note: string) => void;
  addRow: () => void;
  removeRow: (key: number) => void;
  fillDown: (colKey: string) => void;
  paste: (key: number, startAt: number, text: string) => boolean;
}

/** Row state for the "Multiple rows" mode: any number of rows the person types
 *  or pastes, each validated exactly like a single entry or a CSV import row. */
export function useFreeRows({
  columns,
  catalog,
  faculty,
  entries,
  year,
  quarter,
}: {
  columns: DataSourceColumn[];
  catalog: AcademicCatalog;
  faculty: FacultyRecord[];
  entries: DataSourceEntry[];
  /** null while the year box holds something that isn't a year. */
  year: number | null;
  quarter: number | null;
}): FreeRowsState {
  const nextKey = useRef(0);
  const blankRow = (): KeyedRow => ({
    key: nextKey.current++,
    values: Object.fromEntries(columns.map((c) => [c.colKey, ""])),
    note: "",
  });
  const [rows, setRows] = useState<KeyedRow[]>(() =>
    Array.from({ length: INITIAL_ROWS }, blankRow),
  );

  // The same resolved option sets the CSV preview validates against, so a pasted
  // label the picker would not offer is caught here rather than by the server.
  const choices = useMemo(
    () => buildColumnChoices(columns, catalog, faculty),
    [columns, catalog, faculty],
  );
  const validationColumns = useMemo(
    () => withResolvedOptions(columns, choices),
    [columns, choices],
  );
  const recorded = useMemo(
    () => new Set(entries.map((e) => entryFingerprint(columns, e.year, e.quarter, e.values))),
    [entries, columns],
  );

  const view = useMemo<FreeEntryRowView[]>(
    () =>
      rows.map((row) => {
        if (isBlankEntryRow(row)) return { ...row, blank: true, error: null, duplicate: false };
        let error: string | null = null;
        let duplicate = false;
        try {
          const cells = validateEntryValues(validationColumns, toPayload({}, row.values, columns));
          duplicate = year != null && recorded.has(entryFingerprint(columns, year, quarter, cells));
        } catch (err) {
          error =
            err instanceof DataSourceValidationError
              ? err.message
              : "This row could not be validated.";
        }
        return { ...row, blank: false, error, duplicate };
      }),
    [rows, validationColumns, columns, recorded, year, quarter],
  );

  const included = view.filter((r) => !r.blank);
  const errorCount = included.filter((r) => r.error).length;
  const tooMany = included.length > FREE_ROWS_MAX;

  const update = (key: number, fn: (row: KeyedRow) => KeyedRow) =>
    setRows((rs) => rs.map((r) => (r.key === key ? fn(r) : r)));

  return {
    rows: view,
    included,
    errorCount,
    duplicateCount: included.filter((r) => r.duplicate).length,
    tooMany,
    canSubmit: year != null && included.length > 0 && errorCount === 0 && !tooMany,
    setValue: (key, colKey, value) =>
      update(key, (r) => {
        const values = { ...r.values, [colKey]: value };
        // Picking a curriculum fills its Degree level; it stays editable.
        const picked = columns.find((c) => c.colKey === colKey)?.dataType === "curriculum";
        return {
          ...r,
          values: picked ? withDegreeLevel(values, columns, catalog, { overwrite: true }) : values,
        };
      }),
    setNote: (key, note) => update(key, (r) => ({ ...r, note })),
    addRow: () => setRows((rs) => [...rs, blankRow()]),
    removeRow: (key) =>
      setRows((rs) => {
        const rest = rs.filter((r) => r.key !== key);
        return rest.length > 0 ? rest : [blankRow()];
      }),
    // From the first filled-in row to every other filled-in row. Blank rows stay
    // blank: filling them would turn them into rows missing their other cells.
    fillDown: (colKey) =>
      setRows((rs) => {
        const filled = rs.filter((r) => !isBlankEntryRow(r));
        const value = filled[0]?.values[colKey];
        if (value === undefined) return rs;
        return rs.map((r) =>
          isBlankEntryRow(r) ? r : { ...r, values: { ...r.values, [colKey]: value } },
        );
      }),
    /** Spread pasted Excel rows from this row down, overwriting the blank rows
     *  beneath it. Returns false for a plain single-value paste, which the
     *  input should handle itself. */
    paste: (key, startAt, text) => {
      if (!text.includes("\t") && !text.trim().includes("\n")) return false;
      // A pasted level is kept; an empty one is filled from the curriculum.
      const pasted = entryRowsFromPaste(text, columns, choices, startAt).map((p) => ({
        ...p,
        values: withDegreeLevel(p.values, columns, catalog, { overwrite: false }),
      }));
      if (pasted.length === 0) return true;
      setRows((rs) => {
        const at = rs.findIndex((r) => r.key === key);
        const keyed = pasted.map((p) => ({ ...p, key: nextKey.current++ }));
        if (at < 0) return [...rs, ...keyed];
        // Cells before the paste column keep what the first row already had.
        if (startAt > 0) {
          keyed[0] = {
            ...keyed[0],
            values: Object.fromEntries(
              columns.map((c, i) => [
                c.colKey,
                i < startAt ? rs[at].values[c.colKey] ?? "" : keyed[0].values[c.colKey],
              ]),
            ),
          };
        }
        let end = at + 1;
        while (end < rs.length && end - at < keyed.length && isBlankEntryRow(rs[end])) end += 1;
        return [...rs.slice(0, at), ...keyed, ...rs.slice(end)];
      });
      return true;
    },
  };
}

/** The "Multiple rows" grid: every column of the source, a note, a status, and
 *  a remove button per row. Paste rows copied from Excel into any cell. */
export function FreeEntryGrid({
  state,
  columns,
  catalog,
  faculty,
}: {
  state: FreeRowsState;
  columns: DataSourceColumn[];
  catalog: AcademicCatalog;
  faculty: FacultyRecord[];
}) {
  const { rows, included, errorCount, duplicateCount, tooMany } = state;
  const programKey = columns.find((c) => c.dataType === "program")?.colKey ?? null;

  return (
    // min-w-0: lets the table scroll inside the dialog instead of widening it.
    <div className="flex min-w-0 flex-col gap-sm">
      <div className="flex flex-wrap items-center gap-sm">
        <Button size="sm" variant="outline" icon="add" onClick={state.addRow}>
          Add row
        </Button>
        <Badge tone={included.length - errorCount > 0 ? "success" : "neutral"}>
          {included.length - errorCount} {included.length - errorCount === 1 ? "row" : "rows"} ready
        </Badge>
        {errorCount > 0 && (
          <Badge tone="error">
            {errorCount} {errorCount === 1 ? "row needs" : "rows need"} fixing
          </Badge>
        )}
        {duplicateCount > 0 && (
          <Badge tone="warning">{duplicateCount} already recorded this period</Badge>
        )}
        {tooMany && <Badge tone="error">At most {FREE_ROWS_MAX} rows at a time</Badge>}
        <span className="ml-auto inline-flex items-center gap-xs text-caption-sm text-mute">
          <Icon name="content_paste" size={16} />
          Paste rows from Excel into any cell — columns in this order, then Note.
        </span>
      </div>

      <div className="min-w-0 overflow-hidden rounded-DEFAULT border border-hairline">
        <Table>
          <thead>
            <tr>
              {columns.map((c) => (
                <Th key={c.id} className="px-md">
                  <span className="inline-flex items-center gap-xs whitespace-nowrap">
                    {c.label}
                    {c.isRequired && <span aria-hidden>*</span>}
                    <button
                      type="button"
                      aria-label={`Copy the first row's ${c.label} down to every filled row`}
                      title={`Copy the first row's ${c.label} down to every filled row`}
                      onClick={() => state.fillDown(c.colKey)}
                      className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <Icon name="arrow_downward" size={14} />
                    </button>
                  </span>
                </Th>
              ))}
              <Th className="px-md">Note</Th>
              <Th className="px-md">Status</Th>
              <Th className="px-md">
                <span className="sr-only">Remove</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className="border-t border-hairline align-top">
                {/* Paste bubbles up from the cell's input; the column it landed
                    in is where the pasted rows start. */}
                {columns.map((c, colIndex) => (
                  <Td key={c.id} className="px-md py-xs">
                    <div
                      className="min-w-[8rem]"
                      onPaste={(e) => {
                        if (state.paste(row.key, colIndex, e.clipboardData.getData("text/plain"))) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <CellInput
                        column={c}
                        value={row.values[c.colKey] ?? ""}
                        faculty={faculty}
                        catalog={catalog}
                        selectedProgramCode={
                          programKey ? (row.values[programKey] ?? "").trim() || null : null
                        }
                        onChange={(v) => state.setValue(row.key, c.colKey, v)}
                      />
                    </div>
                  </Td>
                ))}
                <Td className="px-md py-xs">
                  <div
                    className="min-w-[8rem]"
                    onPaste={(e) => {
                      if (state.paste(row.key, columns.length, e.clipboardData.getData("text/plain"))) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Input
                      aria-label={`Note, row ${i + 1}`}
                      value={row.note}
                      onChange={(e) => state.setNote(row.key, e.target.value)}
                    />
                  </div>
                </Td>
                <Td className="px-md py-xs">
                  <div className="flex min-h-[36px] w-[11rem] items-center">
                    {row.blank ? (
                      <span className="text-caption-sm text-mute">empty, skipped</span>
                    ) : row.error ? (
                      <span className="text-caption-sm text-error" title={row.error}>
                        {row.error}
                      </span>
                    ) : row.duplicate ? (
                      <span className="text-caption-sm text-[#8a4b00]">
                        already recorded this period
                      </span>
                    ) : (
                      <span className="whitespace-nowrap text-caption-sm text-success">
                        will be added
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="px-md py-xs">
                  <button
                    type="button"
                    aria-label={`Remove row ${i + 1}`}
                    title="Remove row"
                    onClick={() => state.removeRow(row.key)}
                    className="grid h-[36px] w-8 place-items-center rounded text-mute hover:bg-surface-container-high hover:text-error"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
