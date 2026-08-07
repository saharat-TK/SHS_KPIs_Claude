"use client";

import { Card } from "@/components/ui";
import type { KpiStatus } from "@/lib/kpi/dashboard";
import { cn, formatNumber } from "@/lib/utils";
import { AchievementBar } from "./AchievementBar";

/** Two decimals, matching KpiDetailTable, so the same KPI reads identically on
 *  its tile and in the table. */
const fmt = (n: number | null) => (n == null ? "—" : formatNumber(n, 2));

/**
 * Every KPI in the selected group as a compact tile, so a group's shape reads at
 * a glance before the charts and the table go into detail.
 *
 * perf_kpi has no reference/code column, so the K1…Kn chip is positional. That
 * is stable rather than arbitrary: the API returns KPIs ordered by
 * (sort_order, id), which is the same order the record page lists them in.
 */
export function KpiMiniBars({
  statuses,
  onOpenKpi,
  layout = "grid",
}: {
  statuses: KpiStatus[];
  onOpenKpi: (kpiId: number) => void;
  /** "grid" fills the available width — right for a whole tab given over to one
   *  group. "row" packs fixed-width tiles from the left and wraps, so a group of
   *  three does not stretch across four columns inside its strategy card. */
  layout?: "grid" | "row";
}) {
  const row = layout === "row";
  return (
    <div
      className={
        row
          ? "flex flex-wrap items-start gap-sm"
          : "grid grid-cols-2 gap-sm md:grid-cols-3 xl:grid-cols-4"
      }
    >
      {statuses.map((s, i) => (
        <button
          key={s.kpiId}
          type="button"
          onClick={() => onOpenKpi(s.kpiId)}
          title={s.name}
          className={cn(
            "animate-fade-up rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            // Two-up on a phone, then fixed-width, 212px desktop tiles keep
            // the category-card row uniform without enlarging mobile tiles.
            row && "w-[calc(50%-0.1875rem)] sm:w-[180px] lg:h-[212px]",
          )}
          style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
        >
          <Card className="flex h-full flex-col gap-xs p-md transition-shadow hover:shadow-chrome">
            <span className="text-utility-xs uppercase text-mute">K{i + 1}</span>
            <span className="line-clamp-2 text-caption-sm text-on-surface">{s.name}</span>
            {row ? (
              <>
                {/* The two component readings sit in the tile's flexible middle
                    on desktop; mobile keeps the same content in normal flow. */}
                <div
                  className="flex flex-col gap-tiny pt-xs text-utility-xs tabular-nums text-mute lg:min-h-0 lg:flex-1 lg:justify-center"
                  title={`Recorded ${fmt(s.value)} against a Q target of ${fmt(s.quarterTarget)}${s.unit ? ` ${s.unit}` : ""}`}
                >
                  <span>
                    <span className="font-bold uppercase">Result</span>{" "}
                    {fmt(s.value)}{s.unit ? ` ${s.unit}` : ""}
                  </span>
                  <span>
                    <span className="font-bold uppercase">Target</span>{" "}
                    {fmt(s.quarterTarget)}{s.unit ? ` ${s.unit}` : ""}
                  </span>
                </div>
                {/* The percentage stays above the full-width track; its 30px
                    desktop treatment leaves the compact mobile value intact. */}
                <div className="flex flex-col gap-tiny">
                  <span className="self-end text-body-sm font-bold tabular-nums text-on-surface lg:text-[30px] lg:leading-none">
                    {s.pct == null ? "—" : `${formatNumber(s.pct, 0)}%`}
                  </span>
                  <AchievementBar
                    pct={s.pct}
                    health={s.health}
                    size="sm"
                    showValue={false}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              /* The selected-category grid retains its existing shared lower
                 baseline and bar-plus-percentage arrangement. */
              <div className="mt-auto flex flex-col gap-tiny pt-xs">
                <AchievementBar pct={s.pct} health={s.health} size="sm" />
                {(s.value != null || s.quarterTarget != null) && (
                  <span
                    className="truncate text-utility-xs font-normal tabular-nums text-mute"
                    title={`Recorded ${fmt(s.value)} against a Q target of ${fmt(s.quarterTarget)}${s.unit ? ` ${s.unit}` : ""}`}
                  >
                    {fmt(s.value)} / {fmt(s.quarterTarget)}
                    {s.unit ? ` ${s.unit}` : ""}
                  </span>
                )}
              </div>
            )}
          </Card>
        </button>
      ))}
    </div>
  );
}
