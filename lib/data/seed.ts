import type {
  Department,
  FacultyMember,
  Formula,
  FormulaVersion,
  Kpi,
  Measurement,
  Metric,
  ValidationSubmission,
} from "@/lib/types";

export const PERIODS = ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4"] as const;

const SCHOOL = "School of Health Science";

// The 17 standing committees tracked under the School of Health Science.
export const departments: Department[] = [
  { id: "dept-curriculum", name: "Curriculum and Teaching Committee", faculty: SCHOOL, status: "active", keyMetric: "Curriculum Quality" },
  { id: "dept-student-alumni", name: "Student and Alumni Affairs Committee", faculty: SCHOOL, status: "active", keyMetric: "Student Satisfaction" },
  { id: "dept-research-ethics", name: "Research, Innovation and Research Ethics Committee", faculty: SCHOOL, status: "active", keyMetric: "Research Output" },
  { id: "dept-graduate", name: "Graduate Studies Committee", faculty: SCHOOL, status: "active", keyMetric: "Graduate Completion" },
  { id: "dept-edpex", name: "EdPEx Committee", faculty: SCHOOL, status: "active", keyMetric: "EdPEx Score" },
  { id: "dept-policy-planning", name: "Policy and Planning Committee", faculty: SCHOOL, status: "active", keyMetric: "Plan Achievement" },
  { id: "dept-arts-culture", name: "Arts and Culture Preservation Committee", faculty: SCHOOL, status: "active", keyMetric: "Activities Held" },
  { id: "dept-academic-service", name: "Academic Service Committee", faculty: SCHOOL, status: "active", keyMetric: "Service Projects" },
  { id: "dept-foreign-affairs", name: "Foreign Affairs Committee", faculty: SCHOOL, status: "active", keyMetric: "MOU Partnerships" },
  { id: "dept-corp-comm", name: "Corporate Communications Committee", faculty: SCHOOL, status: "active", keyMetric: "Media Reach" },
  { id: "dept-green-office", name: "Green Office Committee", faculty: SCHOOL, status: "active", keyMetric: "Green Office Level" },
  { id: "dept-info-decision", name: "Information Committee for Decision Making", faculty: SCHOOL, status: "active", keyMetric: "Data Timeliness" },
  { id: "dept-risk", name: "Risk Management Committee", faculty: SCHOOL, status: "active", keyMetric: "Risks Mitigated" },
  { id: "dept-km", name: "KM Committee", faculty: SCHOOL, status: "active", keyMetric: "KM Practices" },
  { id: "dept-personnel", name: "Personnel Committee", faculty: SCHOOL, status: "active", keyMetric: "Staff Development" },
  { id: "dept-equipment", name: "Equipment and Supplies Committee", faculty: SCHOOL, status: "active", keyMetric: "Asset Utilization" },
  { id: "dept-finance", name: "Finance and Budget Committee", faculty: SCHOOL, status: "active", keyMetric: "Budget Disbursement" },
];

const FIRST = ["Anchali", "Krit", "Nida", "Somsak", "Pim", "Thanawat", "Suda", "Niran", "Wanida", "Chai", "Malee", "Apinya", "Decha", "Kanya", "Phuwadol", "Siriporn", "Narong", "Ratana", "Worawit", "Achara", "Boonmee"];
const LAST = ["Wong", "Saetang", "Phuwadol", "Srisai", "Chaiyo", "Intara", "Boon", "Ratana", "Suk", "Mongkol", "Pansa", "Vora", "Klahan", "Chinda", "Thong"];
const RANKS = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Instructor"] as const;
const TENURE = ["Tenured", "Tenure-Track", "Non-Tenure", "Contract"] as const;
const FOCUS = ["Student Success", "Research Output", "Clinical Excellence", "Curriculum Design", "Community Health"];

function buildFaculty(): FacultyMember[] {
  const out: FacultyMember[] = [];
  let n = 1;
  for (const d of departments) {
    const count = d.status === "draft" ? 1 : 2 + ((n * 7) % 3); // 2-4 per dept
    for (let i = 0; i < count; i++) {
      const id = `fac-${String(n).padStart(3, "0")}`;
      out.push({
        id,
        name: `Dr. ${FIRST[(n * 3) % FIRST.length]} ${LAST[(n * 5) % LAST.length]}`,
        departmentId: d.id,
        rank: RANKS[(n + i) % RANKS.length],
        tenureStatus: TENURE[(n * 2 + i) % TENURE.length],
        kpiFocus: FOCUS[(n + i) % FOCUS.length],
        researchScore: 58 + ((n * 13 + i * 7) % 40), // 58-97
        status: d.status === "draft" ? "draft" : "active",
      });
      n++;
    }
  }
  return out;
}

