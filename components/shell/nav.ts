import type { Action } from "@/lib/auth/can";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Action required to see this item; omit = visible to all roles. */
  requires?: Action;
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: "dashboard", exact: true },
      {
        label: "Student Success",
        href: "/analytics/student-success",
        icon: "insights",
      },
    ],
  },
  {
    label: "Faculty Data",
    items: [
      { label: "Committees", href: "/committee", icon: "account_tree" },
      { label: "Faculty Roster", href: "/faculty", icon: "groups" },
      {
        label: "Roster Export",
        href: "/faculty/export",
        icon: "download",
        requires: "manage_faculty",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "KPI Management",
        href: "/kpis",
        icon: "tune",
        requires: "configure_kpis",
      },
      {
        label: "Metrics",
        href: "/metrics",
        icon: "straighten",
        requires: "configure_kpis",
      },
      {
        label: "Formula Builder",
        href: "/formulas/builder",
        icon: "function",
        requires: "configure_kpis",
      },
      {
        label: "Version History",
        href: "/formulas/history",
        icon: "history",
        requires: "configure_kpis",
      },
    ],
  },
  {
    label: "Workflow",
    items: [
      {
        label: "Validation Queue",
        href: "/validation",
        icon: "fact_check",
        requires: "review_submissions",
      },
    ],
  },
];
