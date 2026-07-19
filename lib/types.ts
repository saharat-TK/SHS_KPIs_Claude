// ── Shared domain types for the Health Sciences KPI system ──────────────────

export type Role = "admin" | "reviewer" | "committee" | "viewer";

// KPI categories are now user-managed and DB-backed (table `kpi_categories`,
// exposed via /api/kpi-categories). `category` on a KPI is the stable category
// id (slug). The union was promoted to a plain string once categories became
// editable data rather than a fixed set.
export type KpiCategory = string;

export interface KpiCategoryRecord {
  id: string; // stable, globally-unique slug, e.g. "student_success"
  setId?: number | null; // owning strategic set (null = legacy/global)
  label: string; // display name (DB column `name`, aliased on read)
  description?: string;
  sortOrder: number;
}

// Admin-managed measurement unit for KPIs/metrics (shs_kpis_claude.units).
export interface UnitRecord {
  id: number;
  unitNameTh: string;
  unitNameEn: string;
  description: string | null;
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
  /** Links the app user to faculty.id so the performance-approval workflow can
   *  resolve this person's committee_memberships.position (member/lead/counselor). */
  facultyId?: string;
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

/** How a KPI's quarterly target is derived from its annual target.
 *  divide_equally → cumulative annual*q/4 (Q1 25% … Q4 100%);
 *  use_annual     → each quarter's target equals the full annual target. */
export type QuarterlyTargetMode = "divide_equally" | "use_annual";

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
  /** How quarterly targets are derived for this KPI (and, inherited, its
   *  metrics): cumulative annual*q/4, or the full annual target each quarter. */
  quarterlyTargetMode: QuarterlyTargetMode;
  /** KPI-variable definitions used for leaf-KPI data entry. Variable 1
   *  (Dividend) is required; Variable 2 (Divisor) is used only when the unit is
   *  Percent/Ratio. Value = V1, or (V1/V2)*100 for Percent, V1/V2 for Ratio. */
  variable1Name: string | null;
  variable1Unit: string | null;
  variable2Name: string | null;
  variable2Unit: string | null;
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
  targetMode: MetricTargetMode;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  sortOrder: number;
  annualTargets?: AnnualTarget[];
}

export type MetricTargetMode = "none" | "inherit_parent" | "manual";

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
  openPeriodCount?: number;
}

