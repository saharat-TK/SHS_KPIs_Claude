import type {
  Committee,
  CommitteeMembership,
  FacultyMember,
  FacultyRecord,
  Formula,
  FormulaVersion,
  FormulaRecord,
  FormulaVersionRecord,
  AnnualTarget,
  ApprovalAction,
  ApprovalEvent,
  Kpi,
  KpiCategoryRecord,
  LibraryKpi,
  LibraryMetric,
  Measurement,
  Metric,
  PerfKpiApproval,
  PerformanceRecord,
  PerformancePeriod,
  PerformanceStatus,
  PerfKpi,
  PerfMetric,
  QuarterProgress,
  StrategicSet,
  StrategicSetStatus,
  UnitRecord,
  ValidationComment,
  ValidationStatus,
  ValidationSubmission,
} from "@/lib/types";
import { delay, getDB, uid } from "./store";

// Shared helper for the DB-backed KPI-management repos: throw the API's error
// message (so mutation error toasts are meaningful) instead of a generic string.
async function jsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || fallback);
  }
  return res.json();
}

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

// Units — real MySQL-backed (shs_kpis_claude.units), admin-managed reference
// list of measurement units. Uses jsonOrThrow so the API's error text (e.g. the
// duplicate-name 409) surfaces in the error toast.
export const unitsRepo = {
  list: async (): Promise<UnitRecord[]> =>
    jsonOrThrow(await fetch("/api/units"), "Failed to load units"),
  create: async (input: {
    unitNameTh: string;
    unitNameEn: string;
    description?: string;
  }): Promise<UnitRecord> =>
    jsonOrThrow(
      await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to create unit",
    ),
  update: async (
    id: number,
    patch: { unitNameTh?: string; unitNameEn?: string; description?: string },
  ): Promise<UnitRecord> =>
    jsonOrThrow(
      await fetch(`/api/units/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      "Failed to update unit",
    ),
  remove: async (id: number): Promise<{ id: number }> =>
    jsonOrThrow(await fetch(`/api/units/${id}`, { method: "DELETE" }), "Failed to remove unit"),
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

// Formulas — real MySQL-backed (shs_kpis_claude.formula / formula_variable /
// formula_version). Used by the migrated Formula Builder + Version History and
// by the library KPI calculation-logic picker. Numeric BIGINT ids.
export const formulasRepo = {
  list: async (): Promise<FormulaRecord[]> =>
    jsonOrThrow(await fetch("/api/formulas"), "Failed to load formulas"),
  get: async (id: number): Promise<FormulaRecord> =>
    jsonOrThrow(await fetch(`/api/formulas/${id}`), "Failed to load formula"),
  allVersions: async (): Promise<FormulaVersionRecord[]> =>
    jsonOrThrow(await fetch("/api/formulas/versions"), "Failed to load versions"),
  create: async (input: {
    name: string;
    expression: string;
    variables?: { symbol: string; label: string; source?: string }[];
    author?: string;
    changeNote?: string;
  }): Promise<FormulaRecord> =>
    jsonOrThrow(
      await fetch("/api/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to create formula",
    ),
  save: async (
    id: number,
    expression: string,
    author: string,
    changeNote: string,
  ): Promise<FormulaRecord> =>
    jsonOrThrow(
      await fetch(`/api/formulas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression, author, changeNote }),
      }),
      "Failed to save formula",
    ),
  revert: async (
    formulaId: number,
    versionId: number,
    author: string,
  ): Promise<FormulaRecord> =>
    jsonOrThrow(
      await fetch(`/api/formulas/${formulaId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, author }),
      }),
      "Failed to revert formula",
    ),
};

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

// ── KPI Management — Strategic Sets (DB-backed) ─────────────────────────────
// Real MySQL-backed (shs_kpis_claude.strategic_set + library_*). The versioned
// 5-Year Strategic Set templates edited from the admin-only KPIs Library.
export const strategicSetsRepo = {
  list: async (): Promise<StrategicSet[]> =>
    jsonOrThrow(await fetch("/api/strategic-sets"), "Failed to load strategic sets"),
  get: async (id: number): Promise<StrategicSet> =>
    jsonOrThrow(await fetch(`/api/strategic-sets/${id}`), "Failed to load strategic set"),
  create: async (input: {
    name: string;
    description?: string;
    startYear: number;
    cloneFromSetId?: number;
    createdBy?: string;
  }): Promise<StrategicSet> =>
    jsonOrThrow(
      await fetch("/api/strategic-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to create strategic set",
    ),
  update: async (
    id: number,
    patch: { name?: string; description?: string; status?: StrategicSetStatus },
  ): Promise<StrategicSet> =>
    jsonOrThrow(
      await fetch(`/api/strategic-sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      "Failed to update strategic set",
    ),
  remove: async (id: number): Promise<{ id: number }> =>
    jsonOrThrow(
      await fetch(`/api/strategic-sets/${id}`, { method: "DELETE" }),
      "Failed to delete strategic set",
    ),
};

