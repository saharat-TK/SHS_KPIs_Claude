"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Committee,
  CommitteeMembership,
  FacultyMember,
  FacultyRecord,
  Kpi,
  KpiCategoryRecord,
  Metric,
  ValidationComment,
  ValidationStatus,
} from "@/lib/types";
import type {
  AnnualTarget,
  DataSource,
  DataSourceLinkMapping,
  DataSourceStatus,
  LibraryKpi,
  LibraryMetric,
  PerformancePeriod,
  PerformanceRecord,
  PerformanceStatus,
  StrategicSet,
  StrategicSetStatus,
  UnitRecord,
} from "@/lib/types";
import {
  academicCatalogRepo,
  approvalsRepo,
  type ApprovalTransitionInput,
  committeesRepo,
  committeeMembershipsRepo,
  dataSourcesRepo,
  type DataSourceColumnInput,
  type DataSourceBulkEntryInput,
  type DataSourceEntryInput,
  type DataSourceLinkInput,
  type LinkWriteResult,
  facultyRepo,
  facultyRecordsRepo,
  formulasRepo,
  kpiCategoriesRepo,
  kpisRepo,
  libraryKpisRepo,
  libraryMetricsRepo,
  measurementsRepo,
  metricsRepo,
  performanceRecordsRepo,
  strategicSetsRepo,
  unitsRepo,
  validationsRepo,
} from "./repositories";

// ── Toast design-system seam ────────────────────────────────────────────────
// Every mutation declares its confirmation message once via `meta.toast`. A
// global MutationCache handler in app/providers.tsx reads it and fires a toast
// on success (and a default error toast on failure). See components/ui/Toast.tsx.
type ToastMeta = string | ((data: unknown, variables: unknown) => string);
declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { toast?: ToastMeta; errorToast?: string };
  }
}

export const qk = {
  committees: ["committees"] as const,
  committeeUsage: (id: string) => ["committeeUsage", id] as const,
  faculty: ["faculty"] as const,
  kpis: ["kpis"] as const,
  kpi: (id: string) => ["kpis", id] as const,
  kpiCategories: ["kpiCategories"] as const,
  kpiCategoriesFor: (setId?: number) => ["kpiCategories", setId ?? null] as const,
  units: ["units"] as const,
  metrics: ["metrics"] as const,
  metricsByKpi: (id: string) => ["metrics", "byKpi", id] as const,
  formulas: ["formulas"] as const,
  formulaVersions: (id: string) => ["formulas", id, "versions"] as const,
  allVersions: ["formulas", "versions", "all"] as const,
  measurements: ["measurements"] as const,
  validations: ["validations"] as const,
  facultyRecords: ["facultyRecords"] as const,
  committeeMemberships: ["committeeMemberships"] as const,
  strategicSets: ["strategicSets"] as const,
  strategicSet: (id: number) => ["strategicSets", id] as const,
  libraryKpis: (setId: number) => ["libraryKpis", setId] as const,
  libraryKpi: (id: number) => ["libraryKpi", id] as const,
  libraryMetrics: (kpiId: number) => ["libraryMetrics", kpiId] as const,
  performanceRecords: ["performanceRecords"] as const,
  performanceRecord: (id: number) => ["performanceRecords", id] as const,
  performancePeriods: (id: number) => ["performanceRecords", id, "periods"] as const,
  perfKpis: (recordId: number) => ["perfKpis", recordId] as const,
  perfKpi: (id: number) => ["perfKpi", id] as const,
  perfMetrics: (perfKpiId: number) => ["perfMetrics", perfKpiId] as const,
  perfKpiSources: (perfKpiId: number) => ["perfKpiSources", perfKpiId] as const,
  academicCatalog: ["academicCatalog"] as const,
  approvals: (recordId: number, yearNo: number, quarterNo: number) =>
    ["approvals", recordId, yearNo, quarterNo] as const,
  kpiApproval: (perfKpiId: number, yearNo: number, quarterNo: number) =>
    ["kpiApproval", perfKpiId, yearNo, quarterNo] as const,
  dataSources: (committeeId?: string, status?: string) =>
    ["dataSources", committeeId ?? null, status ?? null] as const,
  dataSource: (id: number) => ["dataSource", id] as const,
  dataSourceColumns: (id: number) => ["dataSourceColumns", id] as const,
  dataSourceEntries: (id: number, year?: number, quarter?: number) =>
    ["dataSourceEntries", id, year ?? null, quarter ?? null] as const,
  dataSourceLinks: (id: number) => ["dataSourceLinks", id] as const,
};

