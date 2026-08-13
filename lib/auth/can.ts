import type { Role, User } from "@/lib/types";

// Coarse-grained actions gated across the app. Server-side enforcement in
// Phase 2 will mirror this same table.
export type Action =
  | "view_dashboards"
  | "configure_kpis" // KPIs, metrics, formulas
  | "submit_metrics"
  | "review_submissions" // approve / reject / request clarification
  | "record_performance" // performance-approval workflow (member/lead/counselor queue)
  | "manage_faculty" // committees, faculty, roster export
  | "view_faculty";

const MATRIX: Record<Role, Action[]> = {
  admin: [
    "view_dashboards",
    "configure_kpis",
    "submit_metrics",
    "review_submissions",
    "record_performance",
    "manage_faculty",
    "view_faculty",
  ],
  reviewer: ["view_dashboards", "review_submissions", "record_performance", "view_faculty"],
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

/** Every app role, in descending order of authority. This is the same set as
 *  the faculty.system_role ENUM — keep the two in step (see
 *  scripts/migrate-app-roles.mjs). */
export const ROLES: Role[] = ["admin", "reviewer", "committee", "viewer"];

// The "committee" role spans every committee position — member, lead and
// counselor alike. The specific position comes from committee_memberships and
// is surfaced separately (see UserMenu), so this label stays generic.
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  reviewer: "Reviewer",
  committee: "Committee Member",
  viewer: "Viewer",
};