// ── KPI Management — Library KPIs (DB-backed) ───────────────────────────────
export const libraryKpisRepo = {
  listBySet: async (setId: number): Promise<LibraryKpi[]> =>
    jsonOrThrow(await fetch(`/api/library-kpis?setId=${setId}`), "Failed to load KPIs"),
  get: async (id: number): Promise<LibraryKpi> =>
    jsonOrThrow(await fetch(`/api/library-kpis/${id}`), "Failed to load KPI"),
  create: async (input: Partial<LibraryKpi> & { setId: number; name: string }): Promise<LibraryKpi> =>
    jsonOrThrow(
      await fetch("/api/library-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to create KPI",
    ),
  update: async (id: number, patch: Partial<LibraryKpi>): Promise<LibraryKpi> =>
    jsonOrThrow(
      await fetch(`/api/library-kpis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      "Failed to update KPI",
    ),
  remove: async (id: number): Promise<{ id: number }> =>
    jsonOrThrow(await fetch(`/api/library-kpis/${id}`, { method: "DELETE" }), "Failed to delete KPI"),
  saveTargets: async (id: number, targets: AnnualTarget[]): Promise<AnnualTarget[]> =>
    jsonOrThrow(
      await fetch(`/api/library-kpis/${id}/targets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets }),
      }),
      "Failed to save targets",
    ),
};

// ── KPI Management — Library Metrics (sub-KPIs, DB-backed) ───────────────────
export const libraryMetricsRepo = {
  listByKpi: async (kpiId: number): Promise<LibraryMetric[]> =>
    jsonOrThrow(await fetch(`/api/library-metrics?kpiId=${kpiId}`), "Failed to load metrics"),
  get: async (id: number): Promise<LibraryMetric> =>
    jsonOrThrow(await fetch(`/api/library-metrics/${id}`), "Failed to load metric"),
  create: async (input: Partial<LibraryMetric> & { kpiId: number; name: string }): Promise<LibraryMetric> =>
    jsonOrThrow(
      await fetch("/api/library-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to create metric",
    ),
  update: async (id: number, patch: Partial<LibraryMetric>): Promise<LibraryMetric> =>
    jsonOrThrow(
      await fetch(`/api/library-metrics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      "Failed to update metric",
    ),
  remove: async (id: number): Promise<{ id: number }> =>
    jsonOrThrow(await fetch(`/api/library-metrics/${id}`, { method: "DELETE" }), "Failed to delete metric"),
  saveTargets: async (id: number, targets: AnnualTarget[]): Promise<AnnualTarget[]> =>
    jsonOrThrow(
      await fetch(`/api/library-metrics/${id}/targets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets }),
      }),
      "Failed to save targets",
    ),
};

