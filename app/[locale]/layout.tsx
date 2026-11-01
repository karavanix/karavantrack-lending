import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Golos_Text, JetBrains_Mono, Wix_Madefor_Display } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, liveLocales, isLocale } from "@/i18n/routing";
import { SITE } from "@/lib/site";
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
  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(SITE.url),
    icons: {
      icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
      shortcut: "/logo.svg",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    alternates: {
      languages: Object.fromEntries(liveLocales.map((l) => [l, `/${l}`])),
    },
  };
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

  return (
    <html
      lang={locale}
      className={`${wix.variable} ${cormorant.variable} ${golos.variable} ${mono.variable}`}
    >
      <body className="bg-surface text-ink">
        {/* No NextIntlClientProvider: client components get their strings as props,
            which keeps the messages and the intl runtime out of the browser bundle. */}
        {children}
      </body>
    </html>
  );
}
