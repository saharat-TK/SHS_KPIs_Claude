import type { CommitteeMembership, FacultyRecord } from "@/lib/types";

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
