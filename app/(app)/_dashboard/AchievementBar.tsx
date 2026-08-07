"use client";

import { HEALTH_FILL } from "@/components/ui";
import type { Health } from "@/lib/kpi/progress";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Achievement as a bar that grows from zero on mount. Capped at 100% wide so an
 *  over-achieving KPI cannot push its column open; the number tells the truth. */
export function AchievementBar({
  pct,
  health,
  size = "md",
  showValue = true,
  className,
}: {
  pct: number | null;
  health: Health | null;
  /** "sm" drops the track to a fixed-free full width for the compact tiles. */
  size?: "sm" | "md";
  /** Lets compact tiles place the percentage alongside their other readings. */
  showValue?: boolean;
  className?: string;
}) {
  if (pct == null) return showValue ? <span className="text-caption-sm text-mute">—</span> : null;
  const width = Math.max(2, Math.min(100, pct));
  const small = size === "sm";
  return (
    <div className={cn("flex items-center gap-sm", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-surface-container-high",
          small ? "h-1.5 min-w-0 flex-1" : "h-2 w-[110px] shrink-0",
        )}
      >
        <div
          className="h-full origin-left rounded-full animate-grow-x"
          style={{ width: `${width}%`, background: HEALTH_FILL[health ?? "no_data"] }}
        />
      </div>
      {showValue && (
        <span
          className={cn(
            "tabular-nums text-on-surface",
            small ? "text-utility-xs shrink-0" : "text-caption-sm",
          )}
        >
          {formatNumber(pct, 0)}%
        </span>
      )}
    </div>
  );
}
