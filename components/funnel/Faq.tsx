import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Eyebrow } from "./ui/Eyebrow";

// «Вопросы» (#faq): five <details>/<summary> items, no JS. The first one is open,
// the chevron turns with the `open` attribute. <summary> is focusable and toggles on Enter/Space.
export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <section id="faq" className="py-[clamp(64px,7vw,112px)]">
      <div className="container-page flex flex-wrap gap-x-20 gap-y-8">
        <div className="flex flex-[1_1_300px] flex-col gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="t-feature">{t("title")}</h2>
        </div>
        <div className="flex min-w-0 flex-[2_1_560px] flex-col">
          {items.map((it, i) => (
            <details key={it.q} open={i === 0} className="group border-t border-line-soft py-[22px] last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl font-display text-xl font-extrabold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                {it.q}
                <ChevronDown
                  className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="t-body mt-3 max-w-[640px] leading-[1.6] text-ink-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
