import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TelegramLink } from "@/components/ui/Telegram";

// «Вопросы» (#faq): five <details>/<summary> items, no JS. The first one is open,
// the chevron turns with the `open` attribute. <summary> is focusable and toggles on Enter/Space.
// Under the list — «didn't find an answer?» with the Telegram link.
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
        <p className="t-body mt-8 text-ink-muted">
          {t("more")}{" "}
          <TelegramLink place="faq" className="font-medium text-accent-deep transition hover:underline">
            {t("telegram")}
          </TelegramLink>
        </p>
      </div>
    </Section>
  );
}
