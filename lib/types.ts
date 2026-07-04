// ── Shared domain types for the Health Sciences KPI system ──────────────────

export type Role = "admin" | "reviewer" | "committee" | "viewer";

// KPI categories are now user-managed and DB-backed (table `kpi_categories`,
// exposed via /api/kpi-categories). `category` on a KPI is the stable category
// id (slug). The union was promoted to a plain string once categories became
// editable data rather than a fixed set.
export type KpiCategory = string;

export interface KpiCategoryRecord {
  id: string; // stable slug, e.g. "student_success"
  label: string; // display name (DB column `name`, aliased on read)
  description?: string;
  sortOrder: number;
}

// Canonical default set — mirrors the seed rows in
// schema/SHS_KPI_Category_schema.sql. Used as a loading/offline fallback so the
// category tabs never render empty before the DB query resolves.
export const KPI_CATEGORIES: { id: string; label: string }[] = [
  { id: "student_success", label: "Student Success" },
  { id: "faculty_excellence", label: "Faculty Excellence" },
  { id: "research_output", label: "Research Output" },
  { id: "operational_efficiency", label: "Operational Efficiency" },
  { id: "financial_health", label: "Financial Health" },
];

export type EntityStatus = "active" | "inactive" | "draft";

export type KpiCalculationType =
  | "weighted_sum"
  | "simple_average"
  | "custom_formula";

export const KPI_CALCULATION_TYPES: {
  id: KpiCalculationType;
  label: string;
  hint: string;
}[] = [
  {
    id: "weighted_sum",
    label: "Weighted Sum of sub-KPIs",
    hint: "Sub-KPI values combined by their weights",
  },
  {
    id: "simple_average",
    label: "Simple average",
    hint: "Unweighted mean of sub-KPIs",
  },
  {
    id: "custom_formula",
    label: "Custom formula",
    hint: "Evaluated from a linked formula",
  },
];

export interface Committee {
  id: string;
  name: string;
  faculty: string;
  status: EntityStatus;
  headId?: string;
  keyMetric: string;
}

export type Rank =
  | "Professor"
  | "Associate Professor"
  | "Assistant Professor"
  | "Lecturer"
  | "Support Staff";

export type Position = "Counselor" | "Committee Lead" | "Committee" | "Committee and Secretary";

export interface FacultyMember {
  id: string;
  name: string;
  committeeId: string;
  rank: Rank;
  position: Position;
  kpiFocus: string;
  researchScore: number; // 0-100
  status: EntityStatus;
}

// ── Real MySQL-backed faculty record (shs_kpis_claude.faculty) ──────────────
// Distinct from FacultyMember (the in-memory prototype entity used by
// faculty/management, faculty/export, and committee pages). Person-level
// only — committee membership lives in a separate committee_memberships
// junction table and isn't modeled here yet.
export type Program = "BioMed" | "EnvH" | "OHS" | "PH" | "Sport Science" | "SHS Office";

export type SystemRole = "admin" | "user";

export interface FacultyRecord {
  id: string;
  name: string;
  rank: Rank;
  email: string | null;
  nameTh: string | null;
  program: Program;
  status: EntityStatus;
  systemRole: SystemRole;
}

// The faculty <-> committee bridge (shs_kpis_claude.committee_memberships),
// joined with faculty/committees for display. facultyId/committeeId together
// are the composite key — a membership's identity isn't editable, only its
// position/kpiFocus are.
export interface CommitteeMembership {
  facultyId: string;
  committeeId: string;
  position: Position;
  kpiFocus: string;
  facultyName: string;
  committeeName: string;
}

export interface Thresholds {
  green: number; // >= green => healthy
  amber: number; // >= amber => watch, below => at risk
}

export interface Kpi {
  id: string;
  name: string;
  category: KpiCategory;
  weight: number; // 0-100, relative weight within category
  calculationMethod: string;
  calculationType: KpiCalculationType;
  currentValue: number;
  unit: string; // e.g. "%", "score", "ratio"
  thresholds: Thresholds;
  formulaId?: string;
  committeeIds: string[];
}

export interface Metric {
  // a sub-KPI / measurable component of a KPI
  id: string;
  kpiId: string;
  name: string;
  weight: number;
  calculationMethod: string;
  currentValue: number;
  target: number;
  unit: string;
  dataSource: string;
  assignedCommitteeIds: string[];
}

export interface FormulaVariable {
  symbol: string; // e.g. "G"
  label: string; // e.g. "Graduates"
  source: string; // where the value comes from
}

export interface Formula {
  id: string;
  name: string;
  expression: string; // mathjs-evaluable, uses variable symbols
  variables: FormulaVariable[];
  currentVersion: string; // e.g. "v2.4"
}

export interface FormulaVersion {
  id: string;
  formulaId: string;
  version: string;
  expression: string;
  author: string;
  timestamp: string; // ISO
  changeNote: string;
}

export type MeasurementTarget = "kpi" | "metric";

export interface Measurement {
  id: string;
  targetId: string;
  targetType: MeasurementTarget;
  committeeId: string;
  period: string; // e.g. "2024-Q4"
  value: number;
}

export type ValidationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "clarification";

