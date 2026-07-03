"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Lets a page register a friendly label for a dynamic breadcrumb segment
// (e.g. "/kpi-management/library/1" -> "SHS Strategic Set 2568-2572"), keyed by
// the crumb's full href. Breadcrumb reads these overrides before the static
// LABELS map. Generic: any page with a dynamic id in its path can use it.

type LabelMap = Record<string, string>;

interface BreadcrumbLabelContextValue {
  labels: LabelMap;
  setLabel: (href: string, label: string) => void;
  clearLabel: (href: string) => void;
}

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null);

export function BreadcrumbLabelProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<LabelMap>({});

  const setLabel = useCallback((href: string, label: string) => {
    setLabels((prev) => (prev[href] === label ? prev : { ...prev, [href]: label }));
  }, []);

  const clearLabel = useCallback((href: string) => {
    setLabels((prev) => {
      if (!(href in prev)) return prev;
      const next = { ...prev };
      delete next[href];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ labels, setLabel, clearLabel }),
    [labels, setLabel, clearLabel],
  );

  return (
    <BreadcrumbLabelContext.Provider value={value}>
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

/** Read-only access to the override map (used by Breadcrumb). */
export function useBreadcrumbLabels(): LabelMap {
  return useContext(BreadcrumbLabelContext)?.labels ?? {};
}

/**
 * Register a friendly label for a breadcrumb href. Pass a falsy `label` while
 * the name is still loading — nothing is registered until it resolves. The
 * override is removed on unmount or when the href changes.
 */
export function useBreadcrumbLabel(href: string, label: string | null | undefined) {
  const ctx = useContext(BreadcrumbLabelContext);
  // setLabel/clearLabel are stable (useCallback []). Depend on them directly,
  // NOT on the whole ctx object — its identity changes whenever `labels` update,
  // which would make this effect's clear→set cleanup oscillate infinitely.
  const setLabel = ctx?.setLabel;
  const clearLabel = ctx?.clearLabel;

  useEffect(() => {
    if (!setLabel || !clearLabel || !label) return;
    setLabel(href, label);
    return () => clearLabel(href);
  }, [href, label, setLabel, clearLabel]);
}
