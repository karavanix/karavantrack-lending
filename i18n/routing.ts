// Locale configuration shared by the middleware, the layout, the sitemap and the request config.

/** All locales the site is built for; `messages/<locale>.json` exists for each. */
export const locales = ["ru", "uz", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

/** Locales that are actually served. The rest redirect to `defaultLocale` (middleware.ts). */
export const liveLocales: readonly Locale[] = ["ru", "uz", "en"];

/** Each language in its own name, for the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", uz: "Oʻzbekcha", en: "English" };

export function isLocale(value: string | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}

export function isLiveLocale(value: string | undefined): value is Locale {
  return (liveLocales as readonly string[]).includes(value ?? "");
}
