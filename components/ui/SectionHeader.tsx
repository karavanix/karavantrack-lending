import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

/** Eyebrow + headline (+ lead) at the top of a block. `size="feature"` is one step smaller. */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  size = "section",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  size?: "section" | "feature";
  className?: string;
}) {
  return (
    <div className={`flex max-w-[760px] flex-col gap-4 ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className={size === "section" ? "t-section" : "t-feature"}>{title}</h2>
      {lead && <p className="t-lead text-ink-muted">{lead}</p>}
    </div>
  );
}
