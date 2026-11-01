import type { ReactNode } from "react";

// Mono label above a headline. `line` adds the short rule the first screen has.
export function Eyebrow({
  children,
  line,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  line?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const color = tone === "dark" ? "text-white/55" : "text-ink-muted";
  return (
    <p className={`t-label flex items-center gap-3 ${color} ${className}`}>
      {line && <span aria-hidden="true" className="h-px w-8 bg-current" />}
      <span>{children}</span>
    </p>
  );
}
