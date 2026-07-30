"use client";

// The mapping/filter editor shared by both link modals: LinkKpiModal (pick a
// KPI for a given data source) and LinkDataSourceModal (pick a data source for
// a given KPI). It is deliberately target-agnostic — it only ever sees columns,
// entries and labels — so the two modals differ only in what they pick.
import { useMemo, useState } from "react";
import { Button, Field, Input, Select, Badge } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  AGGREGATION_KINDS,
  AGGREGATION_LABELS,
  OPERATOR_LABELS,
  PERIOD_FIELD,
  aggregateParts,
  aggregationAllowsColumn,
  isMultiValueOperator,
  isProportionKind,
  matchesFilters,
  operatorsFor,
} from "@/lib/kpi/dataSourceFilters";
import { useAcademicCatalog } from "@/lib/data/hooks";
import { EMPTY_ACADEMIC_CATALOG, catalogOptionLabel } from "@/lib/kpi/academicCatalog";
import { formatNumber } from "@/lib/utils";
import { unitNeedsDivisor } from "@/lib/kpi/progress";
import { ACADEMIC_RANKS, RANKS } from "@/lib/types";
import { facultyHeadcount } from "@/lib/kpi/facultyHeadcount";
import type {
  AcademicCatalog,
  AggregationKind,
  DataSourceColumn,
  DataSourceFilter,
  DataSourceLinkMapping,
  DenominatorSource,
  FacultyRecord,
  FilterOperator,
  Rank,
} from "@/lib/types";

let seq = 0;
const nextKey = () => `d${(seq += 1)}`;

export interface DraftFilter {
  key: string;
  field: string;
  operator: FilterOperator;
  value: string;
  valueTo: string;
  /** Used only by the "in" operator. */
  values: string[];
}

export interface DraftMapping {
  key: string;
  aggregation: AggregationKind;
  columnKey: string;
  /** Which rows count. Doubles as the population under a "rows" denominator. */
  filters: DraftFilter[];
  /** Narrows the numerator within it. Proportion kinds, "rows" denominator only. */
  numeratorFilters: DraftFilter[];
  /** Totals the numerator on its own column instead of columnKey. Empty = same
   *  column both sides. Proportion kinds, "rows" denominator only. */
  numeratorColumnKey: string;
  /** Proportion kinds only. */
  denominatorSource: DenominatorSource;
  /** Which ranks the headcount counts, when the denominator is the roster. */
  facultyRanks: Rank[];
}

const newFilter = (field = ""): DraftFilter => ({
  key: nextKey(),
  field,
  operator: "eq",
  value: "",
  valueTo: "",
  values: [],
});

/** A condition is only previewable once its operand is actually filled in —
 *  which for "is any of" means at least one value picked, not a non-empty
 *  `value` (which it never sets). */
const isFilterReady = (f: DraftFilter) =>
  !!f.field &&
  (isMultiValueOperator(f.operator)
    ? f.values.length > 0
    : f.value !== "" && (f.operator !== "between" || f.valueTo !== ""));

export const newMapping = (): DraftMapping => ({
  key: nextKey(),
  aggregation: "count",
  columnKey: "",
  filters: [],
  numeratorFilters: [],
  numeratorColumnKey: "",
  denominatorSource: "rows",
  facultyRanks: ACADEMIC_RANKS,
});

const filterToDraft = (f: DataSourceFilter): DraftFilter => ({
  key: nextKey(),
  field: f.field,
  operator: f.operator,
  value: f.value == null ? "" : String(f.value),
  valueTo: f.valueTo == null ? "" : String(f.valueTo),
  values: (f.values ?? []).map((v) => String(v)),
});

export function toDraft(m: DataSourceLinkMapping): DraftMapping {
  return {
    key: nextKey(),
    aggregation: m.aggregation,
    columnKey: m.columnKey ?? "",
    filters: (m.filters ?? []).map(filterToDraft),
    numeratorFilters: (m.numeratorFilters ?? []).map(filterToDraft),
    numeratorColumnKey: m.numeratorColumnKey ?? "",
    denominatorSource: m.denominatorSource ?? "rows",
    facultyRanks: m.facultyRanks ?? ACADEMIC_RANKS,
  };
}

const filtersToPayload = (fs: DraftFilter[]): DataSourceFilter[] =>
  fs
    .filter((f) => f.field)
    .map((f): DataSourceFilter => {
      // Exactly one operand shape per operator — see DataSourceFilter.
      if (isMultiValueOperator(f.operator)) {
        return { field: f.field, operator: f.operator, values: f.values };
      }
      const base: DataSourceFilter = {
        field: f.field,
        operator: f.operator,
        value: f.value,
      };
      return f.operator === "between" ? { ...base, valueTo: f.valueTo } : base;
    });

