"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SITE } from "@/lib/site";

export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const hidden = useHideOnScrollDown();

  // Phones and tablets: out of the way while scrolling down (more room for
  // the trip), back on any scroll up. Desktop keeps it: the participants'
  // column is pinned right under it.
  return (
    <header
      data-hidden={hidden}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[var(--color-bg)] transition-transform duration-300 ease-out max-lg:data-[hidden=true]:-translate-y-full focus-within:translate-y-0 motion-reduce:transition-none"
    >
      <div className="container-page flex h-14 md:h-16 items-center justify-between text-white">
        <Link href={`/${locale}`} aria-label="YoolLive" className="text-white">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
          <a href="#trip" className="hover:text-white transition">{t("how")}</a>
          <a href="#drivers" className="hover:text-white transition">{t("drivers")}</a>
          <a href="#faq" className="hover:text-white transition">{t("faq")}</a>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitcher />
          <a
            href={SITE.app}
            className="hidden sm:inline-flex h-10 items-center px-3 text-sm text-white/80 hover:text-white transition"
          >
            {t("login")}
          </a>
          <a
            href={SITE.register}
            className="inline-flex h-9 md:h-10 items-center rounded-[10px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t("start")}
          </a>
        </div>
      </div>
    </header>
  );
}

// Hidden once the page has gone a little way down and is still going down;
// shown again near the top or after a short scroll up.
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const check = () => {
      frame = 0;
      const y = window.scrollY;
      if (y < 80) setHidden(false);
      else if (y > last + 8) setHidden(true);
      else if (y < last - 8) setHidden(false);
      else return; // too small a move to decide: keep comparing with `last`
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return hidden;
}
