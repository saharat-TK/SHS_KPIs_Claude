import type { Role, User } from "@/lib/types";

// Coarse-grained actions gated across the app. Server-side enforcement in
// Phase 2 will mirror this same table.
export type Action =
  | "view_dashboards"
  | "configure_kpis" // KPIs, metrics, formulas
  | "submit_metrics"
  | "record_performance" // performance-approval workflow (member/lead/counselor queue)
  | "manage_faculty" // committees, faculty, roster export
  | "view_faculty";

const MATRIX: Record<Role, Action[]> = {
  admin: [
    "view_dashboards",
    "configure_kpis",
    "submit_metrics",
    "record_performance",
    "manage_faculty",
    "view_faculty",
  ],
  reviewer: ["view_dashboards", "record_performance", "view_faculty"],
  committee: ["view_dashboards", "submit_metrics", "record_performance", "view_faculty"],
  viewer: ["view_dashboards", "view_faculty"],
};

export interface ResourceCtx {
  // Optional resource scoping (e.g. committee users only act on their committee)
  committeeId?: string;
}

export function can(
  user: User | null,
  action: Action,
  resource?: ResourceCtx,
): boolean {
  if (!user) return false;
  const allowed = MATRIX[user.role]?.includes(action) ?? false;
  if (!allowed) return false;

  // Committee users are scoped to their own committee for write actions.
  if (
    user.role === "committee" &&
    (action === "submit_metrics") &&
    resource?.committeeId &&
    resource.committeeId !== user.committeeId
  ) {
    return false;
  }
  return true;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  reviewer: "Reviewer",
  committee: "Committee Lead",
  viewer: "Viewer",
};