// Queries --------------------------------------------------------------------
export const useCommittees = () =>
  useQuery({ queryKey: qk.committees, queryFn: committeesRepo.list });

export const useCommitteeUsage = (id: string | null) =>
  useQuery({
    queryKey: qk.committeeUsage(id ?? ""),
    queryFn: () => committeesRepo.usage(id as string),
    enabled: !!id,
  });

export const useFaculty = () =>
  useQuery({ queryKey: qk.faculty, queryFn: facultyRepo.list });

export const useFacultyRecords = () =>
  useQuery({ queryKey: qk.facultyRecords, queryFn: facultyRecordsRepo.list });

export const useCommitteeMemberships = () =>
  useQuery({ queryKey: qk.committeeMemberships, queryFn: committeeMembershipsRepo.list });

export const useKpis = () =>
  useQuery({ queryKey: qk.kpis, queryFn: kpisRepo.list });

export const useKpi = (id: string) =>
  useQuery({ queryKey: qk.kpi(id), queryFn: () => kpisRepo.get(id), enabled: !!id });

export const useKpiCategories = (setId?: number, opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: qk.kpiCategoriesFor(setId),
    queryFn: () => kpiCategoriesRepo.list(setId),
    enabled: opts?.enabled ?? true,
  });

export const useMetrics = () =>
  useQuery({ queryKey: qk.metrics, queryFn: metricsRepo.list });

export const useMetricsByKpi = (kpiId: string) =>
  useQuery({
    queryKey: qk.metricsByKpi(kpiId),
    queryFn: () => metricsRepo.listByKpi(kpiId),
    enabled: !!kpiId,
  });

export const useFormulas = () =>
  useQuery({ queryKey: qk.formulas, queryFn: formulasRepo.list });

export const useAllVersions = () =>
  useQuery({ queryKey: qk.allVersions, queryFn: formulasRepo.allVersions });

export const useMeasurements = () =>
  useQuery({ queryKey: qk.measurements, queryFn: measurementsRepo.list });

export const useValidations = () =>
  useQuery({ queryKey: qk.validations, queryFn: validationsRepo.list });

// Mutations ------------------------------------------------------------------

/** `faculty` is optional on the way in: the route defaults it to the school. */
export type CommitteeInput = Omit<Committee, "id" | "faculty"> & { faculty?: string };

export function useCreateCommittee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CommitteeInput) => committeesRepo.create(input),
    meta: { toast: (d) => `Committee "${(d as Committee).name}" added` },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.committees }),
  });
}

export function useUpdateCommittee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Committee, "id">> }) =>
      committeesRepo.update(id, patch),
    meta: { toast: "Committee updated" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.committees }),
  });
}

export function useDeleteCommittee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => committeesRepo.remove(id),
    meta: { toast: "Committee deleted" },
    // The route refuses while anything is attached, so in practice there is no
    // roster left to drop — but committee_memberships cascades, so the cached
    // list would still be stale if that guard is ever relaxed.
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: qk.committees });
      qc.invalidateQueries({ queryKey: qk.committeeMemberships });
      qc.removeQueries({ queryKey: qk.committeeUsage(id) });
    },
  });
}

export function useCreateFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<FacultyMember, "id">) => facultyRepo.create(input),
    meta: { toast: "Faculty member added" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.faculty }),
  });
}

export function useUpdateFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FacultyMember> }) =>
      facultyRepo.update(id, patch),
    meta: { toast: "Faculty member updated" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.faculty }),
  });
}

export function useDeleteFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facultyRepo.remove(id),
    meta: { toast: "Faculty member removed" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.faculty }),
  });
}

