import type { ReactNode } from "react";

// One word per headline in Cormorant italic, `accent` on light, `accent-soft` on the navy bands.
export function AccentWord({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <em className={`t-accent-word ${tone === "dark" ? "text-accent-soft" : "text-accent"}`}>{children}</em>
  );
}
