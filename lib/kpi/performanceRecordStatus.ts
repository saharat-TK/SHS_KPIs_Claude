import type { PerformanceStatus } from "@/lib/types";

export const PERFORMANCE_RECORD_STATUSES = ["active", "inactive", "completed"] as const;

export function isPerformanceStatus(value: unknown): value is PerformanceStatus {
  return typeof value === "string" && PERFORMANCE_RECORD_STATUSES.includes(value as PerformanceStatus);
}

export function isActivePerformanceRecord(status: PerformanceStatus): boolean {
  return status === "active";
}
