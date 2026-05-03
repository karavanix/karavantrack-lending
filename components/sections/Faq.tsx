import { useTranslations } from "next-intl";
import { Accordion } from "../ui/Accordion";
import { Reveal } from "../ui/Reveal";

export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <section id="faq" className="bg-[var(--color-surface)] py-24 md:py-32">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <Reveal>
          <div>
            <span className="inline-flex rounded-full bg-[var(--color-line-soft)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
              {t("eyebrow")}
            </span>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion items={items} />
        </Reveal>
      </div>
    </section>
  );
}
