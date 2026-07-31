export const PERFORMANCE_YEAR_COUNT = 5;
export const PERFORMANCE_QUARTER_COUNT = 4;

/** Calendar (Buddhist-era) year for a record's yearNo. yearNo 1..5 maps to
 *  startYear..startYear+4 — the arithmetic that was inlined across the UI. */
export function yearForYearNo(startYear: number, yearNo: number): number {
  return startYear + yearNo - 1;
}

/** Inverse of yearForYearNo: which yearNo a calendar year falls on, or null when
 *  it lies outside the record's five-year span. The data-source feed needs this
 *  to place a raw entry on the right performance year. */
export function yearNoForYear(startYear: number, year: number): number | null {
  const yearNo = year - startYear + 1;
  return yearNo >= 1 && yearNo <= PERFORMANCE_YEAR_COUNT ? yearNo : null;
}

/** The rows that count toward (yearNo, quarterNo): cumulative within the year.
 *  Annual-grain entries carry no quarter and describe the whole year, so they
 *  count from Q1 onward (decision D5).
 *
 *  Generic over the row shape so this module keeps its no-imports rule — the
 *  feed passes its own Entry, a test passes a bare { year, quarter }. */
export function entriesInWindow<T extends { year: number; quarter: number | null }>(
  entries: T[],
  startYear: number,
  yearNo: number,
  quarterNo: number,
): T[] {
  const year = yearForYearNo(startYear, yearNo);
  return entries.filter(
    (e) => e.year === year && (e.quarter == null || e.quarter <= quarterNo),
  );
}

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
