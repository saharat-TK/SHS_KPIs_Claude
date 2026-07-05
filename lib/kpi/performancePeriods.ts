export const PERFORMANCE_YEAR_COUNT = 5;
export const PERFORMANCE_QUARTER_COUNT = 4;

export interface PerformancePeriod {
  yearNo: number;
  quarterNo: number;
  isOpen: boolean;
}

type RawPerformancePeriod = {
  yearNo: unknown;
  quarterNo: unknown;
  isOpen: unknown;
};

function periodKey(yearNo: number, quarterNo: number) {
  return `${yearNo}:${quarterNo}`;
}

function assertValidPeriod(yearNo: number, quarterNo: number) {
  if (
    !Number.isInteger(yearNo) ||
    !Number.isInteger(quarterNo) ||
    yearNo < 1 ||
    yearNo > PERFORMANCE_YEAR_COUNT ||
    quarterNo < 1 ||
    quarterNo > PERFORMANCE_QUARTER_COUNT
  ) {
    throw new Error("Invalid yearNo/quarterNo");
  }
}

export function normalizePerformancePeriodInput(
  rows: RawPerformancePeriod[],
): PerformancePeriod[] {
  return rows.map((row) => {
    const yearNo = Number(row.yearNo);
    const quarterNo = Number(row.quarterNo);
    assertValidPeriod(yearNo, quarterNo);
    return { yearNo, quarterNo, isOpen: Boolean(row.isOpen) };
  });
}

export function buildPerformancePeriodMatrix(
  rows: RawPerformancePeriod[],
): PerformancePeriod[] {
  const byPeriod = new Map<string, PerformancePeriod>();

  for (const row of normalizePerformancePeriodInput(rows)) {
    byPeriod.set(periodKey(row.yearNo, row.quarterNo), row);
  }

  const periods: PerformancePeriod[] = [];
  for (let yearNo = 1; yearNo <= PERFORMANCE_YEAR_COUNT; yearNo += 1) {
    for (let quarterNo = 1; quarterNo <= PERFORMANCE_QUARTER_COUNT; quarterNo += 1) {
      periods.push(
        byPeriod.get(periodKey(yearNo, quarterNo)) ?? {
          yearNo,
          quarterNo,
          isOpen: false,
        },
      );
    }
  }
  return periods;
}

export function isPeriodOpen(
  periods: PerformancePeriod[],
  yearNo: number,
  quarterNo: number,
) {
  return periods.some((p) => p.yearNo === yearNo && p.quarterNo === quarterNo && p.isOpen);
}

/** Open quarter numbers for a given year, ascending. */
export function openQuartersForYear(
  periods: PerformancePeriod[],
  yearNo: number,
): number[] {
  return periods
    .filter((p) => p.yearNo === yearNo && p.isOpen)
    .map((p) => p.quarterNo)
    .sort((a, b) => a - b);
}

/** Lowest open quarter for a year, or null when none are open. */
export function firstOpenQuarter(
  periods: PerformancePeriod[],
  yearNo: number,
): number | null {
  const open = openQuartersForYear(periods, yearNo);
  return open.length > 0 ? open[0] : null;
}

/** Count of open periods across the full 5×4 matrix. */
export function openPeriodSummary(periods: PerformancePeriod[]): {
  openCount: number;
  total: number;
} {
  const openCount = periods.reduce((n, p) => (p.isOpen ? n + 1 : n), 0);
  return { openCount, total: PERFORMANCE_YEAR_COUNT * PERFORMANCE_QUARTER_COUNT };
}
