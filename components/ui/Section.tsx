import type { ReactNode } from "react";

type Tone = "surface" | "card" | "dark";
type Border = "none" | "top" | "y";

const tones: Record<Tone, string> = {
  surface: "",
  card: "bg-card",
  dark: "bg-bg text-surface",
};

const borders: Record<Border, string> = {
  none: "",
  top: "border-t border-line-soft",
  y: "border-y border-line-soft",
};

/** The default vertical rhythm of a page block. */
export const SECTION_PADDING = "py-[clamp(64px,7vw,112px)]";

/**
 * A page block: tone (page grey / white card / navy), optional hairline, vertical padding and
 * the 1200px container. `container={false}` leaves the width to the children (full-bleed strips).
 */
export function Section({
  id,
  tone = "surface",
  border = "none",
  padding = SECTION_PADDING,
  container = true,
  className = "",
  containerClassName = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  border?: Border;
  padding?: string;
  container?: boolean;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${tones[tone]} ${borders[border]} ${padding} ${className}`}>
      {container ? <div className={`container-page ${containerClassName}`}>{children}</div> : children}
    </section>
  );
}
