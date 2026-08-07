"use client";

import { Card } from "@/components/ui";
import type { KpiStatus } from "@/lib/kpi/dashboard";
import { cn } from "@/lib/utils";
import { AchievementBar } from "./AchievementBar";

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
          ? "flex flex-wrap gap-sm"
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
            // Two-up on a phone, then a fixed tile so wrapping stays even.
            row && "w-[calc(50%-0.1875rem)] sm:w-[180px]",
          )}
          style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
        >
          <Card className="flex h-full flex-col gap-xs p-md transition-shadow hover:shadow-chrome">
            <span className="text-utility-xs uppercase text-mute">K{i + 1}</span>
            <span className="line-clamp-2 text-caption-sm text-on-surface">{s.name}</span>
            <AchievementBar pct={s.pct} health={s.health} size="sm" className="mt-auto pt-xs" />
          </Card>
        </button>
      ))}
    </div>
  );
}
