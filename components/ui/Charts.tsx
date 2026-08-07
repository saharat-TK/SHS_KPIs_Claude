"use client";

import { useEffect, useId, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  PieChart,
  Pie,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useReducedMotion } from "./CountUp";
import type { Health } from "@/lib/kpi/progress";
import type { RecordingState } from "@/lib/kpi/dashboard";

// Colours are the tailwind.config.ts tokens, repeated here because recharts
// takes SVG paint values, not class names. Keep them in step with the theme.
const INK = "#1a1c1c";
const MUTE = "#757575";
const GRID = "#cccccc";
const PRIMARY = "#416900";
const PRIMARY_BRIGHT = "#76b900";
const WARNING = "#df6500";
const ERROR = "#e52020";
const LINK_BLUE = "#0046a4";
const SURFACE_DIM = "#dadada";

const AXIS = { fontSize: 11, fill: MUTE };
const TOOLTIP = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 2,
    border: `1px solid ${GRID}`,
    boxShadow: "0 0 5px 0 rgba(0,0,0,0.1)",
    color: INK,
  },
  labelStyle: { color: INK, fontWeight: 700 },
} as const;

/** Series palette for multi-line charts, primary first. */
const SERIES = [PRIMARY_BRIGHT, LINK_BLUE, WARNING, PRIMARY, ERROR];

export const HEALTH_FILL: Record<Health | "no_data", string> = {
  healthy: PRIMARY_BRIGHT,
  watch: WARNING,
  at_risk: ERROR,
  no_data: SURFACE_DIM,
};

/** Recording completeness, kept beside HEALTH_FILL so the two status palettes
 *  stay visibly distinct. Blue for "carried" on purpose: it is a normal state
 *  for a use_annual KPI, not a warning, and must not read as one. */
export const RECORDING_FILL: Record<RecordingState, string> = {
  recorded: PRIMARY_BRIGHT,
  carried: LINK_BLUE,
  missing: SURFACE_DIM,
};

/**
 * Recharts' own animation engine (react-smooth) never completes in this app: its
 * frames are cut short, leaving bars, pie sectors and dots stuck at their
 * zero-size first frame and line strokes fully dashed out — every plot renders
 * blank. So the charts are drawn statically and the motion is done in CSS by
 * ChartReveal below, which is deterministic and honours prefers-reduced-motion
 * through the global guard in app/globals.css.
 */
const NO_RECHARTS_ANIMATION = { isAnimationActive: false } as const;

/**
 * Hold the chart back for one commit so ResponsiveContainer measures a laid-out
 * box, then reveal it. `replay` re-runs the reveal whenever it changes — pass the
 * plotted data so switching year/quarter re-draws rather than snapping.
 */
function ChartReveal({
  height,
  replay,
  variant = "wipe",
  children,
}: {
  height: number;
  replay: unknown;
  variant?: "wipe" | "pop";
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div style={{ height }} />;
  return (
    <div
      key={JSON.stringify(replay)}
      className={
        reduced
          ? undefined
          : variant === "wipe"
            ? "animate-wipe-x"
            : "animate-pop-in"
      }
    >
      {children}
    </div>
  );
}

const asPercent = (v: number) => `${v}%`;

// ── Generic charts (used by the analytics pages) ─────────────────────────────

export function TrendLineChart({
  data,
  xKey,
  lines,
  height = 260,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  lines: { key: string; label: string }[];
  height?: number;
}) {
  return (
    <ChartReveal height={height} replay={data}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} />
          <Tooltip {...TOOLTIP} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((l, i) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              {...NO_RECHARTS_ANIMATION}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartReveal>
  );
}

export function CategoryBarChart({
  data,
  xKey,
  barKey,
  label,
  height = 260,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  barKey: string;
  label: string;
  height?: number;
}) {
  return (
    <ChartReveal height={height} replay={data}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: "#f3f3f4" }} />
          <Bar
            dataKey={barKey}
            name={label}
            fill={PRIMARY_BRIGHT}
            radius={[2, 2, 0, 0]}
            {...NO_RECHARTS_ANIMATION}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartReveal>
  );
}

// ── Achievement charts (the dashboard's % of target views) ───────────────────
// These all speak achievement percent, so they share a dashed 100% reference
// line: above it the target is met, below it is not.

/**
 * Achievement over the quarters of a year. The first series is filled with a
 * fading gradient so the overall trend reads behind the per-group lines.
 */