export const faculty: FacultyMember[] = buildFaculty();

export const formulas: Formula[] = [
  {
    id: "formula-grad-rate",
    name: "Graduation Rate",
    expression: "(G / E) * 100",
    variables: [
      { symbol: "G", label: "Graduates within 150% time", source: "Registrar · cohort completion" },
      { symbol: "E", label: "Entering cohort", source: "Admissions · enrollment census" },
    ],
    currentVersion: "v2.4",
  },
  {
    id: "formula-licensure",
    name: "Licensure Pass Rate",
    expression: "(P / A) * 100",
    variables: [
      { symbol: "P", label: "First-attempt passes", source: "Licensing board feed" },
      { symbol: "A", label: "First-attempt sitters", source: "Licensing board feed" },
    ],
    currentVersion: "v1.2",
  },
  {
    id: "formula-research-index",
    name: "Research Productivity Index",
    expression: "(Pub * 2 + Cit / 10 + Grant / 100000) / F",
    variables: [
      { symbol: "Pub", label: "Publications", source: "Scopus" },
      { symbol: "Cit", label: "Citations", source: "Scopus" },
      { symbol: "Grant", label: "Grant THB", source: "Research office" },
      { symbol: "F", label: "FTE faculty", source: "HR roster" },
    ],
    currentVersion: "v3.1",
  },
  {
    id: "formula-employment",
    name: "Post-Grad Employment Rate",
    expression: "(Emp / (Grad - Cont)) * 100",
    variables: [
      { symbol: "Emp", label: "Employed in field @6mo", source: "Graduate survey" },
      { symbol: "Grad", label: "Total graduates", source: "Registrar" },
      { symbol: "Cont", label: "Continuing education", source: "Graduate survey" },
    ],
    currentVersion: "v2.0",
  },
];

export const formulaVersions: FormulaVersion[] = [
  { id: "fv-gr-1", formulaId: "formula-grad-rate", version: "v2.4", expression: "(G / E) * 100", author: "Dr. Anchali Wong", timestamp: "2024-11-02T09:12:00Z", changeNote: "Aligned denominator to 150%-time entering cohort." },
  { id: "fv-gr-2", formulaId: "formula-grad-rate", version: "v2.3", expression: "(G / E0) * 100", author: "Dr. Krit Saetang", timestamp: "2024-08-15T14:03:00Z", changeNote: "Switched to census-date enrollment E0." },
  { id: "fv-gr-3", formulaId: "formula-grad-rate", version: "v2.2", expression: "(G / E) * 100", author: "Dr. Anchali Wong", timestamp: "2024-03-21T11:40:00Z", changeNote: "Initial standardized definition." },
  { id: "fv-lic-1", formulaId: "formula-licensure", version: "v1.2", expression: "(P / A) * 100", author: "Dr. Nida Phuwadol", timestamp: "2024-09-10T10:00:00Z", changeNote: "Restricted to first-attempt sitters only." },
  { id: "fv-lic-2", formulaId: "formula-licensure", version: "v1.1", expression: "(P / A_all) * 100", author: "Dr. Nida Phuwadol", timestamp: "2024-05-02T10:00:00Z", changeNote: "Included all attempts (deprecated)." },
  { id: "fv-ri-1", formulaId: "formula-research-index", version: "v3.1", expression: "(Pub * 2 + Cit / 10 + Grant / 100000) / F", author: "Dr. Krit Saetang", timestamp: "2024-10-18T16:22:00Z", changeNote: "Re-weighted publications ×2." },
  { id: "fv-ri-2", formulaId: "formula-research-index", version: "v3.0", expression: "(Pub + Cit / 10 + Grant / 100000) / F", author: "Dr. Krit Saetang", timestamp: "2024-06-30T16:22:00Z", changeNote: "Added grant THB normalization." },
  { id: "fv-emp-1", formulaId: "formula-employment", version: "v2.0", expression: "(Emp / (Grad - Cont)) * 100", author: "Dr. Anchali Wong", timestamp: "2024-07-12T08:30:00Z", changeNote: "Excluded continuing-education graduates from base." },
];