export function useCreateFacultyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<FacultyRecord, "id">) => facultyRecordsRepo.create(input),
    meta: { toast: "Faculty member added" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.facultyRecords }),
  });
}

export function useUpdateFacultyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FacultyRecord> }) =>
      facultyRecordsRepo.update(id, patch),
    meta: { toast: "Faculty member updated" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.facultyRecords }),
  });
}

export function useDeleteFacultyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facultyRecordsRepo.remove(id),
    meta: { toast: "Faculty member removed" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.facultyRecords }),
  });
}

export function useCreateCommitteeMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      facultyId: string;
      committeeId: string;
      position: CommitteeMembership["position"];
      kpiFocus: string;
    }) => committeeMembershipsRepo.create(input),
    meta: {
      toast: (d) => `${(d as CommitteeMembership).facultyName} assigned to committee`,
      errorToast: "Failed to assign faculty member",
    },
    // The roster size is one of the things that blocks deleting a committee,
    // so the usage counts go stale whenever a membership appears or disappears.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.committeeMemberships });
      qc.invalidateQueries({ queryKey: ["committeeUsage"] });
    },
  });
}

export function useUpdateCommitteeMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facultyId,
      committeeId,
      patch,
    }: {
      facultyId: string;
      committeeId: string;
      patch: { position?: CommitteeMembership["position"]; kpiFocus?: string };
    }) => committeeMembershipsRepo.update(facultyId, committeeId, patch),
    meta: { toast: "Membership updated" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.committeeMemberships }),
  });
}

export function useDeleteCommitteeMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facultyId, committeeId }: { facultyId: string; committeeId: string }) =>
      committeeMembershipsRepo.remove(facultyId, committeeId),
    meta: { toast: "Membership removed" },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.committeeMemberships });
      qc.invalidateQueries({ queryKey: ["committeeUsage"] });
    },
  });
}

export function useCreateKpiCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      setId?: number;
      label: string;
      description?: string;
      sortOrder?: number;
    }) => kpiCategoriesRepo.create(input),
    meta: { toast: (d) => `Category "${(d as KpiCategoryRecord).label}" added` },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kpiCategories }),
  });
}

export function useUpdateKpiCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { label?: string; description?: string; sortOrder?: number };
    }) => kpiCategoriesRepo.update(id, patch),
    meta: { toast: "Category updated" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kpiCategories }),
  });
}

export function useDeleteKpiCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kpiCategoriesRepo.remove(id),
    meta: { toast: "Category removed" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kpiCategories }),
  });
}

// ── Units (admin-managed measurement units) ─────────────────────────────────
export const useUnits = () =>
  useQuery({ queryKey: qk.units, queryFn: unitsRepo.list });

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { unitNameTh: string; unitNameEn: string; description?: string }) =>
      unitsRepo.create(input),
    meta: { toast: (d) => `Unit "${(d as UnitRecord).unitNameEn}" added` },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.units }),
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number;
      patch: { unitNameTh?: string; unitNameEn?: string; description?: string };
    }) => unitsRepo.update(id, patch),
    meta: { toast: "Unit updated" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.units }),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unitsRepo.remove(id),
    meta: { toast: "Unit removed" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.units }),
  });
}

// Drag-to-reorder: applies the new order to the cache immediately (so the
// dragged row doesn't snap back while the request is in flight) and rolls
// back on failure. No toast — the row settling into place is the feedback.
export function useReorderKpiCategories(setId?: number) {
  const qc = useQueryClient();
  const key = qk.kpiCategoriesFor(setId);
  return useMutation({
    mutationFn: (order: string[]) => kpiCategoriesRepo.reorder(order),
    onMutate: async (order: string[]) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<KpiCategoryRecord[]>(key);
      if (previous) {
        const byId = new Map(previous.map((c) => [c.id, c]));
        const reordered = order
          .map((id, i) => {
            const c = byId.get(id);
            return c ? { ...c, sortOrder: i + 1 } : undefined;
          })
          .filter((c): c is KpiCategoryRecord => !!c);
        qc.setQueryData(key, reordered);
      }
      return { previous };
    },
    onError: (_err, _order, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.kpiCategories }),
  });
}

