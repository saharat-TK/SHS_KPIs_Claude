"use client";

import { Fragment } from "react";
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
  if (statuses.length === 0) {
    return (
      <EmptyState
        title="No KPIs in this group"
        message="Pick another strategic group, or clear the filter."
      />
    );
  }

  // Same order as the group tab bar (groupsInUse), with an Uncategorised
  // bucket last for KPIs whose category no longer exists.
  const sections = groups
    .map((g) => ({
      group: g,
      rows: statuses
        .filter((s) => (s.categoryId ?? UNCATEGORISED) === g.id)
        .sort((a, b) => KPI_NAME_ORDER.compare(a.name, b.name)),
    }))
    .filter((s) => s.rows.length > 0);

  // A single group (e.g. a group tab already scopes to one) makes a section
  // header redundant with the tab above it — fall back to one flat list with
  // its own Group column instead.
  const sectioned = sections.length > 1;
  const flatRows = sectioned
    ? []
    : [...statuses].sort((a, b) => KPI_NAME_ORDER.compare(a.name, b.name));

  const row = (s: KpiStatus) => (
    <Tr key={s.kpiId} onClick={() => onOpenKpi(s.kpiId)}>
      <Td className="font-medium">{s.name}</Td>
      <Td align="right">
        {s.annualTarget == null ? "—" : `${formatNumber(s.annualTarget, 2)} ${s.unit ?? ""}`}
      </Td>
      <Td align="right">
        {s.quarterTarget == null ? "—" : `${formatNumber(s.quarterTarget, 2)} ${s.unit ?? ""}`}
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

  return (
    <Table>
      <thead>
        <tr>
          <Th>KPI</Th>
          <Th align="right">Annual Target</Th>
          <Th align="right">Q{quarter} Target</Th>
          <Th align="right">Value</Th>
          <Th>Achievement</Th>
          <Th align="center">Status</Th>
        </tr>
      </thead>
      <tbody>
        {sectioned
          ? sections.map(({ group, rows }) => (
              <Fragment key={group.id}>
                <tr>
                  <td
                    colSpan={6}
                    className="border-b border-hairline bg-surface-soft px-lg py-xs text-label-md font-bold uppercase text-on-surface"
                  >
                    {group.label}
                    <span className="ml-xs font-normal normal-case text-mute">
                      · {rows.length} KPI{rows.length === 1 ? "" : "s"}
                    </span>
                  </td>
                </tr>
                {rows.map(row)}
              </Fragment>
            ))
          : flatRows.map(row)}
      </tbody>
    </Table>
  );
}
