"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[color-mix(in_oklab,var(--color-bg)_85%,transparent)] backdrop-blur-md border-b border-white/5"
          : "bg-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between text-white">
        <Link href={`/${locale}`} aria-label="Yool" className="text-white">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
          <a href="#features" className="hover:text-white transition">{t("features")}</a>
          <a href="#how" className="hover:text-white transition">{t("how")}</a>
          <a href="#pricing" className="hover:text-white transition">{t("pricing")}</a>
          <a href="#faq" className="hover:text-white transition">{t("faq")}</a>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <a
            href={SITE.app}
            className="hidden sm:inline-flex h-10 items-center px-4 text-sm text-white/80 hover:text-white transition"
          >
            {t("login")}
          </a>
          <Button as="a" href="#cta" size="md">
            {t("demo")}
          </Button>
        </div>
      </div>
    </header>
  );
}
