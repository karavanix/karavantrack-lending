import { useTranslations } from "next-intl";
import { Accordion } from "../ui/Accordion";

export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <section id="faq" className="bg-[var(--color-surface)] py-20 md:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <h2 className="h-section text-balance">{t("title")}</h2>
        <Accordion items={items} />
      </div>
    </section>
  );
}
