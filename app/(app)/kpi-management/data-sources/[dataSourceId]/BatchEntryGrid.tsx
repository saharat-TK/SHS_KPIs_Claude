"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Input, Table, Td, Th } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  DataSourceValidationError,
  buildColumnChoices,
  validateEntryValues,
  withResolvedOptions,
} from "@/lib/kpi/dataSources";
import {
  batchColumnKey,
  batchDuplicateKey,
  buildBatchRows,
  recordedBatchKeys,
  type BatchMode,
} from "@/lib/kpi/batchEntry";
import type {
  AcademicCatalog,
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceEntry,
  FacultyRecord,
} from "@/lib/types";
import { CellInput } from "./CellInput";

type BatchModeNonSingle = Exclude<BatchMode, "single">;

/** One row as the grid holds it: the pre-built code plus what has been typed
 *  into it. Values are strings while editing, exactly as in the single-entry
 *  form — validateEntryValues is the authority on what they mean. */
export interface EditableBatchRow {
  code: string;
  label: string;
  locked: Record<string, string>;
  values: Record<string, string>;
  note: string;
  included: boolean;
  /** This code already has an entry in the selected period. */
  duplicate: boolean;
  /** First validation problem, or null. Only computed for included rows. */
  error: string | null;
}

export interface BatchRowsState {
  rows: EditableBatchRow[];
  included: EditableBatchRow[];
  /** Columns the user still has to fill in — everything the mode didn't lock. */
  editableColumns: DataSourceColumn[];
  duplicateCount: number;
  errorCount: number;
  canSubmit: boolean;
  setValue: (code: string, colKey: string, value: string) => void;
  setNote: (code: string, note: string) => void;
  toggle: (code: string) => void;
  fillDown: (colKey: string) => void;
}

/**
 * Row state for a batch, kept here rather than in the modal so the modal's
 * footer can read `canSubmit` and build the payload without owning the grid's
 * bookkeeping.
 *
 * Two resets, deliberately different: changing the mode rebuilds the rows from
 * scratch (a program batch's values mean nothing to a curriculum batch), while
 * changing the period keeps what has been typed and only re-runs the duplicate
 * check — the period is what decides which rows are repeats, so the pre-unchecks
 * have to follow it.
 */