const allDeptIds = departments.filter((d) => d.status === "active").map((d) => d.id);

export const kpis: Kpi[] = [
  { id: "kpi-grad-rate", name: "Graduation Rate", category: "student_success", weight: 35, calculationMethod: "Formula: Graduation Rate", currentValue: 88.4, unit: "%", thresholds: { green: 85, amber: 75 }, formulaId: "formula-grad-rate", departmentIds: allDeptIds },
  { id: "kpi-licensure", name: "Licensure Pass Rate", category: "student_success", weight: 35, calculationMethod: "Formula: Licensure Pass Rate", currentValue: 91.2, unit: "%", thresholds: { green: 90, amber: 80 }, formulaId: "formula-licensure", departmentIds: allDeptIds },
  { id: "kpi-employment", name: "Post-Grad Employment", category: "student_success", weight: 30, calculationMethod: "Formula: Post-Grad Employment Rate", currentValue: 84.7, unit: "%", thresholds: { green: 85, amber: 70 }, formulaId: "formula-employment", departmentIds: allDeptIds },
  { id: "kpi-research-index", name: "Research Productivity Index", category: "research_output", weight: 50, calculationMethod: "Formula: Research Productivity Index", currentValue: 72.0, unit: "score", thresholds: { green: 70, amber: 50 }, formulaId: "formula-research-index", departmentIds: allDeptIds },
  { id: "kpi-pub-output", name: "Publications per FTE", category: "research_output", weight: 50, calculationMethod: "Sum publications / FTE faculty", currentValue: 2.3, unit: "ratio", thresholds: { green: 2, amber: 1 }, departmentIds: allDeptIds },
  { id: "kpi-faculty-quals", name: "Faculty Qualification Index", category: "faculty_excellence", weight: 60, calculationMethod: "% faculty with terminal degree", currentValue: 78.0, unit: "%", thresholds: { green: 80, amber: 65 }, departmentIds: allDeptIds },
  { id: "kpi-student-ratio", name: "Student-Faculty Ratio", category: "operational_efficiency", weight: 40, calculationMethod: "Enrolled students / FTE faculty", currentValue: 14.2, unit: "ratio", thresholds: { green: 15, amber: 20 }, departmentIds: allDeptIds },
  { id: "kpi-cost-per-student", name: "Cost per Student", category: "financial_health", weight: 50, calculationMethod: "Operating cost / enrolled students (THB k)", currentValue: 92, unit: "THB k", thresholds: { green: 100, amber: 130 }, departmentIds: allDeptIds },
];

export const metrics: Metric[] = [
  { id: "metric-cohort-completion", kpiId: "kpi-grad-rate", name: "Cohort Completion (150%)", weight: 60, calculationMethod: "Graduates / entering cohort", currentValue: 88.4, target: 90, unit: "%", dataSource: "Registrar SIS", assignedDepartmentIds: allDeptIds },
  { id: "metric-retention-y1", kpiId: "kpi-grad-rate", name: "First-Year Retention", weight: 40, calculationMethod: "Returning Y2 / entering cohort", currentValue: 93.1, target: 92, unit: "%", dataSource: "Registrar SIS", assignedDepartmentIds: allDeptIds },
  { id: "metric-first-attempt", kpiId: "kpi-licensure", name: "First-Attempt Pass", weight: 70, calculationMethod: "First-attempt passes / sitters", currentValue: 91.2, target: 92, unit: "%", dataSource: "Licensing board", assignedDepartmentIds: allDeptIds },
  { id: "metric-ultimate-pass", kpiId: "kpi-licensure", name: "Ultimate Pass Rate", weight: 30, calculationMethod: "Eventual passes / sitters", currentValue: 97.5, target: 98, unit: "%", dataSource: "Licensing board", assignedDepartmentIds: allDeptIds },
  { id: "metric-field-employ", kpiId: "kpi-employment", name: "Employed in Field @6mo", weight: 100, calculationMethod: "Employed in field / job-seeking grads", currentValue: 84.7, target: 88, unit: "%", dataSource: "Graduate survey", assignedDepartmentIds: allDeptIds },
  { id: "metric-publications", kpiId: "kpi-research-index", name: "Scopus Publications", weight: 50, calculationMethod: "Count of indexed publications", currentValue: 64, target: 75, unit: "count", dataSource: "Scopus API", assignedDepartmentIds: allDeptIds },
  { id: "metric-grant-thb", kpiId: "kpi-research-index", name: "Grant Income (THB M)", weight: 50, calculationMethod: "Awarded grant value", currentValue: 18.4, target: 22, unit: "THB M", dataSource: "Research office", assignedDepartmentIds: allDeptIds },
];

