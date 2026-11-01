import { SITE } from "@/lib/site";

// Official Russian store badges, one visual height (App Store 52px; the Google Play PNG carries
// its own padding, so it is 78px tall with a negative side margin). Files in public/badges/:
// Google Play from play.google.com/intl/ru/badges, App Store = Apple's
// Download_on_the_App_Store_Badge_RU_RGB_blk (tools.applemarketingtools.com does not resolve here).
export function StoreBadges({
  googlePlay,
  appStore,
  className = "",
}: {
  googlePlay: string;
  appStore: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-3 ${className}`}>
      <a href={SITE.stores.googlePlay} target="_blank" rel="noopener noreferrer" className="-mx-2.5 inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badges/google-play.png" alt={googlePlay} height={78} className="h-[78px] w-auto" loading="lazy" />
      </a>
      <a href={SITE.stores.appStore} target="_blank" rel="noopener noreferrer" className="inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badges/app-store.svg" alt={appStore} height={52} className="h-[52px] w-auto" loading="lazy" />
      </a>
    </div>
  );
}
