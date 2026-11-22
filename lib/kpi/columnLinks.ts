// Column links for data sources: "ref by" pairs, the multiple column, and the
// 1/n share auto-fill. Shared by the columns editor, the entry form and the
// entry write routes, so the three can never disagree about what is allowed.
//
// Pure, no runtime imports (type imports are erased), so tests load it directly.
import type {
  AcademicCatalog,
  ColumnAutoFill,
  DataSourceCellValue,
  DataSourceColumnType,
} from "@/lib/types";

/** What this module needs to know about a column — a saved column or a draft. */
export interface LinkColumn {
  colKey: string;
  label: string;
  dataType: DataSourceColumnType;
  isRequired: boolean;
  refColKey?: string | null;
  isMultiple?: boolean;
  autoFill?: ColumnAutoFill | null;
}

type Values = Record<string, DataSourceCellValue>;

/** Dependent type → the type it may be "ref by". The target always holds the
 *  program the dependent value belongs to. */
export const REF_TARGET_TYPE: Partial<Record<DataSourceColumnType, DataSourceColumnType>> = {
  faculty: "program",
  curriculum: "program",
};

/** Types a column may hold several values of in one entry. */
export const MULTIPLE_TYPES: DataSourceColumnType[] = [
  "text",
  "select",
  "faculty",
  "program",
  "curriculum",
];

export const canRefBy = (dependent: DataSourceColumnType, target: DataSourceColumnType) =>
  REF_TARGET_TYPE[dependent] === target;

/** faculty.program → academic_program catalog code. SHS Office has none.
 *  (Same mapping as the publications import's lib/kpi/publicationPeriod.ts.) */
export function programCode(facultyProgram: string | null | undefined): string | null {
  switch (facultyProgram) {
    case "BioMed":
      return "BM";
    case "Sport Science":
      return "SHS";
    case "EnvH":
    case "OHS":
    case "PH":
      return facultyProgram;
    default:
      return null;
  }
}

/** Each of n rows gets 1/n. Six decimals keeps a split's sum within 1e-6 of 1. */
export function fractionFor(n: number): number {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`Row count must be a positive integer: ${n}`);
  }
  return Math.round((1 / n) * 1e6) / 1e6;
}

const isBlank = (v: DataSourceCellValue | undefined) =>
  v === null || v === undefined || v === "";

/** Every problem with a column set's link settings. Empty means it can be saved. */
export function validateColumnConfig(columns: LinkColumn[]): string[] {
  const problems: string[] = [];
  const byKey = new Map(columns.map((c) => [c.colKey, c]));
  const name = (c: LinkColumn) => `"${c.label.trim() || c.colKey}"`;

  const dependentsOf = new Map<string, LinkColumn[]>();
  for (const c of columns) {
    if (!c.refColKey) continue;
    const target = byKey.get(c.refColKey);
    if (!target) {
      problems.push(`${name(c)} is ref by a column that no longer exists`);
      continue;
    }
    if (target.colKey === c.colKey) {
      problems.push(`${name(c)} cannot be ref by itself`);
      continue;
    }
    if (!canRefBy(c.dataType, target.dataType)) {
      const want = REF_TARGET_TYPE[c.dataType];
      problems.push(
        want
          ? `${name(c)} can only be ref by a Programs column, not ${name(target)}`
          : `${name(c)} cannot be ref by another column (only Faculties and Curriculums columns can)`,
      );
      continue;
    }
    if (target.isMultiple) {
      problems.push(
        `${name(target)} follows each value of ${name(c)}, so it cannot be multiple itself`,
      );
    }
    dependentsOf.set(target.colKey, [...(dependentsOf.get(target.colKey) ?? []), c]);
  }
  for (const [targetKey, deps] of dependentsOf) {
    if (deps.length > 1) {
      problems.push(
        `${name(byKey.get(targetKey)!)} is ref by ${deps.map(name).join(" and ")}; only one column can be ref by it`,
      );
    }
  }

  const multiples = columns.filter((c) => c.isMultiple);
  if (multiples.length > 1) {
    problems.push(
      `Only one column can take multiple values (${multiples.map(name).join(", ")} are set)`,
    );
  }
  for (const c of multiples) {
    if (!MULTIPLE_TYPES.includes(c.dataType)) {
      problems.push(`${name(c)} is a ${c.dataType} column, which cannot take multiple values`);
    }
  }

  for (const c of columns) {
    if (c.autoFill !== "share") continue;
    if (c.dataType !== "number") {
      problems.push(`${name(c)} can only be filled with a share if it is a number column`);
    } else if (multiples.length === 0) {
      problems.push(
        `${name(c)} is filled with a share of the multiple values, but no column takes multiple values`,
      );
    }
  }
  return problems;
}

