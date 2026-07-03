// ── Shared domain types for the Health Sciences KPI system ──────────────────

export type Role = "admin" | "reviewer" | "committee" | "viewer";

export type KpiCategory =
  | "student_success"
  | "faculty_excellence"
  | "research_output"
  | "operational_efficiency"
  | "financial_health";

export const KPI_CATEGORIES: { id: KpiCategory; label: string }[] = [
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
