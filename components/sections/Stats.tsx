import { useTranslations } from "next-intl";
import { Reveal } from "../ui/Reveal";

type Item = { value: string; label: string };

export function Stats() {
  const t = useTranslations("stats");
  const items = t.raw("items") as Item[];

  return (
    <section className="bg-[var(--color-bg)] text-white py-20 border-y border-white/5">
      <div className="container-page">
        <Reveal>
          <h2 className="text-sm uppercase tracking-widest text-white/50 mb-10">{t("title")}</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-accent)]">
                  {it.value}
                </div>
                <div className="mt-3 text-sm text-white/60 leading-relaxed">{it.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-10 text-xs text-white/35">{t("footnote")}</p>
        </Reveal>
      </div>
    </section>
  );
}
