import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";

export function Start() {
  const t = useTranslations("start");
  const steps = t.raw("steps") as string[];

  return (
    <section id="start" className="bg-[var(--color-surface)] py-20 md:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        <div>
          <h2 className="h-section text-balance">{t("title")}</h2>
          <ol className="mt-8 grid gap-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-baseline gap-4 text-lg">
                <span className="font-mono text-sm font-bold text-[var(--color-accent)] tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[var(--color-ink)]">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={SITE.register}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 font-semibold text-white transition hover:brightness-110"
            >
              {t("cta")} <ArrowRight className="h-4 w-4" />
            </a>
            <a href={SITE.app} className="text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline">
              {t("login")}
            </a>
          </div>
        </div>

        <div id="drivers" className="scroll-mt-24 rounded-2xl bg-[var(--color-bg)] p-7 text-white md:p-9">
          <span className="font-mono text-xs uppercase tracking-widest text-white/50">{t("driverTag")}</span>
          <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-balance">
            {t("driverTitle")}
          </h3>
          <p className="mt-4 leading-relaxed text-white/70">{t("driverText")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={SITE.stores.googlePlay}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-3 rounded-xl bg-white px-5 font-semibold text-[var(--color-bg)] transition hover:bg-white/90"
            >
              <PlayIcon /> {t("googlePlay")}
            </a>
            {SITE.stores.appStore ? (
              <a
                href={SITE.stores.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-3 rounded-xl bg-white px-5 font-semibold text-[var(--color-bg)] transition hover:bg-white/90"
              >
                <AppleIcon /> {t("appStore")}
              </a>
            ) : (
              <span className="inline-flex h-12 items-center gap-3 rounded-xl border border-white/15 px-5 font-semibold text-white/60">
                <AppleIcon /> {t("appStore")} · {t("soon")}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M4 2.5v19l10-9.5z" fill="#2081F8" />
      <path d="M4 2.5l13 7.4-3 2.6z" fill="#21C45D" />
      <path d="M4 21.5l13-7.4-3-2.6z" fill="#DC2828" />
      <path d="M17 9.9l3.4 1.9c.8.5.8 1.3 0 1.8L17 15.5l-3-3z" fill="#F59F0A" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  );
}
