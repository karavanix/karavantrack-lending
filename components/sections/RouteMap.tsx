"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, Truck, Clock } from "lucide-react";

const PATH = "M 40 220 C 120 120, 200 360, 320 220 S 520 80, 600 200";

export function RouteMap() {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();

  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[hsl(222_20%_9%)] to-[hsl(222_20%_5%)] shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in oklab, var(--color-accent-soft) 14%, transparent), transparent 45%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <svg viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(213 94% 55%)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(213 94% 55%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(213 94% 70%)" stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d={PATH}
          stroke="url(#route)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />

        <path d={PATH} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" strokeDasharray="2 8" />

        <g transform="translate(40 220)">
          <circle r="14" fill="hsl(213 94% 55%)" opacity="0.18" />
          <circle r="6" fill="hsl(213 94% 55%)" />
        </g>

        <g transform="translate(600 200)">
          <motion.circle
            r={16}
            fill="hsl(213 94% 55%)"
            opacity={0.2}
            animate={reduce ? undefined : { r: [16, 26, 16], opacity: [0.25, 0.05, 0.25] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <circle r="8" fill="hsl(213 94% 70%)" />
        </g>

        {/* moving truck dot — native SVG SMIL animation, no hydration mismatch */}
        <g>
          <circle r="14" fill="#fff" opacity="0.12" />
          <circle r="9" fill="#fff" />
          <circle r="4" fill="hsl(213 94% 55%)" />
          {!reduce && (
            <animateMotion dur="6s" repeatCount="indefinite" path={PATH} rotate="auto" />
          )}
        </g>
      </svg>

      <div className="absolute left-4 top-[46%] flex items-center gap-2 rounded-full bg-black/40 backdrop-blur px-3 py-1.5 text-xs text-white/90 border border-white/10">
        <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        {t("routeFrom")}
      </div>
      <div className="absolute right-4 top-[36%] flex items-center gap-2 rounded-full bg-black/40 backdrop-blur px-3 py-1.5 text-xs text-white/90 border border-white/10">
        <MapPin className="h-3.5 w-3.5 text-[var(--color-accent-soft)]" />
        {t("routeTo")}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-5 left-5 right-5 md:right-auto md:max-w-xs rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-xl"
      >
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          {t("live")}
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-white/50">{t("etaLabel")}</div>
              <div className="font-semibold tabular-nums text-white">{t("etaValue")}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Clock className="h-3.5 w-3.5" />
            14:32
          </div>
        </div>
      </motion.div>
    </div>
  );
}
