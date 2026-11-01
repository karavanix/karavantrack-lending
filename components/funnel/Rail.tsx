"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal card strip. The strip itself is plain CSS: overflow-x + scroll-snap, padded so the
 * first card lines up with the container and the rest run past the right edge. This component
 * only adds what CSS cannot: «Назад/Дальше» buttons (desktop), the progress mark, and the count.
 * Wheel, trackpad, touch and arrow keys (strip is focusable) work natively.
 */
export function Rail({
  head,
  hint,
  prev,
  next,
  count,
  children,
}: {
  head: ReactNode;
  hint: string;
  prev: string;
  next: string;
  count: number;
  children: ReactNode;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ frac: 0, atStart: true, atEnd: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const x = el.scrollLeft;
      setPos({ frac: max > 0 ? x / max : 0, atStart: x <= 1, atEnd: x >= max - 1 });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  // One card (plus the gap) per click; snap settles the exact position.
  const step = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 16;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  };

  const btn =
    "grid h-10 w-10 place-items-center rounded-pill border border-line-soft bg-card text-ink transition " +
    "hover:border-ink-muted disabled:cursor-default disabled:opacity-40 disabled:hover:border-line-soft";

  return (
    <div className="flex flex-col gap-[clamp(28px,3.5vw,48px)]">
      <div className="container-page flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        {head}
        <div className="flex items-center gap-3 font-mono text-xs font-medium text-ink-muted">
          <span>{hint}</span>
          <span aria-hidden="true" className="flex h-0.5 w-16 rounded-[2px] bg-line-soft">
            <span
              className="h-0.5 w-[22px] rounded-[2px] bg-accent-deep transition-transform duration-150 motion-reduce:transition-none"
              style={{ transform: `translateX(${pos.frac * 42}px)` }}
            />
          </span>
          <span>{count}</span>
          <span className="ml-3 hidden items-center gap-2 md:flex">
            <button type="button" aria-label={prev} disabled={pos.atStart} onClick={() => step(-1)} className={btn}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label={next} disabled={pos.atEnd} onClick={() => step(1)} className={btn}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>

      <ul
        ref={rail}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[max(20px,calc((100%-1200px)/2))] pb-2 pt-1 [scroll-padding-inline:max(20px,calc((100%-1200px)/2))] [scrollbar-width:none] motion-reduce:scroll-auto focus-visible:outline-accent [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
    </div>
  );
}
