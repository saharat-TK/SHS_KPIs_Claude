import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type AchievementStatus = "met" | "below" | "none";

/**
 * Reads achievement straight off the percentage, not off the KPI's configured
 * health thresholds: 100% or more met the target, anything above zero is short
 * of it, and zero means nothing was achieved yet.
 */
export function achievementStatus(pct: number | null): AchievementStatus | null {
  if (pct == null) return null;
  if (pct >= 100) return "met";
  if (pct > 0) return "below";
  return "none";
}

const STATUS_ICON: Record<AchievementStatus, { name: string; className: string; label: string }> = {
  met: { name: "check_circle", className: "text-success", label: "Met target" },
  below: { name: "warning", className: "text-warning", label: "Below target" },
  none: { name: "cancel", className: "text-error", label: "No progress" },
};

/** Status icon placed in front of a KPI tile's percentage, in place of the
 *  progress bar. Renders nothing when there is no reading yet. */
export function AchievementStatusIcon({
  pct,
  size = 20,
  className,
}: {
  pct: number | null;
  size?: number;
  className?: string;
}) {
  const status = achievementStatus(pct);
  if (!status) return null;
  const icon = STATUS_ICON[status];
  return (
    <span role="img" aria-label={icon.label} title={icon.label} className={cn("inline-flex shrink-0", className)}>
      <Icon name={icon.name} size={size} className={cn(icon.className, "[font-variation-settings:'FILL'_1]")} />
    </span>
  );
}
