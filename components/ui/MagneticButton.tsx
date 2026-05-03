"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
};

export function MagneticButton({ children, className, onClick, href, ariaLabel }: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  function onMove(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - (rect.left + rect.width / 2);
    const my = e.clientY - (rect.top + rect.height / 2);
    x.set(mx * 0.18);
    y.set(my * 0.25);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  const Tag = href ? motion.a : motion.button;
  const tagProps = href ? { href } : { onClick };

  return (
    <Tag
      ref={ref as never}
      aria-label={ariaLabel}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] text-white h-14 px-8 text-base font-semibold shadow-[0_10px_50px_-15px_var(--color-accent-glow)] hover:brightness-110 transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        className,
      )}
      {...tagProps}
    >
      {children}
    </Tag>
  );
}
