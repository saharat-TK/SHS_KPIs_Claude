// Cumulative-sum-cap rule (schema decision #5): the five_year_target is the
// total across the whole strategic period. The 5 annual targets are slices of
// it, so BOTH the sum of the annual targets AND each individual year must not
// exceed the cap. Enforced here (app layer) because a CHECK can't sum sibling
// rows or compare across tables. Shared by the library and performance target
// routes so KPIs and metrics validate identically.

export interface TargetInput {
  yearNo: number; // 1..5
  targetValue: number | null;
}

export function validateAnnualTargets(
  fiveYearTarget: number | null,
  targets: TargetInput[],
): { ok: true } | { ok: false; error: string } {
  // Structural checks.
  for (const t of targets) {
    if (!Number.isInteger(t.yearNo) || t.yearNo < 1 || t.yearNo > 5) {
      return { ok: false, error: `Invalid yearNo: ${t.yearNo}` };
    }
    if (t.targetValue != null && (typeof t.targetValue !== "number" || Number.isNaN(t.targetValue))) {
      return { ok: false, error: `Year ${t.yearNo} target must be a number` };
    }
    if (t.targetValue != null && t.targetValue < 0) {
      return { ok: false, error: `Year ${t.yearNo} target cannot be negative` };
    }
  }

  // No cap set → nothing to enforce.
  if (fiveYearTarget == null) return { ok: true };

  for (const t of targets) {
    if (t.targetValue != null && t.targetValue > fiveYearTarget) {
      return {
        ok: false,
        error: `Year ${t.yearNo} target (${t.targetValue}) exceeds the 5-year target (${fiveYearTarget})`,
      };
    }
  }

  const sum = targets.reduce((acc, t) => acc + (t.targetValue ?? 0), 0);
  if (sum > fiveYearTarget) {
    return {
      ok: false,
      error: `The sum of annual targets (${sum}) exceeds the 5-year target (${fiveYearTarget})`,
    };
  }

  return { ok: true };
}
