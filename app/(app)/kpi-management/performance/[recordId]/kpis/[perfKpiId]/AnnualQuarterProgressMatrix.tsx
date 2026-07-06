"use client";

import { useState, type MouseEvent } from "react";

import { Card, CardBody, CardHeader, Badge, healthOf } from "@/components/ui";
import {
  currentValueForYear,
  percentOfTarget,
  quarterTargetFor,
  targetForYear,
} from "@/lib/kpi/progress";
import type { PerfKpi, PerfMetric, QuarterlyTargetMode, QuarterProgress } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

const QUARTERS = [1, 2, 3, 4] as const;
const COLUMNS = ["Q1", "Q2", "Q3", "Q4", "Annual"] as const;

type MatrixRow = {
  id: string;
  name: string;
  displayLabel: string;
  unit: string | null;
  annualTargets?: PerfKpi["annualTargets"];
  progress?: QuarterProgress[];
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  isParent?: boolean;
};

type TargetSource = "row" | "kpi-fallback";
type CellHealth = "healthy" | "watch" | "at_risk";

type CellData = {
  label: string;
  rawProgress: QuarterProgress | null;
  value: number | null;
  target: number | null;
  percent: number | null;
  targetSource: TargetSource;
  health: CellHealth | null;
};

type HoverTooltip = {
  text: string;
  x: number;
  y: number;
};