export function useCreateKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Kpi, "id">) => kpisRepo.create(input),
    meta: { toast: "KPI created" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kpis }),
  });
}

export function useUpdateKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Kpi> }) =>
      kpisRepo.update(id, patch),
    meta: { toast: "KPI updated" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.kpis });
      qc.invalidateQueries({ queryKey: qk.kpi(id) });
    },
  });
}

export function useDeleteKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kpisRepo.remove(id),
    meta: { toast: "KPI deleted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kpis }),
  });
}

export function useUpsertMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Metric | Omit<Metric, "id">) =>
      "id" in input
        ? metricsRepo.update(input.id, input)
        : metricsRepo.create(input),
    meta: {
      toast: (_d, v) => ("id" in (v as object) ? "Metric updated" : "Metric created"),
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics"] }),
  });
}

export function useDeleteMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metricsRepo.remove(id),
    meta: { toast: "Metric deleted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics"] }),
  });
}

export function useSaveFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: number;
      expression: string;
      author: string;
      changeNote: string;
    }) => formulasRepo.save(args.id, args.expression, args.author, args.changeNote),
    meta: { toast: "Formula saved" },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formulas"] }),
  });
}

export function useRevertFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { formulaId: number; versionId: number; author: string }) =>
      formulasRepo.revert(args.formulaId, args.versionId, args.author),
    meta: { toast: "Formula reverted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formulas"] }),
  });
}

// ── KPI Management — Strategic Sets ─────────────────────────────────────────
export const useStrategicSets = () =>
  useQuery({ queryKey: qk.strategicSets, queryFn: strategicSetsRepo.list });

export const useStrategicSet = (id: number) =>
  useQuery({
    queryKey: qk.strategicSet(id),
    queryFn: () => strategicSetsRepo.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export function useCreateStrategicSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      startYear: number;
      cloneFromSetId?: number;
      createdBy?: string;
    }) => strategicSetsRepo.create(input),
    meta: {
      toast: (d, v) =>
        (v as { cloneFromSetId?: number }).cloneFromSetId
          ? `Set "${(d as StrategicSet).name}" cloned`
          : `Set "${(d as StrategicSet).name}" created`,
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.strategicSets }),
  });
}

export function useUpdateStrategicSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number;
      patch: { name?: string; description?: string; status?: StrategicSetStatus };
    }) => strategicSetsRepo.update(id, patch),
    meta: { toast: "Strategic set updated" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.strategicSets });
      qc.invalidateQueries({ queryKey: qk.strategicSet(id) });
    },
  });
}

export function useDeleteStrategicSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => strategicSetsRepo.remove(id),
    meta: { toast: "Strategic set deleted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.strategicSets }),
  });
}

// ── Library KPIs ────────────────────────────────────────────────────────────
export const useLibraryKpis = (setId: number) =>
  useQuery({
    queryKey: qk.libraryKpis(setId),
    queryFn: () => libraryKpisRepo.listBySet(setId),
    enabled: Number.isFinite(setId) && setId > 0,
  });

export const useLibraryKpi = (id: number) =>
  useQuery({
    queryKey: qk.libraryKpi(id),
    queryFn: () => libraryKpisRepo.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export function useCreateLibraryKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<LibraryKpi> & { setId: number; name: string }) =>
      libraryKpisRepo.create(input),
    meta: { toast: (d) => `KPI "${(d as LibraryKpi).name}" created` },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: qk.libraryKpis((d as LibraryKpi).setId) });
      qc.invalidateQueries({ queryKey: qk.strategicSets });
    },
  });
}

export function useUpdateLibraryKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<LibraryKpi> }) =>
      libraryKpisRepo.update(id, patch),
    meta: { toast: "KPI updated" },
    onSuccess: (d) => {
      const k = d as LibraryKpi;
      qc.invalidateQueries({ queryKey: qk.libraryKpi(k.id) });
      qc.invalidateQueries({ queryKey: qk.libraryKpis(k.setId) });
    },
  });
}

