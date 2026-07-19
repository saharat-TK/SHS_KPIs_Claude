// The school's five academic programs. Shared by the library's "Batch: 5 Programs"
// sub-KPI generator and by the `program` data-source column type.
//
// NOTE: these abbreviations are NOT the same vocabulary as `faculty.program`
// (ENUM 'BioMed','EnvH','OHS','PH','Sport Science','SHS Office'). SHS ≠ Sport Science,
// BM ≠ BioMed, and SHS Office is an office rather than a program. The two lists have
// always disagreed; this module deliberately does not reconcile them, so do not compare
// a `program` cell against a person's home program without an explicit mapping.

export interface ProgramOption {
  /** Short code — what a `program` cell stores, and the sub-KPI name prefix. */
  abbr: string;
  /** Thai สาขาวิชา name, shown to the user. */
  label: string;
}

export const PROGRAMS: ProgramOption[] = [
  { abbr: "PH", label: "สาขาวิชาสาธารณสุขศาสตร์" },
  { abbr: "SHS", label: "สาขาวิชาวิทยาศาสตร์การกีฬาและสุขภาพ" },
  { abbr: "OHS", label: "สาขาวิชาอาชีวอนามัยและความปลอดภัย" },
  { abbr: "EnvH", label: "สาขาวิชาอนามัยสิ่งแวดล้อม" },
  { abbr: "BM", label: "สาขาวิชาเทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ" },
];

/** Allowed stored values for a `program` column. */
export const PROGRAM_CODES: string[] = PROGRAMS.map((p) => p.abbr);

/** abbr → Thai label, for rendering a stored code. */
export const PROGRAM_LABELS: Record<string, string> = Object.fromEntries(
  PROGRAMS.map((p) => [p.abbr, p.label]),
);

/** The label map to hand to formatCellValue: program codes plus faculty ids.
 *  Keeping it in one place stops the table and the CSV export from drifting. */
export function buildCellLabels(
  faculty: { id: string; name: string }[],
): Record<string, string> {
  return {
    ...PROGRAM_LABELS,
    ...Object.fromEntries(faculty.map((f) => [f.id, f.name])),
  };
}
