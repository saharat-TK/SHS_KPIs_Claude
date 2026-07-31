import { cn } from "@/lib/utils";
import type { Thresholds } from "@/lib/types";
import { healthOf, type Health } from "@/lib/kpi/progress";

// healthOf / HEALTH_LABEL / Health now live in lib/kpi/progress.ts so the pure,
// node-testable maths can reach them without loading this JSX module. Re-exported
// here (and through components/ui/index.ts) so every existing call site is
// unchanged.
export { healthOf, HEALTH_LABEL, type Health } from "@/lib/kpi/progress";

const HEALTH_COLOR: Record<Health, string> = {
  healthy: "bg-primary-container",
  watch: "bg-warning",
  at_risk: "bg-error",
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
