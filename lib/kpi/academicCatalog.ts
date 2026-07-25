import type { AcademicCatalog } from "@/lib/types";

/** Resolve stored program/curriculum codes to the same Thai labels everywhere
 *  they appear: data tables, CSV export, and linked-KPI filter descriptions. */
export function buildCellLabels(
  faculty: { id: string; name: string }[],
  catalog: AcademicCatalog,
): Record<string, string> {
  return {
    ...Object.fromEntries(catalog.programs.map((program) => [program.code, program.label])),
    ...Object.fromEntries(catalog.curricula.map((curriculum) => [curriculum.code, curriculum.label])),
    ...Object.fromEntries(faculty.map((member) => [member.id, member.name])),
  };
}
