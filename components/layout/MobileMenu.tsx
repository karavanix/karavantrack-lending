"use client";

import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { TelegramLink } from "@/components/ui/Telegram";
import { Languages } from "./Languages";

type Item = { href: string; label: string };

// Phone-width menu: a button in the bar, a navy panel under it with the anchors,
// «Написать в Telegram», «Войти», the main button and the languages. Closes on a link tap and on Escape.
export function MobileMenu({
  items,
  login,
  start,
  telegram,
  locale,
  languageLabel,
  menuLabel,
}: {
  items: Item[];
  login: Item;
  start: Item;
  telegram: string;
  locale: Locale;
  languageLabel: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 grid h-10 w-10 place-items-center rounded-button text-surface transition hover:bg-white/5"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open && (
        <div
          id={id}
          className="absolute inset-x-0 top-full z-40 border-t border-line bg-bg px-5 pb-6 pt-2"
        >
          <nav className="flex flex-col">
            {items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-white/80 transition hover:text-white"
              >
                {it.label}
              </a>
            ))}
            <TelegramLink
              place="menu"
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium text-accent-soft transition hover:text-white"
            >
              {telegram}
            </TelegramLink>
            <a
              href={login.href}
              data-track="login"
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium text-surface transition hover:text-white"
            >
              {login.label}
            </a>
          </nav>
          <a
            href={start.href}
            data-track="nav_cta"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-button bg-accent-deep text-base font-semibold text-white"
          >
            {start.label}
          </a>
          <Languages current={locale} label={languageLabel} variant="names" className="mt-5 gap-x-6 gap-y-2 text-[15px]" />
        </div>
      )}
    </div>
  );
}
