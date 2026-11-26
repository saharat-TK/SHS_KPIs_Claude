"use client";

import { Input, Select } from "@/components/ui";
import { catalogOptionLabel, curriculaForProgram } from "@/lib/kpi/academicCatalog";
import { useT } from "@/lib/i18n/useT";
import { FORMAT_EXAMPLE, MONTHS, monthLabel } from "@/lib/kpi/cellFormats";
import type { AcademicCatalog, DataSourceColumn, FacultyRecord } from "@/lib/types";
import { DateInput } from "./DateInput";

/** Keeps a stored code that isn't in the current option list selectable, rather
 *  than letting the Select silently blank it. Covers values typed in before the
 *  field became a dropdown, and a curriculum hidden by the program cascade. */
function UnrecognisedOption({ value, known }: { value: string; known: string[] }) {
  const t = useT();
  if (!value || known.includes(value)) return null;
  return <option value={value}>{t("dataSources.cell.notInCatalog", { value })}</option>;
}

/** The control for one data-source cell, picked from the column's type.
 *
 *  Shared by the single-entry form and the batch grid so the two cannot offer
 *  different choices for the same column — a batch row has to be exactly the
 *  row the form would have produced. */
export function CellInput({
  column,
  value,
  onChange,
  faculty,
  catalog,
  selectedProgramCode,
  allowedOptions,
  disabled,
}: {
  column: DataSourceColumn;
  value: string;
  onChange: (value: string) => void;
  faculty: FacultyRecord[];
  catalog: AcademicCatalog;
  /** Set when this source also has a program column, to narrow curricula. */
  selectedProgramCode: string | null;
  /** Narrows a choice column to these codes — a "ref by" filter, or the
   *  values already picked in other rows of a multiple entry. */
  allowedOptions?: string[] | null;
  disabled?: boolean;
}) {
  const t = useT();
  const allow = <T,>(items: T[], code: (t: T) => string) =>
    allowedOptions ? items.filter((t) => allowedOptions.includes(code(t))) : items;

  switch (column.dataType) {
    case "select":
      return (
        <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {allow(column.options ?? [], (o) => o).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {value && allowedOptions && !allowedOptions.includes(value) && (
            <option value={value}>{value}</option>
          )}
        </Select>
      );
    case "faculty": {
      const shown = allow(faculty, (f) => f.id);
      const current = value && !shown.some((f) => f.id === value)
        ? faculty.find((f) => f.id === value)
        : undefined;
      return (
        <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {shown.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.program}
            </option>
          ))}
          {/* Keep a stored person visible even when a filter hides them or they
              have since left the roster, rather than silently blanking it. */}
          {value && !shown.some((f) => f.id === value) && (
            <option value={value}>
              {current
                ? `${current.name} — ${current.program}`
                : t("dataSources.cell.notOnRoster", { value })}
            </option>
          )}
        </Select>
      );
    }
    case "program":
      return (
        <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {allow(catalog.programs, (p) => p.code).map((p) => (
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
      const offered = allowedOptions
        ? allow(catalog.curricula, (c) => c.code)
        : curriculaForProgram(catalog.curricula, selectedProgramCode);
      return (
        <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
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
          <option value="true">{t("dataSources.cell.yes")}</option>
          <option value="false">{t("dataSources.cell.no")}</option>
        </Select>
      );
    case "date":
      // Typed in the Buddhist era, DD/MM/YYYY, or picked from a BE calendar. A
      // native date picker can't show BE (it follows the browser locale), so the
      // calendar is ours; the value is checked as it is typed and stored as CE.
      return (
        <DateInput
          value={value}
          disabled={disabled}
          title={FORMAT_EXAMPLE.date}
          onChange={onChange}
        />
      );
    case "year_be":
      return (
        <Input
          value={value}
          disabled={disabled}
          inputMode="numeric"
          maxLength={4}
          placeholder={FORMAT_EXAMPLE.year_be}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "month":
      return (
        <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={String(m.value)}>
              {monthLabel(m.value)}
            </option>
          ))}
          <UnrecognisedOption value={value} known={MONTHS.map((m) => String(m.value))} />
        </Select>
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
