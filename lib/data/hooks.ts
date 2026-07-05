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
  committeesRepo,
  committeeMembershipsRepo,
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
  faculty: ["faculty"] as const,
  kpis: ["kpis"] as const,
  kpi: (id: string) => ["kpis", id] as const,
  kpiCategories: ["kpiCategories"] as const,
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
};

// Queries --------------------------------------------------------------------
export const useCommittees = () =>
  useQuery({ queryKey: qk.committees, queryFn: committeesRepo.list });

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

export const useKpiCategories = () =>
  useQuery({ queryKey: qk.kpiCategories, queryFn: kpiCategoriesRepo.list });

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
export function useCreateCommittee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Committee, "id">) => committeesRepo.create(input),
    meta: { toast: (d) => `Committee "${(d as Committee).name}" added` },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.committees }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.committeeMemberships }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.committeeMemberships }),
  });
}

export function useCreateKpiCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { label: string; description?: string; sortOrder?: number }) =>
      kpiCategoriesRepo.create(input),
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
export function useReorderKpiCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => kpiCategoriesRepo.reorder(order),
    onMutate: async (order: string[]) => {
      await qc.cancelQueries({ queryKey: qk.kpiCategories });
      const previous = qc.getQueryData<KpiCategoryRecord[]>(qk.kpiCategories);
      if (previous) {
        const byId = new Map(previous.map((c) => [c.id, c]));
        const reordered = order
          .map((id, i) => {
            const c = byId.get(id);
            return c ? { ...c, sortOrder: i + 1 } : undefined;
          })
          .filter((c): c is KpiCategoryRecord => !!c);
        qc.setQueryData(qk.kpiCategories, reordered);
      }
      return { previous };
    },
    onError: (_err, _order, context) => {
      if (context?.previous) qc.setQueryData(qk.kpiCategories, context.previous);
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

type ProgressInput = {
  yearNo: number;
  quarterNo: number;
  progressValue: number | null;
  issue: string;
  solution: string;
  recordedBy?: string;
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
