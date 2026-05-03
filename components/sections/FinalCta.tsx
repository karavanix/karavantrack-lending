"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Reveal } from "../ui/Reveal";

type FormState = "idle" | "loading" | "success" | "error";

export function FinalCta() {
  const t = useTranslations("finalCta");
  const f = useTranslations("finalCta.form");
  const fleetOptions = f.raw("fleetOptions") as string[];
  const [state, setState] = useState<FormState>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.honeypot) return;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setState(res.ok ? "success" : "error");
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setState("error");
    }
  }

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-[var(--color-bg)] text-white py-24 md:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="container-page relative grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <div>
            <h2 className="h-section text-balance">{t("title")}</h2>
            <p className="mt-6 text-lg text-white/65 max-w-md text-balance">{t("subtitle")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={onSubmit}
            className="rounded-[var(--radius-card)] bg-white/5 backdrop-blur border border-white/10 p-6 md:p-8 space-y-4"
          >
            <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" className="hidden" />
            <Field name="name" label={f("name")} required />
            <Field name="company" label={f("company")} required />
            <Field name="phone" label={f("phone")} type="tel" required />
            <div>
              <label className="text-xs uppercase tracking-widest text-white/55">{f("fleet")}</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {fleetOptions.map((opt) => (
                  <label
                    key={opt}
                    className="cursor-pointer text-center rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white/80 transition has-[:checked]:bg-[var(--color-accent)] has-[:checked]:text-[var(--color-bg)] has-[:checked]:border-[var(--color-accent)]"
                  >
                    <input type="radio" name="fleet" value={opt} className="sr-only" required />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={state === "loading"}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] text-white h-12 font-semibold transition hover:brightness-110 disabled:opacity-60"
            >
              {state === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {f("submit")} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {state === "success" && (
              <p className="text-sm text-[var(--color-accent)]">{f("success")}</p>
            )}
            {state === "error" && <p className="text-sm text-red-400">{f("error")}</p>}
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-white/55">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1.5 block w-full rounded-xl bg-white/5 border border-white/10 px-4 h-12 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)] transition"
      />
    </label>
  );
}