export function AnnualQuarterProgressMatrix({
  kpi,
  metrics,
  year,
}: {
  kpi: PerfKpi;
  metrics: PerfMetric[];
  year: number;
}) {
  const rows: MatrixRow[] = [
    {
      id: `kpi-${kpi.id}`,
      name: kpi.name,
      displayLabel: "KPI",
      unit: kpi.unit,
      annualTargets: kpi.annualTargets,
      progress: kpi.progress,
      thresholdGreen: kpi.thresholdGreen,
      thresholdAmber: kpi.thresholdAmber,
      isParent: true,
    },
    ...metrics.map((metric, index) => ({
      id: `metric-${metric.id}`,
      name: metric.name,
      displayLabel: `M${index + 1}`,
      unit: metric.unit,
      annualTargets: metric.annualTargets,
      progress: metric.progress,
      thresholdGreen: metric.thresholdGreen ?? kpi.thresholdGreen,
      thresholdAmber: metric.thresholdAmber ?? kpi.thresholdAmber,
    })),
  ];

  const kpiAnnualTarget = targetForYear(kpi.annualTargets, year);
  const subtitle = `Year ${year}${kpi.startYear ? ` · ${kpi.startYear + year - 1}` : ""}`;

  return (
    <Card className="bg-white">
      <CardHeader title="Annual & Quarterly Progress" subtitle={subtitle} />
      <CardBody className="flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <p className="text-caption-sm text-mute">
            Color shows threshold status from percent of target achieved.
          </p>
          <div className="flex items-center gap-xs text-caption-sm text-mute">
            <span>At risk</span>
            {[
              "bg-error",
              "bg-warning",
              "bg-primary-container",
            ].map((className) => (
              <span
                key={className}
                className="h-3 w-3 rounded-[3px] border border-hairline"
                aria-hidden
              >
                <span className={cn("block h-full w-full rounded-[2px]", className)} />
              </span>
            ))}
            <span>Healthy</span>
            <span className="ml-xs inline-flex items-center gap-tiny">
              <span
                className="h-1.5 w-1.5 rounded-full bg-on-surface/50"
                aria-hidden
              />
              KPI target fallback
            </span>
          </div>
        </div>

        <div className="overflow-visible">
          <div className="grid w-full grid-cols-[32px_repeat(5,minmax(0,1fr))] gap-tiny">
            <div className="text-center text-[9px] font-medium text-mute">Ref</div>
            {COLUMNS.map((column) => (
              <div key={column} className="text-center text-[9px] font-medium text-mute">
                {column}
              </div>
            ))}

            {rows.map((row) => {
              const cells = cellsForRow(row, year, kpiAnnualTarget, kpi.quarterlyTargetMode);
              return (
                <ProgressMatrixRow key={row.id} row={row} cells={cells} />
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ProgressMatrixRow({ row, cells }: { row: MatrixRow; cells: CellData[] }) {
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip | null>(null);

  function showTooltip(event: MouseEvent<HTMLDivElement>, text: string) {
    setHoverTooltip({
      text,
      x: event.clientX + 12,
      y: event.clientY + 12,
    });
  }

  return (
    <>
      <div
        className="flex min-w-0 items-center justify-center py-tiny"
        title={row.name}
      >
        <Badge tone={row.isParent ? "info" : "neutral"} className="px-tiny text-[9px]">
          {row.displayLabel}
        </Badge>
      </div>

      {cells.map((cell) => {
        const tooltip = tooltipForCell(row, cell);
        return (
          <div
            key={cell.label}
            className={cn(
              "relative flex h-7 min-w-0 items-center justify-center rounded-[4px] px-tiny text-[9px] font-semibold",
              colorClassForCell(row, cell),
            )}
            aria-label={tooltip}
            onMouseEnter={(event) => showTooltip(event, tooltip)}
            onMouseMove={(event) => showTooltip(event, tooltip)}
            onMouseLeave={() => setHoverTooltip(null)}
          >
            {displayValueForCell(cell, row.unit)}
            {cell.targetSource === "kpi-fallback" && (
              <span
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-on-surface/60"
                aria-hidden
              />
            )}
          </div>
        );
      })}

      {hoverTooltip && (
        <div
          className="pointer-events-none fixed z-[300] max-w-[280px] whitespace-pre-line rounded border border-hairline bg-ink px-sm py-xs text-left text-[10px] font-normal leading-snug text-on-primary shadow-chrome"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y }}
        >
          {hoverTooltip.text}
        </div>
      )}
    </>
  );
}

function cellsForRow(
  row: MatrixRow,
  year: number,
  kpiAnnualTarget: number | null,
  mode: QuarterlyTargetMode,
): CellData[] {
  const rowAnnualTarget = targetForYear(row.annualTargets, year);
  const rowTargetMissing = rowAnnualTarget == null || rowAnnualTarget === 0;
  const usesKpiFallback = !row.isParent && rowTargetMissing && kpiAnnualTarget != null;
  const annualTarget = row.isParent || !rowTargetMissing ? rowAnnualTarget : kpiAnnualTarget;
  const targetSource: TargetSource = usesKpiFallback ? "kpi-fallback" : "row";
  const quarterCells = QUARTERS.map((quarter) => {
    const target = quarterTargetFor(annualTarget, quarter, mode);
    const rawProgress =
      row.progress?.find((p) => p.yearNo === year && p.quarterNo === quarter) ?? null;
    const value = rawProgress?.progressValue ?? null;
    const percent = percentOfTarget(value, target);
    return {
      label: `Q${quarter}`,
      rawProgress,
      value,
      target,
      percent,
      targetSource,
      health: healthForPercent(row, percent),
    };
  });

  const annualProgress = latestProgressForYear(row.progress, year);
  const annualValue = annualProgress?.progressValue ?? currentValueForYear(row.progress, year);
  const annualPercent = percentOfTarget(annualValue, annualTarget);
  return [
    ...quarterCells,
    {
      label: "Annual",
      rawProgress: annualProgress,
      value: annualValue,
      target: annualTarget,
      percent: annualPercent,
      targetSource,
      health: healthForPercent(row, annualPercent),
    },
  ];
}

function latestProgressForYear(
  progress: QuarterProgress[] | undefined,
  year: number,
): QuarterProgress | null {
  const rows = progress ?? [];
  for (let quarter = 4; quarter >= 1; quarter -= 1) {
    const row = rows.find((p) => p.yearNo === year && p.quarterNo === quarter);
    if (row && row.progressValue != null) return row;
  }
  return null;
}

function healthForPercent(row: MatrixRow, percent: number | null): CellHealth | null {
  if (percent == null || row.thresholdGreen == null || row.thresholdAmber == null) return null;
  return healthOf(percent, { green: row.thresholdGreen, amber: row.thresholdAmber });
}

function colorClassForCell(row: MatrixRow, cell: CellData) {
  const hasValue = cell.value != null || cell.percent != null;
  if (!hasValue) return "bg-surface-container-high text-mute";
  if (!row.isParent) return "border border-hairline bg-surface-lowest text-on-surface";
  if (cell.health === "healthy") return "bg-primary-container text-on-tertiary";
  if (cell.health === "watch") return "bg-warning text-white";
  if (cell.health === "at_risk") return "bg-error text-on-error";
  return "bg-surface-container-high text-on-surface";
}

function displayValueForCell(cell: CellData, unit: string | null) {
  if (cell.percent != null) return `${formatNumber(cell.percent, 0)}%`;
  if (cell.value != null) return formatCompactWithUnit(cell.value, unit);
  return "—";
}

function tooltipForCell(row: MatrixRow, cell: CellData) {
  const value =
    cell.rawProgress?.progressValue == null
      ? "No recorded value"
      : formatWithUnit(cell.rawProgress.progressValue, row.unit);
  const target = cell.target == null ? "No target" : formatWithUnit(cell.target, row.unit);
  const percent = cell.percent == null ? "No progress percent" : `${formatNumber(cell.percent, 1)}%`;
  const issue = normalizeNote(cell.rawProgress?.issue) ?? "No issue recorded";
  const solution = normalizeNote(cell.rawProgress?.solution) ?? "No solution recorded";
  const source =
    cell.targetSource === "kpi-fallback"
      ? "KPI fallback"
      : row.isParent
        ? "KPI target"
        : "Metric target";
  return [
    `${row.name} · ${cell.label}`,
    `Recorded value: ${value}`,
    `Target: ${target}`,
    `Progress: ${percent}`,
    `Issue: ${issue}`,
    `Solution: ${solution}`,
    `Target source: ${source}`,
  ].join("\n");
}

function formatWithUnit(value: number, unit: string | null) {
  return `${formatNumber(value, 2)}${unit ? ` ${unit}` : ""}`;
}

function formatCompactWithUnit(value: number, unit: string | null) {
  return `${formatNumber(value, 0)}${unit ? ` ${unit}` : ""}`;
}

function normalizeNote(value: string | null | undefined) {
  const text = value?.trim();
  return text && text.length > 0 ? text : null;
}