export function AchievementTrendChart({
  data,
  xKey,
  lines,
  height = 260,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  lines: { key: string; label: string }[];
  height?: number;
}) {
  const gradientId = useId();
  return (
    <ChartReveal height={height} replay={data}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -14 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY_BRIGHT} stopOpacity={0.28} />
              <stop offset="100%" stopColor={PRIMARY_BRIGHT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            tickFormatter={asPercent}
            width={46}
          />
          <Tooltip {...TOOLTIP} formatter={(v: number) => `${v}%`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={100} stroke={PRIMARY} strokeDasharray="4 4" />
          {lines.map((l, i) =>
            i === 0 ? (
              <Area
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={SERIES[0]}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 2.5, strokeWidth: 0, fill: SERIES[0] }}
                activeDot={{ r: 5 }}
                connectNulls
                {...NO_RECHARTS_ANIMATION}
              />
            ) : (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
                {...NO_RECHARTS_ANIMATION}
              />
            ),
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartReveal>
  );
}

/** Horizontal comparison across strategic groups, each bar tinted by its own
 *  health so the chart carries status without needing a legend. */
export function GroupAchievementChart({
  data,
  height = 260,
}: {
  data: { label: string; pct: number | null; health: Health | null }[];
  height?: number;
}) {
  const rows = data.map((d) => ({
    label: d.label,
    value: d.pct == null ? 0 : Math.round(d.pct * 10) / 10,
    health: d.health,
  }));
  return (
    <ChartReveal height={height} replay={rows}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            stroke={GRID}
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tickFormatter={asPercent}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={132}
          />
          <Tooltip
            {...TOOLTIP}
            cursor={{ fill: "#f3f3f4" }}
            formatter={(v: number) => `${v}%`}
          />
          <ReferenceLine x={100} stroke={PRIMARY} strokeDasharray="4 4" />
          <Bar
            dataKey="value"
            name="Achievement"
            fill={PRIMARY_BRIGHT}
            radius={[0, 2, 2, 0]}
            barSize={18}
            {...NO_RECHARTS_ANIMATION}
          >
            {rows.map((r) => (
              <Cell key={r.label} fill={HEALTH_FILL[r.health ?? "no_data"]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartReveal>
  );
}

/** The shared donut body. Keeping the two public donuts on one implementation
 *  means the reveal wrapper and the recharts-animation opt-out cannot drift
 *  between them — both are satisfied here by construction. */
function DonutChart<K extends string>({
  slices,
  fill,
  height,
  centre,
}: {
  slices: { key: K; label: string; value: number }[];
  fill: Record<K, string>;
  height: number;
  centre?: React.ReactNode;
}) {
  const drawn = slices.filter((d) => d.value > 0);
  return (
    <ChartReveal height={height} replay={drawn} variant="pop">
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip {...TOOLTIP} />
            <Pie
              data={drawn}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              strokeWidth={0}
              {...NO_RECHARTS_ANIMATION}
            >
              {drawn.map((s) => (
                <Cell key={s.key} fill={fill[s.key]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        {centre && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center justify-center"
            style={{ height: height - 34 }}
          >
            {centre}
          </div>
        )}
      </div>
    </ChartReveal>
  );
}

/** KPI health mix. The centre label is supplied by the caller so it can carry a
 *  count-up number without this module knowing about it. */
export function HealthDonut({
  data,
  height = 240,
  centre,
}: {
  data: { key: Health | "no_data"; label: string; value: number }[];
  height?: number;
  centre?: React.ReactNode;
}) {
  return (
    <DonutChart slices={data} fill={HEALTH_FILL} height={height} centre={centre} />
  );
}

/** Recording completeness. A different question from HealthDonut: whether a
 *  number was entered at all, not whether it was any good. */
export function RecordingDonut({
  data,
  height = 240,
  centre,
}: {
  data: { key: RecordingState; label: string; value: number }[];
  height?: number;
  centre?: React.ReactNode;
}) {
  return (
    <DonutChart slices={data} fill={RECORDING_FILL} height={height} centre={centre} />
  );
}

/** Achievement per year against the 100% target line, across the record's span. */
export function TargetVsActualChart({
  data,
  height = 260,
}: {
  data: { year: string; achievement: number | null; target: number }[];
  height?: number;
}) {
  return (
    <ChartReveal height={height} replay={data}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -14 }}
        >
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            tickFormatter={asPercent}
            width={46}
          />
          <Tooltip
            {...TOOLTIP}
            cursor={{ fill: "#f3f3f4" }}
            formatter={(v: number) => `${v}%`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            dataKey="achievement"
            name="Achieved"
            fill={PRIMARY}
            radius={[2, 2, 0, 0]}
            {...NO_RECHARTS_ANIMATION}
          >
            {data.map((d) => (
              <Cell
                key={d.year}
                fill={
                  d.achievement != null && d.achievement >= 100
                    ? PRIMARY_BRIGHT
                    : PRIMARY
                }
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke={WARNING}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            {...NO_RECHARTS_ANIMATION}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartReveal>
  );
}
