// Performance-approval state machine + position→stage resolution.
//
// Pure, dependency-free so it is unit-testable and shared by the API route
// (authoritative enforcement) and the queue UI (to decide which buttons show).
//
// Chain:  draft ─submit→ submitted ─forward→ forwarded ─approve→ approved(LOCKED)
//                   ▲ │                   ▲ │
//   return(lead)────┘ │   reject(counselor)┘ │
//                     └──────── reverse (admin only, from approved) ───────────┘

import type {
  ApprovalAction,
  ApprovalState,
  CommitteeMembership,
  Position,
  Role,
  StageRole,
} from "@/lib/types";

export type ApprovalLockTone = "warning" | "success";

export interface ApprovalLockInfo {
  locked: boolean;
  icon: string;
  tone: ApprovalLockTone;
  label: string;
  tabLabel: string;
}

/** A single legal transition in the workflow. */
export interface TransitionRule {
  action: ApprovalAction;
  from: ApprovalState[];
  to: ApprovalState;
  /** Which resolved stage role may invoke it. */
  stage: StageRole;
}

export const TRANSITIONS: TransitionRule[] = [
  { action: "submit", from: ["draft", "returned"], to: "submitted", stage: "member" },
  { action: "return", from: ["submitted"], to: "returned", stage: "lead" },
  { action: "forward", from: ["submitted"], to: "forwarded", stage: "lead" },
  { action: "approve", from: ["forwarded"], to: "approved", stage: "counselor" },
  { action: "reject", from: ["forwarded"], to: "submitted", stage: "counselor" },
  // Admin-only unlock: send a finally-approved record back for correction.
  { action: "reverse", from: ["approved"], to: "returned", stage: "admin" },
];

export const APPROVAL_DATA_LOCKED_STATES: ApprovalState[] = [
  "submitted",
  "forwarded",
  "approved",
];

const APPROVAL_LOCK: Partial<Record<ApprovalState, ApprovalLockInfo>> = {
  submitted: {
    locked: true,
    icon: "schedule",
    tone: "warning",
    label: "Submitted, under the Committee lead reviewing",
    tabLabel: "Submitted",
  },
  forwarded: {
    locked: true,
    icon: "schedule",
    tone: "warning",
    label: "Forwarded, under the Managerial final reviewing",
    tabLabel: "Forwarded",
  },
  approved: {
    locked: true,
    icon: "approval",
    tone: "success",
    label: "Approved. Contact admin if reversal is needed",
    tabLabel: "Approved",
  },
};

export function isApprovalDataLocked(state: ApprovalState | null | undefined): boolean {
  return !!state && APPROVAL_DATA_LOCKED_STATES.includes(state);
}

export function approvalLockForState(
  state: ApprovalState | null | undefined,
): ApprovalLockInfo | null {
  return state ? APPROVAL_LOCK[state] ?? null : null;
}

/** The stage a committee position acts as, ignoring any admin rights. */
export function stageForPosition(
  position: Position | null | undefined,
): StageRole | null {
  switch (position) {
    case "Counselor":
      return "counselor";
    case "Committee Lead":
      return "lead";
    case "Committee":
    case "Committee and Secretary":
      return "member";
    default:
      return null;
  }
}

/** Every stage a person may act as.
 *
 *  Admin is **additive**, not a replacement: an administrator who also sits on
 *  the committee keeps their position's transitions and gains `reverse` on top.
 *  Collapsing the two would silently strip a Committee Lead who happens to hold
 *  the admin system role of their ability to forward. */
export function resolveStageRoles(
  position: Position | null | undefined,
  isAdmin: boolean,
): StageRole[] {
  const stages: StageRole[] = [];
  const positionStage = stageForPosition(position);
  if (positionStage) stages.push(positionStage);
  if (isAdmin) stages.push("admin");
  return stages;
}

/** Map a committee membership position (+ app role) to a single acting stage.
 *  Prefer `resolveStageRoles` — this collapses admin over position and exists
 *  for callers that genuinely need one value. */
export function resolveStageRole(
  position: Position | null | undefined,
  userRole: Role | null | undefined,
): StageRole | null {
  if (userRole === "admin") return "admin";
  return stageForPosition(position);
}

/** Resolve a user's position for a target committee from loaded memberships.
 *  Exact committee membership wins. The fallback keeps demo data usable when a
 *  KPI references a committee that has no membership rows yet: in that case, a
 *  faculty member's single real membership supplies their position only. */
export function resolvePositionFromMemberships(
  memberships: CommitteeMembership[] | null | undefined,
  facultyId: string | null | undefined,
  committeeId: string | null | undefined,
): Position | null {
  if (!memberships?.length || !facultyId || !committeeId) return null;

  const exact = memberships.find(
    (m) => m.facultyId === facultyId && m.committeeId === committeeId,
  );
  if (exact) return exact.position;

  const targetCommitteeRows = memberships.filter((m) => m.committeeId === committeeId);
  if (targetCommitteeRows.length > 0) return null;

  const actorRows = memberships.filter((m) => m.facultyId === facultyId);
  return actorRows.length === 1 ? actorRows[0].position : null;
}

/** The rule for a given action, if any. */
export function ruleFor(action: ApprovalAction): TransitionRule | undefined {
  return TRANSITIONS.find((t) => t.action === action);
}

function stageList(stages: StageRole | StageRole[] | null | undefined): StageRole[] {
  if (!stages) return [];
  return Array.isArray(stages) ? stages : [stages];
}

/** The stage that authorises this transition, or null if none does. Used for
 *  the audit trail, which records one acting role per event. */
export function authorizingStage(
  stages: StageRole | StageRole[] | null,
  fromState: ApprovalState,
  action: ApprovalAction,
): StageRole | null {
  const rule = ruleFor(action);
  if (!rule || !rule.from.includes(fromState)) return null;
  return stageList(stages).find((s) => s === rule.stage) ?? null;
}

/** True when the actor — acting as any of `stages` — may move an approval from
 *  `fromState` via `action`. */
export function canTransition(
  stages: StageRole | StageRole[] | null,
  fromState: ApprovalState,
  action: ApprovalAction,
): boolean {
  return authorizingStage(stages, fromState, action) !== null;
}

/** Resulting state for an action; null if the action is unknown. */
export function nextState(action: ApprovalAction): ApprovalState | null {
  return ruleFor(action)?.to ?? null;
}

/** Actions the given stage role may perform from the given state — drives the
 *  per-row buttons in the queue UI. */
export function availableActions(
  stages: StageRole | StageRole[] | null,
  state: ApprovalState,
): ApprovalAction[] {
  const list = stageList(stages);
  if (list.length === 0) return [];
  return TRANSITIONS.filter(
    (t) => list.includes(t.stage) && t.from.includes(state),
  ).map((t) => t.action);
}

/** Actions that must carry a reviewer note (send-back / reject). */
export const ACTIONS_REQUIRING_COMMENT: ApprovalAction[] = ["return", "reject"];

export function actionRequiresComment(action: ApprovalAction): boolean {
  return ACTIONS_REQUIRING_COMMENT.includes(action);
}

/** Human labels for buttons / audit thread. */
export const ACTION_LABELS: Record<ApprovalAction, string> = {
  submit: "Submit",
  return: "Send back",
  forward: "Forward",
  approve: "Approve",
  reject: "Reject",
  reverse: "Reverse",
};
