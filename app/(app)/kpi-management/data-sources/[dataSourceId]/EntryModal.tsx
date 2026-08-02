"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, RadioGroup, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useAcademicCatalog,
  useBulkCreateDataSourceEntries,
  useCreateDataSourceEntry,
  useFacultyRecords,
  useUpdateDataSourceEntry,
} from "@/lib/data/hooks";
import { COLUMN_TYPE_LABELS } from "@/lib/kpi/dataSources";
import {
  BATCH_MODE_LABELS,
  availableBatchModes,
  type BatchMode,
} from "@/lib/kpi/batchEntry";
import { EMPTY_ACADEMIC_CATALOG, buildCellLabels } from "@/lib/kpi/academicCatalog";
import type {
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceEntry,
  DataSourcePeriodGrain,
} from "@/lib/types";
import { CellInput } from "./CellInput";
import { BatchEntryGrid, toPayload, useBatchRows } from "./BatchEntryGrid";

const BATCH_MODE_HINTS: Record<BatchMode, string> = {
  single: "Add one row and fill it in yourself.",
  programs: "One row per academic program, with the program already chosen.",
  curricula: "One row per curriculum, with the curriculum already chosen.",
};

/** The curriculum batch only fills a program in when the source has somewhere to
 *  put one, so the hint must not promise it otherwise. */
const hintFor = (mode: BatchMode, hasProgramColumn: boolean) =>
  mode === "curricula" && hasProgramColumn
    ? "One row per curriculum, with the curriculum and its program already chosen."
    : BATCH_MODE_HINTS[mode];

/** Add or edit one row of raw data — or, when the source records per program or
 *  per curriculum, a whole batch at once.
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
  const { user } = useAuth();
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

  // A batch preset is useless until the catalog arrives, and editing an existing
  // row is always a single row, so the chooser only appears when creating.
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
  }, [open, entry, columns, thisYear]);

  // A curriculum belongs to a program, so when this source also collects the
  // program we narrow the curriculum picker to that program's curricula. With no
  // program column — the common case — every curriculum stays on offer.
  const programColumn = columns.find((c) => c.dataType === "program");
  const selectedProgramCode = programColumn
    ? (values[programColumn.colKey] ?? "").trim() || null
    : null;

  const yearValid = /^\d{4}$/.test(year.trim());
  const batchQuarter = periodGrain === "annual" ? null : Number(quarter);
  const batch = useBatchRows({
    mode: mode === "single" ? "programs" : mode,
    columns,
    catalog,
    faculty,
    entries,
    year: yearValid ? Number(year) : null,
    quarter: batchQuarter,
  });

  const cellLabels = useMemo(() => buildCellLabels([], catalog), [catalog]);

  const requiredFilled = columns.every(
    (c) => !c.isRequired || (values[c.colKey] ?? "").trim() !== "",
  );
  const isBatch = mode !== "single";
  const valid = isBatch
    ? yearValid && batch.canSubmit
    : yearValid && requiredFilled;
  const submitting = create.isPending || update.isPending || bulk.isPending;

  const actor = { actorId: user?.facultyId, userRole: user?.role };

  const submitBatch = () => {
    bulk.mutate(
      {
        id: dataSourceId,
        input: {
          rows: batch.included.map((row) => ({
            year: Number(year),
            quarter: batchQuarter,
            values: toPayload(row.locked, row.values, columns),
            note: row.note.trim() || null,
          })),
          ...actor,
        },
      },
      { onSuccess: onClose },
    );
  };

  const submit = () => {
    if (isBatch) return submitBatch();

    // Empty string means "no value"; the API turns it into null.
    const payloadValues: Record<string, DataSourceCellValue> = Object.fromEntries(
      columns.map((c) => [c.colKey, (values[c.colKey] ?? "").trim() || null]),
    );
    const input = {
      year: Number(year),
      quarter: batchQuarter,
      values: payloadValues,
      note: note.trim() || null,
      ...actor,
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

  const submitLabel = isBatch
    ? `Add ${batch.included.length} ${batch.included.length === 1 ? "Entry" : "Entries"}`
    : entry
      ? "Save"
      : "Add Entry";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "Edit Entry" : "Add Entry"}
      subtitle={
        entry
          ? "One row of raw data for this source."
          : isBatch
            ? `${hintFor(mode, !!programColumn)} All rows share the period below.`
            : "One row of raw data for this source."
      }
      size={isBatch ? "lg" : "md"}
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
                label: BATCH_MODE_LABELS[m],
                hint: hintFor(m, !!programColumn),
              }))}
            />
          </div>
        )}

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

        {isBatch ? (
          <BatchEntryGrid
            state={batch}
            columns={columns}
            catalog={catalog}
            faculty={faculty}
            labels={cellLabels}
          />
        ) : (
          <>
            {columns.map((c) => (
              <Field
                key={c.id}
                label={`${c.label}${c.isRequired ? " *" : ""}`}
                hint={[COLUMN_TYPE_LABELS[c.dataType], c.unit].filter(Boolean).join(" · ")}
              >
                <CellInput
                  column={c}
                  value={values[c.colKey] ?? ""}
                  faculty={faculty}
                  catalog={catalog}
                  selectedProgramCode={selectedProgramCode}
                  onChange={(v) => setValues((prev) => ({ ...prev, [c.colKey]: v }))}
                />
              </Field>
            ))}

            <Field label="Note" hint="Optional context for this row.">
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}
