import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-button font-semibold transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  // One primary button per screen: `accent-deep` fill, white text (6.7:1), the only shadow on the page.
  primary: "bg-accent-deep text-white shadow-glow hover:brightness-110",
  secondary: "bg-card text-ink border border-line-soft hover:border-ink-muted",
};

const sizes: Record<Size, string> = {
  md: "h-[54px] px-6 text-base",
  sm: "h-10 px-4 text-sm",
};

type Common = {
  variant?: Variant;
  size?: Size;
  /** Trailing arrow, used on «Попробовать бесплатно». */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", arrow, className = "", children, ...rest } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const inner = (
    <>
      {children}
      {arrow && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
    </>
  );
  if ("href" in rest && rest.href) {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
