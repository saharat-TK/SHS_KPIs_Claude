"use client";

import { Button, Card, CountUp, RingGauge, HEALTH_FILL } from "@/components/ui";
import type { CategoryDetailRow } from "@/lib/kpi/dashboard";
import { cn } from "@/lib/utils";
import { KpiMiniBars } from "./KpiMiniBars";
import { metBand } from "./metBand";

// Category scorecards use pale semantic 50 surfaces with 200-level borders.
// The 500-level ring sits a shade lighter than the 600-level text.
const CATEGORY_CARD_SURFACE = {
  healthy: { card: "!bg-[#f7fee7] !border-[#d9f99d]", muted: "text-[#65a30d]", donut: "#84cc16" },
  watch: { card: "!bg-[#fff7ed] !border-[#fed7aa]", muted: "text-[#ea580c]", donut: "#f97316" },
  at_risk: { card: "!bg-[#fef2f2] !border-[#fecaca]", muted: "text-[#dc2626]", donut: "#ef4444" },
} as const;

const CATEGORY_KPI_NAME_ORDER = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

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
  const tint = band ? CATEGORY_CARD_SURFACE[band] : null;
  const muted = tint?.muted ?? "text-mute";

  return (
    <Card className={cn("flex flex-col gap-md p-md", tint?.card)}>
      <h3 className={cn("text-heading-md uppercase", muted)}>{row.label}</h3>

      <div className="flex flex-col gap-md lg:flex-row lg:items-start">
        {/* Column 1 — the two summary readings. They routinely disagree (a group
            can average 106% with only 3 of 5 met), so each keeps its own label. */}
        <div className="flex flex-col gap-md lg:w-[180px] lg:shrink-0 lg:items-center">
          <div className="flex items-center gap-md lg:flex-col lg:items-center">
            <RingGauge
              value={row.onTarget}
              total={row.total}
              size={88}
              fill={tint?.donut ?? HEALTH_FILL.no_data}
              label={`${row.onTarget} of ${row.total} KPIs met target`}
              centerTextClassName="text-[25px] leading-none"
              animateCenterValue
            />
            <div className="lg:text-center">
              <p className={cn("text-utility-xs uppercase", muted)}>KPIs met target</p>
              <p className={cn("text-caption-sm mt-tiny", muted)}>
                <CountUp value={row.onTarget} /> of <CountUp value={row.total} />
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className={cn("h-px w-16 shrink-0 bg-current opacity-40", muted)}
          />

          <div className="lg:text-center">
            <span className="text-[30px] leading-none font-bold text-on-surface tabular-nums">
              {row.pct == null ? "—" : <CountUp value={row.pct} suffix="%" />}
            </span>
            <p className={cn("text-utility-xs uppercase mt-xs", muted)}>Avg achievement</p>
            <p className={cn("text-caption-sm mt-tiny", muted)}>
              <CountUp value={row.total} /> KPI{row.total === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Column 2 — the group's KPIs. The rule turns horizontal when the
            columns stack, since a left border on a full-width block would just
            be a stray line down the page. */}
        <div className="min-w-0 flex-1 border-t border-hairline pt-md lg:border-l lg:border-t-0 lg:pl-md lg:pt-0">
          <KpiMiniBars
            statuses={[...row.statuses].sort((a, b) => CATEGORY_KPI_NAME_ORDER.compare(a.name, b.name))}
            onOpenKpi={onOpenKpi}
            layout="row"
          />
        </div>

        {/* Column 3 — the drill-through. */}
        <div className="lg:shrink-0">
          <Button
            variant="ghost"
            size="sm"
            iconRight="chevron_right"
            onClick={onSelect}
            aria-label={`View ${row.label}`}
          >
            View group
          </Button>
        </div>
      </div>
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