export function useDeleteLibraryKpi(setId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => libraryKpisRepo.remove(id),
    meta: { toast: "KPI deleted" },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.libraryKpis(setId) });
      qc.invalidateQueries({ queryKey: qk.strategicSets });
    },
  });
}

export function useSaveLibraryKpiTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targets }: { id: number; targets: AnnualTarget[] }) =>
      libraryKpisRepo.saveTargets(id, targets),
    meta: { toast: "Targets saved" },
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: qk.libraryKpi(id) }),
  });
}

// ── Library Metrics (sub-KPIs) ──────────────────────────────────────────────
export const useLibraryMetrics = (kpiId: number) =>
  useQuery({
    queryKey: qk.libraryMetrics(kpiId),
    queryFn: () => libraryMetricsRepo.listByKpi(kpiId),
    enabled: Number.isFinite(kpiId) && kpiId > 0,
  });

export function useCreateLibraryMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<LibraryMetric> & { kpiId: number; name: string }) =>
      libraryMetricsRepo.create(input),
    meta: { toast: (d) => `Metric "${(d as LibraryMetric).name}" created` },
    onSuccess: (d) =>
      qc.invalidateQueries({ queryKey: qk.libraryMetrics((d as LibraryMetric).kpiId) }),
  });
}

export function useUpdateLibraryMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<LibraryMetric> }) =>
      libraryMetricsRepo.update(id, patch),
    meta: { toast: "Metric updated" },
    onSuccess: (d) =>
      qc.invalidateQueries({ queryKey: qk.libraryMetrics((d as LibraryMetric).kpiId) }),
  });
}

export function useDeleteLibraryMetric(kpiId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => libraryMetricsRepo.remove(id),
    meta: { toast: "Metric deleted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.libraryMetrics(kpiId) }),
  });
}

export function useSaveLibraryMetricTargets(kpiId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targets }: { id: number; targets: AnnualTarget[] }) =>
      libraryMetricsRepo.saveTargets(id, targets),
    meta: { toast: "Targets saved" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.libraryMetrics(kpiId) }),
  });
}

// ── Performance records (activated snapshots) ───────────────────────────────
export const usePerformanceRecords = () =>
  useQuery({ queryKey: qk.performanceRecords, queryFn: performanceRecordsRepo.list });

export const usePerformanceRecord = (id: number) =>
  useQuery({
    queryKey: qk.performanceRecord(id),
    queryFn: () => performanceRecordsRepo.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export const usePerformancePeriods = (id: number) =>
  useQuery({
    queryKey: qk.performancePeriods(id),
    queryFn: () => performanceRecordsRepo.periods(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export const usePerfKpis = (recordId: number) =>
  useQuery({
    queryKey: qk.perfKpis(recordId),
    queryFn: () => performanceRecordsRepo.kpisByRecord(recordId),
    enabled: Number.isFinite(recordId) && recordId > 0,
  });

export function useActivatePerformanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sourceSetId: number; name?: string; activatedBy?: string }) =>
      performanceRecordsRepo.activate(input),
    meta: { toast: (d) => `Record "${(d as PerformanceRecord).name}" activated` },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.performanceRecords }),
  });
}

export function useUpdatePerformanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { name?: string; status?: PerformanceStatus } }) =>
      performanceRecordsRepo.update(id, patch),
    meta: { toast: "Record updated" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.performanceRecords });
      qc.invalidateQueries({ queryKey: qk.performanceRecord(id) });
    },
  });
}

export function useSyncPerformanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => performanceRecordsRepo.sync(id),
    meta: { toast: "Synced from library" },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: qk.performanceRecord(id) });
      qc.invalidateQueries({ queryKey: qk.perfKpis(id) });
    },
  });
}

export function useRecomputeFromDataSources() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => performanceRecordsRepo.recomputeFromSources(id),
    // The outcome is the message — it says what was skipped and why.
    meta: { toast: (d) => (d as { summary: string }).summary },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: qk.perfKpis(id) });
      qc.invalidateQueries({ queryKey: ["perfKpi"] });
      qc.invalidateQueries({ queryKey: ["perfMetrics"] });
    },
  });
}