export interface ValidationComment {
  authorId: string;
  authorName: string;
  timestamp: string;
  text: string;
}

export interface ValidationSubmission {
  id: string;
  metricId: string;
  committeeId: string;
  submittedById: string;
  submittedDate: string; // ISO
  period: string;
  value: number;
  status: ValidationStatus;
  reviewerId?: string;
  comments: ValidationComment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  committeeId?: string;
}

// ============================================================================
//  KPI Management — DB-backed Library + Performance layers
//  Mirrors schema/SHS_KPI_Management_schema.sql. snake_case columns are aliased
//  to these camelCase fields in the API SELECT_FIELDS. BIGINT ids surface as
//  numbers; FKs into the older string-keyed tables (kpi_categories, committees,
//  faculty) stay strings.
// ============================================================================

export type KpiType = "strategic" | "operational" | "routine";
export type CollectionPeriod = "Q1" | "Q2" | "Q3" | "Q4" | "every_quarter";
export type StrategicSetStatus = "draft" | "active" | "archived";
export type PerformanceStatus = "active" | "closed" | "archived";

export const KPI_TYPES: { id: KpiType; label: string }[] = [
  { id: "strategic", label: "Strategic" },
  { id: "operational", label: "Operational" },
  { id: "routine", label: "Routine" },
];

export const COLLECTION_PERIODS: { id: CollectionPeriod; label: string }[] = [
  { id: "Q1", label: "Quarter 1" },
  { id: "Q2", label: "Quarter 2" },
  { id: "Q3", label: "Quarter 3" },
  { id: "Q4", label: "Quarter 4" },
  { id: "every_quarter", label: "Every quarter" },
];

/** One per-year target row. yearNo 1..5 maps to startYear..startYear+4. */
export interface AnnualTarget {
  yearNo: number; // 1..5
  targetValue: number | null;
}

export interface StrategicSet {
  id: number;
  name: string;
  description: string | null;
  startYear: number;
  endYear: number; // generated (startYear + 4)
  status: StrategicSetStatus;
  clonedFromSetId: number | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  kpiCount?: number; // populated in list views
}

export interface LibraryKpi {
  id: number;
  setId: number;
  name: string;
  description: string | null;
  categoryId: string | null;
  kpiType: KpiType;
  dataCollectMethod: string | null;
  collectionPeriod: CollectionPeriod;
  dataSourceUrl: string | null;
  committeeId: string | null;
  personInChargeId: string | null;
  weight: number;
  unit: string | null;
  fiveYearTarget: number | null;
  calculationType: KpiCalculationType;
  calculationLogic: string | null;
  formulaId: number | null;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  sortOrder: number;
  annualTargets?: AnnualTarget[];
  metricCount?: number; // populated in list views
}

export interface LibraryMetric {
  id: number;
  kpiId: number;
  name: string;
  description: string | null;
  categoryId: string | null;
  dataCollectMethod: string | null;
  collectionPeriod: CollectionPeriod;
  dataSourceUrl: string | null;
  committeeId: string | null;
  personInChargeId: string | null;
  weight: number;
  unit: string | null;
  fiveYearTarget: number | null;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  sortOrder: number;
  annualTargets?: AnnualTarget[];
}

// ── Persisted formula engine (distinct from the in-memory Formula* above,
//    which the legacy /formulas pages still use). Numeric BIGINT ids. ──────────
export interface FormulaRecord {
  id: number;
  name: string;
  expression: string;
  currentVersion: string | null;
  variables?: FormulaVariableRecord[];
}

export interface FormulaVariableRecord {
  id: number;
  formulaId: number;
  symbol: string;
  label: string;
  source: string | null;
}

export interface FormulaVersionRecord {
  id: number;
  formulaId: number;
  version: string;
  expression: string;
  author: string | null;
  changeNote: string | null;
  createdAt: string;
}

// ── Performance layer (activated snapshots) ─────────────────────────────────
export interface PerformanceRecord {
  id: number;
  sourceSetId: number;
  name: string;
  startYear: number;
  endYear: number;
  status: PerformanceStatus;
  activatedBy: string | null;
  activatedAt: string;
  lastSyncedAt: string | null;
  kpiCount?: number;
}

export interface PerfKpi extends Omit<LibraryKpi, "id" | "setId" | "annualTargets"> {
  id: number;
  recordId: number;
  sourceKpiId: number | null;
  hasChildren: boolean;
  annualTargets?: AnnualTarget[];
  progress?: QuarterProgress[];
  startYear?: number; // from the parent performance_record (detail view)
}

export interface PerfMetric extends Omit<LibraryMetric, "id" | "kpiId" | "annualTargets"> {
  id: number;
  perfKpiId: number;
  sourceMetricId: number | null;
  annualTargets?: AnnualTarget[];
  progress?: QuarterProgress[];
  startYear?: number;
  recordId?: number;
}

/** One recorded quarter. quarterTarget is computed on read (running sum of
 *  yearTarget/4 across Q1..Q4), never stored. issue + solution are required. */
export interface QuarterProgress {
  yearNo: number; // 1..5
  quarterNo: number; // 1..4
  progressValue: number | null;
  isComputed?: boolean;
  issue: string | null;
  solution: string | null;
  quarterTarget?: number; // derived
}