// Deterministic per-department × period measurements for the student-success KPIs.
function buildMeasurements(): Measurement[] {
  const out: Measurement[] = [];
  const targets: { id: string; base: number; spread: number }[] = [
    { id: "kpi-grad-rate", base: 86, spread: 12 },
    { id: "kpi-licensure", base: 89, spread: 11 },
    { id: "kpi-employment", base: 82, spread: 16 },
  ];
  departments.forEach((d, di) => {
    if (d.status !== "active") return;
    targets.forEach((t) => {
      PERIODS.forEach((p, pi) => {
        const wobble = ((di * 7 + pi * 5) % 11) - 5; // -5..+5
        const trend = pi * 0.8; // gentle improvement across the year
        const value = Math.round(
          Math.min(99, Math.max(55, t.base + (di % 5) * (t.spread / 6) + wobble + trend)) * 10,
        ) / 10;
        out.push({
          id: `m-${t.id}-${d.id}-${p}`,
          targetId: t.id,
          targetType: "kpi",
          departmentId: d.id,
          period: p,
          value,
        });
      });
    });
  });
  return out;
}

export const measurements: Measurement[] = buildMeasurements();

export const validationSubmissions: ValidationSubmission[] = [
  { id: "val-001", metricId: "metric-cohort-completion", departmentId: "dept-curriculum", submittedById: "u-dept", submittedDate: "2025-01-08T08:30:00Z", period: "2024-Q4", value: 89.2, status: "pending", comments: [] },
  { id: "val-002", metricId: "metric-first-attempt", departmentId: "dept-student-alumni", submittedById: "fac-004", submittedDate: "2025-01-07T11:15:00Z", period: "2024-Q4", value: 90.5, status: "pending", comments: [] },
  { id: "val-003", metricId: "metric-publications", departmentId: "dept-research-ethics", submittedById: "fac-010", submittedDate: "2025-01-06T14:40:00Z", period: "2024-Q4", value: 71, status: "clarification", reviewerId: "u-reviewer", comments: [{ authorId: "u-reviewer", authorName: "Dr. Krit Saetang", timestamp: "2025-01-07T09:00:00Z", text: "Please confirm whether conference proceedings are included in this count." }] },
  { id: "val-004", metricId: "metric-field-employ", departmentId: "dept-graduate", submittedById: "fac-013", submittedDate: "2025-01-05T10:00:00Z", period: "2024-Q4", value: 79.0, status: "approved", reviewerId: "u-reviewer", comments: [{ authorId: "u-reviewer", authorName: "Dr. Krit Saetang", timestamp: "2025-01-06T10:00:00Z", text: "Matches graduate survey export. Approved." }] },
  { id: "val-005", metricId: "metric-grant-thb", departmentId: "dept-edpex", submittedById: "fac-007", submittedDate: "2025-01-04T16:20:00Z", period: "2024-Q4", value: 12.1, status: "rejected", reviewerId: "u-reviewer", comments: [{ authorId: "u-reviewer", authorName: "Dr. Krit Saetang", timestamp: "2025-01-05T08:30:00Z", text: "Figure includes pending (unawarded) proposals. Resubmit awarded-only." }] },
  { id: "val-006", metricId: "metric-retention-y1", departmentId: "dept-policy-planning", submittedById: "fac-016", submittedDate: "2025-01-09T09:05:00Z", period: "2024-Q4", value: 91.8, status: "pending", comments: [] },
  { id: "val-007", metricId: "metric-ultimate-pass", departmentId: "dept-academic-service", submittedById: "fac-019", submittedDate: "2025-01-09T13:25:00Z", period: "2024-Q4", value: 98.2, status: "pending", comments: [] },
  { id: "val-008", metricId: "metric-cohort-completion", departmentId: "dept-finance", submittedById: "fac-021", submittedDate: "2025-01-03T12:00:00Z", period: "2024-Q4", value: 95.4, status: "approved", reviewerId: "u-reviewer", comments: [] },
];