export function useDeletePerformanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => performanceRecordsRepo.remove(id),
    meta: { toast: "Record deleted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.performanceRecords }),
  });
}

export function useSavePerformancePeriods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      periods,
      updatedBy,
    }: {
      id: number;
      periods: Pick<PerformancePeriod, "yearNo" | "quarterNo" | "isOpen">[];
      updatedBy?: string;
    }) => performanceRecordsRepo.savePeriods(id, periods, updatedBy),
    meta: { toast: "Recording periods updated" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.performancePeriods(id) });
      qc.invalidateQueries({ queryKey: qk.performanceRecords });
    },
  });
}

// ── Performance progress entry (KPIs + metrics) ─────────────────────────────
export const usePerfKpi = (id: number) =>
  useQuery({
    queryKey: qk.perfKpi(id),
    queryFn: () => performanceRecordsRepo.getKpi(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export const usePerfMetricsByKpi = (perfKpiId: number) =>
  useQuery({
    queryKey: qk.perfMetrics(perfKpiId),
    queryFn: () => performanceRecordsRepo.metricsByKpi(perfKpiId),
    enabled: Number.isFinite(perfKpiId) && perfKpiId > 0,
  });

/** Data sources linked to this KPI or any of its metrics. */
export const usePerfKpiSources = (perfKpiId: number) =>
  useQuery({
    queryKey: qk.perfKpiSources(perfKpiId),
    queryFn: () => performanceRecordsRepo.sourcesByKpi(perfKpiId),
    enabled: Number.isFinite(perfKpiId) && perfKpiId > 0,
  });

type ProgressInput = {
  yearNo: number;
  quarterNo: number;
  progressValue: number | null;
  variable1Value?: number | null;
  variable2Value?: number | null;
  issue: string;
  solution: string;
  recordedBy?: string;
  actorId?: string;
};

export function useSaveKpiProgress(perfKpiId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProgressInput) =>
      performanceRecordsRepo.saveKpiProgress(perfKpiId, input),
    meta: { toast: "Progress saved" },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.perfKpi(perfKpiId) }),
  });
}

export function useSaveMetricProgress(perfMetricId: number, perfKpiId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProgressInput) =>
      performanceRecordsRepo.saveMetricProgress(perfMetricId, input),
    meta: { toast: "Progress saved" },
    onSuccess: () => {
      // Parent KPI roll-up may have changed.
      qc.invalidateQueries({ queryKey: qk.perfKpi(perfKpiId) });
      // The Sub-KPIs table (usePerfMetricsByKpi) reads this list query — refresh
      // it too so saving in the pop-up updates the table live, in place.
      qc.invalidateQueries({ queryKey: qk.perfMetrics(perfKpiId) });
    },
  });
}

// ── Performance approval workflow (member → lead → counselor → locked) ───────
export const useRecordApprovals = (
  recordId: number,
  yearNo: number,
  quarterNo: number,
) =>
  useQuery({
    queryKey: qk.approvals(recordId, yearNo, quarterNo),
    queryFn: () => approvalsRepo.listByRecord(recordId, yearNo, quarterNo),
    enabled: Number.isFinite(recordId) && recordId > 0 && yearNo >= 1 && quarterNo >= 1,
  });

export const useKpiApproval = (
  perfKpiId: number,
  yearNo: number,
  quarterNo: number,
) =>
  useQuery({
    queryKey: qk.kpiApproval(perfKpiId, yearNo, quarterNo),
    queryFn: () => approvalsRepo.getForKpi(perfKpiId, yearNo, quarterNo),
    enabled: Number.isFinite(perfKpiId) && perfKpiId > 0 && yearNo >= 1 && quarterNo >= 1,
  });

/** Perform a workflow transition. Invalidates the record queue, the KPI's own
 *  approval thread, and its perf progress queries so the lock state refreshes. */
