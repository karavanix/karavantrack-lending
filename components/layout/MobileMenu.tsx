"use client";

import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { TelegramIcon, telegramAttrs } from "@/components/ui/Telegram";
import { Languages } from "./Languages";

type Item = { href: string; label: string };

// Phone-width menu: a button in the bar, a navy panel under it: the anchors, a line, the main
// button and «Написать в Telegram» under it, the language pill. «Войти» stays in the bar. Closes on a link tap and on Escape.
export function MobileMenu({
  items,
  start,
  telegram,
  locale,
  languageLabel,
  menuLabel,
}: {
  items: Item[];
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
        className="-mr-2.5 grid h-11 w-11 place-items-center rounded-button text-surface transition hover:bg-white/5"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
      </button>
      {open && (
        <div
          id={id}
          className="absolute inset-x-0 top-full z-40 border-t border-line bg-bg px-5 pb-7 pt-3"
        >
          <nav className="flex flex-col">
            {items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className="py-3.5 text-[17px] font-medium text-white/85 transition hover:text-white"
              >
                {it.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-5">
            <a
              href={start.href}
              data-track="nav_cta"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 w-full items-center justify-center rounded-button bg-accent-deep text-base font-semibold text-white"
            >
              {start.label}
            </a>
            <Button {...telegramAttrs("menu")} variant="outline" onClick={() => setOpen(false)} className="h-12 w-full text-base">
              <TelegramIcon />
              {telegram}
            </Button>
          </div>
          <Languages current={locale} label={languageLabel} className="mt-6" />
        </div>
      )}
    </div>
  );
}
