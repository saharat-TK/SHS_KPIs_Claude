import type { CommitteeMembership, FacultyRecord, Position } from "@/lib/types";

export interface PersonOption {
  id: string;
  name: string;
  /** false when this is the kept-and-flagged current selection (not a member). */
  inCommittee: boolean;
}

/**
 * Faculty eligible as "Person in Charge" for the given committee — the committee's
 * members. When a person is already selected but is not a member (e.g. after the
 * committee changed), they are kept as a flagged option so an existing assignment
 * is never silently dropped. Returns an empty list when no committee is selected.
 */
export function personsForCommittee(
  faculty: FacultyRecord[],
  memberships: CommitteeMembership[] | undefined,
  committeeId: string,
  selectedPersonId: string,
): PersonOption[] {
  const memberIds = new Set(
    committeeId
      ? (memberships ?? [])
          .filter((m) => m.committeeId === committeeId)
          .map((m) => m.facultyId)
      : [],
  );
  const options: PersonOption[] = faculty
    .filter((f) => memberIds.has(f.id))
    .map((f) => ({ id: f.id, name: f.name, inCommittee: true }));
  if (selectedPersonId && !memberIds.has(selectedPersonId)) {
    const f = faculty.find((x) => x.id === selectedPersonId);
    options.push({ id: selectedPersonId, name: f?.name ?? selectedPersonId, inCommittee: false });
  }
  return options;
}

/** What is still attached to a committee, and therefore blocks deleting it. */
export interface CommitteeUsage {
  memberships: number;
  dataSources: number;
  libraryKpis: number;
  libraryMetrics: number;
  performanceKpis: number;
}

const USAGE_LABELS: [keyof CommitteeUsage, string, string][] = [
  ["memberships", "roster member", "roster members"],
  ["dataSources", "data source", "data sources"],
  ["libraryKpis", "library KPI", "library KPIs"],
  ["libraryMetrics", "library metric", "library metrics"],
  ["performanceKpis", "recorded KPI", "recorded KPIs"],
];

/**
 * Why a committee cannot be deleted, or `null` when nothing is attached to it.
 *
 * Deleting would cascade its memberships away, unassign its library KPIs and
 * metrics, and strand perf_kpi.committee_id — which carries no FK, and which the
 * approval workflow reads to resolve an approver's position. So the rule is to
 * refuse and name what is in the way. The same text is used for the DELETE
 * route's 409 body and the disabled button's tooltip, so the client's
 * explanation and the server's refusal can never disagree.
 */
export function describeCommitteeUsage(usage: CommitteeUsage): string | null {
  const parts = USAGE_LABELS.filter(([key]) => usage[key] > 0).map(
    ([key, one, many]) => `${usage[key]} ${usage[key] === 1 ? one : many}`,
  );
  if (parts.length === 0) return null;
  return `Still in use: ${parts.join(", ")}. Detach them, or set the committee to Inactive instead.`;
}

/**
 * The readable id for a new committee, matching the existing "cmt-curriculum"
 * style rather than a random suffix. The trailing "committee" word is dropped
 * because every name ends with it. Callers must still resolve collisions — this
 * only produces the base, and the column is VARCHAR(30).
 */
export function committeeIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-?committee$/, "")
    .replace(/^-+|-+$/g, "");
  if (!slug) return "";
  return `cmt-${slug}`.slice(0, 30).replace(/-+$/, "");
}

/** A singleton roster slot: one faculty member, or unfilled. */
export type SlotState = { facultyId: string; kpiFocus: string } | null;

/** A membership write, declarative enough for the caller to map onto its own
 *  create/update/remove mutations. `update`'s `position` is only present when
 *  the row's position is actually changing — every other patch is kpiFocus-only. */
export type MembershipAction =
  | { type: "create"; facultyId: string; position: Position; kpiFocus: string }
  | { type: "update"; facultyId: string; kpiFocus: string; position?: Position }
  | { type: "remove"; facultyId: string };

/**
 * Combines two independently-edited KPI Focus boxes into the single column a
 * merged Counselor-and-Committee-Lead row can store. Equal values collapse to
 * one — this is what makes loading a merged row's shared value into both
 * boxes, then saving with no edits, a no-op instead of re-concatenating.
 */
export function mergeKpiFocus(counselorFocus: string, leadFocus: string): string {
  const a = counselorFocus.trim();
  const b = leadFocus.trim();
  return a === b ? a : `${a} / ${b}`;
}

/** One singleton slot's create/update/remove, independent of any other slot. */
export function diffOneSlot(
  old: SlotState,
  next: SlotState,
  position: Position,
): MembershipAction[] {
  if (!old && next) {
    return [{ type: "create", facultyId: next.facultyId, position, kpiFocus: next.kpiFocus }];
  }
  if (old && !next) {
    return [{ type: "remove", facultyId: old.facultyId }];
  }
  if (old && next) {
    if (old.facultyId !== next.facultyId) {
      return [
        { type: "remove", facultyId: old.facultyId },
        { type: "create", facultyId: next.facultyId, position, kpiFocus: next.kpiFocus },
      ];
    }
    if (old.kpiFocus !== next.kpiFocus) {
      return [{ type: "update", facultyId: old.facultyId, kpiFocus: next.kpiFocus }];
    }
  }
  return [];
}

