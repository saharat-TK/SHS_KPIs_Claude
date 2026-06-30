import type {
  Department,
  FacultyMember,
  Formula,
  FormulaVersion,
  Kpi,
  Measurement,
  Metric,
  ValidationComment,
  ValidationStatus,
  ValidationSubmission,
} from "@/lib/types";
import { delay, getDB, uid } from "./store";

// ── The repository layer: the single seam between UI and data source. ────────
// Every function is async and returns plain data. Phase 2 reimplements the
// bodies against Firebase/Supabase/Postgres; hooks and components are untouched.

// Departments ----------------------------------------------------------------
export const departmentsRepo = {
  list: () => delay(getDB().departments),
  get: (id: string) =>
    delay(getDB().departments.find((d) => d.id === id) ?? null),
  create: async (input: Omit<Department, "id">) => {
    const dept: Department = { ...input, id: uid("dept") };
    getDB().departments.push(dept);
    return delay(dept);
  },
};

// Faculty --------------------------------------------------------------------
export const facultyRepo = {
  list: () => delay(getDB().faculty),
  create: async (input: Omit<FacultyMember, "id">) => {
    const member: FacultyMember = { ...input, id: uid("fac") };
    getDB().faculty.push(member);
    return delay(member);
  },
  remove: async (id: string) => {
    const db = getDB();
    db.faculty = db.faculty.filter((f) => f.id !== id);
    return delay({ id });
  },
};

// KPIs -----------------------------------------------------------------------
export const kpisRepo = {
  list: () => delay(getDB().kpis),
  get: (id: string) => delay(getDB().kpis.find((k) => k.id === id) ?? null),
  create: async (input: Omit<Kpi, "id">) => {
    const kpi: Kpi = { ...input, id: uid("kpi") };
    getDB().kpis.push(kpi);
    return delay(kpi);
  },
  update: async (id: string, patch: Partial<Kpi>) => {
    const db = getDB();
    const idx = db.kpis.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error("KPI not found");
    db.kpis[idx] = { ...db.kpis[idx], ...patch, id };
    return delay(db.kpis[idx]);
  },
  remove: async (id: string) => {
    const db = getDB();
    db.kpis = db.kpis.filter((k) => k.id !== id);
    return delay({ id });
  },
};

// Metrics --------------------------------------------------------------------
export const metricsRepo = {
  list: () => delay(getDB().metrics),
  listByKpi: (kpiId: string) =>
    delay(getDB().metrics.filter((m) => m.kpiId === kpiId)),
  create: async (input: Omit<Metric, "id">) => {
    const metric: Metric = { ...input, id: uid("metric") };
    getDB().metrics.push(metric);
    return delay(metric);
  },
  update: async (id: string, patch: Partial<Metric>) => {
    const db = getDB();
    const idx = db.metrics.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Metric not found");
    db.metrics[idx] = { ...db.metrics[idx], ...patch, id };
    return delay(db.metrics[idx]);
  },
  remove: async (id: string) => {
    const db = getDB();
    db.metrics = db.metrics.filter((m) => m.id !== id);
    return delay({ id });
  },
};

// Formulas -------------------------------------------------------------------
export const formulasRepo = {
  list: () => delay(getDB().formulas),
  get: (id: string) => delay(getDB().formulas.find((f) => f.id === id) ?? null),
  versions: (formulaId: string) =>
    delay(
      getDB()
        .formulaVersions.filter((v) => v.formulaId === formulaId)
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    ),
  allVersions: () =>
    delay(
      [...getDB().formulaVersions].sort((a, b) =>
        a.timestamp < b.timestamp ? 1 : -1,
      ),
    ),
  save: async (
    id: string,
    expression: string,
    author: string,
    changeNote: string,
  ) => {
    const db = getDB();
    const formula = db.formulas.find((f) => f.id === id);
    if (!formula) throw new Error("Formula not found");
    const nextVersion = bumpVersion(formula.currentVersion);
    formula.expression = expression;
    formula.currentVersion = nextVersion;
    const version: FormulaVersion = {
      id: uid("fv"),
      formulaId: id,
      version: nextVersion,
      expression,
      author,
      timestamp: new Date().toISOString(),
      changeNote,
    };
    db.formulaVersions.push(version);
    return delay({ formula, version });
  },
  revert: async (formulaId: string, versionId: string, author: string) => {
    const db = getDB();
    const formula = db.formulas.find((f) => f.id === formulaId);
    const target = db.formulaVersions.find((v) => v.id === versionId);
    if (!formula || !target) throw new Error("Not found");
    const nextVersion = bumpVersion(formula.currentVersion);
    formula.expression = target.expression;
    formula.currentVersion = nextVersion;
    db.formulaVersions.push({
      id: uid("fv"),
      formulaId,
      version: nextVersion,
      expression: target.expression,
      author,
      timestamp: new Date().toISOString(),
      changeNote: `Reverted to ${target.version}.`,
    });
    return delay(formula);
  },
};

function bumpVersion(v: string): string {
  const m = v.match(/v(\d+)\.(\d+)/);
  if (!m) return "v1.0";
  return `v${m[1]}.${Number(m[2]) + 1}`;
}

// Measurements ---------------------------------------------------------------
export const measurementsRepo = {
  list: () => delay(getDB().measurements),
  byTarget: (targetId: string) =>
    delay(getDB().measurements.filter((m) => m.targetId === targetId)),
};

// Validations ----------------------------------------------------------------
export const validationsRepo = {
  list: () => delay(getDB().validations),
  decide: async (
    id: string,
    status: ValidationStatus,
    reviewerId: string,
    comment?: ValidationComment,
  ) => {
    const db = getDB();
    const sub = db.validations.find((v) => v.id === id);
    if (!sub) throw new Error("Submission not found");
    sub.status = status;
    sub.reviewerId = reviewerId;
    if (comment) sub.comments.push(comment);
    return delay(sub);
  },
  submit: async (input: Omit<ValidationSubmission, "id" | "status" | "comments">) => {
    const sub: ValidationSubmission = {
      ...input,
      id: uid("val"),
      status: "pending",
      comments: [],
    };
    getDB().validations.push(sub);
    return delay(sub);
  },
};

export type {
  Department,
  FacultyMember,
  Formula,
  FormulaVersion,
  Kpi,
  Measurement,
  Metric,
  ValidationSubmission,
};
