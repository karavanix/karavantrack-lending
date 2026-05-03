"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Reveal } from "../ui/Reveal";

type Step = { title: string; desc: string };

export function HowItWorks() {
  const t = useTranslations("how");
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how" className="relative overflow-hidden bg-[var(--color-bg)] text-white py-24 md:py-32">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-50" />
      <div className="container-page relative">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
              {t("eyebrow")}
            </span>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
          </div>
        </Reveal>

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <motion.li
                whileHover={{ y: -4 }}
                className="relative h-full rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] p-8"
              >
                <div className="font-display text-6xl font-bold text-[var(--color-accent)]/30 leading-none">
                  0{i + 1}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-white/60 leading-relaxed">{s.desc}</p>
              </motion.li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
