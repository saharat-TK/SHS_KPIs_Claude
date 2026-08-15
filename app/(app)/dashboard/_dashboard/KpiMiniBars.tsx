"use client";

import { Card, CountUp } from "@/components/ui";
import type { KpiStatus } from "@/lib/kpi/dashboard";
import type { Health } from "@/lib/kpi/progress";
import { cn, formatNumber } from "@/lib/utils";
import { AchievementBar } from "./AchievementBar";
import { SubKpiHoverPreview } from "./SubKpiHoverPreview";
import { subKpiDensity } from "./subKpiDensity";

const HEATMAP_SURFACE: Record<Health, string> = {
  healthy: "!border-[#bef264] !bg-[#bef264] text-lime-950",
  watch: "!border-[#fdba74] !bg-[#fdba74] text-orange-950",
  at_risk: "!border-[#fca5a5] !bg-[#fca5a5] text-red-950",
};

/** Two decimals, matching KpiDetailTable, so the same KPI reads identically on
 *  its tile and in the table. */
const fmt = (n: number | null) => (n == null ? "—" : formatNumber(n, 2));

function FullTile({
  status,
  index,
  row,
  onOpenKpi,
}: {
  status: KpiStatus;
  index: number;
  row: boolean;
  onOpenKpi: (kpiId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenKpi(status.kpiId)}
      title={status.name}
      className={cn(
        "animate-fade-up rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        row && "w-[calc(50%-0.1875rem)] sm:w-[168px] lg:h-[212px]",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <Card className="flex h-full flex-col gap-xs p-md !border-0 shadow-md transition-shadow hover:shadow-lg">
        <span className="text-utility-xs uppercase text-mute">K{index + 1}</span>
        <span className={cn(row ? "line-clamp-3" : "line-clamp-2", "text-caption-sm text-on-surface")}>
          {status.name}
        </span>
        {row ? (
          <>
            <div
              className="flex flex-col gap-tiny pt-xs text-utility-xs tabular-nums text-mute lg:min-h-0 lg:flex-1 lg:justify-center"
              title={`Recorded ${fmt(status.value)} against a Q target of ${fmt(status.quarterTarget)}${status.unit ? ` ${status.unit}` : ""}`}
            >
              <span>
                <span className="font-bold">ผล</span>{" "}
                {status.value == null ? "—" : <CountUp value={status.value} digits={2} />}
                {status.unit ? ` ${status.unit}` : ""}
              </span>
              <span>
                <span className="font-bold">เป้า</span>{" "}
                {status.quarterTarget == null ? "—" : <CountUp value={status.quarterTarget} digits={2} />}
                {status.unit ? ` ${status.unit}` : ""}
              </span>
            </div>
            <div className="flex flex-col gap-tiny">
              <span className="self-end text-body-sm font-bold tabular-nums text-on-surface lg:text-[25px] lg:leading-none">
                {status.pct == null ? "—" : <CountUp value={status.pct} suffix="%" />}
              </span>
              <AchievementBar
                pct={status.pct}
                health={status.health}
                size="sm"
                showValue={false}
                className="w-full"
              />
            </div>
          </>
        ) : (
          <div className="mt-auto flex flex-col gap-tiny pt-xs">
            <AchievementBar pct={status.pct} health={status.health} size="sm" />
            {(status.value != null || status.quarterTarget != null) && (
              <span
                className="truncate text-utility-xs font-normal tabular-nums text-mute"
                title={`Recorded ${fmt(status.value)} against a Q target of ${fmt(status.quarterTarget)}${status.unit ? ` ${status.unit}` : ""}`}
              >
                {fmt(status.value)} / {fmt(status.quarterTarget)}
                {status.unit ? ` ${status.unit}` : ""}
              </span>
            )}
          </div>
        )}
      </Card>
    </button>
  );
}

function CompactDetailTile({
  status,
  index,
  onOpenKpi,
}: {
  status: KpiStatus;
  index: number;
  onOpenKpi: (kpiId: number) => void;
}) {
  return (
    <SubKpiHoverPreview status={status}>
      <button
        type="button"
        onClick={() => onOpenKpi(status.kpiId)}
        title={status.name}
        className="h-full w-full min-w-0 animate-fade-up rounded-lg text-left transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:hover:scale-100"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        <Card className="flex h-full flex-col gap-tiny p-md !border-0 !bg-cyan-50 shadow-md transition-shadow hover:shadow-lg">
          <span className="text-utility-xs uppercase text-mute">K{index + 1}</span>
          <span className="line-clamp-2 text-caption-sm font-normal text-on-surface">{status.name}</span>
          <div className="mt-auto flex flex-col gap-tiny">
            <div className="flex flex-wrap items-baseline justify-end gap-xs">
              <span className="text-[8px] font-normal text-on-surface">Achieved by</span>
              <span className="text-body-sm font-bold tabular-nums text-on-surface lg:text-[18px] lg:leading-none">
                {status.pct == null ? "—" : <CountUp value={status.pct} suffix="%" />}
              </span>
            </div>
            <AchievementBar pct={status.pct} health={status.health} size="sm" showValue={false} className="w-full" />
          </div>
        </Card>
      </button>
    </SubKpiHoverPreview>
  );
}

function CompactTile({
  status,
  index,
  onOpenKpi,
}: {
  status: KpiStatus;
  index: number;
  onOpenKpi: (kpiId: number) => void;
}) {
  return (
    <SubKpiHoverPreview status={status}>
      <button
        type="button"
        onClick={() => onOpenKpi(status.kpiId)}
        className="h-full w-full min-w-0 animate-fade-up rounded-lg text-left transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:hover:scale-100"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        <Card className="flex h-full flex-col gap-tiny p-xs !border-0 !bg-cyan-50 shadow-md transition-shadow hover:shadow-lg">
          <span className="line-clamp-3 text-caption-sm text-on-surface">{status.name}</span>
          <div className="mt-auto flex flex-col gap-tiny">
            <span className="self-end text-body-sm font-bold tabular-nums text-on-surface lg:text-[25px] lg:leading-none">
              {status.pct == null ? "—" : <CountUp value={status.pct} suffix="%" />}
            </span>
            <AchievementBar pct={status.pct} health={status.health} size="sm" showValue={false} className="w-full" />
          </div>
        </Card>
      </button>
    </SubKpiHoverPreview>
  );
}

function HeatmapTile({
  status,
  index,
  onOpenKpi,
}: {
  status: KpiStatus;
  index: number;
  onOpenKpi: (kpiId: number) => void;
}) {
  const surface = status.health ? HEATMAP_SURFACE[status.health] : "!border-hairline !bg-surface-container-high text-mute";
  return (
    <SubKpiHoverPreview status={status}>
      <button
        type="button"
        onClick={() => onOpenKpi(status.kpiId)}
        aria-label={`K${index + 1}: ${status.name}`}
        className={cn(
          "aspect-square min-w-0 animate-fade-up rounded-lg border text-utility-xs font-bold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:hover:scale-100",
          surface,
        )}
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        K{index + 1}
      </button>
    </SubKpiHoverPreview>
  );
}

/**
 * Every KPI in the selected group as a compact tile, so a group's shape reads at
 * a glance before the charts and the table go into detail.
 */
export function KpiMiniBars({
  statuses,
  onOpenKpi,
  layout = "grid",
}: {
  statuses: KpiStatus[];
  onOpenKpi: (kpiId: number) => void;
  /** "grid" fills the selected category. "row" adapts density inside All Groups cards. */
  layout?: "grid" | "row";
}) {
  const row = layout === "row";
  const density = row ? subKpiDensity(statuses.length) : "full";
  const layoutClass = !row
    ? "grid grid-cols-2 gap-sm md:grid-cols-3 xl:grid-cols-4"
    : density === "full"
      ? "flex flex-wrap items-start gap-sm"
      : density === "compact_detail"
        ? "grid grid-cols-2 gap-tiny sm:grid-cols-5 lg:auto-rows-[104px]"
        : density === "compact"
          ? "grid grid-cols-2 gap-tiny sm:grid-cols-5 lg:grid-cols-10 lg:auto-rows-[104px]"
          : "grid grid-cols-5 gap-tiny pr-tiny sm:grid-cols-10 lg:max-h-[214px] lg:overflow-y-auto lg:scroll-thin";

  return (
    <div className={layoutClass}>
      {statuses.map((status, index) => {
        if (density === "compact_detail") {
          return <CompactDetailTile key={status.kpiId} status={status} index={index} onOpenKpi={onOpenKpi} />;
        }
        if (density === "compact") {
          return <CompactTile key={status.kpiId} status={status} index={index} onOpenKpi={onOpenKpi} />;
        }
        if (density === "heatmap") {
          return <HeatmapTile key={status.kpiId} status={status} index={index} onOpenKpi={onOpenKpi} />;
        }
        return <FullTile key={status.kpiId} status={status} index={index} row={row} onOpenKpi={onOpenKpi} />;
      })}
    </div>
  );
}
