"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useBreadcrumbLabels } from "./BreadcrumbLabels";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  committee: "Committees",
  faculty: "Faculty Roster",
  export: "Roster Export",
  kpis: "KPI Management",
  "kpi-management": "KPI Management",
  library: "KPIs Library",
  performance: "Performance Records",
  "data-sources": "Data Sources",
  metrics: "Metrics",
  formulas: "Formulas",
  builder: "Formula Builder",
  history: "Version History",
  analytics: "Analytics",
  "student-success": "Student Success",
  validation: "Validation Queue",
  admin: "Administration",
  units: "Units",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const overrides = useBreadcrumbLabels();
  const segments = pathname.split("/").filter(Boolean);

  // The dashboard is the app's root view, so it doubles as the leading crumb.
  // On /dashboard itself that would otherwise render as "Dashboard › Dashboard".
  const rest = segments[0] === "dashboard" ? [] : segments;

  const crumbs = [
    { href: "/dashboard", label: LABELS.dashboard },
    ...rest.map((seg, i) => {
      const href = "/" + rest.slice(0, i + 1).join("/");
      return { href, label: overrides[href] ?? LABELS[seg] ?? seg };
    }),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-nowrap items-center gap-xs overflow-hidden text-caption-sm text-[#8a8a8a]"
    >
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span
            key={c.href}
            className={cn("flex items-center gap-xs", last ? "min-w-0" : "shrink-0")}
          >
            {i > 0 && (
              <Icon name="chevron_right" size={16} className="shrink-0 text-[#5e5e5e]" />
            )}
            {last ? (
              <span className="truncate max-w-[420px] font-medium text-white">
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="whitespace-nowrap hover:text-white transition-colors"
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
