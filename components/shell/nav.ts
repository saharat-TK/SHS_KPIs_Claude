import type { Action } from "@/lib/auth/can";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Action required to see this item; omit = visible to all roles. */
  requires?: Action;
  exact?: boolean;
  /** Nested sub-menu items. When present this item renders as a collapsible
   *  parent whose row toggles the children rather than navigating. */
  children?: NavItem[];
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
        label: "Faculty Management",
        href: "/faculty/management",
        icon: "manage_accounts",
        requires: "manage_faculty",
      },
    ],
  },
  {
    label: "KPI Management",
    items: [
      {
        label: "KPI Management",
        href: "/kpi-management",
        icon: "stacked_bar_chart",
        children: [
          {
            label: "Performance Records",
            href: "/kpi-management/performance",
            icon: "assessment",
          },
          {
            label: "KPIs Library",
            href: "/kpi-management/library",
            icon: "library_books",
            requires: "configure_kpis",
          },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Units",
        href: "/admin/units",
        icon: "square_foot",
        requires: "configure_kpis",
      },
    ],
  },
  {
    label: "Administration (prototype)",
    items: [
      {
        label: "KPIs (prototype)",
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
      {
        label: "Performance Approvals",
        href: "/performance-approvals",
        icon: "approval",
        requires: "record_performance",
      },
    ],
  },
];
