"use client";

import { Badge, Table, Th, Td, Tr, EmptyState } from "@/components/ui";
import { HEALTH_LABEL, HEALTH_TONE } from "@/lib/kpi/progress";
import { UNCATEGORISED, type DashboardCategory, type KpiStatus } from "@/lib/kpi/dashboard";
import { formatNumber } from "@/lib/utils";
import { AchievementBar } from "./AchievementBar";

const KPI_NAME_ORDER = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function KpiDetailTable({
  statuses,
  groups,
  quarter,
  onOpenKpi,
}: {
  statuses: KpiStatus[];
  groups: DashboardCategory[];
  quarter: number;
  onOpenKpi: (kpiId: number) => void;
}) {
  const sortedStatuses = [...statuses].sort((a, b) => KPI_NAME_ORDER.compare(a.name, b.name));

  if (statuses.length === 0) {
    return (
      <EmptyState
        title="No KPIs in this group"
        message="Pick another strategic group, or clear the filter."
      />
    );
  }
  return (
    <Table>
      <thead>
        <tr>
          <Th>KPI</Th>
          <Th>Group</Th>
          <Th align="right">Q{quarter} Target</Th>
          <Th align="right">Value</Th>
          <Th>Achievement</Th>
          <Th align="center">Status</Th>
        </tr>
      </thead>
      <tbody>
        {sortedStatuses.map((s) => {
          const groupLabel =
            groups.find((g) => g.id === (s.categoryId ?? UNCATEGORISED))?.label ?? "—";
          return (
            <Tr key={s.kpiId} onClick={() => onOpenKpi(s.kpiId)}>
              <Td className="font-medium">{s.name}</Td>
              <Td className="text-mute">{groupLabel}</Td>
              <Td align="right">
                {s.quarterTarget == null
                  ? "—"
                  : `${formatNumber(s.quarterTarget, 2)} ${s.unit ?? ""}`}
              </Td>
              <Td align="right" className="font-medium">
                {s.value == null ? "—" : `${formatNumber(s.value, 2)} ${s.unit ?? ""}`}
              </Td>
              <Td>
                <AchievementBar pct={s.pct} health={s.health} />
              </Td>
              <Td align="center">
                {s.health ? (
                  <Badge tone={HEALTH_TONE[s.health]}>{HEALTH_LABEL[s.health]}</Badge>
                ) : (
                  <span className="text-caption-sm text-mute">
                    {s.value == null ? "No data" : "Ungraded"}
                  </span>
                )}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
