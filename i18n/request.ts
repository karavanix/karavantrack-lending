import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

/** All locales the site is built for; `messages/<locale>.json` exists for each. */
export const locales = ["ru", "uz", "en"] as const;
/** Locales that are actually served. The rest redirect to `defaultLocale` (middleware.ts). */
export const liveLocales = ["ru"] as const;
export const defaultLocale = "ru" as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (locales as readonly string[]).includes(requested ?? "")
    ? (requested as Locale)
    : defaultLocale;

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return { locale, messages };
});
