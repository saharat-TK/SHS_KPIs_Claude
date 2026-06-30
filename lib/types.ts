// ── Shared domain types for the Health Sciences KPI system ──────────────────

export type Role = "admin" | "reviewer" | "department" | "viewer";

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

export interface Department {
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
  | "Instructor";

export type TenureStatus = "Tenured" | "Tenure-Track" | "Non-Tenure" | "Contract";

export interface FacultyMember {
  id: string;
  name: string;
  departmentId: string;
  rank: Rank;
  tenureStatus: TenureStatus;
  kpiFocus: string;
  researchScore: number; // 0-100
  status: EntityStatus;
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
  currentValue: number;
  unit: string; // e.g. "%", "score", "ratio"
  thresholds: Thresholds;
  formulaId?: string;
  departmentIds: string[];
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
  assignedDepartmentIds: string[];
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
  departmentId: string;
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
  departmentId: string;
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
  departmentId?: string;
}
