import { useTranslations } from "next-intl";
import { ShieldCheck, Lock, FileText, Server } from "lucide-react";
import { Reveal } from "../ui/Reveal";

type Item = { title: string; desc: string };

const ICONS = [Lock, ShieldCheck, FileText, Server];

export function Trust() {
  const t = useTranslations("trust");
  const items = t.raw("items") as Item[];

  return (
    <section className="bg-[var(--color-bg)] text-white py-24 md:py-28 border-t border-white/5">
      <div className="container-page">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
              {t("eyebrow")}
            </span>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => {
            const Icon = ICONS[i] ?? Lock;
            return (
              <Reveal key={i} delay={i * 0.05}>
                <div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 border border-white/10 text-[var(--color-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-semibold text-lg">{it.title}</h3>
                  <p className="mt-1 text-white/55 text-sm leading-relaxed">{it.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
