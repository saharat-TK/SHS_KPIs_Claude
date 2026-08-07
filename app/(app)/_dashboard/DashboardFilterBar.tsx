"use client";

import { Field, Select } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { PERFORMANCE_YEAR_COUNT, yearForYearNo } from "@/lib/kpi/performancePeriods";

/** The Year/Quarter controls the record page also uses. Everything below them on
 *  the dashboard reads from these two. */
export function DashboardFilterBar({
  year,
  quarter,
  startYear,
  openQuarters,
  onChange,
}: {
  year: number;
  quarter: number;
  /** Renders the Buddhist-era calendar year beside each year number. Omitted
   *  while the record is still loading. */
  startYear?: number;
  openQuarters: number[];
  onChange: (patch: { year?: number; quarter?: number }) => void;
}) {
  return (
    <div className="flex flex-col gap-md rounded-lg border border-hairline bg-surface-lowest px-md py-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap items-end gap-md">
        <Field label="Year">
          <Select
            value={String(year)}
            onChange={(e) => onChange({ year: Number(e.target.value) })}
            className="min-w-[180px] rounded-xl"
          >
            {Array.from({ length: PERFORMANCE_YEAR_COUNT }, (_, i) => i + 1).map((y) => (
              <option key={y} value={y}>
                {startYear ? `Year ${y} · ${yearForYearNo(startYear, y)}` : `Year ${y}`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quarter">
          <Select
            value={String(quarter)}
            onChange={(e) => onChange({ quarter: Number(e.target.value) })}
            className="min-w-[150px] rounded-xl"
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                Quarter {q}
                {openQuarters.includes(q) ? " · open" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="flex items-center gap-sm text-caption-sm text-mute lg:pb-sm">
        <Icon name="history" size={16} className="text-stone" />
        Values are read as of Q{quarter} — the latest quarter recorded up to that point.
      </p>
    </div>
  );
}
