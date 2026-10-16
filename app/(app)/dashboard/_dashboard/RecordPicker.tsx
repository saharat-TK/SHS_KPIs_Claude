"use client";

import { Badge, Select, Tabs } from "@/components/ui";
import { kpisInGroup } from "@/lib/kpi/dashboard";
import type { PerformanceStatus } from "@/lib/types";
import type { DashboardScope } from "./useDashboardScope";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  completed: "warning",
};

/** The record's status badge, plus a switcher when more than one record is
 *  active. Shared by the Dashboard and Data Table page headers. */
export function RecordPicker({ scope }: { scope: DashboardScope }) {
  const { record, activeRecords, setFilters } = scope;
  return (
    <>
      {record && <Badge tone={STATUS_TONE[record.status]}>{record.status}</Badge>}
      {activeRecords.length > 1 && (
        <Select
          aria-label="Performance record"
          value={String(record?.id ?? "")}
          onChange={(e) => setFilters({ recordId: Number(e.target.value) })}
          className="w-auto min-w-[220px] max-w-[320px]"
        >
          {activeRecords.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      )}
    </>
  );
}

/** "All Groups" plus one tab per group in use, each with its KPI count. */
export function GroupTabs({ scope }: { scope: DashboardScope }) {
  const { typed, groups, categories, activeGroup, setFilters } = scope;
  return (
    <Tabs
      items={[
        { id: "all", label: "All Groups", count: typed.length },
        ...groups.map((g) => ({
          id: g.id,
          label: g.label,
          count: kpisInGroup(typed, g.id, categories).length,
        })),
      ]}
      active={activeGroup}
      onChange={(g) => setFilters({ group: g })}
      className="rounded-lg !border-b-0 bg-surface-lowest px-sm shadow-chrome"
    />
  );
}
