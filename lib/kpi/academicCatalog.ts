// Client-safe helpers over the academic catalog. The catalog itself is loaded
// from the DB (see academicCatalogServer.ts / useAcademicCatalog) — nothing here
// hardcodes a program or curriculum, so the UI cannot drift from the tables.
import type { AcademicCatalog, Curriculum } from "@/lib/types";

/** Empty catalog, so callers can render before the query resolves. */
export const EMPTY_ACADEMIC_CATALOG: AcademicCatalog = { programs: [], curricula: [] };

/** Resolve stored program/curriculum codes and faculty ids to the labels shown
 *  everywhere they appear: data tables, CSV export, and link filter summaries.
 *  Keeping it in one place stops those three from drifting apart. */
export function buildCellLabels(
  faculty: { id: string; name: string }[],
  catalog: AcademicCatalog = EMPTY_ACADEMIC_CATALOG,
): Record<string, string> {
  return {
    ...Object.fromEntries(catalog.programs.map((p) => [p.code, p.label])),
    ...Object.fromEntries(catalog.curricula.map((c) => [c.code, c.label])),
    // Faculty last: ids are namespaced ("fac-001") so they cannot collide with
    // catalog codes, but the ordering makes the intent explicit.
    ...Object.fromEntries(faculty.map((f) => [f.id, f.name])),
  };
}

/** The curricula offered for a given program. An empty/absent program means the
 *  picker is unconstrained, so every curriculum is offered. */
export function curriculaForProgram(
  curricula: Curriculum[],
  programCode: string | null | undefined,
): Curriculum[] {
  if (!programCode) return curricula;
  return curricula.filter((c) => c.programCode === programCode);
}

/** How a catalog entry reads in a picker: the stored code plus its Thai name. */
export const catalogOptionLabel = (entry: { code: string; label: string }) =>
  `${entry.code} — ${entry.label}`;
