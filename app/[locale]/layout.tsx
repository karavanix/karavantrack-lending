import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Golos_Text, JetBrains_Mono, Wix_Madefor_Display } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, liveLocales, isLocale } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { Analytics } from "@/components/layout/Analytics";
import "../globals.css";

// Fonts per docs/funnel/design/system/README.md. Only the headline face and the text face are
// preloaded; the accent italic and the mono are small and come after first paint.
const wix = Wix_Madefor_Display({
  subsets: ["latin", "cyrillic"],
  weight: "800",
  variable: "--font-wix",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: "600",
  style: "italic",
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-golos",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: "500",
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: "#0f141b",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("title");
  const description = t("description");
  // Static 1200×630 PNG per locale, built by docs/funnel/tools/og/og.mjs. Only ru exists so far.
  const ogImage = { url: `/og.${liveLocales.includes(locale) ? locale : "ru"}.png`, width: 1200, height: 630, alt: title };
  // Search-console meta tags, only if the owner verifies that way instead of DNS.
  const verification = {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }),
    ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && { yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION }),
  };
  return {
    title,
    description,
    metadataBase: new URL(SITE.url),
    applicationName: "YoolLive",
    icons: {
      icon: [
        { url: "/logo.svg", type: "image/svg+xml" },
        { url: "/logo-512.png", type: "image/png", sizes: "512x512" },
      ],
      shortcut: "/logo.svg",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "YoolLive",
      url: `/${locale}`,
      locale: OG_LOCALES[locale],
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(liveLocales.map((l) => [l, `/${l}`])),
    },
    ...(Object.keys(verification).length && { verification }),
  };
}

const OG_LOCALES: Record<string, string> = { ru: "ru_RU", uz: "uz_UZ", en: "en_US" };

/** Organization + SoftwareApplication, no ratings or reviews (there are none). */
function jsonLd(description: string) {
  const organization = {
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: "YoolLive",
    url: SITE.url,
    logo: `${SITE.url}/logo-512.png`,
    email: SITE.email,
    telephone: SITE.phones.map((p) => p.tel),
    // Office as the footer shows it (district only for now); Yandex Webmaster's region needs it.
    address: {
      "@type": "PostalAddress",
      streetAddress: "Mirabad district",
      addressLocality: "Tashkent",
      addressCountry: "UZ",
    },
  };
  const application = {
    "@type": "SoftwareApplication",
    name: "YoolLive",
    description,
    url: SITE.url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, iOS",
    installUrl: [SITE.stores.googlePlay, SITE.stores.appStore],
    publisher: { "@id": `${SITE.url}/#organization` },
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [organization, application] });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta" });

  return (
    <html
      lang={locale}
      className={`${wix.variable} ${cormorant.variable} ${golos.variable} ${mono.variable}`}
    >
      <body className="bg-surface text-ink">
        {/* No NextIntlClientProvider: client components get their strings as props,
            which keeps the messages and the intl runtime out of the browser bundle. */}
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(t("description")) }} />
        <Analytics />
      </body>
    </html>
  );
}
