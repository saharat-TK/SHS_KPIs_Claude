"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useCreateDataSourceEntry,
  useUpdateDataSourceEntry,
} from "@/lib/data/hooks";
import { COLUMN_TYPE_LABELS } from "@/lib/kpi/dataSources";
import type {
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceEntry,
  DataSourcePeriodGrain,
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

function CellInput({
  column,
  value,
  onChange,
}: {
  column: DataSourceColumn;
  value: string;
  onChange: (value: string) => void;
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
