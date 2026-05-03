import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white hover:brightness-110 hover:-translate-y-0.5 shadow-[0_10px_40px_-15px_var(--color-accent-glow)]",
  secondary:
    "bg-[var(--color-bg)] text-white hover:bg-[var(--color-bg-soft)] hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-current hover:bg-black/5 dark:hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
} & (
  | ({ as?: "button" } & ComponentProps<"button">)
  | ({ as: "a"; href: string } & ComponentProps<typeof Link>)
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if ((rest as { as?: string }).as === "a") {
    const { as: _as, href, ...linkRest } = rest as { as: "a"; href: string } & ComponentProps<typeof Link>;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }
  const { as: _as, ...btnRest } = rest as { as?: "button" } & ComponentProps<"button">;
  return (
    <button className={classes} {...btnRest}>
      {children}
    </button>
  );
}
