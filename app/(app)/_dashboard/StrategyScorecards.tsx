"use client";

import { Card } from "@/components/ui";
import { HEALTH_SURFACE } from "@/lib/kpi/progress";
import type { CategoryRow } from "@/lib/kpi/dashboard";
import { cn, formatNumber } from "@/lib/utils";
import { AchievementBar } from "./AchievementBar";

/** One strategic group as a scorecard: how much of its target it reached, and
 *  how many of its KPIs actually met theirs. Clicking drills into that group. */
function ScorecardTile({ row, onSelect }: { row: CategoryRow; onSelect: () => void }) {
  // HEALTH_SURFACE tints are marked !important because cn() is a plain join —
  // without that they lose to Card's own bg-surface-lowest.
  const tint = row.health ? HEALTH_SURFACE[row.health] : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`View ${row.label} — ${row.pct == null ? "no data" : `${formatNumber(row.pct, 0)}% achievement`}`}
      className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-sm p-md transition-shadow hover:shadow-chrome",
          tint?.card,
        )}
      >
        <span className={cn("text-utility-xs uppercase truncate", tint?.muted ?? "text-mute")}>
          {row.label}
        </span>
        <div className="flex items-end gap-xs">
          <span className="text-display-md leading-none text-on-surface tabular-nums">
            {row.pct == null ? "—" : formatNumber(row.pct, 0)}
          </span>
          {row.pct != null && (
            <span className={cn("text-body-sm mb-xs", tint?.muted ?? "text-mute")}>%</span>
          )}
        </div>
        <AchievementBar pct={row.pct} health={row.health} size="sm" />
        <span className={cn("text-caption-sm", tint?.muted ?? "text-mute")}>
          {row.onTarget} of {row.total} KPIs met
        </span>
      </Card>
    </button>
  );
}

export function StrategyScorecards({
  rows,
  onSelect,
}: {
  rows: CategoryRow[];
  onSelect: (groupId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
        >
          <ScorecardTile row={row} onSelect={() => onSelect(row.id)} />
        </div>
      ))}
    </div>
  );
}