export const toPayload = (d: DraftMapping): DataSourceLinkMapping => ({
  aggregation: d.aggregation,
  columnKey: aggregationAllowsColumn(d.aggregation) ? d.columnKey || null : null,
  filters: filtersToPayload(d.filters),
  // Only the proportion kinds carry the denominator fields, and each mode
  // carries only its own — so a leftover from switching can't be stored.
  ...(isProportionKind(d.aggregation)
    ? d.denominatorSource === "faculty"
      ? { denominatorSource: "faculty" as const, facultyRanks: d.facultyRanks }
      : {
          numeratorFilters: filtersToPayload(d.numeratorFilters),
          // The same column on both sides is a no-op the server strips anyway;
          // dropping it here keeps the live preview in step with what it stores.
          ...(d.numeratorColumnKey && d.numeratorColumnKey !== d.columnKey
            ? { numeratorColumnKey: d.numeratorColumnKey }
            : {}),
        }
    : {}),
});

export function MappingCard({
  mapping,
  columns,
  entries,
  labels,
  faculty,
  onChange,
  onRemove,
}: {
  mapping: DraftMapping;
  columns: DataSourceColumn[];
  entries: { id: number; year: number; quarter: number | null; values: Record<string, unknown> }[];
  labels: Record<string, string>;
  faculty: FacultyRecord[];
  onChange: (patch: Partial<DraftMapping>) => void;
  onRemove: () => void;
}) {
  const numberColumns = columns.filter((c) => c.dataType === "number");

  const isProportion = isProportionKind(mapping.aggregation);
  const byFaculty = isProportion && mapping.denominatorSource === "faculty";
  // Two columns make the sides differ on their own, so the numerator conditions
  // stop being the only thing keeping the answer off 100%.
  const numeratorColumn = numberColumns.find((c) => c.colKey === mapping.numeratorColumnKey);
  const twoColumn = !!numeratorColumn && mapping.numeratorColumnKey !== mapping.columnKey;
  // Same helper the server feeds with, so the preview can't disagree with the
  // number that ends up stored.
  const headcount = facultyHeadcount(faculty, mapping.facultyRanks);

  // Live preview. Filters that are still half-typed throw inside matchesFilters,
  // so treat any error as "not previewable yet" rather than crashing the modal.
  const preview = useMemo(() => {
    const ready = mapping.filters.filter(isFilterReady);
    const readyNum = mapping.numeratorFilters.filter(isFilterReady);
    try {
      const payload = toPayload({
        ...mapping,
        filters: ready,
        numeratorFilters: readyNum,
      });
      const matched = entries.filter((e) =>
        matchesFilters(e as never, columns, payload.filters),
      );
      // Mirror the server: narrow within the matched population, not the window.
      const numerator =
        isProportion && !byFaculty
          ? matched.filter((e) =>
              matchesFilters(e as never, columns, payload.numeratorFilters ?? []),
            )
          : undefined;
      const proportion = byFaculty
        ? { denominator: headcount }
        : numerator
          ? {
              numerator: numerator as never,
              // Already collision-stripped by toPayload, so the preview divides
              // exactly what a save would.
              numeratorColumnKey: payload.numeratorColumnKey ?? null,
            }
          : undefined;
      const parts = aggregateParts(
        mapping.aggregation,
        payload.columnKey,
        matched as never,
        proportion,
      );
      return {
        matched: matched.length,
        total: entries.length,
        numerator: numerator?.length ?? null,
        parts,
        value: parts.value,
        pending:
          ready.length !== mapping.filters.length ||
          (!byFaculty && readyNum.length !== mapping.numeratorFilters.length),
      };
    } catch {
      return null;
    }
  }, [mapping, columns, entries, isProportion, byFaculty, headcount]);

  return (
    <div className="rounded-md border border-hairline p-md">
      {/* Top-aligned: the Column field's hint makes it taller than its
          neighbours, and bottom-alignment would push their labels out of line. */}
      <div className="flex flex-wrap items-start gap-sm">
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
        {aggregationAllowsColumn(mapping.aggregation) && (
          <div className="min-w-[10rem] flex-1">
            <Field
              label="Column"
              hint={
                numberColumns.length === 0
                  ? "No number columns on this source."
                  : isProportion
                    ? "Optional — leave blank to compare row counts."
                    : undefined
              }
            >
              <Select
                value={mapping.columnKey}
                onChange={(e) => {
                  const columnKey = e.target.value;
                  // Taking over the numerator's column — or dropping to a row
                  // count — leaves nothing for it to mean, and the picker below
                  // would render blank on a value it no longer offers.
                  onChange({
                    columnKey,
                    ...(!columnKey || columnKey === mapping.numeratorColumnKey
                      ? { numeratorColumnKey: "" }
                      : {}),
                  });
                }}
              >
                <option value="">
                  {isProportion ? "Count rows" : "Select a column…"}
                </option>
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
          // mt-xl skips past the Field-label row, so this lines up with the
          // inputs now that the group is top- rather than bottom-aligned.
          className="mt-xl grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>

      <div className="mt-md flex flex-col gap-sm border-t border-hairline pt-md">
        {isProportion && (
          <div className="flex flex-wrap items-center gap-md pb-sm">
            <span className="text-label-md text-on-surface">Out of</span>
            {(
              [
                ["rows", "Rows of this data source"],
                ["faculty", "Faculty headcount"],
              ] as [DenominatorSource, string][]
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-xs text-body-sm">
                <input
                  type="radio"
                  name={`denom-${mapping.key}`}
                  checked={mapping.denominatorSource === value}
                  onChange={() => onChange({ denominatorSource: value })}
                />
                {label}
              </label>
            ))}
          </div>
        )}

        <ConditionList
          heading={
            byFaculty ? "Count rows where…" : isProportion ? "Out of rows where…" : undefined
          }
          emptyText={
            byFaculty
              ? "No conditions — every row of this data source counts toward the top."
              : isProportion
                ? "No conditions — every row of this data source is the denominator."
                : "No conditions — every row of this data source counts."
          }
          filters={mapping.filters}
          columns={columns}
          labels={labels}
          onChange={(filters) => onChange({ filters })}
        />

        {isProportion && !byFaculty && (
          <div className="mt-sm flex flex-col gap-sm border-t border-hairline pt-md">
            <div className="max-w-xs">
              <Field
                label="Numerator column"
                hint={
                  !mapping.columnKey
                    ? "Pick a column above first — a column total has no row count to divide by."
                    : "For fractions whose top and bottom are two different columns."
                }
              >
                <Select
                  value={mapping.numeratorColumnKey}
                  disabled={!mapping.columnKey}
                  onChange={(e) => onChange({ numeratorColumnKey: e.target.value })}
                >
                  <option value="">Same column as the denominator</option>
                  {numberColumns
                    .filter((c) => c.colKey !== mapping.columnKey)
                    .map((c) => (
                      <option key={c.id} value={c.colKey}>
                        {c.label}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>

            <ConditionList
              heading={
                twoColumn
                  ? `Of those, total ${numeratorColumn!.label} where…`
                  : "Of those, count rows where…"
              }
              emptyText={
                twoColumn
                  ? "No conditions — the whole population above is totalled on both columns."
                  : "Add at least one — without it the answer is always 100%."
              }
              filters={mapping.numeratorFilters}
              columns={columns}
              labels={labels}
              onChange={(numeratorFilters) => onChange({ numeratorFilters })}
            />
          </div>
        )}

        {byFaculty && (
          <div className="mt-sm flex flex-col gap-xs border-t border-hairline pt-md">
            <span className="text-label-md text-on-surface">Divide by active faculty</span>
            <div className="flex flex-wrap gap-md">
              {RANKS.map((rank) => (
                <label key={rank} className="flex items-center gap-xs text-body-sm">
                  <input
                    type="checkbox"
                    checked={mapping.facultyRanks.includes(rank)}
                    onChange={(e) =>
                      onChange({
                        // Keep RANKS order rather than click order, so the
                        // stored list and the description read consistently.
                        facultyRanks: RANKS.filter((r) =>
                          r === rank ? e.target.checked : mapping.facultyRanks.includes(r),
                        ),
                      })
                    }
                  />
                  {rank}
                </label>
              ))}
            </div>
            <p className="text-caption-sm text-mute">
              {mapping.facultyRanks.length === 0
                ? "Pick at least one rank — there is nothing to divide by."
                : `${headcount} active ${headcount === 1 ? "person" : "people"}. Uses the current roster, so earlier quarters are divided by today's headcount.`}
            </p>
          </div>
        )}

        {preview && (
          <div className="flex justify-end">
            <span className="text-caption-sm text-mute">
              <Badge tone={preview.matched > 0 ? "success" : "warning"}>
                {byFaculty
                  ? `${preview.matched} rows ÷ ${headcount} faculty`
                  : // Row counts would mislead in two-column mode — the fraction
                    // is two column totals, often over the very same rows.
                    twoColumn &&
                      preview.parts.numerator != null &&
                      preview.parts.denominator != null
                    ? `${formatNumber(preview.parts.numerator, 2)} of ${formatNumber(preview.parts.denominator, 2)}`
                    : isProportion
                      ? `${preview.numerator} of ${preview.matched} rows`
                      : `${preview.matched} of ${preview.total} rows`}
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
          </div>
        )}
      </div>
    </div>
  );
}

/** Everything both link modals show below their picker: the mapping, the button
 *  that adds it, and the note. The two modals choose opposite things — a KPI for
 *  a source, or a source for a KPI — but what they build out of that choice is
 *  identical, so it lives here rather than being kept in step by hand. A link
 *  carries one mapping whichever way it was made, and whatever it targets. */
export function LinkMappingSection({
  mappings,
  onChange,
  columns,
  entries,
  labels,
  faculty,
  targetUnit,
  note,
  onNote,
  placeholder,
}: {
  mappings: DraftMapping[];
  onChange: (mappings: DraftMapping[]) => void;
  columns: DataSourceColumn[];
  entries: {
    id: number;
    year: number;
    quarter: number | null;
    values: Record<string, unknown>;
  }[];
  labels: Record<string, string>;
  faculty: FacultyRecord[];
  /** Drives the tip pointing a percent/ratio target at the aggregation that
   *  divides. Null when the target has no unit. */
  targetUnit: string | null;
  note: string;
  onNote: (note: string) => void;
  /** Shown in place of the mapping controls when there is nothing to map yet —
   *  the reverse modal has no data source until one is picked, and the
   *  "no columns" copy below would misdescribe that. */
  placeholder?: string;
}) {
  const addMapping = () => onChange([...mappings, newMapping()]);

  return (
    <>
      <div className="border-t border-hairline pt-md">
        <div className="mb-sm flex items-center justify-between">
          <div>
            <h3 className="text-label-md text-on-surface">Which rows count</h3>
            <p className="text-caption-sm text-mute">
              Matching rows are aggregated into the quarterly value, cumulatively
              within each year.
            </p>
          </div>
          {!placeholder && mappings.length === 0 && (
            <Button size="sm" variant="ghost" icon="add" onClick={addMapping}>
              Add mapping
            </Button>
          )}
        </div>

        {placeholder ? (
          <p className="text-body-sm text-mute">{placeholder}</p>
        ) : columns.length === 0 ? (
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
                faculty={faculty}
                onChange={(patch) =>
                  onChange(mappings.map((x) => (x.key === m.key ? { ...x, ...patch } : x)))
                }
                onRemove={() => onChange(mappings.filter((x) => x.key !== m.key))}
              />
            ))}
          </div>
        )}

        {/* The dividend and divisor live inside one aggregation, so a percent
            target needs the kind that divides rather than a second mapping. */}
        {!placeholder && unitNeedsDivisor(targetUnit) && mappings.length > 0 && (
          <p className="mt-sm flex items-center gap-xs text-caption-sm text-mute">
            <Badge tone="neutral">tip</Badge>A {targetUnit} target is fed by{" "}
            {targetUnit?.trim().toLowerCase() === "ratio" ? "Ratio of" : "Percent of"} —
            it records the dividend and divisor behind the number.
          </p>
        )}
      </div>

      <Field label="Note" hint="Optional — how this data supports the KPI.">
        <Input value={note} onChange={(e) => onNote(e.target.value)} />
      </Field>
    </>
  );
}

/** One list of conditions plus its "Add condition" button. Rendered twice for
 *  the proportion kinds — once for the population, once for the numerator. */
function ConditionList({
  heading,
  emptyText,
  filters,
  columns,
  labels,
  onChange,
}: {
  heading?: string;
  emptyText: string;
  filters: DraftFilter[];
  columns: DataSourceColumn[];
  labels: Record<string, string>;
  onChange: (filters: DraftFilter[]) => void;
}) {
  return (
    <div className="flex flex-col gap-sm">
      {heading && <span className="text-label-md text-on-surface">{heading}</span>}

      {filters.length === 0 ? (
        <p className="text-caption-sm text-mute">{emptyText}</p>
      ) : (
        filters.map((f) => (
          <FilterRow
            key={f.key}
            filter={f}
            columns={columns}
            labels={labels}
            onChange={(patch) =>
              onChange(filters.map((x) => (x.key === f.key ? { ...x, ...patch } : x)))
            }
            onRemove={() => onChange(filters.filter((x) => x.key !== f.key))}
          />
        ))
      )}

      <div>
        <Button
          size="sm"
          variant="ghost"
          icon="add"
          onClick={() => onChange([...filters, newFilter()])}
        >
          Add condition
        </Button>
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
    <div className="flex flex-wrap items-start gap-sm">
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
              onChange({ field, operator: next, value: "", valueTo: "", values: [] });
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
              // Operands don't carry across operator shapes — clear them all.
              onChange({
                operator: e.target.value as FilterOperator,
                value: "",
                valueTo: "",
                values: [],
              })
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
      ) : isMultiValueOperator(filter.operator) ? (
        <div className="min-w-[14rem] flex-[2]">
          <MultiValueInput
            column={column}
            labels={labels}
            values={filter.values}
            onChange={(values) => onChange({ values })}
          />
        </div>
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
        // mt-xl skips past the Field-label row above, so this lines up with
        // the input row now that the group is top- rather than bottom-aligned.
        className="mt-xl grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
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

/** The pickable values of a choice-like column, as {value, label} pairs. Faculty
 *  and program render a friendly label but store a code, exactly as EntryModal
 *  does. Returns null for types that aren't a fixed list. */
function choiceOptions(
  column: DataSourceColumn | undefined,
  labels: Record<string, string>,
  catalog: AcademicCatalog,
): { value: string; label: string }[] | null {
  if (!column) return null;
  switch (column.dataType) {
    case "select":
      return (column.options ?? []).map((o) => ({ value: o, label: o }));
    case "program":
      return catalog.programs.map((p) => ({ value: p.code, label: catalogOptionLabel(p) }));
    case "curriculum":
      return catalog.curricula.map((c) => ({ value: c.code, label: catalogOptionLabel(c) }));
    case "faculty":
      return Object.entries(labels)
        .filter(([k]) => k.startsWith("fac-"))
        .sort((a, b) => a[1].localeCompare(b[1], "th"))
        .map(([id, name]) => ({ value: id, label: name }));
    default:
      return null;
  }
}

/** "is any of" picker: the dropdown adds a value, each pick becomes a removable
 *  chip. Chosen values are hidden from the dropdown so it can't add duplicates,
 *  and it stays usable for the 65-strong faculty list where a checkbox grid
 *  would not. */
function MultiValueInput({
  column,
  labels,
  values,
  onChange,
}: {
  column?: DataSourceColumn;
  labels: Record<string, string>;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const catalog = useAcademicCatalog().data ?? EMPTY_ACADEMIC_CATALOG;
  const options = choiceOptions(column, labels, catalog) ?? [];
  const remaining = options.filter((o) => !values.includes(o.value));
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <Field
      label="Values"
      hint={values.length === 0 ? "Pick one or more — a row matches any of them." : undefined}
    >
      <div className="flex flex-col gap-xs">
        <Select
          value=""
          disabled={!column || remaining.length === 0}
          onChange={(e) => {
            if (e.target.value) onChange([...values, e.target.value]);
          }}
        >
          <option value="">
            {!column
              ? "Pick a field first"
              : remaining.length === 0
                ? "All values added"
                : "Add a value…"}
          </option>
          {remaining.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {values.length > 0 && (
          <div className="flex flex-wrap gap-xs">
            {values.map((v) => (
              <span key={v} className="inline-flex items-center gap-xxs">
                <Badge tone="neutral">
                  <span className="inline-flex items-center gap-xxs">
                    {labelFor(v)}
                    <button
                      type="button"
                      aria-label={`Remove ${labelFor(v)}`}
                      title={`Remove ${labelFor(v)}`}
                      onClick={() => onChange(values.filter((x) => x !== v))}
                      className="text-mute hover:text-error"
                    >
                      <Icon name="close" className="text-[14px]" />
                    </button>
                  </span>
                </Badge>
              </span>
            ))}
          </div>
        )}
      </div>
    </Field>
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
  const catalog = useAcademicCatalog().data ?? EMPTY_ACADEMIC_CATALOG;
  if (!column) {
    return <Input value={value} disabled placeholder="Pick a field first" onChange={() => {}} />;
  }

  // Choice-like types share their option list with the "is any of" picker.
  const choices = choiceOptions(column, labels, catalog);
  if (choices) {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {choices.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {/* A filter written before this field became a dropdown can hold a value
            the catalog doesn't know. Keep it visible, or the Select would render
            blank and quietly rewrite the filter on the next save. */}
        {value && !choices.some((o) => o.value === value) && (
          <option value={value}>{value} — not in the catalog</option>
        )}
      </Select>
    );
  }

  switch (column.dataType) {
    case "boolean":
      return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
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
