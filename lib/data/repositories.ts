import type {
  Committee,
  CommitteeMembership,
  FacultyMember,
  FacultyRecord,
  Formula,
  FormulaVersion,
  Kpi,
  KpiCategoryRecord,
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

// Committees ----------------------------------------------------------------
export const committeesRepo = {
  list: () => delay(getDB().committees),
  get: (id: string) =>
    delay(getDB().committees.find((d) => d.id === id) ?? null),
  create: async (input: Omit<Committee, "id">) => {
    const committee: Committee = { ...input, id: uid("cmt") };
    getDB().committees.push(committee);
    return delay(committee);
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
  update: async (id: string, patch: Partial<FacultyMember>) => {
    const db = getDB();
    const idx = db.faculty.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("Faculty member not found");
    db.faculty[idx] = { ...db.faculty[idx], ...patch, id };
    return delay(db.faculty[idx]);
  },
  remove: async (id: string) => {
    const db = getDB();
    db.faculty = db.faculty.filter((f) => f.id !== id);
    return delay({ id });
  },
};

// Faculty records — real MySQL-backed (shs_kpis_claude.faculty), used only by
// the Faculty Management page (app/(app)/faculty/management/page.tsx).
// Parallel to, not a replacement for, facultyRepo above — the mock-data pages
// (export, and the committee-entity CRUD on the committee page) keep using
// facultyRepo/committeesRepo untouched.
export const facultyRecordsRepo = {
  list: async (): Promise<FacultyRecord[]> => {
    const res = await fetch("/api/faculty");
    if (!res.ok) throw new Error("Failed to load faculty");
    return res.json();
  },
  create: async (input: Omit<FacultyRecord, "id">): Promise<FacultyRecord> => {
    const res = await fetch("/api/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create faculty member");
    return res.json();
  },
  update: async (
    id: string,
    patch: Partial<FacultyRecord>,
  ): Promise<FacultyRecord> => {
    const res = await fetch(`/api/faculty/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update faculty member");
    return res.json();
  },
  remove: async (id: string): Promise<{ id: string }> => {
    const res = await fetch(`/api/faculty/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to remove faculty member");
    return res.json();
  },
};

// Committee memberships — real MySQL-backed (shs_kpis_claude.committee_memberships),
// joined with faculty/committees for display. Used by the read-only Faculty
// Roster page (app/(app)/faculty/page.tsx) and the assign/edit UI on the
// Committees page (app/(app)/committee/page.tsx).
export const committeeMembershipsRepo = {
  list: async (): Promise<CommitteeMembership[]> => {
    const res = await fetch("/api/committee-memberships");
    if (!res.ok) throw new Error("Failed to load committee memberships");
    return res.json();
  },
  create: async (input: {
    facultyId: string;
    committeeId: string;
    position: CommitteeMembership["position"];
    kpiFocus: string;
  }): Promise<CommitteeMembership> => {
    const res = await fetch("/api/committee-memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create membership");
    return res.json();
  },
  update: async (
    facultyId: string,
    committeeId: string,
    patch: { position?: CommitteeMembership["position"]; kpiFocus?: string },
  ): Promise<CommitteeMembership> => {
    const res = await fetch(`/api/committee-memberships/${facultyId}/${committeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update membership");
    return res.json();
  },
  remove: async (
    facultyId: string,
    committeeId: string,
  ): Promise<{ facultyId: string; committeeId: string }> => {
    const res = await fetch(`/api/committee-memberships/${facultyId}/${committeeId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove membership");
    return res.json();
  },
};

// KPI categories — real MySQL-backed (shs_kpis_claude.kpi_categories), user-
// managed via the "Manage Categories" modal on the KPI Management page.
// Fetch-based like facultyRecordsRepo. Note: deletion of an in-use category is
// blocked in the UI against the in-memory KPIs, since KPIs aren't in MySQL yet.
export const kpiCategoriesRepo = {
  list: async (): Promise<KpiCategoryRecord[]> => {
    const res = await fetch("/api/kpi-categories");
    if (!res.ok) throw new Error("Failed to load categories");
    return res.json();
  },
  create: async (input: {
    label: string;
    description?: string;
    sortOrder?: number;
  }): Promise<KpiCategoryRecord> => {
    const res = await fetch("/api/kpi-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.label, description: input.description, sortOrder: input.sortOrder }),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
  },
  update: async (
    id: string,
    patch: { label?: string; description?: string; sortOrder?: number },
  ): Promise<KpiCategoryRecord> => {
    const res = await fetch(`/api/kpi-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
  },
  remove: async (id: string): Promise<{ id: string }> => {
    const res = await fetch(`/api/kpi-categories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to remove category");
    return res.json();
  },
  reorder: async (order: string[]): Promise<KpiCategoryRecord[]> => {
    const res = await fetch("/api/kpi-categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (!res.ok) throw new Error("Failed to reorder categories");
    return res.json();
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
  Committee,
  FacultyMember,
  Formula,
  FormulaVersion,
  Kpi,
  KpiCategoryRecord,
  Measurement,
  Metric,
  ValidationSubmission,
};
