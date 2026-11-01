import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

/** Telegram's paper plane. Inline: lucide has no brand icons, and a file would be one more request. */
export function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.78.84l-4.94-3.64-2.38 2.3c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.62-.2L6.18 13.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.5 2.8c.88-.32 1.65.2 1.44 1.5z" />
    </svg>
  );
}

export type TelegramPlace = "start" | "faq" | "footer" | "menu";

/** «Написать в Telegram»: opens the chat (the app on a phone, t.me on a computer), goal `tg_contact`. */
export function TelegramLink({
  place,
  className = "",
  onClick,
  children,
}: {
  place: TelegramPlace;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <a
      href={SITE.telegram}
      target="_blank"
      rel="noopener noreferrer"
      data-track="tg_contact"
      data-track-place={place}
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <TelegramIcon />
      {children}
    </a>
  );
}
