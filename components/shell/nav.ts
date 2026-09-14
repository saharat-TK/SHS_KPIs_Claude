import type { Action } from "@/lib/auth/can";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export interface NavItem {
  /** i18n key resolved with t() at render time in Sidebar.tsx. */
  label: TranslationKey;
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
  /** i18n key resolved with t() at render time in Sidebar.tsx. */
  label: TranslationKey;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "nav.groups.overview",
    items: [
      { label: "nav.items.dashboard", href: "/dashboard", icon: "dashboard" },
      {
        label: "nav.items.studentSuccess",
        href: "/analytics/student-success",
        icon: "insights",
      },
    ],
  },
  {
    label: "nav.groups.workflow",
    items: [
      {
        label: "nav.items.performanceApprovals",
        href: "/performance-approvals",
        icon: "approval",
        requires: "record_performance",
      },
    ],
  },
  {
    label: "nav.groups.kpiManagement",
    items: [
      {
        label: "nav.items.kpiManagement",
        href: "/kpi-management",
        icon: "stacked_bar_chart",
        children: [
          {
            label: "nav.items.performanceRecords",
            href: "/kpi-management/performance",
            icon: "assessment",
          },
          {
            label: "nav.items.dataSources",
            href: "/kpi-management/data-sources",
            icon: "database",
          },
          {
            label: "nav.items.kpisLibrary",
            href: "/kpi-management/library",
            icon: "library_books",
            requires: "configure_kpis",
          },
        ],
      },
    ],
  },
  {
    label: "nav.groups.facultyData",
    items: [
      {
        label: "nav.items.facultyData",
        href: "/faculty",
        icon: "groups",
        children: [
          {
            label: "nav.items.facultyRoster",
            href: "/faculty",
            icon: "badge",
            exact: true,
          },
          {
            label: "nav.items.committees",
            href: "/committee",
            icon: "account_tree",
          },
          {
            label: "nav.items.facultyManagement",
            href: "/faculty/management",
            icon: "manage_accounts",
            requires: "manage_faculty",
          },
        ],
      },
    ],
  },
  {
    label: "nav.groups.administration",
    items: [
      {
        label: "nav.items.units",
        href: "/admin/units",
        icon: "square_foot",
        requires: "configure_kpis",
      },
    ],
  },
  {
    label: "nav.groups.administrationPrototype",
    items: [
      {
        label: "nav.items.kpisPrototype",
        href: "/kpis",
        icon: "tune",
        requires: "configure_kpis",
      },
      {
        label: "nav.items.metrics",
        href: "/metrics",
        icon: "straighten",
        requires: "configure_kpis",
      },
      {
        label: "nav.items.formulaBuilder",
        href: "/formulas/builder",
        icon: "function",
        requires: "configure_kpis",
      },
      {
        label: "nav.items.versionHistory",
        href: "/formulas/history",
        icon: "history",
        requires: "configure_kpis",
      },
    ],
  },
];
