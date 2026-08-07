"use client";

import { Fragment, useState } from "react";
import { Badge, Icon, Table, Th, Td, Tr, EmptyState } from "@/components/ui";
import type { IssueRow } from "@/lib/kpi/dashboard";

const KPI_NAME_ORDER = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function IssuesTable({
  rows,
  onOpenKpi,
}: {
  rows: IssueRow[];
  onOpenKpi: (kpiId: number) => void;
}) {
  const [expandedKpiIds, setExpandedKpiIds] = useState<Set<number>>(() => new Set());
  const groupedRows = Array.from(
    rows.reduce((groups, row) => {
      const group = groups.get(row.kpiId) ?? [];
      group.push(row);
      groups.set(row.kpiId, group);
      return groups;
    }, new Map<number, IssueRow[]>()),
    ([kpiId, issues]) => ({
      kpiId,
      name: issues[0].kpiName,
      issues: [...issues].sort((a, b) => b.quarterNo - a.quarterNo),
    }),
  ).sort((a, b) => KPI_NAME_ORDER.compare(a.name, b.name));

  const toggleGroup = (kpiId: number) => {
    setExpandedKpiIds((current) => {
      const next = new Set(current);
      if (next.has(kpiId)) next.delete(kpiId);
      else next.add(kpiId);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="task_alt"
        title="No issues recorded"
        // Worth saying plainly: an empty table here is a normal state, not a
        // fault. The roll-up and data-source engines write values but never
        // these notes, so only hand-entered quarters can ever appear.
        message="Issues and remedies are typed in per quarter on the KPI progress form. Rolled-up and data-source rows never carry one."
      />
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Th align="center" className="w-16 whitespace-nowrap">Quarter</Th>
          <Th>Issue</Th>
          <Th>Remedy</Th>
        </tr>
      </thead>
      <tbody>
        {groupedRows.map((group) => {
          const expanded = expandedKpiIds.has(group.kpiId);
          return (
            <Fragment key={group.kpiId}>
              <tr>
                <td colSpan={3} className="border-b border-hairline bg-surface-soft p-0">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.kpiId)}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-sm px-lg py-sm text-left hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <Icon name={expanded ? "expand_less" : "expand_more"} size={18} className="text-mute" />
                    <span className="font-medium text-on-surface">{group.name}</span>
                    <span className="text-caption-sm text-mute">
                      {group.issues.length} issue{group.issues.length === 1 ? "" : "s"}
                    </span>
                  </button>
                </td>
              </tr>
              {expanded &&
                group.issues.map((r) => (
                  <Tr key={`${r.kpiId}-${r.quarterNo}`} onClick={() => onOpenKpi(r.kpiId)}>
                    <Td align="center" className="w-16 align-top whitespace-nowrap">
                      <Badge tone="neutral">Q{r.quarterNo}</Badge>
                    </Td>
                    <Td className="align-top">
                      <span className="line-clamp-3" title={r.issue}>
                        {r.issue}
                      </span>
                    </Td>
                    <Td className="align-top">
                      {r.solution == null ? (
                        <span className="text-mute">—</span>
                      ) : (
                        <span className="line-clamp-3" title={r.solution}>
                          {r.solution}
                        </span>
                      )}
                    </Td>
                  </Tr>
                ))}
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}
