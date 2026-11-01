"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

// Lead form for large fleets. Posts {name, company, phone, fleet, honeypot} to /api/leads
// (app/api/leads/route.ts forwards it to api-server). States: idle → sending → success
// (the message replaces the fields) | error (text under the button, fields stay filled).
// Required fields are checked here (noValidate), the message is `lead.required`.
export type LeadLabels = {
  title: string;
  text: string;
  name: string;
  company: string;
  phone: string;
  fleet: string;
  fleetOptions: string[];
  submit: string;
  sending: string;
  success: string;
  error: string;
  required: string;
};

type Field = "name" | "company" | "phone" | "fleet";
const FIELDS: Field[] = ["name", "company", "phone", "fleet"];
type Status = "idle" | "sending" | "success" | "error";

const label =
  "flex flex-col gap-2 font-mono text-[11px] font-medium uppercase leading-4 tracking-[0.1em] text-white/70";
const control =
  "h-12 w-full rounded-button border border-line bg-bg px-3.5 font-sans text-base text-surface " +
  "transition focus:border-accent focus:outline-none aria-invalid:border-warning [color-scheme:dark]";

export function LeadForm({ t }: { t: LeadLabels }) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [missing, setMissing] = useState<Field[]>([]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const read = (k: string) => String(fd.get(k) ?? "").trim();
    const data = {
      name: read("name"),
      company: read("company"),
      phone: read("phone"),
      fleet: read("fleet"),
      honeypot: read("honeypot"),
    };

    const empty = FIELDS.filter((k) => !data[k]);
    setMissing(empty);
    if (empty.length) {
      (form.elements.namedItem(empty[0]) as HTMLElement | null)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  // A field that was flagged empty clears its message as soon as something is typed into it.
  function onInput(e: FormEvent<HTMLFormElement>) {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.value && missing.includes(el.name as Field)) setMissing(missing.filter((k) => k !== el.name));
  }

  function field(name: Field, children: ReactNode, className = "") {
    const bad = missing.includes(name);
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <label htmlFor={`${id}-${name}`} className={label}>
          {t[name]}
          {children}
        </label>
        {bad && (
          <p id={`${id}-${name}-err`} className="t-small text-warning">
            {t.required}
          </p>
        )}
      </div>
    );
  }

  function attrs(name: Field) {
    const bad = missing.includes(name);
    return {
      id: `${id}-${name}`,
      name,
      className: control,
      "aria-invalid": bad || undefined,
      "aria-describedby": bad ? `${id}-${name}-err` : undefined,
    };
  }

  return (
    <div className="min-w-0 flex-[1_1_380px] rounded-card border border-line bg-bg-soft p-[clamp(24px,3vw,36px)]">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{t.title}</h3>
        <p className="text-[15px] leading-[1.5] text-white/70">{t.text}</p>
      </div>

      {status === "success" ? (
        <div role="status" className="mt-6 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent-deep text-white">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="t-body pt-1 text-white/80">{t.success}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} onInput={onInput} noValidate className="mt-[18px] flex flex-col gap-[18px]">
          {/* Honeypot: hidden from people, bots fill it; the route answers ok and drops the lead. */}
          <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          {field("name", <input type="text" autoComplete="name" {...attrs("name")} />)}
          {field("company", <input type="text" autoComplete="organization" {...attrs("company")} />)}

          <div className="flex flex-wrap gap-x-3 gap-y-[18px]">
            {field("phone", <input type="tel" autoComplete="tel" inputMode="tel" {...attrs("phone")} />, "flex-[1_1_180px]")}
            {field(
              "fleet",
              <span className="relative block">
                <select defaultValue="" {...attrs("fleet")} className={`${control} appearance-none pr-10`}>
                  <option value="" disabled hidden />
                  {t.fleetOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
                  aria-hidden="true"
                />
              </span>,
              "flex-[1_1_140px]",
            )}
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="h-[52px] rounded-button bg-accent-deep text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60 disabled:hover:brightness-100"
          >
            {status === "sending" ? t.sending : t.submit}
          </button>

          {status === "error" && (
            <p role="alert" className="t-small text-warning">
              {t.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
