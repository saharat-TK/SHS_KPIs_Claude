"use client";

import { Input, Select } from "@/components/ui";
import { catalogOptionLabel, curriculaForProgram } from "@/lib/kpi/academicCatalog";
import type { AcademicCatalog, DataSourceColumn, FacultyRecord } from "@/lib/types";

/** Keeps a stored code that isn't in the current option list selectable, rather
 *  than letting the Select silently blank it. Covers values typed in before the
 *  field became a dropdown, and a curriculum hidden by the program cascade. */
function UnrecognisedOption({ value, known }: { value: string; known: string[] }) {
  if (!value || known.includes(value)) return null;
  return <option value={value}>{value} — not in the catalog</option>;
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
