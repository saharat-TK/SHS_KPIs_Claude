"use client";

import { useMemo } from "react";
import {
  usePerformanceRecords,
  usePerfKpis,
  useKpiCategories,
  useKpiTypes,
  usePerformancePeriods,
  useEdpexCatalog,
} from "@/lib/data/hooks";
import { KPI_TYPES, type PerformanceRecord } from "@/lib/types";
import {
  ALL_KPI_TYPES,
  categoriesForAllTypes,
  countByType,
  groupByEdpexTopic,
  groupsInUse,
  kpisInGroup,
  kpisOfType,
  pickActiveRecord,
  type DashboardKpi,
} from "@/lib/kpi/dashboard";
import { openQuartersForYear } from "@/lib/kpi/performancePeriods";
import { DEFAULT_KPI_TYPE, useDashboardFilters } from "./useDashboardFilters";

/**
 * Everything the dashboard's filters decide, in one place: which record is on
 * screen, which KPIs of it the type / group-by / group-tab filters keep, and
 * the group list those KPIs are split into. Shared by the Dashboard and the
 * Data Table page so the two can never disagree about what a filter means.
 */
export function useDashboardScope() {
  const filters = useDashboardFilters();
  const { recordId, year, group, type, groupBy } = filters;
  const recordsQ = usePerformanceRecords();
  const kpiTypesQ = useKpiTypes();

  const activeRecords = useMemo(
    () => (recordsQ.data ?? []).filter((r) => r.status === "active"),
    [recordsQ.data],
  );
  // Which record is on screen: the one the URL pins, else the active one that is
  // actually being recorded into. The id is never written back on mount, so a
  // link without ?record= keeps following whatever is active today.
  const autoRecord = useMemo(() => pickActiveRecord(recordsQ.data ?? []), [recordsQ.data]);
  const record: PerformanceRecord | null =
    (recordsQ.data ?? []).find((r) => r.id === recordId) ?? autoRecord;

  const kpisQ = usePerfKpis(record?.id ?? 0);
  const categoriesQ = useKpiCategories(record?.sourceSetId, { enabled: !!record });
  const periodsQ = usePerformancePeriods(record?.id ?? 0);
  const edpexQ = useEdpexCatalog();

  const kpis = useMemo<DashboardKpi[]>(() => kpisQ.data ?? [], [kpisQ.data]);
  const setCategories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);

  // The type toggle's options come from the kpi_type table rather than a
  // constant so a type added there gets an option instead of vanishing from
  // every view. KPI_TYPES is the loading fallback, the same idiom the library
  // editor uses.
  const kpiTypeOptions = useMemo(
    () =>
      kpiTypesQ.data
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((t) => ({ id: t.id, label: t.kpiTypeName })) ?? KPI_TYPES,
    [kpiTypesQ.data],
  );
  // Counts read the WHOLE record — they are what tells you a type is empty.
  const typeCounts = useMemo(() => countByType(kpis), [kpis]);
  // "All" leads the toggle: every KPI of the record, whatever its type.
  const kpiTypeItems = useMemo(
    () => [
      { id: ALL_KPI_TYPES, label: "All", count: kpis.length, disabled: kpis.length === 0 },
      ...kpiTypeOptions.map((t) => ({
        id: t.id,
        label: t.label,
        count: typeCounts[t.id] ?? 0,
        disabled: (typeCounts[t.id] ?? 0) === 0,
      })),
    ],
    [kpiTypeOptions, typeCounts, kpis.length],
  );
  // A ?t= naming a type this deployment does not have would scope the page to
  // nothing, so fall back rather than render an empty view.
  const activeType =
    type === ALL_KPI_TYPES || kpiTypeOptions.some((t) => t.id === type) ? type : DEFAULT_KPI_TYPE;

  // Everything below this line is scoped to one type. `typed` also carries the
  // routine-taxonomy swap, so `categoryId` already means the right column.
  // With "Group by: EdPEx", the EdPEx projection then re-keys `categoryId` to
  // the KPI's EdPEx topic and swaps the group list to match, so every grouping
  // helper works unchanged on either view.
  const { kpis: typed, categories } = useMemo(() => {
    const ofType = kpisOfType(kpis, activeType);
    return groupBy === "edpex"
      ? groupByEdpexTopic(ofType, edpexQ.data ?? [])
      : {
          kpis: ofType,
          // "All" mixes both taxonomies; list Strategic groups before Routine.
          categories:
            activeType === ALL_KPI_TYPES ? categoriesForAllTypes(setCategories) : setCategories,
        };
  }, [kpis, activeType, groupBy, edpexQ.data, setCategories]);

  const groups = useMemo(() => groupsInUse(typed, categories), [typed, categories]);
  // A group the record no longer has (after switching records or types) would
  // silently filter everything away, so fall back to All.
  const activeGroup = group !== "all" && !groups.some((g) => g.id === group) ? "all" : group;
  const scoped = useMemo(
    () => (activeGroup === "all" ? typed : kpisInGroup(typed, activeGroup, categories)),
    [typed, activeGroup, categories],
  );

  return {
    ...filters,
    recordsQ,
    kpisQ,
    record,
    activeRecords,
    /** Every KPI in the record, before any filter. */
    kpis,
    kpiTypeItems,
    activeType,
    /** The selected type's KPIs, `categoryId` re-keyed for the group-by view. */
    typed,
    /** The group list `typed` is keyed against. */
    categories,
    /** The groups actually present, in display order. */
    groups,
    activeGroup,
    /** `typed`, narrowed to the selected group tab. */
    scoped,
    openQuarters: openQuartersForYear(periodsQ.data ?? [], year),
    loading: recordsQ.isLoading || kpisQ.isLoading,
    isError: recordsQ.isError || kpisQ.isError,
  };
}

export type DashboardScope = ReturnType<typeof useDashboardScope>;
