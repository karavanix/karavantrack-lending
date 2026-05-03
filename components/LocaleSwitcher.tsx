"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { locales } from "@/i18n/request";

const labels: Record<string, string> = { ru: "RU", uz: "UZ", en: "EN" };

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function switchTo(next: string) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
      >
        <Globe className="h-4 w-4" />
        {labels[locale] ?? locale.toUpperCase()}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-28 overflow-hidden rounded-xl border border-white/10 bg-[var(--color-bg-soft)] py-1 shadow-xl"
        >
          {locales.map((l) => (
            <button
              key={l}
              role="menuitem"
              onClick={() => switchTo(l)}
              className={`block w-full px-3 py-2 text-left text-sm transition ${
                l === locale ? "text-[var(--color-accent)]" : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              {labels[l] ?? l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
