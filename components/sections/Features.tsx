"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  MapPin,
  UserPlus,
  ListChecks,
  Bell,
  Users,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "../ui/Reveal";

const ICONS: LucideIcon[] = [MapPin, UserPlus, ListChecks, Bell, Users, LineChart];

type Item = { title: string; desc: string };

export function Features() {
  const t = useTranslations("features");
  const items = t.raw("items") as Item[];

  return (
    <section id="features" className="bg-[var(--color-surface)] py-24 md:py-32">
      <div className="container-page">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-[var(--color-line-soft)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
              {t("eyebrow")}
            </span>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const Icon = ICONS[i] ?? MapPin;
            return (
              <Reveal key={i} delay={i * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group h-full rounded-[var(--radius-card)] border border-[var(--color-line-soft)] bg-white p-7 transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.15)]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-accent)] transition-transform group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{it.title}</h3>
                  <p className="mt-2 text-[var(--color-ink-muted)] leading-relaxed">{it.desc}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
