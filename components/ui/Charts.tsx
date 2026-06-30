"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const AXIS = { fontSize: 12, fill: "#757575" };
const GRID = "#e8e8e8";
const COLORS = ["#416900", "#76b900", "#df6500", "#0046a4"];

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
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
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
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} cursor={{ fill: "#f3f3f4" }} />
        <Bar dataKey={barKey} name={label} fill="#76b900" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
