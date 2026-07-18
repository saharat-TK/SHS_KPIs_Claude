"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select, UnitSelect } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useSaveDataSourceColumns } from "@/lib/data/hooks";
import {
  COLUMN_TYPE_LABELS,
  DATA_SOURCE_COLUMN_TYPES,
  slugifyColumnKey,
} from "@/lib/kpi/dataSources";
import type { DataSourceColumn, DataSourceColumnType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A row in the editor. `id` is present for columns that already exist — the
 *  API matches on it so a rename keeps the col_key, and with it every value
 *  already recorded under that key. */
interface Draft {
  key: string; // React list key only; not the col_key
  id?: number;
  colKey?: string;
  label: string;
  dataType: DataSourceColumnType;
  unit: string | null;
  options: string[];
  isRequired: boolean;
}

let draftSeq = 0;
const newDraft = (): Draft => ({
  key: `draft-${(draftSeq += 1)}`,
  label: "",
  dataType: "text",
  unit: null,
  options: [],
  isRequired: false,
});

const toDraft = (c: DataSourceColumn): Draft => ({
  key: `col-${c.id}`,
  id: c.id,
  colKey: c.colKey,
  label: c.label,
  dataType: c.dataType,
  unit: c.unit,
  options: c.options ?? [],
  isRequired: c.isRequired,
});

export function ManageColumnsModal({
  open,
  onClose,
  dataSourceId,
  columns,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  columns: DataSourceColumn[];
}) {
  const save = useSaveDataSourceColumns();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Re-seed whenever the modal opens so a cancelled edit is discarded.
  useEffect(() => {
    if (open) setDrafts(columns.map(toDraft));
  }, [open, columns]);

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const remove = (key: string) => setDrafts((ds) => ds.filter((d) => d.key !== key));

  const move = (key: string, delta: number) =>
    setDrafts((ds) => {
      const i = ds.findIndex((d) => d.key === key);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= ds.length) return ds;
      const next = [...ds];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const problems = drafts.flatMap((d) => {
    if (!d.label.trim()) return ["Every column needs a label"];
    if (d.dataType === "select" && d.options.filter(Boolean).length === 0) {
      return [`"${d.label.trim()}" is a choice column, so it needs at least one option`];
    }
    return [];
  });
  const valid = problems.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Columns"
      subtitle="Define what this data source collects. Renaming a column keeps the data already recorded under it; deleting one hides its values."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  id: dataSourceId,
                  columns: drafts.map((d) => ({
                    id: d.id,
                    colKey: d.colKey,
                    label: d.label.trim(),
                    dataType: d.dataType,
                    unit: d.unit,
                    options: d.dataType === "select" ? d.options.filter(Boolean) : null,
                    isRequired: d.isRequired,
                  })),
                },
                { onSuccess: onClose },
              )
            }
          >
            {save.isPending ? "Saving…" : "Save Columns"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {drafts.length === 0 ? (
          <p className="text-body-sm text-mute">
            No columns yet. Add the first one below.
          </p>
        ) : (
          <div className="flex flex-col gap-sm">
            {drafts.map((d, i) => (
              <ColumnRow
                key={d.key}
                draft={d}
                isFirst={i === 0}
                isLast={i === drafts.length - 1}
                onChange={(patch) => update(d.key, patch)}
                onRemove={() => remove(d.key)}
                onMove={(delta) => move(d.key, delta)}
              />
            ))}
          </div>
        )}

        {problems.length > 0 && (
          <p className="text-body-sm text-error">{problems[0]}</p>
        )}

        <div className="border-t border-hairline pt-md">
          <Button
            variant="ghost"
            icon="add"
            onClick={() => setDrafts((ds) => [...ds, newDraft()])}
          >
            Add column
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ColumnRow({
  draft,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  draft: Draft;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const key = draft.colKey ?? slugifyColumnKey(draft.label || "column");

  return (
    <div className="rounded-md border border-hairline p-md">
      <div className="flex flex-wrap items-end gap-sm">
        <div className="min-w-[12rem] flex-1">
          <Field label="Label">
            <Input
              value={draft.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="e.g. Student count"
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Type">
            <Select
              value={draft.dataType}
              onChange={(e) =>
                onChange({ dataType: e.target.value as DataSourceColumnType })
              }
            >
              {DATA_SOURCE_COLUMN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {COLUMN_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {draft.dataType === "number" && (
          <div className="w-40">
            <Field label="Unit">
              <UnitSelect
                value={draft.unit ?? ""}
                onChange={(unit) => onChange({ unit: unit || null })}
              />
            </Field>
          </div>
        )}
        <label className="flex items-center gap-xs pb-sm text-body-sm">
          <input
            type="checkbox"
            checked={draft.isRequired}
            onChange={(e) => onChange({ isRequired: e.target.checked })}
          />
          Required
        </label>
        <div className="flex items-center gap-xxs pb-xs">
          <IconButton icon="arrow_upward" label="Move up" disabled={isFirst} onClick={() => onMove(-1)} />
          <IconButton icon="arrow_downward" label="Move down" disabled={isLast} onClick={() => onMove(1)} />
          <IconButton icon="delete" label="Remove column" onClick={onRemove} />
        </div>
      </div>

      {draft.dataType === "select" && (
        <div className="mt-sm">
          <Field label="Options" hint="Comma-separated list of allowed values.">
            <Input
              value={draft.options.join(", ")}
              onChange={(e) =>
                onChange({
                  options: e.target.value.split(",").map((o) => o.trim()),
                })
              }
              placeholder="e.g. BSc, MSc, PhD"
            />
          </Field>
        </div>
      )}

      <p className="mt-xs text-caption-sm text-mute">
        Stored as <code>{key}</code>
        {draft.id ? "" : " (new)"}
      </p>
    </div>
  );
}

function IconButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-mute transition-colors",
        disabled ? "opacity-30" : "hover:bg-surface-container-high hover:text-on-surface",
      )}
    >
      <Icon name={icon} className="text-[18px]" />
    </button>
  );
}
