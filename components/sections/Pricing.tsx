"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";
import { cn } from "@/lib/cn";

type Plan = {
  name: string;
  price: string;
  desc: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

export function Pricing() {
  const t = useTranslations("pricing");
  const plans = t.raw("plans") as Plan[];

  return (
    <section id="pricing" className="bg-[var(--color-surface)] py-24 md:py-32">
      <div className="container-page">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[var(--color-line-soft)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
              {t("eyebrow")}
            </span>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-bg)] px-4 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              {t("betaBadge")}
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                className={cn(
                  "h-full rounded-[var(--radius-card)] p-8 md:p-10 flex flex-col",
                  p.highlight
                    ? "bg-[var(--color-bg)] text-white shadow-[0_30px_60px_-30px_rgba(25,227,194,0.4)] ring-1 ring-[var(--color-accent)]/40"
                    : "bg-white border border-[var(--color-line-soft)]",
                )}
              >
                <div className={p.highlight ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"}>
                  <span className="text-xs uppercase tracking-widest">{p.name}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight">{p.price}</span>
                </div>
                <p className={cn("mt-3", p.highlight ? "text-white/60" : "text-[var(--color-ink-muted)]")}>{p.desc}</p>

                <ul className="mt-8 space-y-3 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex gap-2 text-sm">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          p.highlight ? "text-[var(--color-accent)]" : "text-[var(--color-bg)]",
                        )}
                      />
                      <span className={p.highlight ? "text-white/85" : "text-[var(--color-ink)]"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  as="a"
                  href="#cta"
                  variant={p.highlight ? "primary" : "secondary"}
                  size="md"
                  className="mt-10 w-full"
                >
                  {p.cta}
                </Button>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
