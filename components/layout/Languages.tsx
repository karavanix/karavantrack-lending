import { LOCALE_NAMES, locales, type Locale } from "@/i18n/routing";

// Language switcher: a segmented pill (design system → «переключатель языка — radius-pill») with
// the codes in mono, the current one filled and not linked. The same control sits in the bar,
// the phone menu and the footer; plain links, so it works inside the client menu without JS.
export function Languages({ current, label, className = "" }: { current: Locale; label: string; className?: string }) {
  const seg = "rounded-pill px-2.5 py-1 transition";
  return (
    <nav
      aria-label={label}
      className={`inline-flex items-center rounded-pill border border-line p-0.5 font-mono text-[12px] font-medium uppercase tracking-[0.06em] ${className}`}
    >
      {locales.map((l) =>
        l === current ? (
          <span key={l} lang={l} aria-current="page" aria-label={LOCALE_NAMES[l]} className={`${seg} bg-white/10 text-surface`}>
            {l}
          </span>
        ) : (
          <a key={l} href={`/${l}`} lang={l} hrefLang={l} aria-label={LOCALE_NAMES[l]} className={`${seg} text-white/60 hover:text-white`}>
            {l}
          </a>
        ),
      )}
    </nav>
  );
}
