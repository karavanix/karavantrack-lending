import type { MetadataRoute } from "next";
import { defaultLocale, liveLocales } from "@/i18n/routing";
import { SITE } from "@/lib/site";

// One entry per language, each listing all of them as alternates (hreflang in the sitemap,
// the same set as `alternates.languages` in the layout).
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(liveLocales.map((l) => [l, `${SITE.url}/${l}`]));
  return liveLocales.map((locale) => ({
    url: `${SITE.url}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
