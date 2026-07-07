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

/** Map a committee membership position (+ app role) to the acting stage role.
 *  Admin role always wins so an administrator can reverse locked records. */
export function resolveStageRole(
  position: Position | null | undefined,
  userRole: Role | null | undefined,
): StageRole | null {
  if (userRole === "admin") return "admin";
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

/** The rule for a given action, if any. */
export function ruleFor(action: ApprovalAction): TransitionRule | undefined {
  return TRANSITIONS.find((t) => t.action === action);
}

/** True when `stageRole` may move an approval from `fromState` via `action`. */
export function canTransition(
  stageRole: StageRole | null,
  fromState: ApprovalState,
  action: ApprovalAction,
): boolean {
  if (!stageRole) return false;
  const rule = ruleFor(action);
  if (!rule) return false;
  return rule.stage === stageRole && rule.from.includes(fromState);
}

/** Resulting state for an action; null if the action is unknown. */
export function nextState(action: ApprovalAction): ApprovalState | null {
  return ruleFor(action)?.to ?? null;
}

/** Actions the given stage role may perform from the given state — drives the
 *  per-row buttons in the queue UI. */
export function availableActions(
  stageRole: StageRole | null,
  state: ApprovalState,
): ApprovalAction[] {
  if (!stageRole) return [];
  return TRANSITIONS.filter(
    (t) => t.stage === stageRole && t.from.includes(state),
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
