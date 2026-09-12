"use client";

import type { ReactNode } from "react";
import { HoverInfoCard } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { KPI_CALCULATION_TYPES, type PerfKpi } from "@/lib/types";

/**
 * Icon-only trigger next to a KPI's name showing its core configuration —
 * Description, Data Collecting Method, Data Source, Calculation Type,
 * Calculation Logic, and Variables — in the same dark-cyan hover card the
 * Dashboard uses for its sub-KPI performance preview (see
 * SubKpiHoverPreview), via the shared HoverInfoCard shell. Most fields are
 * nullable in the library, so only rows with a value are shown; Calculation
 * Type is a required enum and always appears.
 */
export function KpiInfoTrigger({ kpi }: { kpi: PerfKpi }) {
  const variables = [
    kpi.variable1Name
      ? `${kpi.variable1Name}${kpi.variable1Unit ? ` (${kpi.variable1Unit})` : ""}`
      : null,
    kpi.variable2Name
      ? `${kpi.variable2Name}${kpi.variable2Unit ? ` (${kpi.variable2Unit})` : ""}`
      : null,
  ].filter((v): v is string => v != null);

  // Unlike the other fields, calculationType is a required enum — always
  // shown, never filtered out below.
  const calcType = KPI_CALCULATION_TYPES.find((t) => t.id === kpi.calculationType);

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Description", value: kpi.description },
    { label: "Data Collecting Method", value: kpi.dataCollectMethod },
    {
      label: "Data Source",
      value: kpi.dataSourceUrl ? (
        <a
          href={kpi.dataSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-cyan-200 underline hover:text-white"
        >
          {kpi.dataSourceUrl}
        </a>
      ) : null,
    },
    {
      label: "Calculation Type",
      value: calcType ? (
        <>
          {calcType.label}
          <span className="block text-cyan-100">{calcType.hint}</span>
        </>
      ) : (
        kpi.calculationType
      ),
    },
    { label: "KPI Calculation Logic", value: kpi.calculationLogic },
    { label: "KPI Variables", value: variables.length > 0 ? variables.join(" · ") : null },
  ].filter((row) => row.value != null && row.value !== "");

  return (
    <HoverInfoCard
      panelWidth={320}
      // A short grace delay + an interactive panel so the cursor can travel
      // from the icon onto the card (and click the Data Source link) without
      // it closing on the way — see components/ui/HoverInfoCard.tsx.
      closeDelayMs={200}
      panelInteractive
      panel={
        <div className="flex flex-col gap-sm">
          <p className="text-body-sm font-bold leading-snug">{kpi.name}</p>
          {rows.length === 0 ? (
            <p className="text-caption-sm text-cyan-100">No configuration details recorded.</p>
          ) : (
            rows.map((row) => (
              <div key={row.label} className="text-caption-sm">
                <p className="text-cyan-100">{row.label}</p>
                <p className="whitespace-pre-wrap">{row.value}</p>
              </div>
            ))
          )}
        </div>
      }
    >
      <button
        type="button"
        aria-label="KPI configuration details"
        title="KPI configuration details"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-mute hover:bg-surface-soft hover:text-on-surface"
      >
        <Icon name="info" size={18} />
      </button>
    </HoverInfoCard>
  );
}
