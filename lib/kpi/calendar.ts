// Month-grid maths for the date picker (DateInput.tsx). Pure, and it imports only
// cellFormats so tests can load it directly.
//
// The picker shows Buddhist-era years but a date is stored as CE
// `YYYY-MM-DD`, so every cell carries both: `day` to draw, `iso` to hand back.
// All arithmetic is UTC, so the viewer's timezone can never move a day.

import { BE_OFFSET } from "./cellFormats.ts";

export interface CalendarDay {
  /** 1-based day of the month. */
  day: number;
  /** Stored form, CE `YYYY-MM-DD`. */
  iso: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Days in a month of a Buddhist-era year (month is 1–12). */
export function daysInMonth(beYear: number, month: number): number {
  return new Date(Date.UTC(beYear - BE_OFFSET, month, 0)).getUTCDate();
}

/** CE `YYYY-MM-DD` for a BE year, month and day. */
export function isoOf(beYear: number, month: number, day: number): string {
  return `${String(beYear - BE_OFFSET).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

/** The month's weeks, Sunday first. Days outside the month are `null`. */
export function monthGrid(beYear: number, month: number): (CalendarDay | null)[][] {
  const lead = new Date(Date.UTC(beYear - BE_OFFSET, month - 1, 1)).getUTCDay();
  const cells: (CalendarDay | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth(beYear, month); day += 1) {
    cells.push({ day, iso: isoOf(beYear, month, day) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Move a (BE year, month) pair by whole months, wrapping across years. */
export function shiftMonth(
  beYear: number,
  month: number,
  delta: number,
): { beYear: number; month: number } {
  const index = beYear * 12 + (month - 1) + delta;
  return { beYear: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 };
}

/** Today in the Buddhist era, by the viewer's local calendar. */
export function todayParts(now: Date = new Date()): {
  beYear: number;
  month: number;
  day: number;
} {
  return {
    beYear: now.getFullYear() + BE_OFFSET,
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

/** Split a stored CE `YYYY-MM-DD` into BE parts, or null if it is not one. */
export function partsOfIso(
  iso: string,
): { beYear: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year + BE_OFFSET, month)) {
    return null;
  }
  return { beYear: year + BE_OFFSET, month, day };
}

/** A stored CE date moved by whole days (negative goes back). */
export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  return `${String(moved.getUTCFullYear()).padStart(4, "0")}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/** A stored CE date moved by whole months. A day the target month lacks (31
 *  January + 1 month) lands on that month's last day instead of spilling over. */
export function addMonths(iso: string, months: number): string {
  const parts = partsOfIso(iso);
  if (!parts) return iso;
  const to = shiftMonth(parts.beYear, parts.month, months);
  return isoOf(to.beYear, to.month, Math.min(parts.day, daysInMonth(to.beYear, to.month)));
}
