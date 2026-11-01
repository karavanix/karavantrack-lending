import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { SITE } from "@/lib/site";

// Official store badges in the page's language, one visual height (App Store 52px; the Google Play
// PNG carries its own padding, so it is 78px tall with a negative side margin). Files in
// public/badges/: Google Play from play.google.com/intl/en_us/badges (`<lang>_badge_web_generic.png`),
// App Store = Apple's Download_on_the_App_Store_Badge_<RU|US-UK>_RGB_blk from Wikimedia Commons
// (tools.applemarketingtools.com does not resolve here). Apple has no Uzbek badge there, so uz
// shows the English one.
const APP_STORE_BADGE: Record<Locale, string> = { ru: "ru", uz: "en", en: "en" };

export function StoreBadges({
  googlePlay,
  appStore,
  className = "",
}: {
  googlePlay: string;
  appStore: string;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-3 ${className}`}>
      <a
        href={SITE.stores.googlePlay}
        target="_blank"
        rel="noopener noreferrer"
        data-track="store_google"
        className="-mx-2.5 inline-flex"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/badges/google-play.${locale}.png`} alt={googlePlay} height={78} className="h-[78px] w-auto" loading="lazy" />
      </a>
      <a href={SITE.stores.appStore} target="_blank" rel="noopener noreferrer" data-track="store_apple" className="inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/badges/app-store.${APP_STORE_BADGE[locale]}.svg`} alt={appStore} height={52} className="h-[52px] w-auto" loading="lazy" />
      </a>
    </div>
  );
}
