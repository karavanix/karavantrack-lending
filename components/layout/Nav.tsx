import { useTranslations, useLocale } from "next-intl";
import { SITE, ANCHORS, appLink } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { Languages } from "./Languages";
import { MobileMenu } from "./MobileMenu";

// Navy bar, 64px: mark + wordmark, anchors, RU UZ EN, «Войти», main button. On phones the anchors,
// the languages and the button fold into the menu; on tablets the languages live in the footer only
// (the bar has no room for them next to the uz labels).
export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const items = [
    { href: ANCHORS.how, label: t("how") },
    { href: ANCHORS.drivers, label: t("drivers") },
    { href: ANCHORS.faq, label: t("faq") },
  ];
  const login = appLink(SITE.login, locale);
  const register = appLink(SITE.register, locale);

  return (
    <header className="relative z-40 bg-bg text-surface">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <a href={`/${locale}`} aria-label="YoolLive" className="text-surface">
          <Logo />
        </a>

        <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium md:flex lg:gap-8">
          {items.map((it) => (
            <a key={it.href} href={it.href} className="text-white/75 transition hover:text-white">
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-sm font-medium">
          <Languages current={locale} label={t("language")} variant="codes" className="hidden gap-3 text-[13px] lg:flex" />
          <a href={login} data-track="login" className="whitespace-nowrap py-3 text-surface transition hover:text-white">
            {t("login")}
          </a>
          <span className="hidden md:block">
            <Button href={register} size="sm" data-track="nav_cta" className="whitespace-nowrap">
              {t("start")}
            </Button>
          </span>
          <MobileMenu
            items={items}
            login={{ href: login, label: t("login") }}
            start={{ href: register, label: t("start") }}
            telegram={t("telegram")}
            locale={locale}
            languageLabel={t("language")}
            menuLabel={t("menu")}
          />
        </div>
      </div>
    </header>
  );
}
