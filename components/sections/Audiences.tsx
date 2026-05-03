"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Reveal } from "../ui/Reveal";
import { SITE } from "@/lib/site";

export function Audiences() {
  const t = useTranslations("audiences");

  return (
    <section className="bg-[var(--color-surface)] py-24 md:py-32">
      <div className="container-page">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[var(--color-line-soft)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
              {t("eyebrow")}
            </span>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <motion.div
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-bg)] text-white p-10 md:p-12 min-h-[480px]"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 90% 110%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 55%)",
                }}
              />
              <div className="relative">
                <div className="text-xs uppercase tracking-widest text-[var(--color-accent)]">
                  {t("shipper.tag")}
                </div>
                <h3 className="mt-3 text-3xl md:text-4xl font-display font-semibold tracking-tight">
                  {t("shipper.title")}
                </h3>
                <p className="mt-4 text-white/60 max-w-md">{t("shipper.desc")}</p>
                <a
                  href={SITE.app}
                  className="mt-8 inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-soft)] transition"
                >
                  {t("shipper.cta")} <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <motion.div
                aria-hidden
                initial={{ opacity: 0, y: 30, rotate: 4 }}
                whileInView={{ opacity: 1, y: 0, rotate: 4 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="pointer-events-none absolute -right-16 top-[55%] w-[460px] md:w-[560px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:rotate-2 group-hover:-translate-y-2"
              >
                <Image
                  src="/computer.png"
                  alt=""
                  width={1200}
                  height={900}
                  className="w-full h-auto block"
                />
              </motion.div>
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line-soft)] bg-white p-10 md:p-12 min-h-[480px]"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 95% 105%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 55%)",
                }}
              />
              <div className="relative max-w-sm">
                <div className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                  {t("carrier.tag")}
                </div>
                <h3 className="mt-3 text-3xl md:text-4xl font-display font-semibold tracking-tight">
                  {t("carrier.title")}
                </h3>
                <p className="mt-4 text-[var(--color-ink-muted)]">{t("carrier.desc")}</p>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-line-soft)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  {t("carrier.soon")}
                </div>
              </div>

              <motion.div
                aria-hidden
                initial={{ opacity: 0, y: 30, rotate: -6 }}
                whileInView={{ opacity: 1, y: 0, rotate: -6 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                className="pointer-events-none absolute -right-6 top-[50%] w-[210px] md:w-[240px] rounded-[36px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,40,120,0.25)] ring-1 ring-[var(--color-line-soft)] transition-transform duration-500 group-hover:-rotate-3 group-hover:-translate-y-2"
              >
                <Image
                  src="/phone.png"
                  alt=""
                  width={600}
                  height={1230}
                  className="w-full h-auto block"
                />
              </motion.div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