/** The program lookups a ref pair needs, built from the roster and catalog. */
export interface RefLookups {
  /** faculty.id → catalog program code (null for SHS Office). */
  facultyProgram: Record<string, string | null>;
  /** curriculum code → catalog program code. */
  curriculumProgram: Record<string, string>;
}

export function buildRefLookups(
  faculty: { id: string; program: string | null }[],
  catalog: AcademicCatalog | null | undefined,
): RefLookups {
  return {
    facultyProgram: Object.fromEntries(faculty.map((f) => [f.id, programCode(f.program)])),
    curriculumProgram: Object.fromEntries(
      (catalog?.curricula ?? []).map((c) => [c.code, c.programCode]),
    ),
  };
}

/** The program a dependent value belongs to: a faculty member's program or a
 *  curriculum's. Undefined when the value is unknown to the lookups. */
export function refValueFor(
  dependent: Pick<LinkColumn, "dataType">,
  value: DataSourceCellValue,
  lookups: RefLookups,
): string | null | undefined {
  if (isBlank(value)) return undefined;
  const key = String(value);
  if (dependent.dataType === "faculty") {
    return key in lookups.facultyProgram ? lookups.facultyProgram[key] : undefined;
  }
  if (dependent.dataType === "curriculum") {
    return lookups.curriculumProgram[key];
  }
  return undefined;
}

/** Narrow a dependent column's choices to the selected program. No program
 *  selected leaves every choice available. */
export function filterChoicesByRef<T extends { code: string }>(
  dependent: Pick<LinkColumn, "dataType">,
  choices: T[],
  targetValue: DataSourceCellValue,
  lookups: RefLookups,
): T[] {
  if (isBlank(targetValue)) return choices;
  const want = String(targetValue);
  return choices.filter((c) => refValueFor(dependent, c.code, lookups) === want);
}

/** How the entry form lays a source out. `groups` go in the right-hand section:
 *  the multiple column (with its ref target and share columns) and every other
 *  ref pair. Everything else stays on the left. */
export interface EntryGroup {
  /** The column the user picks — the multiple column or the ref dependent. */
  main: LinkColumn;
  /** Its ref target, filled in from `main`. */
  target: LinkColumn | null;
  multiple: boolean;
}

export interface EntryLayout {
  left: LinkColumn[];
  groups: EntryGroup[];
  /** Number columns filled with 1/n; shown read-only with the multiple group. */
  shares: LinkColumn[];
}

export function entryLayout<C extends LinkColumn>(columns: C[]): EntryLayout & { left: C[] } {
  const byKey = new Map(columns.map((c) => [c.colKey, c]));
  const targetOf = (c: LinkColumn) => {
    const t = c.refColKey ? byKey.get(c.refColKey) : undefined;
    return t && canRefBy(c.dataType, t.dataType) ? t : null;
  };

  const groups: EntryGroup[] = [];
  const placed = new Set<string>();
  const multiple = columns.find((c) => c.isMultiple);
  if (multiple) {
    const target = targetOf(multiple);
    groups.push({ main: multiple, target, multiple: true });
    placed.add(multiple.colKey);
    if (target) placed.add(target.colKey);
  }
  for (const c of columns) {
    if (placed.has(c.colKey)) continue;
    const target = targetOf(c);
    if (!target || placed.has(target.colKey)) continue;
    groups.push({ main: c, target, multiple: false });
    placed.add(c.colKey);
    placed.add(target.colKey);
  }

  const shares = multiple ? columns.filter((c) => c.autoFill === "share") : [];
  for (const s of shares) placed.add(s.colKey);
  return { left: columns.filter((c) => !placed.has(c.colKey)), groups, shares };
}

