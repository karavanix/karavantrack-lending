import { LOCALE_NAMES, locales, type Locale } from "@/i18n/routing";

// Language switcher for the navy bands: plain links to /ru, /uz, /en, the current language marked
// and not linked. `codes` (RU UZ EN) fits the bar; `names` (Русский, Oʻzbekcha, English) goes in
// the phone menu and the footer. No JS, so it works in the client menu as well.
export function Languages({
  current,
  label,
  variant,
  className = "",
}: {
  current: Locale;
  label: string;
  variant: "codes" | "names";
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex flex-wrap items-center ${className}`}>
      {locales.map((l) => {
        const text = variant === "codes" ? l.toUpperCase() : LOCALE_NAMES[l];
        const name = variant === "codes" ? LOCALE_NAMES[l] : undefined;
        return l === current ? (
          <span key={l} lang={l} aria-current="page" aria-label={name} className="text-surface">
            {text}
          </span>
        ) : (
          <a key={l} href={`/${l}`} lang={l} hrefLang={l} aria-label={name} className="text-white/55 transition hover:text-white">
            {text}
          </a>
        );
      })}
    </nav>
  );
}
