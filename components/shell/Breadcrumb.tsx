"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  committee: "Committees",
  faculty: "Faculty Roster",
  export: "Roster Export",
  kpis: "KPI Management",
  metrics: "Metrics",
  formulas: "Formulas",
  builder: "Formula Builder",
  history: "Version History",
  analytics: "Analytics",
  "student-success": "Student Success",
  validation: "Validation Queue",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [
    { href: "/", label: "Home" },
    ...segments.map((seg, i) => ({
      href: "/" + segments.slice(0, i + 1).join("/"),
      label: LABELS[seg] ?? seg,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-xs text-caption-sm text-mute">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href} className="flex items-center gap-xs">
            {i > 0 && <Icon name="chevron_right" size={16} className="text-stone" />}
            {last ? (
              <span className="text-on-surface font-medium">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-on-surface transition-colors">
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
