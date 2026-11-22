// Parsing for the formatted cell types: Year (BE), Month and Date.
//
// One source of truth for what these accept, used by cell validation
// (coerceCellValue), Excel paste and CSV import (normalizeCellInput), link
// filter operands, and the examples shown next to every input — so the form,
// the grid, the file import and the API can never disagree.
//
// Pure, no runtime imports, so tests load it directly.

/** Thrown with a message that reads after the column's label, e.g.
 *  `"Publication year (BE)" must be a 4-digit BE year, e.g. 2569`. */
export class CellFormatError extends Error {}

const fail = (message: string): never => {
  throw new CellFormatError(message);
};

/** Years from here on are read as Buddhist era: no CE date in this system is
 *  anywhere near 2400, and every BE year in use is (2400 BE = 1857 CE). */
export const BE_YEAR_FROM = 2400;
export const BE_OFFSET = 543;
const MIN_CE_YEAR = 1900;
const MAX_BE_YEAR = 2999;

/** This year in the Buddhist era — the default for every year field. */
export const currentBEYear = (now: Date = new Date()) => now.getFullYear() + BE_OFFSET;

/** The example shown with each input, in hints, placeholders and the CSV legend. */
export const FORMAT_EXAMPLE = {
  year_be: "e.g. 2569",
  month: "1–12, e.g. 3 (March)",
  date: "e.g. 2026-03-15 or 15/03/2026",
} as const;

export const MONTHS = [
  { value: 1, en: "January", th: "มกราคม", thShort: "ม.ค." },
  { value: 2, en: "February", th: "กุมภาพันธ์", thShort: "ก.พ." },
  { value: 3, en: "March", th: "มีนาคม", thShort: "มี.ค." },
  { value: 4, en: "April", th: "เมษายน", thShort: "เม.ย." },
  { value: 5, en: "May", th: "พฤษภาคม", thShort: "พ.ค." },
  { value: 6, en: "June", th: "มิถุนายน", thShort: "มิ.ย." },
  { value: 7, en: "July", th: "กรกฎาคม", thShort: "ก.ค." },
  { value: 8, en: "August", th: "สิงหาคม", thShort: "ส.ค." },
  { value: 9, en: "September", th: "กันยายน", thShort: "ก.ย." },
  { value: 10, en: "October", th: "ตุลาคม", thShort: "ต.ค." },
  { value: 11, en: "November", th: "พฤศจิกายน", thShort: "พ.ย." },
  { value: 12, en: "December", th: "ธันวาคม", thShort: "ธ.ค." },
] as const;

/** How a stored month reads in a picker or table: "3 — March (มี.ค.)". */
export const monthLabel = (value: number) => {
  const m = MONTHS[value - 1];
  return m ? `${m.value} — ${m.en} (${m.thShort})` : String(value);
};

/** Short form for table cells and CSV export: "3 — Mar". */
export const monthShortLabel = (value: number) => {
  const m = MONTHS[value - 1];
  return m ? `${m.value} — ${m.en.slice(0, 3)}` : String(value);
};

const text = (raw: unknown) => String(raw ?? "").trim();

/** A Buddhist-era year as a number — Year (BE) cells and every entry's period
 *  year. A CE year is rejected with its BE equivalent rather than converted:
 *  silently moving a value by 543 years is worse than asking. */
export function parseYearBE(raw: unknown): number {
  const s = text(raw);
  if (!/^\d{4}$/.test(s)) fail(`must be a 4-digit BE year, ${FORMAT_EXAMPLE.year_be}`);
  const year = Number(s);
  if (year >= MIN_CE_YEAR && year < BE_YEAR_FROM) {
    fail(`is ${year}, which looks like a CE year — the BE year is ${year + BE_OFFSET}`);
  }
  if (year < MIN_CE_YEAR || year > MAX_BE_YEAR) {
    fail(`must be a 4-digit BE year, ${FORMAT_EXAMPLE.year_be}`);
  }
  return year;
}

// Every accepted spelling, folded the same way as the input: lower case with
// spaces and dots removed, so "Mar.", "mar" and "มี.ค." all match.
const fold = (s: string) => s.toLowerCase().replace(/[\s.]/g, "");
const MONTH_BY_NAME = new Map<string, number>(
  MONTHS.flatMap((m) => [
    [fold(m.en), m.value],
    [fold(m.en.slice(0, 3)), m.value],
    [fold(m.th), m.value],
    [fold(m.thShort), m.value],
  ]),
);
MONTH_BY_NAME.set("sept", 9);

/** A month 1-12 from a number or an English/Thai name or abbreviation. */
export function parseMonth(raw: unknown): number {
  const s = text(raw);
  if (/^\d{1,2}(\.0+)?$/.test(s)) {
    const n = Number(s);
    if (n >= 1 && n <= 12) return n;
  } else {
    const n = MONTH_BY_NAME.get(fold(s));
    if (n) return n;
  }
  return fail(`must be a month ${FORMAT_EXAMPLE.month}`);
}

const pad = (n: number) => String(n).padStart(2, "0");

function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) return false;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate(); // last day of month m
  return d <= days;
}

// Excel stores a date as days since 1899-12-30. Only a 5-digit serial is read
// as one (1927-2173), so a stray small number is never taken for a date.
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

/** A date as "YYYY-MM-DD". Accepts ISO, D/M/YYYY with / - or . (always day
 *  first — the Thai convention), and an Excel date serial from a paste. */
export function parseDate(raw: unknown): string {
  const s = text(raw);
  let y: number, m: number, d: number;

  let match: RegExpExecArray | null;
  if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if (/^\d{5}$/.test(s)) {
    const date = new Date(EXCEL_EPOCH_MS + Number(s) * 86_400_000);
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  } else {
    return fail(`must be a date ${FORMAT_EXAMPLE.date.replace("e.g.", "like")}`);
  }

  if (y >= BE_YEAR_FROM) {
    fail(
      `is ${s}, which uses a Buddhist-era year — write ${pad(d)}/${pad(m)}/${y - BE_OFFSET}`,
    );
  }
  if (y < MIN_CE_YEAR || !isRealDate(y, m, d)) {
    fail(`is ${s}, which is not a real date (${FORMAT_EXAMPLE.date})`);
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

export type FormattedType = keyof typeof FORMAT_EXAMPLE;
export const isFormattedType = (t: string): t is FormattedType => t in FORMAT_EXAMPLE;

/** Canonical text for an input box, so a pasted "15/03/2026" or "มี.ค." shows
 *  as what will be saved. Anything unparseable is returned untouched for
 *  validation to report — this never hides a bad value. */
export function normalizeCellInput(dataType: string, raw: string): string {
  if (!raw.trim()) return raw;
  try {
    if (dataType === "year_be") return String(parseYearBE(raw));
    if (dataType === "month") return String(parseMonth(raw));
    if (dataType === "date") return parseDate(raw);
  } catch {
    /* left for validation to report */
  }
  return raw;
}
