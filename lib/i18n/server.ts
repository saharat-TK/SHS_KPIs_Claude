import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";
import { translate, type TranslationKey } from "./dictionaries";

/** The active locale for a server render, resolved from the cookie. */
export function getServerLocale(): Locale {
  return normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);
}

/**
 * Server-component translator. Reads the locale from the cookie once and
 * returns a bound `t()` — mirrors the client `useT()` for server components
 * like the login page.
 */
export function getServerT() {
  const locale = getServerLocale();
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
