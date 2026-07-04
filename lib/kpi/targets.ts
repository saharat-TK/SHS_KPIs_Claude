// Per-year cap rule (schema decision #5): when five_year_target is set, each
// annual target must be less than or equal to it. The sum of annual targets may
// exceed the cap. Shared by the library target routes so KPIs and metrics
// validate identically.

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
        error: `Year ${t.yearNo} target (${t.targetValue}) must not exceed the 5-year target (${fiveYearTarget})`,
      };
    }
  }

  return { ok: true };
}
