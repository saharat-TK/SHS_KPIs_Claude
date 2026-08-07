"use client";

import { Button, Card } from "@/components/ui";
import { HEALTH_SURFACE } from "@/lib/kpi/progress";
import type { CategoryDetailRow } from "@/lib/kpi/dashboard";
import { cn, formatNumber } from "@/lib/utils";
import { AchievementBar } from "./AchievementBar";
import { KpiMiniBars } from "./KpiMiniBars";
import { metBand } from "./metBand";

/**
 * One strategic group: how many of its KPIs met target, how far it got on
 * average, and every KPI in it.
 *
 * The root is a section rather than a button so the KPI tiles inside can be
 * buttons of their own — the header carries the drill into the group's tab.
 */
function ScorecardTile({
  row,
  onSelect,
  onOpenKpi,
}: {
  row: CategoryDetailRow;
  onSelect: () => void;
  onOpenKpi: (kpiId: number) => void;
}) {
  // Tinted from the MET ratio, not from row.health: the highlighted figure is
  // the met ratio, and a card that tints green behind a number reading 33%
  // argues with itself. row.health (worst graded member) still drives the
  // group bar chart, where achievement is what is being plotted.
  //
  // The !important prefixes are load-bearing — cn() is a plain join, so an
  // un-important tint loses to Card's own bg-surface-lowest.
  const band = metBand(row.pctMet);
  const tint = band ? HEALTH_SURFACE[band] : null;
  const muted = tint?.muted ?? "text-mute";

  return (
    <Card className={cn("flex flex-col gap-md p-md", tint?.card)}>
      <div className="flex items-start justify-between gap-md">
        <h3 className={cn("text-utility-xs uppercase", muted)}>{row.label}</h3>
        <Button
          variant="ghost"
          size="sm"
          iconRight="chevron_right"
          onClick={onSelect}
          aria-label={`View ${row.label}`}
          className="shrink-0"
        >
          View group
        </Button>
      </div>

      {/* Two readings of the same group that routinely disagree, so each keeps
          its own label — a group can average 106% with only 3 of 5 met. */}
      <div className="flex flex-wrap items-start gap-lg">
        <div className="min-w-[160px] flex-1">
          <div className="flex items-end gap-xs">
            <span className="text-display-lg leading-none text-on-surface tabular-nums">
              {row.pctMet == null ? "—" : formatNumber(row.pctMet, 0)}
            </span>
            {row.pctMet != null && (
              <span className={cn("text-body-sm mb-xs", muted)}>%</span>
            )}
          </div>
          <p className={cn("text-utility-xs uppercase mt-xs", muted)}>KPIs met target</p>
          <p className={cn("text-caption-sm mt-tiny", muted)}>
            {row.onTarget} of {row.total}
          </p>
          <AchievementBar pct={row.pctMet} health={band} size="sm" className="mt-sm" />
        </div>

        <div className="min-w-[140px]">
          <div className="flex items-end gap-xs">
            <span className="text-display-md leading-none text-on-surface tabular-nums">
              {row.pct == null ? "—" : formatNumber(row.pct, 0)}
            </span>
            {row.pct != null && <span className={cn("text-body-sm mb-tiny", muted)}>%</span>}
          </div>
          <p className={cn("text-utility-xs uppercase mt-xs", muted)}>Avg achievement</p>
          <p className={cn("text-caption-sm mt-tiny", muted)}>
            {row.total} KPI{row.total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <KpiMiniBars statuses={row.statuses} onOpenKpi={onOpenKpi} layout="row" />
    </Card>
  );
}

export function StrategyScorecards({
  rows,
  onSelect,
  onOpenKpi,
}: {
  rows: CategoryDetailRow[];
  onSelect: (groupId: string) => void;
  onOpenKpi: (kpiId: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-md">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
        >
          <ScorecardTile
            row={row}
            onSelect={() => onSelect(row.id)}
            onOpenKpi={onOpenKpi}
          />
        </div>
      ))}
    </div>
  );
}
