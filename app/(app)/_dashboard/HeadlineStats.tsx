"use client";

import { StatCard } from "@/components/ui";
import type { DashboardSummary } from "@/lib/kpi/dashboard";

export function HeadlineStats({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-2 gap-lg lg:grid-cols-4">
      <StatCard
        label="On Target"
        value={summary.pctOnTarget ?? 0}
        unit="%"
        icon="check_circle"
        animate
        tone={
          summary.graded === 0
            ? "default"
            : summary.pctOnTarget! >= 80
              ? "healthy"
              : summary.pctOnTarget! >= 50
                ? "watch"
                : "at_risk"
        }
        delta={{ value: `${summary.onTarget} of ${summary.graded} graded`, direction: "flat" }}
        className="animate-fade-up"
      />
      <StatCard
        label="Avg Achievement"
        value={summary.avgAchievement ?? 0}
        unit="%"
        digits={1}
        icon="speed"
        animate
        tone="soft"
        delta={{ value: `${summary.withData} KPI(s) with data`, direction: "flat" }}
        className="animate-fade-up [animation-delay:60ms]"
      />
      <StatCard
        label="Tracked KPIs"
        value={summary.total}
        icon="tune"
        animate
        delta={{
          value: summary.noData > 0 ? `${summary.noData} not recorded` : "all recorded",
          direction: summary.noData > 0 ? "flat" : "up",
        }}
        className="animate-fade-up [animation-delay:120ms]"
      />
      <StatCard
        label="At Risk"
        value={summary.atRisk}
        icon="warning"
        animate
        tone={summary.atRisk > 0 ? "at_risk" : "default"}
        delta={{
          value: summary.watch > 0 ? `${summary.watch} on watch` : "none on watch",
          direction: summary.atRisk > 0 ? "down" : "up",
        }}
        className="animate-fade-up [animation-delay:180ms]"
      />
    </div>
  );
}