/**
 * Reconciles the Counselor + Committee Lead slot pair into the minimal set of
 * create/update/remove actions, respecting committee_memberships' one-row-
 * per-person-per-committee primary key: forming or dissolving a merged
 * "Counselor and Committee Lead" row is always a PATCH on the person's
 * existing row, never a duplicate create alongside it.
 *
 * Branches on whether the pair is merged (both slots hold the same person)
 * before and after the edit. Each branch is exhaustive and mutually exclusive
 * with its siblings by construction — see tests/committee.test.mjs.
 */
export function diffCounselorLeadSlots(
  old: { counselor: SlotState; committeeLead: SlotState },
  next: { counselor: SlotState; committeeLead: SlotState },
): MembershipAction[] {
  const oldMerged =
    old.counselor && old.committeeLead && old.counselor.facultyId === old.committeeLead.facultyId
      ? old.counselor.facultyId
      : null;
  const newMerged =
    next.counselor && next.committeeLead && next.counselor.facultyId === next.committeeLead.facultyId
      ? next.counselor.facultyId
      : null;

  if (oldMerged === null && newMerged === null) {
    return [
      ...diffOneSlot(old.counselor, next.counselor, "Counselor"),
      ...diffOneSlot(old.committeeLead, next.committeeLead, "Committee Lead"),
    ];
  }

  if (oldMerged === null && newMerged !== null) {
    const nc = next.counselor;
    const nl = next.committeeLead;
    if (!nc || !nl) return []; // unreachable: newMerged already confirmed both are set
    const kpiFocus = mergeKpiFocus(nc.kpiFocus, nl.kpiFocus);
    const actions: MembershipAction[] = [];
    if (old.counselor?.facultyId === newMerged) {
      if (old.committeeLead) actions.push({ type: "remove", facultyId: old.committeeLead.facultyId });
      actions.push({ type: "update", facultyId: newMerged, position: "Counselor and Committee Lead", kpiFocus });
    } else if (old.committeeLead?.facultyId === newMerged) {
      if (old.counselor) actions.push({ type: "remove", facultyId: old.counselor.facultyId });
      actions.push({ type: "update", facultyId: newMerged, position: "Counselor and Committee Lead", kpiFocus });
    } else {
      if (old.counselor) actions.push({ type: "remove", facultyId: old.counselor.facultyId });
      if (old.committeeLead) actions.push({ type: "remove", facultyId: old.committeeLead.facultyId });
      actions.push({ type: "create", facultyId: newMerged, position: "Counselor and Committee Lead", kpiFocus });
    }
    return actions;
  }

  if (oldMerged !== null && newMerged === null) {
    const nc = next.counselor;
    const nl = next.committeeLead;
    const actions: MembershipAction[] = [];
    if (nc?.facultyId === oldMerged) {
      actions.push({ type: "update", facultyId: oldMerged, position: "Counselor", kpiFocus: nc.kpiFocus });
      if (nl) actions.push({ type: "create", facultyId: nl.facultyId, position: "Committee Lead", kpiFocus: nl.kpiFocus });
    } else if (nl?.facultyId === oldMerged) {
      actions.push({ type: "update", facultyId: oldMerged, position: "Committee Lead", kpiFocus: nl.kpiFocus });
      if (nc) actions.push({ type: "create", facultyId: nc.facultyId, position: "Counselor", kpiFocus: nc.kpiFocus });
    } else {
      actions.push({ type: "remove", facultyId: oldMerged });
      if (nc) actions.push({ type: "create", facultyId: nc.facultyId, position: "Counselor", kpiFocus: nc.kpiFocus });
      if (nl) actions.push({ type: "create", facultyId: nl.facultyId, position: "Committee Lead", kpiFocus: nl.kpiFocus });
    }
    return actions;
  }

  // oldMerged !== null && newMerged !== null — still merged, maybe a different
  // person or edited text.
  const oc = old.counselor;
  const nc = next.counselor;
  const nl = next.committeeLead;
  if (!oc || !nc || !nl) return []; // unreachable: oldMerged/newMerged already confirmed these are set
  if (newMerged === oldMerged) {
    const kpiFocus = mergeKpiFocus(nc.kpiFocus, nl.kpiFocus);
    if (kpiFocus !== oc.kpiFocus) {
      return [{ type: "update", facultyId: oc.facultyId, kpiFocus }];
    }
    return [];
  }
  return [
    { type: "remove", facultyId: oc.facultyId },
    {
      type: "create",
      facultyId: nc.facultyId,
      position: "Counselor and Committee Lead",
      kpiFocus: mergeKpiFocus(nc.kpiFocus, nl.kpiFocus),
    },
  ];
}
