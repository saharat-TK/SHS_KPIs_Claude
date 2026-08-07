"use client";

import { Badge, Table, Th, Td, Tr, EmptyState } from "@/components/ui";
import type { IssueRow } from "@/lib/kpi/dashboard";

export function IssuesTable({
  rows,
  onOpenKpi,
}: {
  rows: IssueRow[];
  onOpenKpi: (kpiId: number) => void;
}) {
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
    <Table>
      <thead>
        <tr>
          <Th>KPI</Th>
          <Th align="center">Quarter</Th>
          <Th>Issue</Th>
          <Th>Remedy</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Tr key={`${r.kpiId}-${r.quarterNo}`} onClick={() => onOpenKpi(r.kpiId)}>
            <Td className="align-top font-medium">{r.kpiName}</Td>
            <Td align="center" className="align-top">
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
      </tbody>
    </Table>
  );
}
