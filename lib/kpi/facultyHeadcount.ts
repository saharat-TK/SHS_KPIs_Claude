// How many people a per-head metric divides by. Shared by the link modal's live
// preview and the server feed so the number a user sees is the number stored —
// the same reason kpiValueFromVariables is shared.
//
// No runtime imports: tests load this directly under node's type-stripping,
// which cannot resolve the "@/" alias for value imports.

/** Active staff in any of the given ranks.
 *
 *  Inactive people never count — a headcount is of people currently in post.
 *  The rank list is the caller's choice; ACADEMIC_RANKS (lib/types) is the usual
 *  one, excluding Support Staff.
 *
 *  Note the roster carries no history, so this is always the CURRENT headcount,
 *  even when feeding an earlier quarter. Callers surface that caveat. */
export function facultyHeadcount(
  faculty: { rank: string; status: string }[],
  ranks: string[],
): number {
  return faculty.filter((f) => f.status === "active" && ranks.includes(f.rank)).length;
}
