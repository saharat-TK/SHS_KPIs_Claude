import type { Role, User } from "@/lib/types";

// Coarse-grained actions gated across the app. Server-side enforcement in
// Phase 2 will mirror this same table.
export type Action =
  | "view_dashboards"
  | "configure_kpis" // KPIs, metrics, formulas
  | "submit_metrics"
  | "review_submissions" // approve / reject / request clarification
  | "manage_faculty" // departments, faculty, roster export
  | "view_faculty";

const MATRIX: Record<Role, Action[]> = {
  admin: [
    "view_dashboards",
    "configure_kpis",
    "submit_metrics",
    "review_submissions",
    "manage_faculty",
    "view_faculty",
  ],
  reviewer: ["view_dashboards", "review_submissions", "view_faculty"],
  department: ["view_dashboards", "submit_metrics", "view_faculty"],
  viewer: ["view_dashboards", "view_faculty"],
};

export interface ResourceCtx {
  // Optional resource scoping (e.g. department users only act on their dept)
  departmentId?: string;
}

export function can(
  user: User | null,
  action: Action,
  resource?: ResourceCtx,
): boolean {
  if (!user) return false;
  const allowed = MATRIX[user.role]?.includes(action) ?? false;
  if (!allowed) return false;

  // Department users are scoped to their own department for write actions.
  if (
    user.role === "department" &&
    (action === "submit_metrics") &&
    resource?.departmentId &&
    resource.departmentId !== user.departmentId
  ) {
    return false;
  }
  return true;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  reviewer: "Reviewer",
  department: "Department Lead",
  viewer: "Viewer",
};
