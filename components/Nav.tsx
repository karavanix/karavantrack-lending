"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SITE } from "@/lib/site";

export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[rgba(15,20,27,0.72)] backdrop-blur-md">
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
