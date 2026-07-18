"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, Select, Badge } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCreateDataSourceLink,
  useDataSourceColumns,
  useDataSourceEntries,
  useFacultyRecords,
  useLibraryKpis,
  useLibraryMetrics,
  useStrategicSets,
  useUpdateDataSourceLink,
} from "@/lib/data/hooks";
import {
  AGGREGATION_KINDS,
  AGGREGATION_LABELS,
  OPERATOR_LABELS,
  PERIOD_FIELD,
  aggregate,
  aggregationNeedsColumn,
  matchesFilters,
  operatorsFor,
} from "@/lib/kpi/dataSourceFilters";
import { unitNeedsDivisor } from "@/lib/kpi/progress";
import { buildCellLabels } from "@/lib/kpi/programs";
import { PROGRAMS } from "@/lib/kpi/programs";
import { formatNumber } from "@/lib/utils";
import type {
  AggregationKind,
  DataSourceColumn,
  DataSourceFilter,
  DataSourceLink,
  DataSourceLinkMapping,
  FilterOperator,
  MappingSlot,
} from "@/lib/types";

const SLOT_LABELS: Record<MappingSlot, string> = {
  value: "The KPI value",
  variable1: "Variable 1 (dividend)",
  variable2: "Variable 2 (divisor)",
};

let seq = 0;
const nextKey = () => `d${(seq += 1)}`;

interface DraftFilter {
  key: string;
  field: string;
  operator: FilterOperator;
  value: string;
  valueTo: string;
}

interface DraftMapping {
  key: string;
  slot: MappingSlot;
  aggregation: AggregationKind;
  columnKey: string;
  filters: DraftFilter[];
}

const newFilter = (field = ""): DraftFilter => ({
  key: nextKey(),
  field,
  operator: "eq",
  value: "",
  valueTo: "",
});

const newMapping = (slot: MappingSlot = "value"): DraftMapping => ({
  key: nextKey(),
  slot,
  aggregation: "count",
  columnKey: "",
  filters: [],
});

function toDraft(m: DataSourceLinkMapping): DraftMapping {
  return {
    key: nextKey(),
    slot: m.slot,
    aggregation: m.aggregation,
    columnKey: m.columnKey ?? "",
    filters: (m.filters ?? []).map((f) => ({
      key: nextKey(),
      field: f.field,
      operator: f.operator,
      value: f.value == null ? "" : String(f.value),
      valueTo: f.valueTo == null ? "" : String(f.valueTo),
    })),
  };
}

const toPayload = (d: DraftMapping): DataSourceLinkMapping => ({
  slot: d.slot,
  aggregation: d.aggregation,
  columnKey: aggregationNeedsColumn(d.aggregation) ? d.columnKey || null : null,
  filters: d.filters
    .filter((f) => f.field)
    .map((f) => {
      const base: DataSourceFilter = {
        field: f.field,
        operator: f.operator,
        value: f.value,
      };
      return f.operator === "between" ? { ...base, valueTo: f.valueTo } : base;
    }),
});

/** Link this data source to a library KPI or metric, and say which of its rows
 *  produce that target's quarterly value. Editing a link keeps its target — the
 *  unique key is built on it — and changes only the mappings. */