export function useBatchRows({
  mode,
  columns,
  catalog,
  faculty,
  entries,
  year,
  quarter,
}: {
  mode: BatchModeNonSingle;
  columns: DataSourceColumn[];
  catalog: AcademicCatalog;
  faculty: FacultyRecord[];
  entries: DataSourceEntry[];
  /** null while the year box holds something that isn't a year. */
  year: number | null;
  quarter: number | null;
}): BatchRowsState {
  const base = useMemo(
    () => buildBatchRows(mode, catalog, columns),
    [mode, catalog, columns],
  );
  const identityKey = useMemo(() => batchColumnKey(mode, columns), [mode, columns]);

  const [drafts, setDrafts] = useState<
    Record<string, { values: Record<string, string>; note: string }>
  >({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // A fresh mode is a fresh batch.
  useEffect(() => {
    setDrafts({});
  }, [mode, catalog, columns]);

  const duplicates = useMemo(() => {
    if (!identityKey || year == null) return new Set<string>();
    const recorded = recordedBatchKeys(entries, identityKey);
    return new Set(
      base
        .map((r) => r.code)
        .filter((code) =>
          recorded.has(batchDuplicateKey(year, quarter, identityKey, code)),
        ),
    );
  }, [base, entries, identityKey, year, quarter]);

  // Re-arm the checkboxes whenever the set of repeats could have moved.
  const duplicateSignature = useMemo(
    () => [...duplicates].sort().join("|"),
    [duplicates],
  );
  useEffect(() => {
    setChecked(
      Object.fromEntries(base.map((r) => [r.code, !duplicates.has(r.code)])),
    );
    // `duplicates` is rebuilt on every render of its inputs; the signature is
    // what actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, duplicateSignature]);

  const editableColumns = useMemo(
    () => columns.filter((c) => !(c.colKey in (base[0]?.locked ?? {}))),
    [columns, base],
  );

  // The same resolved option set the CSV preview validates against, so a batch
  // cannot accept a code the import path would reject.
  const validationColumns = useMemo(
    () => withResolvedOptions(columns, buildColumnChoices(columns, catalog, faculty)),
    [columns, catalog, faculty],
  );

  const rows = useMemo<EditableBatchRow[]>(
    () =>
      base.map((r) => {
        const draft = drafts[r.code];
        const values = { ...(draft?.values ?? {}) };
        const included = checked[r.code] ?? false;

        let error: string | null = null;
        if (included) {
          try {
            validateEntryValues(validationColumns, toPayload(r.locked, values, columns));
          } catch (err) {
            error =
              err instanceof DataSourceValidationError
                ? err.message
                : "This row could not be validated.";
          }
        }

        return {
          code: r.code,
          label: r.label,
          locked: r.locked,
          values,
          note: draft?.note ?? "",
          included,
          duplicate: duplicates.has(r.code),
          error,
        };
      }),
    [base, drafts, checked, duplicates, validationColumns, columns],
  );

  const included = rows.filter((r) => r.included);
  const errorCount = included.filter((r) => r.error).length;

  const patch = (code: string, next: Partial<{ values: Record<string, string>; note: string }>) =>
    setDrafts((prev) => {
      const current = prev[code] ?? { values: {}, note: "" };
      return { ...prev, [code]: { ...current, ...next } };
    });

  return {
    rows,
    included,
    editableColumns,
    duplicateCount: rows.filter((r) => r.duplicate).length,
    errorCount,
    canSubmit: year != null && included.length > 0 && errorCount === 0,
    setValue: (code, colKey, value) =>
      setDrafts((prev) => {
        const current = prev[code] ?? { values: {}, note: "" };
        return {
          ...prev,
          [code]: { ...current, values: { ...current.values, [colKey]: value } },
        };
      }),
    setNote: (code, note) => patch(code, { note }),
    toggle: (code) => setChecked((prev) => ({ ...prev, [code]: !prev[code] })),
    fillDown: (colKey) =>
      setDrafts((prev) => {
        const targets = base.filter((r) => checked[r.code]);
        const source = targets[0];
        if (!source) return prev;
        const value = prev[source.code]?.values[colKey] ?? "";
        const next = { ...prev };
        for (const r of targets) {
          const current = next[r.code] ?? { values: {}, note: "" };
          next[r.code] = { ...current, values: { ...current.values, [colKey]: value } };
        }
        return next;
      }),
  };
}

/** The payload for one row: the mode's locked codes plus what was typed. Every
 *  column is present — an empty string means "no value", which the API turns
 *  into null, matching the single-entry form. */
export function toPayload(
  locked: Record<string, string>,
  values: Record<string, string>,
  columns: DataSourceColumn[],
): Record<string, DataSourceCellValue> {
  return Object.fromEntries(
    columns.map((c) => [
      c.colKey,
      locked[c.colKey] ?? ((values[c.colKey] ?? "").trim() || null),
    ]),
  );
}

/** The grid itself — one row per program or curriculum, with the code already
 *  chosen and only the measures left to type. */
export function BatchEntryGrid({
  state,
  columns,
  catalog,
  faculty,
  labels,
}: {
  state: BatchRowsState;
  columns: DataSourceColumn[];
  catalog: AcademicCatalog;
  faculty: FacultyRecord[];
  /** Catalog code -> Thai name, for rendering the locked cells. */
  labels: Record<string, string>;
}) {
  const { rows, included, editableColumns, duplicateCount, errorCount } = state;

  if (rows.length === 0) {
    return (
      <p className="text-body-sm text-mute">
        The academic catalog has no entries to build this batch from.
      </p>
    );
  }

  return (
    // min-w-0: without it this grid item is sized to the table's min-content
    // width, which drags the whole dialog — radio group included — wider than
    // the modal instead of letting the table scroll inside it.
    <div className="flex min-w-0 flex-col gap-sm">
      <div className="flex flex-wrap items-center gap-sm">
        <Badge tone="neutral">
          {included.length} of {rows.length} rows selected
        </Badge>
        {duplicateCount > 0 && (
          <Badge tone="warning">
            {duplicateCount} already recorded this period
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge tone="error">
            {errorCount} {errorCount === 1 ? "row needs" : "rows need"} fixing
          </Badge>
        )}
      </div>

      <div className="min-w-0 overflow-hidden rounded-DEFAULT border border-hairline">
        <Table>
          <thead>
            <tr>
              <Th className="px-md">
                <span className="sr-only">Include</span>
              </Th>
              {columns.map((c) => {
                const locked = c.colKey in (rows[0]?.locked ?? {});
                return (
                  <Th key={c.id} className="px-md">
                    <span className="inline-flex items-center gap-xs whitespace-nowrap">
                      {c.label}
                      {c.isRequired && !locked && <span aria-hidden>*</span>}
                      {!locked && (
                        <button
                          type="button"
                          aria-label={`Copy ${c.label} down to every selected row`}
                          title={`Copy ${c.label} down to every selected row`}
                          onClick={() => state.fillDown(c.colKey)}
                          className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-surface-container-high hover:text-on-surface"
                        >
                          <Icon name="arrow_downward" size={14} />
                        </button>
                      )}
                    </span>
                  </Th>
                );
              })}
              <Th className="px-md">Note</Th>
              <Th className="px-md">Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              // The program a curriculum row locked in, so its curriculum cell
              // stays consistent with the cascade in the single-entry form.
              const rowProgram =
                columns.find((c) => c.dataType === "program")?.colKey ?? null;
              const programCode = rowProgram
                ? (row.locked[rowProgram] ?? row.values[rowProgram] ?? "").trim() || null
                : null;

              return (
                <tr
                  key={row.code}
                  className={row.included ? undefined : "opacity-55"}
                >
                  <Td className="px-md py-xs">
                    <input
                      type="checkbox"
                      className="accent-primary-container"
                      aria-label={`Include ${row.code}`}
                      checked={row.included}
                      onChange={() => state.toggle(row.code)}
                    />
                  </Td>

                  {columns.map((c) => {
                    const lockedCode = row.locked[c.colKey];
                    if (lockedCode !== undefined) {
                      return (
                        <Td key={c.id} className="px-md py-xs">
                          <div className="whitespace-nowrap font-medium">
                            {lockedCode}
                          </div>
                          <div className="text-caption-sm text-mute">
                            {labels[lockedCode] ?? "—"}
                          </div>
                        </Td>
                      );
                    }
                    return (
                      <Td key={c.id} className="px-md py-xs">
                        <div className="min-w-[8rem]">
                          <CellInput
                            column={c}
                            value={row.values[c.colKey] ?? ""}
                            faculty={faculty}
                            catalog={catalog}
                            selectedProgramCode={programCode}
                            onChange={(v) => state.setValue(row.code, c.colKey, v)}
                          />
                        </div>
                      </Td>
                    );
                  })}

                  <Td className="px-md py-xs">
                    <div className="min-w-[8rem]">
                      <Input
                        aria-label={`Note for ${row.code}`}
                        value={row.note}
                        onChange={(e) => state.setNote(row.code, e.target.value)}
                      />
                    </div>
                  </Td>

                  <Td className="px-md py-xs">
                    {row.error ? (
                      <span
                        className="text-caption-sm text-error"
                        title={row.error}
                      >
                        {row.error}
                      </span>
                    ) : row.duplicate ? (
                      <span className="whitespace-nowrap text-caption-sm text-mute">
                        already recorded this period
                      </span>
                    ) : row.included ? (
                      <span className="whitespace-nowrap text-caption-sm text-success">
                        will be added
                      </span>
                    ) : (
                      <span className="text-caption-sm text-mute">skipped</span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {editableColumns.length === 0 && (
        <p className="text-caption-sm text-mute">
          Every column on this source is filled in by the batch. Submitting adds
          one row per {rows.length === 5 ? "department" : "curriculum"}.
        </p>
      )}
    </div>
  );
}