// ── KPI Management — Performance records (activated snapshots, DB-backed) ─────
export const performanceRecordsRepo = {
  list: async (): Promise<PerformanceRecord[]> =>
    jsonOrThrow(await fetch("/api/performance-records"), "Failed to load performance records"),
  get: async (id: number): Promise<PerformanceRecord> =>
    jsonOrThrow(await fetch(`/api/performance-records/${id}`), "Failed to load performance record"),
  activate: async (input: {
    sourceSetId: number;
    name?: string;
    activatedBy?: string;
  }): Promise<PerformanceRecord> =>
    jsonOrThrow(
      await fetch("/api/performance-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to activate performance record",
    ),
  update: async (
    id: number,
    patch: { name?: string; status?: PerformanceStatus },
  ): Promise<PerformanceRecord> =>
    jsonOrThrow(
      await fetch(`/api/performance-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
      "Failed to update performance record",
    ),
  remove: async (id: number): Promise<{ id: number }> =>
    jsonOrThrow(
      await fetch(`/api/performance-records/${id}`, { method: "DELETE" }),
      "Failed to delete performance record",
    ),
  sync: async (id: number): Promise<PerformanceRecord> =>
    jsonOrThrow(
      await fetch(`/api/performance-records/${id}/sync`, { method: "POST" }),
      "Failed to sync performance record",
    ),
  periods: async (id: number): Promise<PerformancePeriod[]> =>
    jsonOrThrow(
      await fetch(`/api/performance-records/${id}/periods`),
      "Failed to load recording periods",
    ),
  savePeriods: async (
    id: number,
    periods: { yearNo: number; quarterNo: number; isOpen: boolean }[],
    updatedBy?: string,
  ): Promise<PerformancePeriod[]> =>
    jsonOrThrow(
      await fetch(`/api/performance-records/${id}/periods`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods, updatedBy }),
      }),
      "Failed to save recording periods",
    ),
  kpisByRecord: async (recordId: number): Promise<PerfKpi[]> =>
    jsonOrThrow(await fetch(`/api/perf-kpis?recordId=${recordId}`), "Failed to load performance KPIs"),
  getKpi: async (perfKpiId: number): Promise<PerfKpi> =>
    jsonOrThrow(await fetch(`/api/perf-kpis/${perfKpiId}`), "Failed to load performance KPI"),
  metricsByKpi: async (perfKpiId: number): Promise<PerfMetric[]> =>
    jsonOrThrow(await fetch(`/api/perf-metrics?perfKpiId=${perfKpiId}`), "Failed to load performance metrics"),
  saveKpiProgress: async (
    perfKpiId: number,
    input: {
      yearNo: number;
      quarterNo: number;
      progressValue: number | null;
      variable1Value?: number | null;
      variable2Value?: number | null;
      issue: string;
      solution: string;
      recordedBy?: string;
    },
  ): Promise<QuarterProgress[]> =>
    jsonOrThrow(
      await fetch(`/api/perf-kpis/${perfKpiId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to save progress",
    ),
  saveMetricProgress: async (
    perfMetricId: number,
    input: { yearNo: number; quarterNo: number; progressValue: number | null; issue: string; solution: string; recordedBy?: string },
  ): Promise<QuarterProgress[]> =>
    jsonOrThrow(
      await fetch(`/api/perf-metrics/${perfMetricId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to save progress",
    ),
};

// ── Performance approval workflow (member → lead → counselor, DB-backed) ─────
export interface ApprovalTransitionInput {
  action: ApprovalAction;
  yearNo: number;
  quarterNo: number;
  actorId?: string;
  actorName?: string;
  userRole?: string;
  comment?: string;
}

export const approvalsRepo = {
  // Queue listing: one row per KPI in a record for the given (year, quarter).
  listByRecord: async (
    recordId: number,
    yearNo: number,
    quarterNo: number,
  ): Promise<PerfKpiApproval[]> =>
    jsonOrThrow(
      await fetch(
        `/api/performance-records/${recordId}/approvals?yearNo=${yearNo}&quarterNo=${quarterNo}`,
      ),
      "Failed to load approvals",
    ),
  // A single KPI's approval + event thread for one quarter.
  getForKpi: async (
    perfKpiId: number,
    yearNo: number,
    quarterNo: number,
  ): Promise<{ approval: PerfKpiApproval; events: ApprovalEvent[] }> =>
    jsonOrThrow(
      await fetch(
        `/api/perf-kpis/${perfKpiId}/approval?yearNo=${yearNo}&quarterNo=${quarterNo}`,
      ),
      "Failed to load approval",
    ),
  // Perform a workflow transition (submit / return / forward / approve / reject / reverse).
  transition: async (
    perfKpiId: number,
    input: ApprovalTransitionInput,
  ): Promise<{ approval: PerfKpiApproval; events: ApprovalEvent[] }> =>
    jsonOrThrow(
      await fetch(`/api/perf-kpis/${perfKpiId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      "Failed to update approval",
    ),
};

export type {
  Committee,
  FacultyMember,
  Formula,
  FormulaVersion,
  FormulaRecord,
  FormulaVersionRecord,
  Kpi,
  KpiCategoryRecord,
  Measurement,
  Metric,
  ValidationSubmission,
};
