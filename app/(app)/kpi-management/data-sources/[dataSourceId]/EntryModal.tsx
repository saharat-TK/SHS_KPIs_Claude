"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, RadioGroup, Select } from "@/components/ui";
import {
  useAcademicCatalog,
  useBulkCreateDataSourceEntries,
  useCreateDataSourceEntry,
  useFacultyRecords,
  useUpdateDataSourceEntry,
} from "@/lib/data/hooks";
import { COLUMN_TYPE_LABELS, coerceCellValue } from "@/lib/kpi/dataSources";
import { FORMAT_EXAMPLE, isFormattedType } from "@/lib/kpi/cellFormats";

/** Types whose typed text can be malformed, checked live as the user types.
 *  Choice types can't be: their pickers only offer valid values. */
const FORMAT_CHECKED = new Set(["number", "url", "date", "year_ce", "month"]);
import {
  batchModeLabel,
  availableBatchModes,
  degreeLevelColumn,
  withDegreeLevel,
  type BatchMode,
} from "@/lib/kpi/batchEntry";
import { EMPTY_ACADEMIC_CATALOG, buildCellLabels } from "@/lib/kpi/academicCatalog";
import type {
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceEntry,
  DataSourcePeriodGrain,
} from "@/lib/types";
import {
  buildRefLookups,
  duplicateItems,
  entryLayout,
  expandEntry,
  type GroupItem,
} from "@/lib/kpi/columnLinks";
import { CellInput } from "./CellInput";
import { LinkedItemsPanel, blankItem, type DraftItem } from "./LinkedItemsPanel";
import { BatchEntryGrid, toPayload, useBatchRows } from "./BatchEntryGrid";
import { FreeEntryGrid, useFreeRows } from "./FreeEntryGrid";

const BATCH_MODE_HINTS: Record<BatchMode, string> = {
  single: "Add one row and fill it in yourself.",
  rows: "Several rows of your own; paste from Excel or add rows one by one.",
  programs: "One row per academic program, with the program already chosen.",
  curricula: "One row per curriculum, with the curriculum already chosen.",
};

/** The curriculum batch only fills a program (or degree level) in when the
 *  source has somewhere to put one, so the hint must not promise it otherwise. */
const hintFor = (mode: BatchMode, hasProgramColumn: boolean, hasLevelColumn = false) => {
  if (mode !== "curricula" || (!hasProgramColumn && !hasLevelColumn)) {
    return BATCH_MODE_HINTS[mode];
  }
  const filled = [hasProgramColumn && "its program", hasLevelColumn && "degree level"]
    .filter(Boolean)
    .join(" and ");
  return `One row per curriculum, with the curriculum and ${filled} already chosen.`;
};

/** Add or edit one row of raw data — or a batch at once: free-form rows typed or
 *  pasted from Excel, or, when the source records per program or per
 *  curriculum, one pre-built row for each.
 *
 *  Values are held as strings while editing and coerced server-side by
 *  validateEntryValues, which is the authority. */
