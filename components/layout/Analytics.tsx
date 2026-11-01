"use client";

import { useEffect } from "react";
import Script from "next/script";
import { SITE } from "@/lib/site";
import { GA4_ID, YM_ID, TRACK_ATTR, currentUtm, initCounters, track, trackParams, withUtm, type Goal } from "@/lib/analytics";

/**
 * Mounted once in the layout. Three jobs, all behind the counters' ids:
 * 1. loads Yandex Metrika and GA4 after `load` (the queueing stubs are set first, so early clicks
 *    are not lost);
 * 2. reports clicks on `[data-track]` elements as goals — the sections stay server components and
 *    only carry the attribute;
 * 3. carries the utm marks, yclid and gclid from the landing URL into the registration and login
 *    links (rewrites the hrefs on mount and again on click, which also covers links rendered
 *    later, e.g. the menu).
 */
export function Analytics() {
  useEffect(() => {
    initCounters();

    const isAppEntry = (href: string) => href.startsWith(SITE.register) || href.startsWith(SITE.login);
    const utm = currentUtm();
    if (Object.keys(utm).length) {
      for (const a of document.querySelectorAll<HTMLAnchorElement>(`a[href^="${SITE.app}"]`)) {
        if (isAppEntry(a.href)) a.href = withUtm(a.href, utm);
      }
    }

    const onClick = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>(`a, button, [${TRACK_ATTR}]`);
      if (!target) return;
      if (target instanceof HTMLAnchorElement && isAppEntry(target.href)) {
        target.href = withUtm(target.href, utm);
      }
      const tracked = target.closest<HTMLElement>(`[${TRACK_ATTR}]`);
      const goal = tracked?.getAttribute(TRACK_ATTR);
      if (goal) track(goal as Goal, trackParams(tracked!));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      {YM_ID && (
        <>
          <Script src={`https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`} strategy="lazyOnload" />
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://mc.yandex.ru/watch/${YM_ID}`} style={{ position: "absolute", left: -9999 }} alt="" />
            </div>
          </noscript>
        </>
      )}
      {GA4_ID && (
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="lazyOnload" />
      )}
    </>
  );
}
