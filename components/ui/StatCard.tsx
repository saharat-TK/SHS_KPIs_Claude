"use client";

import { cn } from "@/lib/utils";
import { HEALTH_SURFACE } from "@/lib/kpi/progress";
import { Icon } from "./Icon";
import { Card } from "./Card";
import { CountUp } from "./CountUp";

// Fill + label/unit colour, kept paired: a tinted card needs its muted text
// darkened to stay legible (text-mute on any of these fills is only ~3.7:1,
// under AA for 12-13px, while each pairing below clears 6:1). The value itself
// stays text-on-surface — near-black is the most readable on all five fills.
//
// healthy/watch/at_risk come from HEALTH_SURFACE (lib/kpi/progress.ts) — the
// same Badge success/warning/error tones the Threshold sidebar card uses, kept
// in one place rather than duplicated per consumer. `soft` is StatCard's own
// paler derivative of healthy, for grouping cards that carry no status —
// deliberately lighter than every status tint so it is never mistaken for one.
const TONES = {
  default: { card: "", muted: "text-mute" },
  soft: { card: "!bg-[#f2f8ea] !border-[#cfe3b4]", muted: "text-[#2f6500]" },
  ...HEALTH_SURFACE,
} as const;

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon,
  tone = "default",
  className,
  animate = false,
  digits = 0,
  emphasis = "default",
  title,
  visual,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  icon?: string;
  /** Tints the card: "soft" to group status-free stats, or a Health value to
   *  show threshold status. Omit for the plain white card. */
  tone?: keyof typeof TONES;
  className?: string;
  /** Count the value up from zero on mount and on every change. Numeric values
   *  only — a string value is always rendered as given. */
  animate?: boolean;
  /** Decimal places for the animated value. */
  digits?: number;
  /** "figure" is the dashboard headline hierarchy: tiny uppercase label, larger
   *  figure, unit demoted beside it. Everywhere else keeps the default — this
   *  card is used on four other pages that are not headlines. */
  emphasis?: "default" | "figure";
  /** Native tooltip, for naming a second reading of the same number (e.g. the
   *  graded-only percentage behind a met-of-total figure). */
  title?: string;
  /** A small graphic restating this card's own number — a ring, a sparkline.
   *  Sits to the right of the figure and takes the icon's place, so pass one or
   *  the other, not both. */
  visual?: React.ReactNode;
}) {
  const toneClasses = TONES[tone];
  const figure = emphasis === "figure";
  const dirColor =
    delta?.direction === "up"
      ? "text-success"
      : delta?.direction === "down"
        ? "text-error"
        : "text-mute";
  const dirIcon =
    delta?.direction === "up"
      ? "trending_up"
      : delta?.direction === "down"
        ? "trending_down"
        : "trending_flat";

  const body = (
    <>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            figure ? "text-utility-xs uppercase" : "text-label-md",
            toneClasses.muted,
          )}
        >
          {label}
        </span>
        {icon && !visual && <Icon name={icon} size={20} className="text-primary" />}
      </div>
      <div className="flex items-end gap-xs">
        <span
          className={cn(
            "text-on-surface leading-none tabular-nums",
            figure ? "text-display-lg" : "text-display-md",
          )}
        >
          {animate && typeof value === "number" ? (
            <CountUp value={value} digits={digits} />
          ) : (
            value
          )}
        </span>
        {unit && (
          <span className={cn("text-body-sm", figure ? "mb-xs" : "mb-tiny", toneClasses.muted)}>
            {unit}
          </span>
        )}
      </div>
      {delta && (
        <span className={cn("inline-flex items-center gap-xs text-caption-sm", dirColor)}>
          <Icon name={dirIcon} size={16} />
          {delta.value}
        </span>
      )}
    </>
  );

  return (
    <Card
      title={title}
      className={cn(
        visual ? "flex items-center gap-md" : "flex flex-col gap-sm",
        figure ? "p-md" : "p-lg",
        toneClasses.card,
        className,
      )}
    >
      {visual ? (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-sm">{body}</div>
          {visual}
        </>
      ) : (
        body
      )}
    </Card>
  );
}
