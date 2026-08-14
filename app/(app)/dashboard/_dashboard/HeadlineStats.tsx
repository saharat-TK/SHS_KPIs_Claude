"use client";

import { StatCard, RingGauge } from "@/components/ui";
import type { DashboardSummary, RecordingMix, TargetsMet } from "@/lib/kpi/dashboard";
import { formatNumber } from "@/lib/utils";
import { achievementBand, metBand } from "./metBand";

const HEADLINE_MET_TONE = {
  healthy: "headline_healthy",
  watch: "headline_watch",
  at_risk: "headline_at_risk",
} as const;

/**
 * The four numbers the overview leads with.
 *
 * Card 1 is deliberately "met of ALL KPIs", not summarize().pctOnTarget, which
 * divides by the graded count and so reads high on a record with unrecorded
 * KPIs. Both readings are true; only one answers "how many KPIs met target".
 * The graded-only figure is kept in the card's tooltip so the two are visibly
 * different quantities rather than one silently replacing the other.
 */
export function HeadlineStats({
  targets,
  summary,
  recording,
}: {
  targets: TargetsMet;
  summary: DashboardSummary;
  recording: RecordingMix;
}) {
  const ungradable = targets.total - targets.graded;
  const notRecorded = recording.carried + recording.missing;
  // One expression drives the figure's tint and its ring, so the two can never
  // disagree about how the same ratio is doing.
  const metTone = metBand(targets.pctOfAll);
  const headlineMetTone = metTone ? HEADLINE_MET_TONE[metTone] : "headline_neutral";
  const averageTone = achievementBand(summary.avgAchievement);
  const headlineAverageTone = averageTone ? HEADLINE_MET_TONE[averageTone] : "headline_neutral";
  return (
    <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
      <StatCard
        label="KPIs Met Target"
        value={targets.met}
        unit={`of ${targets.total}`}
        emphasis="figure"
        animate
        // The ring restates the figure on purpose: it makes the proportion
        // readable without the reader dividing 4 by 8 themselves.
        visual={
          <RingGauge
            value={targets.met}
            total={targets.total}
            fill="#ffffff"
            label={`${targets.met} of ${targets.total} KPIs met target`}
            contrast="inverse"
          />
        }
        title={
          targets.graded === 0
            ? "No KPI in scope has both a value and thresholds, so none can be graded yet."
            : `${targets.met} of ${targets.graded} gradable KPIs — ${formatNumber(summary.pctOnTarget ?? 0, 1)}% of those that can be judged.`
        }
        tone={headlineMetTone}
        delta={{
          value:
            ungradable > 0
              ? `${ungradable} not yet gradable`
              : `all ${targets.total} gradable`,
          direction: "flat",
        }}
        className="animate-fade-up"
      />
      <StatCard
        label="Avg Achievement"
        value={summary.avgAchievement ?? "—"}
        unit={summary.avgAchievement == null ? undefined : "%"}
        digits={1}
        icon="speed"
        emphasis="figure"
        animate
        tone={headlineAverageTone}
        delta={{ value: `${summary.withData} KPI(s) with data`, direction: "flat" }}
        className="animate-fade-up [animation-delay:60ms]"
      />
      <StatCard
        label="Recorded This Quarter"
        value={recording.recorded}
        unit={`of ${recording.total}`}
        icon="edit_note"
        emphasis="figure"
        animate
        title="Carried forward means an earlier quarter of the same year holds the value — normal for a KPI that reports annually."
        delta={{
          value:
            notRecorded === 0
              ? "fully up to date"
              : `${recording.carried} carried · ${recording.missing} missing`,
          direction: recording.missing > 0 ? "down" : "flat",
        }}
        className="animate-fade-up [animation-delay:120ms]"
      />
      <StatCard
        label="At Risk"
        value={summary.atRisk}
        icon="warning"
        emphasis="figure"
        animate
        tone={summary.atRisk > 0 ? "at_risk" : "default"}
        delta={{
          value: summary.watch > 0 ? `${summary.watch} on watch` : "none on watch",
          // Never "up" here: a green rising arrow beside a zero reads as
          // "at-risk count climbing", which is the opposite of the news.
          direction: summary.atRisk > 0 ? "down" : "flat",
        }}
        className="animate-fade-up [animation-delay:180ms]"
      />
    </div>
  );
}
