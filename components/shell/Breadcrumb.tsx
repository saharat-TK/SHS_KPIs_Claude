"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useBreadcrumbLabels } from "./BreadcrumbLabels";
import { useT } from "@/lib/i18n/useT";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

// Path segment -> i18n key. Resolved with t() at render time; unknown segments
// fall back to the raw segment, and per-page overrides (dynamic DB names) win.
const LABELS: Record<string, TranslationKey> = {
  dashboard: "breadcrumb.dashboard",
  committee: "breadcrumb.committee",
  faculty: "breadcrumb.faculty",
  export: "breadcrumb.export",
  kpis: "breadcrumb.kpis",
  "kpi-management": "breadcrumb.kpi-management",
  library: "breadcrumb.library",
  performance: "breadcrumb.performance",
  "data-sources": "breadcrumb.data-sources",
  metrics: "breadcrumb.metrics",
  formulas: "breadcrumb.formulas",
  builder: "breadcrumb.builder",
  history: "breadcrumb.history",
  analytics: "breadcrumb.analytics",
  "student-success": "breadcrumb.student-success",
  admin: "breadcrumb.admin",
  units: "breadcrumb.units",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const overrides = useBreadcrumbLabels();
  const t = useT();
  const segments = pathname.split("/").filter(Boolean);

  // The dashboard is the app's root view, so it doubles as the leading crumb.
  // On /dashboard itself that would otherwise render as "Dashboard › Dashboard".
  const rest = segments[0] === "dashboard" ? [] : segments;

  const crumbs = [
    { href: "/dashboard", label: t(LABELS.dashboard) },
    ...rest.map((seg, i) => {
      const href = "/" + rest.slice(0, i + 1).join("/");
      const key = LABELS[seg];
      return { href, label: overrides[href] ?? (key ? t(key) : seg) };
    }),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-nowrap items-center gap-xs overflow-hidden text-caption-sm text-mute"
    >
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span
            key={c.href}
            className={cn("flex items-center gap-xs", last ? "min-w-0" : "shrink-0")}
          >
            {i > 0 && (
              <Icon name="chevron_right" size={16} className="shrink-0 text-stone" />
            )}
            {last ? (
              <span className="truncate max-w-[420px] font-semibold text-on-surface">
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="whitespace-nowrap hover:text-on-surface transition-colors"
              >
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
