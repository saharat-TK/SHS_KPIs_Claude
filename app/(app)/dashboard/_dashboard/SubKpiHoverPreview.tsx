"use client";

import type { ReactNode } from "react";
import { HoverInfoCard } from "@/components/ui";
import { AchievementBar } from "./AchievementBar";
import type { KpiStatus } from "@/lib/kpi/dashboard";
import { formatNumber } from "@/lib/utils";

const statusLabel = (status: KpiStatus) => {
  if (status.health === "healthy") return "On target";
  if (status.health === "watch") return "Watch";
  if (status.health === "at_risk") return "At risk";
  return status.value == null ? "No data" : "Ungraded";
};

const metric = (value: number | null, unit: string | null) =>
  value == null ? "—" : `${formatNumber(value, 2)}${unit ? ` ${unit}` : ""}`;

/**
 * A dashboard-local preview showing a sub-KPI's performance numbers, built on
 * the shared `HoverInfoCard` shell (portals to document.body, keeping dense-grid
 * details visible even when the grid itself scrolls inside a fixed-height card).
 */
export function SubKpiHoverPreview({
  status,
  children,
}: {
  status: KpiStatus;
  children: ReactNode;
}) {
  return (
    <HoverInfoCard
      wrapperClassName="block h-full"
      panel={
        <>
          <p className="text-body-sm font-bold leading-snug">{status.name}</p>
          <div className="mt-sm grid grid-cols-2 gap-x-md gap-y-xs text-caption-sm">
            <span className="text-cyan-100">ผล</span>
            <span className="text-right tabular-nums">{metric(status.value, status.unit)}</span>
            <span className="text-cyan-100">เป้า</span>
            <span className="text-right tabular-nums">{metric(status.quarterTarget, status.unit)}</span>
            <span className="text-cyan-100">Status</span>
            <span className="text-right font-medium">{statusLabel(status)}</span>
          </div>
          <div className="mt-md flex items-baseline justify-between gap-sm text-caption-sm">
            <span className="text-cyan-100">Achievement</span>
            <span className="text-body-sm font-bold tabular-nums">
              {status.pct == null ? "—" : `${formatNumber(status.pct, 0)}%`}
            </span>
          </div>
          <AchievementBar
            pct={status.pct}
            health={status.health}
            size="sm"
            showValue={false}
            className="mt-xs w-full"
          />
        </>
      }
    >
      {children}
    </HoverInfoCard>
  );
}