export function LinkKpiModal({
  open,
  onClose,
  dataSourceId,
  link,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  /** Present = edit mode. */
  link?: DataSourceLink | null;
}) {
  const isEdit = !!link;
  const setsQ = useStrategicSets();
  const [setId, setSetId] = useState(0);
  const [kpiId, setKpiId] = useState(0);
  const [metricId, setMetricId] = useState(0);
  const [note, setNote] = useState("");
  const [mappings, setMappings] = useState<DraftMapping[]>([]);

  const kpisQ = useLibraryKpis(setId);
  const metricsQ = useLibraryMetrics(kpiId);
  const columnsQ = useDataSourceColumns(dataSourceId);
  const entriesQ = useDataSourceEntries(dataSourceId);
  const facultyQ = useFacultyRecords();
  const create = useCreateDataSourceLink();
  const update = useUpdateDataSourceLink();

  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const entries = useMemo(() => entriesQ.data ?? [], [entriesQ.data]);
  const labels = useMemo(() => buildCellLabels(facultyQ.data ?? []), [facultyQ.data]);

  useEffect(() => {
    if (!open) return;
    setNote(link?.note ?? "");
    setMappings((link?.mappings ?? []).map(toDraft));
    if (!link) {
      setSetId(0);
      setKpiId(0);
      setMetricId(0);
    }
  }, [open, link]);

  // A percent/ratio KPI can be fed as two variables instead of one value.
  const selectedKpi = (kpisQ.data ?? []).find((k) => k.id === kpiId);
  const allowsVariables =
    !isEdit && !metricId && unitNeedsDivisor(selectedKpi?.unit ?? null);

  const updateMapping = (key: string, patch: Partial<DraftMapping>) =>
    setMappings((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const submitting = create.isPending || update.isPending;
  const valid = isEdit || kpiId > 0;

  const submit = () => {
    const payload = mappings.map(toPayload);
    if (isEdit && link) {
      update.mutate(
        {
          dataSourceId,
          linkId: link.id,
          patch: { mappings: payload, note: note.trim() || null },
        },
        { onSuccess: onClose },
      );
      return;
    }
    create.mutate(
      {
        id: dataSourceId,
        input: {
          ...(metricId > 0 ? { libraryMetricId: metricId } : { libraryKpiId: kpiId }),
          mappings: payload,
          note: note.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit Link" : "Link to a KPI"}
      subtitle={
        isEdit
          ? `Which rows of this data source produce “${link?.metricName || link?.kpiName}”.`
          : "Pick the target, then say which rows count toward it. Leave the mapping empty to record the link as evidence only."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || submitting} onClick={submit}>
            {submitting ? "Saving…" : isEdit ? "Save Link" : "Link"}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
        {isEdit ? (
          <div className="rounded-md border border-hairline bg-surface-lowest px-md py-sm text-body-sm">
            <span className="text-mute">Feeding </span>
            <span className="font-medium">{link?.metricName || link?.kpiName}</span>
            {link?.setName && <span className="text-mute"> · {link.setName}</span>}
          </div>
        ) : (
          <TargetPicker
            sets={setsQ.data ?? []}
            kpis={kpisQ.data ?? []}
            metrics={metricsQ.data ?? []}
            setId={setId}
            kpiId={kpiId}
            metricId={metricId}
            onSet={(v) => {
              setSetId(v);
              setKpiId(0);
              setMetricId(0);
            }}
            onKpi={(v) => {
              setKpiId(v);
              setMetricId(0);
            }}
            onMetric={setMetricId}
          />
        )}

        <div className="border-t border-hairline pt-md">
          <div className="mb-sm flex items-center justify-between">
            <div>
              <h3 className="text-label-md text-on-surface">Which rows count</h3>
              <p className="text-caption-sm text-mute">
                Matching rows are aggregated into the quarterly value, cumulatively
                within each year.
              </p>
            </div>
            {mappings.length < (allowsVariables ? 2 : 1) && (
              <Button
                size="sm"
                variant="ghost"
                icon="add"
                onClick={() =>
                  setMappings((ms) => [
                    ...ms,
                    newMapping(
                      allowsVariables
                        ? ms.some((m) => m.slot === "variable1")
                          ? "variable2"
                          : "variable1"
                        : "value",
                    ),
                  ])
                }
              >
                Add mapping
              </Button>
            )}
          </div>

          {columns.length === 0 ? (
            <p className="text-body-sm text-mute">
              This data source has no columns yet, so there is nothing to filter on.
            </p>
          ) : mappings.length === 0 ? (
            <p className="text-body-sm text-mute">
              No mapping — this link is evidence only and will not change any value.
            </p>
          ) : (
            <div className="flex flex-col gap-md">
              {mappings.map((m) => (
                <MappingCard
                  key={m.key}
                  mapping={m}
                  columns={columns}
                  entries={entries}
                  labels={labels}
                  allowsVariables={allowsVariables}
                  onChange={(patch) => updateMapping(m.key, patch)}
                  onRemove={() =>
                    setMappings((ms) => ms.filter((x) => x.key !== m.key))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <Field label="Note" hint="Optional — how this data supports the KPI.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function TargetPicker({
  sets,
  kpis,
  metrics,
  setId,
  kpiId,
  metricId,
  onSet,
  onKpi,
  onMetric,
}: {
  sets: { id: number; name: string }[];
  kpis: { id: number; name: string }[];
  metrics: { id: number; name: string }[];
  setId: number;
  kpiId: number;
  metricId: number;
  onSet: (v: number) => void;
  onKpi: (v: number) => void;
  onMetric: (v: number) => void;
}) {
  return (
    <>
      <Field label="Strategic set">
        <Select value={setId || ""} onChange={(e) => onSet(Number(e.target.value))}>
          <option value="">Select a set…</option>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="KPI">
        <Select
          value={kpiId || ""}
          disabled={!setId}
          onChange={(e) => onKpi(Number(e.target.value))}
        >
          <option value="">{setId ? "Select a KPI…" : "Select a set first"}</option>
          {kpis.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Metric" hint="Optional — leave blank to feed the KPI itself.">
        <Select
          value={metricId || ""}
          disabled={!kpiId || metrics.length === 0}
          onChange={(e) => onMetric(Number(e.target.value))}
        >
          <option value="">The KPI itself</option>
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

function MappingCard({
  mapping,
  columns,
  entries,
  labels,
  allowsVariables,
  onChange,
  onRemove,
}: {
  mapping: DraftMapping;
  columns: DataSourceColumn[];
  entries: { id: number; year: number; quarter: number | null; values: Record<string, unknown> }[];
  labels: Record<string, string>;
  allowsVariables: boolean;
  onChange: (patch: Partial<DraftMapping>) => void;
  onRemove: () => void;
}) {
  const numberColumns = columns.filter((c) => c.dataType === "number");

  // Live preview. Filters that are still half-typed throw inside matchesFilters,
  // so treat any error as "not previewable yet" rather than crashing the modal.
  const preview = useMemo(() => {
    const ready = mapping.filters.filter(
      (f) =>
        f.field &&
        f.value !== "" &&
        (f.operator !== "between" || f.valueTo !== ""),
    );
    try {
      const payload = toPayload({ ...mapping, filters: ready });
      const matched = entries.filter((e) =>
        matchesFilters(e as never, columns, payload.filters),
      );
      return {
        matched: matched.length,
        total: entries.length,
        value: aggregate(mapping.aggregation, payload.columnKey, matched as never),
        pending: ready.length !== mapping.filters.length,
      };
    } catch {
      return null;
    }
  }, [mapping, columns, entries]);

  return (
    <div className="rounded-md border border-hairline p-md">
      <div className="flex flex-wrap items-end gap-sm">
        {allowsVariables && (
          <div className="w-48">
            <Field label="Feeds">
              <Select
                value={mapping.slot}
                onChange={(e) => onChange({ slot: e.target.value as MappingSlot })}
              >
                <option value="variable1">{SLOT_LABELS.variable1}</option>
                <option value="variable2">{SLOT_LABELS.variable2}</option>
              </Select>
            </Field>
          </div>
        )}
        <div className="w-44">
          <Field label="Aggregate">
            <Select
              value={mapping.aggregation}
              onChange={(e) =>
                onChange({ aggregation: e.target.value as AggregationKind })
              }
            >
              {AGGREGATION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {AGGREGATION_LABELS[k]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {aggregationNeedsColumn(mapping.aggregation) && (
          <div className="min-w-[10rem] flex-1">
            <Field
              label="Column"
              hint={numberColumns.length === 0 ? "No number columns on this source." : undefined}
            >
              <Select
                value={mapping.columnKey}
                onChange={(e) => onChange({ columnKey: e.target.value })}
              >
                <option value="">Select a column…</option>
                {numberColumns.map((c) => (
                  <option key={c.id} value={c.colKey}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <button
          type="button"
          aria-label="Remove mapping"
          title="Remove mapping"
          onClick={onRemove}
          className="mb-xs grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>

      <div className="mt-md flex flex-col gap-sm border-t border-hairline pt-md">
        {mapping.filters.length === 0 ? (
          <p className="text-caption-sm text-mute">
            No conditions — every row of this data source counts.
          </p>
        ) : (
          mapping.filters.map((f) => (
            <FilterRow
              key={f.key}
              filter={f}
              columns={columns}
              labels={labels}
              onChange={(patch) =>
                onChange({
                  filters: mapping.filters.map((x) =>
                    x.key === f.key ? { ...x, ...patch } : x,
                  ),
                })
              }
              onRemove={() =>
                onChange({ filters: mapping.filters.filter((x) => x.key !== f.key) })
              }
            />
          ))
        )}

        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            icon="add"
            onClick={() => onChange({ filters: [...mapping.filters, newFilter()] })}
          >
            Add condition
          </Button>

          {preview && (
            <span className="text-caption-sm text-mute">
              <Badge tone={preview.matched > 0 ? "success" : "warning"}>
                {preview.matched} of {preview.total} rows
              </Badge>{" "}
              {preview.pending
                ? "· finish the condition to preview"
                : `· ${AGGREGATION_LABELS[mapping.aggregation].toLowerCase()} = ${
                    preview.value == null
                      ? "—"
                      : // A count is a whole number; everything else may not be.
                        formatNumber(preview.value, mapping.aggregation === "count" ? 0 : 2)
                  }`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  filter,
  columns,
  labels,
  onChange,
  onRemove,
}: {
  filter: DraftFilter;
  columns: DataSourceColumn[];
  labels: Record<string, string>;
  onChange: (patch: Partial<DraftFilter>) => void;
  onRemove: () => void;
}) {
  const column = columns.find((c) => c.colKey === filter.field);
  const isPeriod = filter.field === PERIOD_FIELD;
  const allowed: FilterOperator[] = isPeriod
    ? ["between"]
    : column
      ? operatorsFor(column.dataType)
      : ["eq"];

  return (
    <div className="flex flex-wrap items-end gap-sm">
      <div className="min-w-[9rem] flex-1">
        <Field label="Field">
          <Select
            value={filter.field}
            onChange={(e) => {
              const field = e.target.value;
              const next =
                field === PERIOD_FIELD
                  ? "between"
                  : (operatorsFor(
                      columns.find((c) => c.colKey === field)?.dataType ?? "text",
                    )[0] ?? "eq");
              onChange({ field, operator: next, value: "", valueTo: "" });
            }}
          >
            <option value="">Select a field…</option>
            {columns.map((c) => (
              <option key={c.id} value={c.colKey}>
                {c.label}
              </option>
            ))}
            <option value={PERIOD_FIELD}>Period (year / quarter)</option>
          </Select>
        </Field>
      </div>

      <div className="w-36">
        <Field label="Is">
          <Select
            value={filter.operator}
            disabled={allowed.length === 1}
            onChange={(e) =>
              onChange({ operator: e.target.value as FilterOperator, valueTo: "" })
            }
          >
            {allowed.map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isPeriod ? (
        <>
          <PeriodBound label="From" value={filter.value} onChange={(v) => onChange({ value: v })} />
          <PeriodBound label="To" value={filter.valueTo} onChange={(v) => onChange({ valueTo: v })} />
        </>
      ) : (
        <>
          <div className="min-w-[9rem] flex-1">
            <Field label={filter.operator === "between" ? "From" : "Value"}>
              <ValueInput
                column={column}
                labels={labels}
                value={filter.value}
                onChange={(v) => onChange({ value: v })}
              />
            </Field>
          </div>
          {filter.operator === "between" && (
            <div className="min-w-[9rem] flex-1">
              <Field label="To">
                <ValueInput
                  column={column}
                  labels={labels}
                  value={filter.valueTo}
                  onChange={(v) => onChange({ valueTo: v })}
                />
              </Field>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        aria-label="Remove condition"
        title="Remove condition"
        onClick={onRemove}
        className="mb-xs grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  );
}

/** A "YYYY-Q" bound, entered as a year plus a quarter so the encoding is never
 *  the user's problem. */
function PeriodBound({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [year, quarter] = value.split("-");
  const emit = (y: string, q: string) => onChange(y && q ? `${y}-${q}` : "");

  return (
    <div className="flex items-end gap-xs">
      <div className="w-24">
        <Field label={`${label} year`}>
          <Input
            value={year ?? ""}
            inputMode="numeric"
            placeholder="2568"
            onChange={(e) => emit(e.target.value.trim(), quarter || "1")}
          />
        </Field>
      </div>
      <div className="w-20">
        <Field label="Qtr">
          <Select
            value={quarter ?? "1"}
            onChange={(e) => emit(year ?? "", e.target.value)}
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Q{q}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

/** The value control matches the column's type, so a faculty filter is picked by
 *  name and stored as an id — exactly as EntryModal does. */
function ValueInput({
  column,
  labels,
  value,
  onChange,
}: {
  column?: DataSourceColumn;
  labels: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  if (!column) {
    return <Input value={value} disabled placeholder="Pick a field first" onChange={() => {}} />;
  }

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
    case "program":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {PROGRAMS.map((p) => (
            <option key={p.abbr} value={p.abbr}>
              {p.abbr} — {p.label}
            </option>
          ))}
        </Select>
      );
    case "faculty":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {Object.entries(labels)
            .filter(([k]) => k.startsWith("fac-"))
            .sort((a, b) => a[1].localeCompare(b[1], "th"))
            .map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
        </Select>
      );
    case "date":
      return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <Input value={value} inputMode="decimal" onChange={(e) => onChange(e.target.value)} />
      );
    default:
      return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
  }
}
