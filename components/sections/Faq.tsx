import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { TelegramIcon, telegramAttrs } from "@/components/ui/Telegram";

// «Вопросы» (#faq): five <details>/<summary> items, no JS. The first one is open,
// the chevron turns with the `open` attribute. <summary> is focusable and toggles on Enter/Space.
// Under the list — «didn't find an answer?» with the Telegram button.
export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <Section id="faq" containerClassName="flex flex-wrap gap-x-20 gap-y-8">
      <SectionHeader size="feature" eyebrow={t("eyebrow")} title={t("title")} className="flex-[1_1_300px]" />
      <div className="flex min-w-0 flex-[2_1_560px] flex-col">
        {items.map((it, i) => (
          <details key={it.q} open={i === 0} className="group border-t border-line-soft py-[22px] last:border-b">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl font-display text-xl font-extrabold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
              {it.q}
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="t-body mt-3 max-w-[640px] leading-[1.6] text-ink-muted">{it.a}</p>
          </details>
        ))}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="t-body text-ink-muted">{t("more")}</p>
          <Button {...telegramAttrs("faq")} variant="secondary" size="sm">
            <TelegramIcon />
            {t("telegram")}
          </Button>
        </div>
      </div>
    </Section>
  );
}