export interface PerformancePeriod {
  yearNo: number;
  quarterNo: number;
  isOpen: boolean;
  openedBy: string | null;
  openedAt: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface PerfKpi extends Omit<LibraryKpi, "id" | "setId" | "annualTargets"> {
  id: number;
  recordId: number;
  sourceKpiId: number | null;
  hasChildren: boolean;
  annualTargets?: AnnualTarget[];
  progress?: QuarterProgress[];
  startYear?: number; // from the parent performance_record (detail view)
  /** Set when a data source computes this KPI's value (derived, not stored). */
  fedBy?: { dataSourceId: number; dataSourceName: string } | null;
}

export interface PerfMetric extends Omit<LibraryMetric, "id" | "kpiId" | "annualTargets" | "targetMode"> {
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
  /** Raw KPI-variable inputs for leaf KPIs; progressValue is derived from them. */
  variable1Value?: number | null;
  variable2Value?: number | null;
  isComputed?: boolean;
  issue: string | null;
  solution: string | null;
  quarterTarget?: number; // derived
}

// ── Approval workflow (LAYER C) ─────────────────────────────────────────────
// Mirrors schema/SHS_KPI_Management_schema.sql perf_kpi_approval[_event].

/** State machine states. A missing DB row is treated as "draft". */
export type ApprovalState =
  | "draft"
  | "submitted"
  | "returned"
  | "forwarded"
  | "approved";

/** The stage a person acts as, resolved from committee position (+ admin role). */
export type StageRole = "member" | "lead" | "counselor" | "admin";

/** Transition verbs a user can invoke. */
export type ApprovalAction =
  | "submit"
  | "return"
  | "forward"
  | "approve"
  | "reject"
  | "reverse";

/** One approval record governing a perf KPI + its metrics for a (year, quarter). */
export interface PerfKpiApproval {
  id: number | null; // null when no row exists yet (implicit draft)
  perfKpiId: number;
  recordId: number;
  committeeId: string | null;
  yearNo: number;
  quarterNo: number;
  state: ApprovalState;
  submittedBy: string | null;
  submittedAt: string | null;
  forwardedBy: string | null;
  forwardedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  // Joined/derived, present on the record-level queue listing:
  kpiName?: string;
  committeeName?: string;
  unit?: string | null;
  progressValue?: number | null;
  hasChildren?: boolean;
}

/** One append-only audit/comment row in an approval's thread. */
export interface ApprovalEvent {
  id: number;
  approvalId: number;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: ApprovalAction;
  fromState: ApprovalState | null;
  toState: ApprovalState;
  comment: string | null;
  createdAt: string;
}

// ── Data sources (LAYER D) ──────────────────────────────────────────────────
// Mirrors schema/SHS_KPI_Management_schema.sql data_source[_column|_entry|_link].
// Committee-owned raw data; linked to library KPIs/metrics as evidence.

export type DataSourcePeriodGrain = "quarterly" | "annual";
export type DataSourceStatus = "active" | "archived";
export type DataSourceColumnType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "boolean"
  // Derived-option types: the user does not author their options, so `options`
  // stays NULL in the DB and is resolved at validation/render time instead.
  | "faculty" // stores a faculty.id ("fac-001")
  | "program"; // stores a PROGRAMS abbr ("PH")

/** A cell value as stored in data_source_entry.values_json. */
export type DataSourceCellValue = string | number | boolean | null;

export interface DataSource {
  id: number;
  name: string;
  description: string | null;
  committeeId: string;
  periodGrain: DataSourcePeriodGrain;
  status: DataSourceStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined/derived on the list endpoint:
  committeeName?: string;
  columnCount?: number;
  entryCount?: number;
  linkCount?: number;
}

export interface DataSourceColumn {
  id: number;
  dataSourceId: number;
  colKey: string;
  label: string;
  dataType: DataSourceColumnType;
  unit: string | null;
  /** Allowed values; only meaningful when dataType is "select". */
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

/** One recorded row. `quarter` is null when the source's grain is "annual". */
export interface DataSourceEntry {
  id: number;
  dataSourceId: number;
  year: number;
  quarter: number | null;
  values: Record<string, DataSourceCellValue>;
  note: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
  recordedByName?: string;
}

/** Which rows of a data source count, and how they turn into a number. */
export type FilterOperator = "eq" | "in" | "gte" | "lte" | "between";

/** One condition. `field` is a data_source_column.col_key, or PERIOD_FIELD
 *  ("__period") for the entry's own year/quarter. Exactly one of value / values
 *  carries the operand, depending on the operator. */
export interface DataSourceFilter {
  field: string;
  operator: FilterOperator;
  /** Same shape as a stored cell, so a boolean column's filter is a boolean.
   *  Set for every operator except "in". */
  value?: DataSourceCellValue;
  /** Set only for "between", where both bounds are inclusive. */
  valueTo?: DataSourceCellValue;
  /** Set only for "in" — the allowed values, deduped and non-empty. Gives OR
   *  within a single field; conditions across fields remain ANDed. */
  values?: DataSourceCellValue[];
}

export type AggregationKind = "sum" | "avg" | "count" | "latest";

/** Where the aggregated number lands on the target. A percent/ratio KPI takes
 *  two mappings (variable1 = dividend, variable2 = divisor); everything else
 *  takes one "value". */
export type MappingSlot = "value" | "variable1" | "variable2";

export interface DataSourceLinkMapping {
  slot: MappingSlot;
  aggregation: AggregationKind;
  /** The column being aggregated. Null (and unused) when aggregation is "count". */
  columnKey: string | null;
  filters: DataSourceFilter[];
}

/** Feed edge from a data source to a library KPI or metric. Exactly one of
 *  libraryKpiId / libraryMetricId is set. `mappings` says which rows produce the
 *  target's quarterly value; an empty array means the link is evidence only. */
export interface DataSourceLink {
  id: number;
  dataSourceId: number;
  libraryKpiId: number | null;
  libraryMetricId: number | null;
  mappings: DataSourceLinkMapping[];
  note: string | null;
  // Joined for display:
  kpiName?: string;
  metricName?: string;
  setName?: string;
  dataSourceName?: string;
}
