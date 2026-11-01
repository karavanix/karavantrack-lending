import { useTranslations, useLocale } from "next-intl";
import { SITE, ANCHORS } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";

// Navy bar, 64px: mark + wordmark, anchors, «Войти», main button. On phones the anchors and the
// button fold into the menu. The language switcher comes back with the uz/en translations.
export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const items = [
    { href: ANCHORS.how, label: t("how") },
    { href: ANCHORS.drivers, label: t("drivers") },
    { href: ANCHORS.faq, label: t("faq") },
  ];

  return (
    <header className="relative z-40 bg-bg text-surface">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <a href={`/${locale}`} aria-label="YoolLive" className="text-surface">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {items.map((it) => (
            <a key={it.href} href={it.href} className="text-white/75 transition hover:text-white">
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-sm font-medium">
          <a href={SITE.login} data-track="login" className="py-3 text-[15px] text-surface transition hover:text-white md:text-sm">
            {t("login")}
          </a>
          <span className="hidden md:block">
            <Button href={SITE.register} size="sm" data-track="nav_cta">
              {t("start")}
            </Button>
          </span>
          <MobileMenu
            items={items}
            start={{ href: SITE.register, label: t("start") }}
            telegram={t("telegram")}
            menuLabel={t("menu")}
          />
        </div>
      </div>
    </header>
  );
}
