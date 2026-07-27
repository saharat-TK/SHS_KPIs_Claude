"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useAcademicCatalog,
  useCreateDataSourceEntry,
  useFacultyRecords,
  useUpdateDataSourceEntry,
} from "@/lib/data/hooks";
import { COLUMN_TYPE_LABELS } from "@/lib/kpi/dataSources";
import {
  EMPTY_ACADEMIC_CATALOG,
  catalogOptionLabel,
  curriculaForProgram,
} from "@/lib/kpi/academicCatalog";
import type {
  AcademicCatalog,
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceEntry,
  DataSourcePeriodGrain,
  FacultyRecord,
} from "@/lib/types";

/** Add or edit one row of raw data. Values are held as strings while editing and
 *  coerced server-side by validateEntryValues, which is the authority. */
export function EntryModal({
  open,
  onClose,
  dataSourceId,
  periodGrain,
  columns,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  periodGrain: DataSourcePeriodGrain;
  columns: DataSourceColumn[];
  entry: DataSourceEntry | null;
}) {
  const { user } = useAuth();
  const create = useCreateDataSourceEntry();
  const update = useUpdateDataSourceEntry();

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
  const catalog = useAcademicCatalog().data ?? EMPTY_ACADEMIC_CATALOG;

  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(String(thisYear));
  const [quarter, setQuarter] = useState("1");
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setYear(String(entry?.year ?? thisYear));
    setQuarter(String(entry?.quarter ?? 1));
    setNote(entry?.note ?? "");
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
  const requiredFilled = columns.every(
    (c) => !c.isRequired || (values[c.colKey] ?? "").trim() !== "",
  );
  const valid = yearValid && requiredFilled;
  const submitting = create.isPending || update.isPending;

  const submit = () => {
    // Empty string means "no value"; the API turns it into null.
    const payloadValues: Record<string, DataSourceCellValue> = Object.fromEntries(
      columns.map((c) => [c.colKey, (values[c.colKey] ?? "").trim() || null]),
    );
    const input = {
      year: Number(year),
      quarter: periodGrain === "annual" ? null : Number(quarter),
      values: payloadValues,
      note: note.trim() || null,
      actorId: user?.facultyId,
      userRole: user?.role,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "Edit Entry" : "Add Entry"}
      subtitle="One row of raw data for this source."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || submitting} onClick={submit}>
            {submitting ? "Saving…" : entry ? "Save" : "Add Entry"}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
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
      </div>
    </Modal>
  );
}

/** Keeps a stored code that isn't in the current option list selectable, rather
 *  than letting the Select silently blank it. Covers values typed in before the
 *  field became a dropdown, and a curriculum hidden by the program cascade. */
function UnrecognisedOption({ value, known }: { value: string; known: string[] }) {
  if (!value || known.includes(value)) return null;
  return <option value={value}>{value} — not in the catalog</option>;
}

function CellInput({
  column,
  value,
  onChange,
  faculty,
  catalog,
  selectedProgramCode,
}: {
  column: DataSourceColumn;
  value: string;
  onChange: (value: string) => void;
  faculty: FacultyRecord[];
  catalog: AcademicCatalog;
  /** Set when this source also has a program column, to narrow curricula. */
  selectedProgramCode: string | null;
}) {
  switch (column.dataType) {
    case "select":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(column.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    case "faculty":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.program}
            </option>
          ))}
          {/* Keep a stored person who has since left the roster visible, rather
              than silently blanking the field on edit. */}
          {value && !faculty.some((f) => f.id === value) && (
            <option value={value}>{value} — no longer on the roster</option>
          )}
        </Select>
      );
    case "program":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {catalog.programs.map((p) => (
            <option key={p.code} value={p.code}>
              {catalogOptionLabel(p)}
            </option>
          ))}
          <UnrecognisedOption
            value={value}
            known={catalog.programs.map((p) => p.code)}
          />
        </Select>
      );
    case "curriculum": {
      const offered = curriculaForProgram(catalog.curricula, selectedProgramCode);
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {offered.map((c) => (
            <option key={c.code} value={c.code}>
              {catalogOptionLabel(c)}
            </option>
          ))}
          {/* Also covers a valid curriculum that the chosen program filtered out,
              so switching program never silently discards what was recorded. */}
          <UnrecognisedOption value={value} known={offered.map((c) => c.code)} />
        </Select>
      );
    }
    case "boolean":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Select>
      );
    case "date":
      return (
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      );
    case "url":
      return (
        <Input
          type="url"
          inputMode="url"
          placeholder="https://example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
  }
}
