// Framework-agnostic i18n constants. Safe to import from both client and
// server components (no next/headers, no browser APIs here).

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** The school is primarily Thai-speaking, so Thai is the out-of-the-box UI. */
export const DEFAULT_LOCALE: Locale = "th";

/** Cookie the preference is persisted in, read server-side in app/layout.tsx so
 *  <html lang> is correct on first paint and there's no language flash. */
export const LOCALE_COOKIE = "shs_locale";

/** One year, in seconds — used when writing the cookie on the client. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "th" || value === "en";
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