/** One row of the right-hand section: the picked value and its ref'd program. */
export interface GroupItem {
  main: DataSourceCellValue;
  target: DataSourceCellValue;
}

/** Values repeated within the multiple group — the form blocks saving them. */
export function duplicateItems(items: GroupItem[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const it of items) {
    if (isBlank(it.main)) continue;
    const k = String(it.main);
    if (seen.has(k)) dupes.add(k);
    seen.add(k);
  }
  return [...dupes];
}

/** Turn one filled-in entry form into the rows it saves: one per item of the
 *  multiple group (or one row when there is none), each carrying the shared
 *  left-hand values, every single group's pick, and its share of 1/n.
 *
 *  `itemsByGroup` is keyed by the group's main col_key. Blank items are dropped. */
export function expandEntry(
  layout: EntryLayout,
  base: Values,
  itemsByGroup: Record<string, GroupItem[]>,
): Values[] {
  const shared: Values = { ...base };
  let multipleGroup: EntryGroup | null = null;
  for (const g of layout.groups) {
    if (g.multiple) {
      multipleGroup = g;
      continue;
    }
    const it = itemsByGroup[g.main.colKey]?.[0];
    shared[g.main.colKey] = it && !isBlank(it.main) ? it.main : null;
    if (g.target) shared[g.target.colKey] = it && !isBlank(it.target) ? it.target : null;
  }

  const items = multipleGroup
    ? (itemsByGroup[multipleGroup.main.colKey] ?? []).filter((it) => !isBlank(it.main))
    : [];
  const rows: Values[] = items.length
    ? items.map((it) => {
        const row: Values = { ...shared, [multipleGroup!.main.colKey]: it.main };
        if (multipleGroup!.target) {
          row[multipleGroup!.target.colKey] = isBlank(it.target) ? null : it.target;
        }
        return row;
      })
    : [
        multipleGroup
          ? {
              ...shared,
              [multipleGroup.main.colKey]: null,
              ...(multipleGroup.target ? { [multipleGroup.target.colKey]: null } : {}),
            }
          : shared,
      ];

  const share = fractionFor(rows.length);
  for (const row of rows) for (const s of layout.shares) row[s.colKey] = share;
  return rows;
}

/** Server-side guard: every ref dependent's value belongs to its target's
 *  program. Returns the problems, empty when the row is consistent. Unknown
 *  values are left to validateEntryValues, which already rejects them. */
export function checkRefConsistency(
  columns: LinkColumn[],
  values: Values,
  lookups: RefLookups,
): string[] {
  const byKey = new Map(columns.map((c) => [c.colKey, c]));
  const problems: string[] = [];
  for (const c of columns) {
    const target = c.refColKey ? byKey.get(c.refColKey) : undefined;
    if (!target || !canRefBy(c.dataType, target.dataType)) continue;
    const expected = refValueFor(c, values[c.colKey] ?? null, lookups);
    if (expected === undefined) continue;
    const actual = isBlank(values[target.colKey]) ? null : String(values[target.colKey]);
    if (expected === null && actual !== null) {
      problems.push(`"${c.label}" has no program in the catalog, so "${target.label}" must be blank`);
    } else if (expected !== null && actual !== expected) {
      problems.push(
        `"${c.label}" belongs to program ${expected}, but "${target.label}" is ${actual ?? "blank"}`,
      );
    }
  }
  return problems;
}
