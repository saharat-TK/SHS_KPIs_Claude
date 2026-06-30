import { cn } from "@/lib/utils";
import type { Thresholds } from "@/lib/types";

export type Health = "healthy" | "watch" | "at_risk";

export function healthOf(value: number, t: Thresholds): Health {
  if (value >= t.green) return "healthy";
  if (value >= t.amber) return "watch";
  return "at_risk";
}

const HEALTH_COLOR: Record<Health, string> = {
  healthy: "bg-primary-container",
  watch: "bg-warning",
  at_risk: "bg-error",
};

export const HEALTH_LABEL: Record<Health, string> = {
  healthy: "On Target",
  watch: "Watch",
  at_risk: "At Risk",
};

export function ThresholdBar({
  value,
  max = 100,
  thresholds,
  className,
}: {
  value: number;
  max?: number;
  thresholds: Thresholds;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const health = healthOf(value, thresholds);
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", HEALTH_COLOR[health])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
