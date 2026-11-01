import { useTranslations, useLocale } from "next-intl";
import { SITE, ANCHORS } from "@/lib/site";
import { Logo } from "./ui/Logo";

// Navy footer: brand and tagline, link columns, © line. The languages line from the
// mock-up waits for the uz/en translations.
export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const n = useTranslations("nav");

  return (
    <footer className="bg-bg pb-8 pt-14 text-surface">
      <div className="container-page flex flex-col gap-10">
        <div className="flex flex-wrap justify-between gap-x-16 gap-y-8">
          <div className="flex max-w-[360px] flex-[1_1_280px] flex-col gap-3.5">
            <a href={`/${locale}`} aria-label="YoolLive" className="inline-flex text-surface">
              <Logo />
            </a>
            <p className="t-small leading-[1.55] text-white/70">{t("tagline")}</p>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-8 text-sm">
            <FooterCol title={t("product")}>
              <FooterLink href={ANCHORS.how}>{n("how")}</FooterLink>
              <FooterLink href={ANCHORS.drivers}>{n("drivers")}</FooterLink>
              <FooterLink href={ANCHORS.faq}>{n("faq")}</FooterLink>
            </FooterCol>
            <FooterCol title={t("contacts")}>
              <a href={`mailto:${SITE.email}`} className="text-accent-soft transition hover:text-white">
                {SITE.email}
              </a>
            </FooterCol>
            <FooterCol title={t("docs")}>
              <FooterLink href={SITE.privacy} external>
                {t("privacy")}
              </FooterLink>
              <FooterLink href={SITE.terms} external>
                {t("terms")}
              </FooterLink>
            </FooterCol>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-6 text-[13px] text-white/55">
          <span>{t("rights")}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="t-label text-[11px]! text-white/55">{title}</span>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a href={href} className="text-white/80 transition hover:text-white" {...props}>
      {children}
    </a>
  );
}
