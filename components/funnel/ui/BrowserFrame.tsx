import type { CSSProperties, ReactNode } from "react";
import { SITE } from "@/lib/site";

// Browser window around a cabinet recording. The recordings have no chrome of their own;
// the page draws the bar with the address. `ratio` reserves the height before anything loads.
export function BrowserFrame({
  children,
  ratio = "16 / 9",
  url = SITE.appHost,
  glow,
  className = "",
}: {
  children: ReactNode;
  ratio?: string;
  url?: string;
  glow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-card border border-line-soft bg-card ${
        glow ? "shadow-glow" : ""
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className="flex h-10 shrink-0 items-center gap-2 border-b border-line-soft px-4 font-mono text-xs font-medium text-ink-muted"
      >
        <span className="h-2.5 w-2.5 rounded-pill bg-line-soft" />
        <span className="h-2.5 w-2.5 rounded-pill bg-line-soft" />
        <span className="h-2.5 w-2.5 rounded-pill bg-line-soft" />
        <span className="ml-3">{url}</span>
      </div>
      <div className="relative w-full bg-surface" style={{ aspectRatio: ratio } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}
