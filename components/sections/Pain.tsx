import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Reveal } from "../ui/Reveal";

export function Pain() {
  const t = useTranslations("pain");
  const items = t.raw("items") as string[];
  const sol = t.raw("solutionItems") as string[];

  return (
    <section className="bg-[var(--color-surface)] py-24 md:py-32">
      <div className="container-page grid gap-16 lg:grid-cols-2 lg:gap-24">
        <Reveal>
          <div>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="h-section mt-4 text-balance">{t("title")}</h2>
            <ul className="mt-10 space-y-4">
              {items.map((it, i) => (
                <li key={i} className="flex gap-3 text-[var(--color-ink-muted)]">
                  <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-red-500/10 text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-lg">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[var(--radius-card)] bg-[var(--color-bg)] text-white p-10 md:p-12 shadow-xl">
            <Eyebrow tone="dark">{t("solutionEyebrow")}</Eyebrow>
            <h3 className="h-section mt-4 text-balance">{t("solutionTitle")}</h3>
            <ul className="mt-10 space-y-4">
              {sol.map((it, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-lg text-white/90">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Eyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-widest ${
        tone === "light"
          ? "bg-[var(--color-line-soft)] text-[var(--color-ink-muted)]"
          : "bg-white/10 text-white/70"
      }`}
    >
      {children}
    </span>
  );
}
