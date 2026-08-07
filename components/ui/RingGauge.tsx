"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./CountUp";
import { cn } from "@/lib/utils";

/**
 * A small proportion ring: the filled arc is `value` out of `total`, with the
 * percentage in the middle.
 *
 * Inline SVG rather than the recharts donut in Charts.tsx, which carries a
 * Legend, a Tooltip and a ResponsiveContainer sized for a 240px card. At this
 * size a ResponsiveContainer is exactly the measurement problem ChartReveal
 * exists to work around, and none of the rest earns its weight — two circles
 * and a dash offset say the same thing and stay crisp at any DPR.
 */
export function RingGauge({
  value,
  total,
  size = 72,
  stroke = 8,
  fill,
  label,
  className,
  centerTextClassName,
  contrast = "default",
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  /** Arc colour. Pass a HEALTH_FILL entry so the ring agrees with its card. */
  fill: string;
  /** Read out in place of the graphic; the visible centre is hidden from AT. */
  label: string;
  className?: string;
  /** Optional size/style override for a specific gauge's visible centre value. */
  centerTextClassName?: string;
  /** Inverse foreground for use on a dark card surface. */
  contrast?: "default" | "inverse";
}) {
  const reduced = useReducedMotion();
  // Sweep from empty to the real arc on mount. Under reduced motion the first
  // paint is already the final value, so nothing moves.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => setDrawn(true), []);

  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (reduced || drawn ? pct : 0));

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* -90deg so the arc starts at twelve o'clock rather than three. */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className={contrast === "inverse" ? "stroke-white/35" : "stroke-surface-container-high"}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fill}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={
              reduced
                ? undefined
                : { transition: "stroke-dashoffset 600ms cubic-bezier(0.2, 0, 0, 1)" }
            }
          />
        </g>
      </svg>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums",
          centerTextClassName ?? "text-caption-sm",
          contrast === "inverse" ? "text-white" : "text-on-surface",
        )}
      >
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}
