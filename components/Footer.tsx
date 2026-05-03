import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Mail, Instagram, Facebook, Send } from "lucide-react";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="bg-[var(--color-bg)] text-white/70">
      <div className="container-page py-16 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href={`/${locale}`} aria-label="Yool" className="inline-flex text-white">
            <Logo />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{t("tagline")}</p>

          <a
            href={`mailto:${SITE.email}`}
            className="mt-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
          >
            <Mail className="h-4 w-4" />
            {SITE.email}
          </a>

          <div className="mt-5 flex items-center gap-2">
            <SocialLink href={SITE.socials.instagram} label="Instagram">
              <Instagram className="h-4 w-4" />
            </SocialLink>
            <SocialLink href={SITE.socials.facebook} label="Facebook">
              <Facebook className="h-4 w-4" />
            </SocialLink>
            <SocialLink href={SITE.socials.telegram} label="Telegram">
              <Send className="h-4 w-4" />
            </SocialLink>
          </div>
        </div>

        <FooterCol title={t("product")}>
          <FooterLink href="#features">{t("links.features")}</FooterLink>
          <FooterLink href="#pricing">{t("links.pricing")}</FooterLink>
          <FooterLink href="#faq">{t("links.faq")}</FooterLink>
        </FooterCol>

        <FooterCol title={t("company")}>
          <FooterLink href="#">{t("links.about")}</FooterLink>
          <FooterLink href={`mailto:${SITE.email}`}>{t("links.contacts")}</FooterLink>
        </FooterCol>

        <FooterCol title={t("legal")}>
          <FooterLink href={SITE.privacy} external>
            {t("links.privacy")}
          </FooterLink>
          <FooterLink href={SITE.terms} external>
            {t("links.terms")}
          </FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-6 text-xs text-white/50">{t("rights")}</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-white/40 mb-4">{title}</div>
      <ul className="space-y-2 text-sm">{children}</ul>
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
    <li>
      <a href={href} className="hover:text-white transition" {...props}>
        {children}
      </a>
    </li>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 transition"
    >
      {children}
    </a>
  );
}
