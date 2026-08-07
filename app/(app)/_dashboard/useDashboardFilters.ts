"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERFORMANCE_YEAR_COUNT } from "@/lib/kpi/performancePeriods";

export interface DashboardFilters {
  /** Null means "follow whatever record is active" — the URL pins one only
   *  after an explicit switch, so a bare link keeps tracking the live record. */
  recordId: number | null;
  year: number;
  quarter: number;
  /** "all", a category id, or UNCATEGORISED. */
  group: string;
  /** A kpi_type slug. Not validated here — kpi_type is a DB table, so the live
   *  list decides what is real. Dashboard falls back when it isn't. */
  type: string;
}

/** Defaults applied when the key is absent. A key whose value equals its default
 *  is dropped from the URL, so the common view has a clean address. */
const DEFAULT_YEAR = 1;
const DEFAULT_QUARTER = 4;
const DEFAULT_GROUP = "all";
export const DEFAULT_KPI_TYPE = "strategic";

/** Parse to an integer inside [min, max], or fall back. A hand-edited ?q=9 must
 *  degrade to a usable view, never blank the page. */
function clampParam(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

/**
 * Dashboard filter state, held in the URL so a view can be linked and pasted.
 * Keys are kept short (`record`, `y`, `q`, `g`) because these addresses get
 * shared in chat.
 *
 * Writes use router.replace, not push: stepping the quarter should not fill the
 * back stack, so Back still means "the page before the dashboard".
 */
export function useDashboardFilters(): DashboardFilters & {
  setFilters: (patch: Partial<DashboardFilters>) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<DashboardFilters>(() => {
    const rawRecord = Number(searchParams.get("record"));
    return {
      recordId: Number.isInteger(rawRecord) && rawRecord > 0 ? rawRecord : null,
      year: clampParam(searchParams.get("y"), 1, PERFORMANCE_YEAR_COUNT, DEFAULT_YEAR),
      quarter: clampParam(searchParams.get("q"), 1, 4, DEFAULT_QUARTER),
      group: searchParams.get("g") || DEFAULT_GROUP,
      type: searchParams.get("t") || DEFAULT_KPI_TYPE,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const next = new URLSearchParams(searchParams.toString());
      const put = (key: string, value: string, fallback: string) => {
        if (value === fallback) next.delete(key);
        else next.set(key, value);
      };
      if ("recordId" in patch) {
        if (patch.recordId == null) next.delete("record");
        else next.set("record", String(patch.recordId));
      }
      if (patch.year != null) put("y", String(patch.year), String(DEFAULT_YEAR));
      if (patch.quarter != null) put("q", String(patch.quarter), String(DEFAULT_QUARTER));
      if (patch.group != null) put("g", patch.group, DEFAULT_GROUP);
      if (patch.type != null) put("t", patch.type, DEFAULT_KPI_TYPE);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return { ...filters, setFilters };
}
