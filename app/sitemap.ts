import type { MetadataRoute } from "next";
import { locales } from "@/i18n/request";

const SITE = "https://yool.live";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === "ru" ? 1 : 0.8,
  }));
}
