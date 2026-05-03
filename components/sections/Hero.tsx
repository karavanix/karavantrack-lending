"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, Play } from "lucide-react";
import { MagneticButton } from "../ui/MagneticButton";
import { RouteMap } from "./RouteMap";

export function Hero() {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)] text-white pt-32 pb-24 md:pt-40 md:pb-32">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-60" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-accent) 25%, transparent), transparent)",
        }}
      />

      <div className="container-page relative grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-white/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            {t("eyebrow")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="h-display mt-6 text-balance"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-white/70 text-balance"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton href="#cta">
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <a
              href="#how"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20">
                <Play className="h-4 w-4" />
              </span>
              {t("ctaSecondary")}
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative"
        >
          <RouteMap />
        </motion.div>
      </div>
    </section>
  );
}
