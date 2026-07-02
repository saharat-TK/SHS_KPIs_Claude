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
  Metric,
  ValidationComment,
  ValidationStatus,
} from "@/lib/types";
import {
  committeesRepo,
  committeeMembershipsRepo,
  facultyRepo,
  facultyRecordsRepo,
  formulasRepo,
  kpisRepo,
  measurementsRepo,
  metricsRepo,
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
  metrics: ["metrics"] as const,
  metricsByKpi: (id: string) => ["metrics", "byKpi", id] as const,
  formulas: ["formulas"] as const,
  formulaVersions: (id: string) => ["formulas", id, "versions"] as const,
  allVersions: ["formulas", "versions", "all"] as const,
  measurements: ["measurements"] as const,
  validations: ["validations"] as const,
  facultyRecords: ["facultyRecords"] as const,
  committeeMemberships: ["committeeMemberships"] as const,
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

export const useFormulaVersions = (formulaId: string) =>
  useQuery({
    queryKey: qk.formulaVersions(formulaId),
    queryFn: () => formulasRepo.versions(formulaId),
    enabled: !!formulaId,
  });

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
      id: string;
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
    mutationFn: (args: { formulaId: string; versionId: string; author: string }) =>
      formulasRepo.revert(args.formulaId, args.versionId, args.author),
    meta: { toast: "Formula reverted" },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formulas"] }),
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