export function useApprovalTransition(recordId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      perfKpiId,
      input,
    }: {
      perfKpiId: number;
      input: ApprovalTransitionInput;
    }) => approvalsRepo.transition(perfKpiId, input),
    meta: {
      toast: (_d, v) => {
        const action = (v as { input: ApprovalTransitionInput }).input.action;
        const map: Record<string, string> = {
          submit: "Submitted for review",
          return: "Sent back for revision",
          forward: "Forwarded for final approval",
          approve: "Finally approved & locked",
          reject: "Rejected back to committee lead",
          reverse: "Approval reversed — record unlocked",
        };
        return map[action] ?? "Updated";
      },
    },
    onSuccess: (_d, { perfKpiId, input }) => {
      qc.invalidateQueries({
        queryKey: qk.approvals(recordId, input.yearNo, input.quarterNo),
      });
      qc.invalidateQueries({
        queryKey: qk.kpiApproval(perfKpiId, input.yearNo, input.quarterNo),
      });
      qc.invalidateQueries({ queryKey: qk.perfKpi(perfKpiId) });
      qc.invalidateQueries({ queryKey: qk.perfMetrics(perfKpiId) });
    },
  });
}

export function useDecideValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      status: ValidationStatus;
      reviewerId: string;
      comment?: ValidationComment;
    }) => validationsRepo.decide(args.id, args.status, args.reviewerId, args.comment),
    meta: {
      toast: (_d, v) => {
        const s = (v as { status: ValidationStatus }).status;
        return s === "approved"
          ? "Submission approved"
          : s === "rejected"
            ? "Submission rejected"
            : "Clarification requested";
      },
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.validations }),
  });
}

// ── Data sources (committee raw data) ───────────────────────────────────────
export const useDataSources = (filter?: {
  committeeId?: string;
  status?: DataSourceStatus;
}) =>
  useQuery({
    queryKey: qk.dataSources(filter?.committeeId, filter?.status),
    queryFn: () => dataSourcesRepo.list(filter),
  });

export const useDataSource = (id: number) =>
  useQuery({
    queryKey: qk.dataSource(id),
    queryFn: () => dataSourcesRepo.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export const useDataSourceColumns = (id: number) =>
  useQuery({
    queryKey: qk.dataSourceColumns(id),
    queryFn: () => dataSourcesRepo.columns(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export const useDataSourceEntries = (
  id: number,
  filter?: { year?: number; quarter?: number },
) =>
  useQuery({
    queryKey: qk.dataSourceEntries(id, filter?.year, filter?.quarter),
    queryFn: () => dataSourcesRepo.entries(id, filter),
    enabled: Number.isFinite(id) && id > 0,
  });

export const useDataSourceLinks = (id: number) =>
  useQuery({
    queryKey: qk.dataSourceLinks(id),
    queryFn: () => dataSourcesRepo.links(id),
    enabled: Number.isFinite(id) && id > 0,
  });

export function useCreateDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof dataSourcesRepo.create>[0]) =>
      dataSourcesRepo.create(input),
    meta: { toast: (d) => `Data source "${(d as DataSource).name}" created` },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dataSources"] }),
  });
}

export function useUpdateDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number;
      patch: Parameters<typeof dataSourcesRepo.update>[1];
    }) => dataSourcesRepo.update(id, patch),
    meta: { toast: "Data source updated" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      qc.invalidateQueries({ queryKey: qk.dataSource(id) });
    },
  });
}

export function useDeleteDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dataSourcesRepo.remove(id),
    meta: { toast: "Data source deleted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dataSources"] }),
  });
}

export function useSaveDataSourceColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, columns }: { id: number; columns: DataSourceColumnInput[] }) =>
      dataSourcesRepo.saveColumns(id, columns),
    meta: { toast: "Columns saved" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.dataSourceColumns(id) });
      // Entries render through the column set, so their view is stale too.
      qc.invalidateQueries({ queryKey: ["dataSourceEntries", id] });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
    },
  });
}

export function useCreateDataSourceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DataSourceEntryInput }) =>
      dataSourcesRepo.createEntry(id, input),
    meta: { toast: "Entry recorded" },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["dataSourceEntries", id] });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      invalidatePerformanceValues(qc);
    },
  });
}

export function useBulkCreateDataSourceEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DataSourceBulkEntryInput }) =>
      dataSourcesRepo.bulkCreateEntries(id, input),
    meta: {
      toast: (d: unknown) => {
        const n = (d as { inserted: number }).inserted;
        return `${n} ${n === 1 ? "entry" : "entries"} imported`;
      },
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["dataSourceEntries", id] });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      invalidatePerformanceValues(qc);
    },
  });
}

export function useUpdateDataSourceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      input,
    }: {
      dataSourceId: number;
      entryId: number;
      input: Partial<DataSourceEntryInput>;
    }) => dataSourcesRepo.updateEntry(entryId, input),
    meta: { toast: "Entry updated" },
    onSuccess: (_d, { dataSourceId }) => {
      qc.invalidateQueries({ queryKey: ["dataSourceEntries", dataSourceId] });
      invalidatePerformanceValues(qc);
    },
  });
}

export function useDeleteDataSourceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      actor,
    }: {
      dataSourceId: number;
      entryId: number;
      actor: { actorId?: string; userRole?: string };
    }) => dataSourcesRepo.removeEntry(entryId, actor),
    meta: { toast: "Entry deleted" },
    onSuccess: (_d, { dataSourceId }) => {
      qc.invalidateQueries({ queryKey: ["dataSourceEntries", dataSourceId] });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      invalidatePerformanceValues(qc);
    },
  });
}

/** Writing a link or an entry recomputes performance values, which can belong to
 *  any record — drop the whole perf slice rather than guess which. */
function invalidatePerformanceValues(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["perfKpis"] });
  qc.invalidateQueries({ queryKey: ["perfKpi"] });
  qc.invalidateQueries({ queryKey: ["perfMetrics"] });
  // The set of linked sources changes with the link itself, and the performance
  // page's Linked Data Sources section reads it — without this, creating,
  // editing or removing a link there appears to do nothing until a reload.
  qc.invalidateQueries({ queryKey: ["perfKpiSources"] });
}

/** "Linked · 12 quarters updated · 4 skipped (4 period closed)". The feed summary
 *  is omitted for an evidence-only link, which computes nothing. */
function linkToast(head: string, data: unknown): string {
  const { feed } = (data ?? {}) as LinkWriteResult;
  return feed && !feed.startsWith("0 quarters") ? `${head} · ${feed}` : head;
}

export function useCreateDataSourceLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DataSourceLinkInput }) =>
      dataSourcesRepo.createLink(id, input),
    // The link immediately recomputes what it feeds; say what that did.
    meta: { toast: (d) => linkToast("Linked", d) },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.dataSourceLinks(id) });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      invalidatePerformanceValues(qc);
    },
  });
}

export function useUpdateDataSourceLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      linkId,
      patch,
    }: {
      dataSourceId: number;
      linkId: number;
      patch: { mappings?: DataSourceLinkMapping[]; note?: string | null };
    }) => dataSourcesRepo.updateLink(linkId, patch),
    meta: { toast: (d) => linkToast("Link updated", d) },
    onSuccess: (_d, { dataSourceId }) => {
      qc.invalidateQueries({ queryKey: qk.dataSourceLinks(dataSourceId) });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      invalidatePerformanceValues(qc);
    },
  });
}

export function useDeleteDataSourceLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId }: { dataSourceId: number; linkId: number }) =>
      dataSourcesRepo.removeLink(linkId),
    meta: { toast: "Link removed" },
    onSuccess: (_d, { dataSourceId }) => {
      qc.invalidateQueries({ queryKey: qk.dataSourceLinks(dataSourceId) });
      qc.invalidateQueries({ queryKey: ["dataSources"] });
      // Values it already fed keep their last number, but what feeds them no
      // longer does — so the perf slice (fedBy flags, the linked-sources list)
      // is stale until it refetches.
      invalidatePerformanceValues(qc);
    },
  });
}

/** The academic catalog (programs + curricula). Small, stable reference data —
 *  one query serves every program/curriculum picker on the page. */
export const useAcademicCatalog = () =>
  useQuery({ queryKey: qk.academicCatalog, queryFn: academicCatalogRepo.get });