export function EntryModal({
  open,
  onClose,
  dataSourceId,
  periodGrain,
  columns,
  entry,
  entries = [],
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  periodGrain: DataSourcePeriodGrain;
  columns: DataSourceColumn[];
  entry: DataSourceEntry | null;
  /** Rows already recorded, so a batch can flag one it would repeat. */
  entries?: DataSourceEntry[];
}) {
  const create = useCreateDataSourceEntry();
  const update = useUpdateDataSourceEntry();
  const bulk = useBulkCreateDataSourceEntries();

  // Only fetch the roster when a faculty column is actually on this source.
  const needsFaculty = columns.some((c) => c.dataType === "faculty");
  const facultyQ = useFacultyRecords();
  const faculty = useMemo(
    () =>
      needsFaculty
        ? (facultyQ.data ?? [])
            .filter((f) => f.status === "active")
            .sort((a, b) => a.name.localeCompare(b.name, "th"))
        : [],
    [needsFaculty, facultyQ.data],
  );

  // Same idea for the academic catalog: one query feeds both pickers.
  const catalogQ = useAcademicCatalog();
  const catalog = catalogQ.data ?? EMPTY_ACADEMIC_CATALOG;

  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(String(thisYear));
  const [quarter, setQuarter] = useState("1");
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<BatchMode>("single");

  // "Ref by" pairs and the multiple column move to a right-hand section; the
  // rest of the form stays on the left. See lib/kpi/columnLinks.ts.
  const layout = useMemo(() => entryLayout(columns), [columns]);
  const [items, setItems] = useState<Record<string, DraftItem[]>>({});
  const lookups = useMemo(
    () => buildRefLookups(facultyQ.data ?? [], catalogQ.data),
    [facultyQ.data, catalogQ.data],
  );

  // The batch grids need the catalog for their pickers and checks, and editing an
  // existing row is always a single row, so the chooser only appears when creating.
  const modes = useMemo(() => availableBatchModes(columns), [columns]);
  const showModes = !entry && modes.length > 1 && !!catalogQ.data;

  useEffect(() => {
    if (!open) return;
    setYear(String(entry?.year ?? thisYear));
    setQuarter(String(entry?.quarter ?? 1));
    setNote(entry?.note ?? "");
    setMode("single");
    setValues(
      Object.fromEntries(
        columns.map((c) => {
          const v = entry?.values[c.colKey];
          return [c.colKey, v === null || v === undefined ? "" : String(v)];
        }),
      ),
    );
    const cell = (key: string | undefined) => {
      const v = key ? entry?.values[key] : undefined;
      return v === null || v === undefined ? "" : String(v);
    };
    setItems(
      Object.fromEntries(
        layout.groups.map((g) => [
          g.main.colKey,
          entry ? [{ main: cell(g.main.colKey), target: cell(g.target?.colKey) }] : [blankItem()],
        ]),
      ),
    );
  }, [open, entry, columns, thisYear, layout]);

  const linked = layout.groups.length > 0;
  const multipleGroup = layout.groups.find((g) => g.multiple);
  const duplicates = multipleGroup ? duplicateItems(items[multipleGroup.main.colKey] ?? []) : [];
  // Blank program/faculty pickers are left out, so a half-filled row never counts.
  const itemCells = (): Record<string, GroupItem[]> =>
    Object.fromEntries(
      Object.entries(items).map(([k, rows]) => [
        k,
        rows.map((r) => ({ main: r.main.trim() || null, target: r.target.trim() || null })),
      ]),
    );
  const linkedRows = expandEntry(
    layout,
    Object.fromEntries(layout.left.map((c) => [c.colKey, (values[c.colKey] ?? "").trim() || null])),
    itemCells(),
  );

  // A curriculum belongs to a program, so when this source also collects the
  // program we narrow the curriculum picker to that program's curricula. With no
  // program column — the common case — every curriculum stays on offer.
  const programColumn = columns.find((c) => c.dataType === "program");
  const hasLevelColumn = degreeLevelColumn(columns) != null;
  const selectedProgramCode = programColumn
    ? (values[programColumn.colKey] ?? "").trim() || null
    : null;

  const yearValid = /^\d{4}$/.test(year.trim());
  const batchQuarter = periodGrain === "annual" ? null : Number(quarter);
  const batch = useBatchRows({
    mode: mode === "curricula" ? "curricula" : "programs",
    columns,
    catalog,
    faculty,
    entries,
    year: yearValid ? Number(year) : null,
    quarter: batchQuarter,
  });

  const freeRows = useFreeRows({
    columns,
    catalog,
    faculty,
    entries,
    year: yearValid ? Number(year) : null,
    quarter: batchQuarter,
  });

  const cellLabels = useMemo(() => buildCellLabels([], catalog), [catalog]);

  // Format problems in the typed fields (a BE year, 31/02, month 13), found with
  // the same coerceCellValue the server runs. Shown once a field is left, but
  // they block saving straight away.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (open) setTouched(new Set());
  }, [open, entry]);
  const formatErrors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const c of columns) {
      const v = (values[c.colKey] ?? "").trim();
      if (!v || !FORMAT_CHECKED.has(c.dataType)) continue;
      try {
        coerceCellValue(c, v);
      } catch (err) {
        out[c.colKey] = err instanceof Error ? err.message : String(err);
      }
    }
    return out;
  }, [columns, values]);
  const leftKeys = new Set((linked ? layout.left : columns).map((c) => c.colKey));
  const hasFormatError = Object.keys(formatErrors).some((k) => leftKeys.has(k));

  // With linked columns, check what would actually be saved: every expanded row.
  const requiredFilled = linked
    ? duplicates.length === 0 &&
      linkedRows.every((row) =>
        columns.every((c) => !c.isRequired || (row[c.colKey] ?? "") !== ""),
      )
    : columns.every((c) => !c.isRequired || (values[c.colKey] ?? "").trim() !== "");
  const isFree = mode === "rows";
  const isBatch = mode !== "single";
  const valid = isFree
    ? yearValid && freeRows.canSubmit
    : isBatch
      ? yearValid && batch.canSubmit
      : yearValid && requiredFilled && !hasFormatError;
  const submitting = create.isPending || update.isPending || bulk.isPending;

  const submitBatch = () => {
    const rows = isFree
      ? freeRows.included.map((row) => ({ locked: {}, values: row.values, note: row.note }))
      : batch.included;
    bulk.mutate(
      {
        id: dataSourceId,
        input: {
          rows: rows.map((row) => ({
            year: Number(year),
            quarter: batchQuarter,
            values: toPayload(row.locked, row.values, columns),
            note: row.note.trim() || null,
          })),
        },
      },
      { onSuccess: onClose },
    );
  };

  const submit = () => {
    if (isBatch) return submitBatch();

    // One entry form, several authors: save one row per author in one request.
    if (linked && !entry && linkedRows.length > 1) {
      bulk.mutate(
        {
          id: dataSourceId,
          input: {
            rows: linkedRows.map((rowValues) => ({
              year: Number(year),
              quarter: batchQuarter,
              values: rowValues,
              note: note.trim() || null,
            })),
          },
        },
        { onSuccess: onClose },
      );
      return;
    }

    // Empty string means "no value"; the API turns it into null.
    const payloadValues: Record<string, DataSourceCellValue> = linked
      ? linkedRows[0]
      : Object.fromEntries(
          columns.map((c) => [c.colKey, (values[c.colKey] ?? "").trim() || null]),
        );
    const input = {
      year: Number(year),
      quarter: batchQuarter,
      values: payloadValues,
      note: note.trim() || null,
    };

    if (entry) {
      update.mutate(
        { dataSourceId, entryId: entry.id, input },
        { onSuccess: onClose },
      );
    } else {
      create.mutate({ id: dataSourceId, input }, { onSuccess: onClose });
    }
  };

  const batchCount = isFree ? freeRows.included.length : batch.included.length;
  const submitLabel = isBatch
    ? `Add ${batchCount} ${batchCount === 1 ? "Entry" : "Entries"}`
    : entry
      ? "Save"
      : linked && linkedRows.length > 1
        ? `Add Entry (${linkedRows.length} rows)`
        : "Add Entry";
  const split = linked && !isBatch;


  const periodFields = (
    <div className="flex gap-md">
      <Field label="Year">
        <Input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. 2568"
        />
      </Field>
      {periodGrain === "quarterly" && (
        <Field label="Quarter">
          <Select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Q{q}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );

  const fieldsFor = (cols: DataSourceColumn[]) =>
    cols.map((c) => (
      <Field
        key={c.id}
        label={`${c.label}${c.isRequired ? " *" : ""}`}
        hint={[
          COLUMN_TYPE_LABELS[c.dataType],
          c.unit,
          isFormattedType(c.dataType) ? FORMAT_EXAMPLE[c.dataType] : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <span
          className="contents"
          onBlur={() => setTouched((prev) => new Set(prev).add(c.colKey))}
        >
        <CellInput
          column={c}
          value={values[c.colKey] ?? ""}
          faculty={faculty}
          catalog={catalog}
          selectedProgramCode={selectedProgramCode}
          onChange={(v) =>
            setValues((prev) => {
              const next = { ...prev, [c.colKey]: v };
              // Picking a curriculum fills its Degree level; it stays editable.
              return c.dataType === "curriculum"
                ? withDegreeLevel(next, columns, catalog, { overwrite: true })
                : next;
            })
          }
        />
        </span>
        {formatErrors[c.colKey] && touched.has(c.colKey) && (
          <span role="alert" className="text-caption-sm text-error">
            {formatErrors[c.colKey]}
          </span>
        )}
      </Field>
    ));

  const noteField = (
    <Field
      label="Note"
      hint={
        split && linkedRows.length > 1
          ? "Optional context, saved on every row."
          : "Optional context for this row."
      }
    >
      <Input value={note} onChange={(e) => setNote(e.target.value)} />
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "Edit Entry" : "Add Entry"}
      subtitle={
        entry
          ? "One row of raw data for this source."
          : isBatch
            ? `${hintFor(mode, !!programColumn, hasLevelColumn)} All rows share the period below.`
            : split && multipleGroup
              ? `One entry; it is saved as one row per ${multipleGroup.main.label}.`
              : "One row of raw data for this source."
      }
      // All three batch modes share one width, so switching between them does
      // not resize the dialog; it never outgrows the screen in any mode.
      size={isBatch ? "batch" : split ? "xl" : "md"}
      fitViewport
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || submitting} onClick={submit}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </>
      }
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-md">
        {showModes && (
          // Not wrapped in a Field: Field is a <label>, and nesting the radios'
          // own labels inside it would make any click select the first option.
          <div className="flex flex-col gap-xs">
            <h3 className="text-label-md text-on-surface">What to add</h3>
            <RadioGroup
              name="batch-mode"
              orientation="horizontal"
              value={mode}
              onChange={setMode}
              options={modes.map((m) => ({
                value: m,
                label: batchModeLabel(m, catalog),
                hint: hintFor(m, !!programColumn, hasLevelColumn),
              }))}
            />
          </div>
        )}

        {!split && periodFields}

        {isFree ? (
          <FreeEntryGrid state={freeRows} columns={columns} catalog={catalog} faculty={faculty} />
        ) : isBatch ? (
          <BatchEntryGrid
            state={batch}
            columns={columns}
            catalog={catalog}
            faculty={faculty}
            labels={cellLabels}
          />
        ) : split ? (
          // Left: the entry's own fields. Right: the multiple column and the
          // "ref by" pairs. Stacks on narrow screens.
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-lg md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-md">
              {periodFields}
              {fieldsFor(layout.left)}
              {noteField}
            </div>
            <LinkedItemsPanel
              layout={layout}
              items={items}
              onChange={(key, next) => setItems((prev) => ({ ...prev, [key]: next }))}
              faculty={faculty}
              catalog={catalog}
              lookups={lookups}
              duplicates={duplicates}
              allowAdd={!entry}
            />
          </div>
        ) : (
          <>
            {fieldsFor(columns)}
            {noteField}
          </>
        )}
      </div>
    </Modal>
  );
}
