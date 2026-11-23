"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Field, Input, RadioGroup, Select, useConfirm } from "@/components/ui";
import {
  useAcademicCatalog,
  useBulkCreateDataSourceEntries,
  useCreateDataSourceEntry,
  useFacultyRecords,
  useSaveDataSourceEntryGroup,
  useUpdateDataSourceEntry,
} from "@/lib/data/hooks";
import {
  COLUMN_TYPE_LABELS,
  coerceCellValue,
  describeEntryForConfirm,
} from "@/lib/kpi/dataSources";
import {
  CellFormatError,
  FORMAT_EXAMPLE,
  currentBEYear,
  formatDateBE,
  isFormattedType,
  parseYearBE,
} from "@/lib/kpi/cellFormats";

/** Types whose typed text can be malformed, checked live as the user types.
 *  Choice types can't be: their pickers only offer valid values. */
const FORMAT_CHECKED = new Set(["number", "url", "date", "year_be", "month"]);
/** Touched-set key for the period Year; no column key can start with "@". */
const YEAR_FIELD = "@year";
import {
  batchModeLabel,
  availableBatchModes,
  degreeLevelColumn,
  withDegreeLevel,
  type BatchMode,
} from "@/lib/kpi/batchEntry";
import { EMPTY_ACADEMIC_CATALOG, buildCellLabels } from "@/lib/kpi/academicCatalog";
import { groupEntries, notesDiffer } from "@/lib/kpi/entryGroups";
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
  const saveGroup = useSaveDataSourceEntryGroup();
  const confirm = useConfirm();

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

  // Entry periods are Buddhist era, like the performance records they feed.
  const thisYear = currentBEYear();
  const [year, setYear] = useState(String(thisYear));
  const [quarter, setQuarter] = useState("1");
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<BatchMode>("single");
  // Editing a multi-input entry opens every row of it, so the entry is edited
  // and saved as a whole. Read through a ref: a refetch while the window is open
  // must not reset what the user has typed.
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const [groupRows, setGroupRows] = useState<DataSourceEntry[]>([]);
  // Imported rows each keep their own note; editing the entry must not copy one
  // note over all of them.
  const ownNotes = useMemo(() => notesDiffer(groupRows), [groupRows]);

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
          if (v === null || v === undefined) return [c.colKey, ""];
          // Dates are stored as CE but typed and shown in BE.
          return [c.colKey, c.dataType === "date" ? formatDateBE(v) : String(v)];
        }),
      ),
    );
    const cell = (row: DataSourceEntry | null, key: string | undefined) => {
      const v = key && row ? row.values[key] : undefined;
      return v === null || v === undefined ? "" : String(v);
    };
    const rows = entry
      ? (groupEntries(entriesRef.current, columns).find((g) =>
          g.rows.some((r) => r.id === entry.id),
        )?.rows ?? [entry])
      : [];
    setGroupRows(rows);
    if (notesDiffer(rows)) setNote("");
    setItems(
      Object.fromEntries(
        layout.groups.map((g) => [
          g.main.colKey,
          !entry
            ? [blankItem()]
            : g.multiple
              ? rows.map((r) => ({
                  main: cell(r, g.main.colKey),
                  target: cell(r, g.target?.colKey),
                  entryId: r.id,
                }))
              : [{ main: cell(entry, g.main.colKey), target: cell(entry, g.target?.colKey) }],
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

  const yearError = useMemo(() => {
    try {
      parseYearBE(year);
      return null;
    } catch (err) {
      return err instanceof CellFormatError ? `Year ${err.message}` : String(err);
    }
  }, [year]);
  const yearValid = yearError === null;
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
  // An entry flagged incomplete (imported with a flag) may be saved as it is, so
  // people can finish it in several passes. Add Entry and entries that were
  // never flagged keep the strict rule.
  const editingIncomplete = !!entry && groupRows.some((r) => r.isIncomplete);
  const isFree = mode === "rows";
  const isBatch = mode !== "single";
  const valid = isFree
    ? yearValid && freeRows.canSubmit
    : isBatch
      ? yearValid && batch.canSubmit
      : yearValid &&
        (editingIncomplete ? !linked || duplicates.length === 0 : requiredFilled) &&
        !hasFormatError;
  const submitting =
    create.isPending || update.isPending || bulk.isPending || saveGroup.isPending;

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

    // Editing a multi-input entry: every row of it is saved together, with the
    // values added, changed or dropped and the 1/n share recomputed for all.
    if (entry && linked && multipleGroup) {
      const kept = (items[multipleGroup.main.colKey] ?? []).filter((it) => it.main.trim() !== "");
      // With every value cleared expandEntry yields one blank row; it reuses the first row.
      const ids = kept.length
        ? kept.map((it) => it.entryId)
        : [(items[multipleGroup.main.colKey] ?? [])[0]?.entryId];
      saveGroup.mutate(
        {
          id: dataSourceId,
          input: {
            allowIncomplete: editingIncomplete,
            originalIds: groupRows.map((r) => r.id),
            rows: linkedRows.map((rowValues, i) => ({
              id: ids[i],
              year: Number(year),
              quarter: batchQuarter,
              values: rowValues,
              // A row that was imported keeps its own note; added rows have none.
              note: ownNotes
                ? ((groupRows.find((r) => r.id === ids[i])?.note ?? "").trim() || null)
                : note.trim() || null,
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
        { dataSourceId, entryId: entry.id, input: { ...input, allowIncomplete: editingIncomplete } },
        { onSuccess: onClose },
      );
    } else {
      create.mutate({ id: dataSourceId, input }, { onSuccess: onClose });
    }
  };

  const deleteEntry = async () => {
    const target = groupRows[0] ?? entry;
    const name = target ? describeEntryForConfirm(columns, target) : "this entry";
    const ok = await confirm({
      title: "Delete this entire entry?",
      message: `All ${groupRows.length} rows of ${name} will be permanently removed. This cannot be undone. Type DELETE ENTRY to proceed.`,
      tone: "danger",
      confirmLabel: "Delete entry",
      confirmPhrase: "DELETE ENTRY",
    });
    if (!ok) return;
    saveGroup.mutate(
      { id: dataSourceId, input: { originalIds: groupRows.map((r) => r.id), rows: [] } },
      { onSuccess: onClose },
    );
  };

  const batchCount = isFree ? freeRows.included.length : batch.included.length;
  const submitLabel = isBatch
    ? `Add ${batchCount} ${batchCount === 1 ? "Entry" : "Entries"}`
    : entry
      ? multipleGroup && linkedRows.length > 1
        ? `Save (${linkedRows.length} rows)`
        : "Save"
      : linked && linkedRows.length > 1
        ? `Add Entry (${linkedRows.length} rows)`
        : "Add Entry";
  const split = linked && !isBatch;


  const periodFields = (
    <div className="flex gap-md">
      <Field label="Year (BE)" hint={`Buddhist era · ${FORMAT_EXAMPLE.year_be}`}>
        <span
          className="contents"
          onBlur={() => setTouched((prev) => new Set(prev).add(YEAR_FIELD))}
        >
          <Input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
            maxLength={4}
            placeholder={FORMAT_EXAMPLE.year_be}
          />
        </span>
        {yearError && touched.has(YEAR_FIELD) && (
          <span role="alert" className="text-caption-sm text-error">
            {yearError}
          </span>
        )}
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

  const noteField = ownNotes ? (
    <Field label="Note" hint="Each row keeps its own note (set by the import); they are left as they are.">
      <Input value="" disabled placeholder={`${groupRows.length} different notes`} readOnly />
    </Field>
  ) : (
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
          ? multipleGroup
            ? `One entry; it is saved as one row per ${multipleGroup.main.label}.`
            : "One row of raw data for this source."
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
          {entry && multipleGroup && (
            <Button
              variant="ghost"
              icon="delete"
              className="mr-auto text-error hover:text-error"
              disabled={submitting}
              onClick={deleteEntry}
            >
              Delete entire entry
            </Button>
          )}
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
        {editingIncomplete && (
          <p className="rounded border border-warning/30 bg-warning/10 px-md py-sm text-body-sm text-on-surface">
            Required fields are empty — this entry won&apos;t count in KPIs until it is completed.
          </p>
        )}
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
              allowAdd
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
