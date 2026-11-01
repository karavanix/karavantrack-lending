import type { MetadataRoute } from "next";
import { liveLocales } from "@/i18n/request";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return liveLocales.map((locale) => ({
    url: `${SITE.url}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === "ru" ? 1 : 0.8,
  }));
}
