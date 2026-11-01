"use client";

import { createRef, useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import type { Step } from "@/lib/content";
import type { Clip } from "@/lib/media";
import { allowPreload, pauseAll, play, prefersReducedMotion, rewindAll, useVisible } from "@/lib/video";
import { BrowserFrame } from "@/components/media/BrowserFrame";
import { LoopVideo } from "@/components/media/LoopVideo";
import { PosterVideo } from "@/components/media/PosterVideo";
import { WindowWithPhone } from "@/components/media/WindowWithPhone";

/** A step's recording: a cabinet window, optionally with a phone clip of the same length over it. */
export type StepMedia = { window: Clip; phone?: Clip };

/**
 * A list of steps and ONE big stage (docs/funnel/design/how-v2.html).
 * md+: the active step shows its text and a progress bar that fills while its recording plays;
 * when the recording ends the next step takes over; a click or the arrow keys switch at once (tabs).
 * Below md there is no switcher: each step carries its own looping recording, nothing is hidden.
 */
export function HowSteps({ steps, media }: { steps: Step[]; media: StepMedia[] }) {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const visible = useVisible(stageRef);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const refs = useRef(
    media.map(() => ({ win: createRef<HTMLVideoElement>(), ph: createRef<HTMLVideoElement>() })),
  ).current;

  const next = useCallback(() => setActive((a) => (a + 1) % media.length), [media.length]);

  // Play the active step's clip(s) while the stage is on screen; rewind the others; drive the bar.
  useEffect(() => {
    const reduce = prefersReducedMotion();
    refs.forEach((r, i) => {
      const videos = [r.win.current, r.ph.current];
      if (i === active && visible && !reduce) {
        allowPreload(videos, "auto");
        videos.forEach(play);
      } else {
        pauseAll(videos);
        if (i !== active) rewindAll(videos);
      }
    });

    const bar = bars.current[active];
    const win = refs[active].win.current;
    if (bar) bar.style.width = "0%";
    if (!win || !visible || reduce) return;
    let raf = 0;
    const tick = () => {
      if (bar && win.duration) bar.style.width = `${Math.min(100, (win.currentTime / win.duration) * 100)}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, visible, refs]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const n = steps.length;
    const moves: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let to: number | undefined;
    if (e.key in moves) to = (active + moves[e.key] + n) % n;
    if (e.key === "Home") to = 0;
    if (e.key === "End") to = n - 1;
    if (to === undefined) return;
    e.preventDefault();
    setActive(to);
    tabs.current[to]?.focus();
  }

  return (
    <div className="mt-[clamp(32px,4vw,56px)] grid gap-x-16 gap-y-10 md:grid-cols-[380px_1fr] md:items-start">
      <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-10 md:gap-0" onKeyDown={onKeyDown}>
        {steps.map((s, i) => {
          const selected = i === active;
          return (
            <div key={s.title} className="border-t border-line-soft md:last:border-b">
              <button
                type="button"
                role="tab"
                id={`how-tab-${i}`}
                aria-selected={selected}
                aria-controls="how-stage"
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                className="group relative flex w-full flex-col items-start gap-2 pb-5 pt-5 text-left transition-opacity md:pb-6 md:aria-[selected=false]:opacity-50 md:aria-[selected=false]:hover:opacity-80"
              >
                <span className="t-data text-accent-deep">{String(i + 1).padStart(2, "0")}</span>
                <span className="block font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em]">{s.title}</span>
                <span className="t-body block text-ink-muted md:hidden md:group-aria-selected:block">{s.text}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-px hidden h-0.5 overflow-hidden bg-line-soft md:group-aria-selected:block"
                >
                  <span
                    ref={(el) => {
                      bars.current[i] = el;
                    }}
                    className="block h-full w-0 bg-accent"
                  />
                </span>
              </button>
              {/* Below md: the step's own looping recording. */}
              <div className="pb-2 md:hidden">
                <StepStage m={media[i]} label={s.image} />
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={stageRef}
        id="how-stage"
        role="tabpanel"
        aria-labelledby={`how-tab-${active}`}
        className="hidden min-w-0 md:block"
      >
        {media.map((m, i) => (
          <div key={m.window.src} className={i === active ? "" : "hidden"}>
            <StepStage m={m} label={steps[i].image} refs={refs[i]} onEnded={next} />
          </div>
        ))}
      </div>
    </div>
  );
}

// One step's media. With `refs` the videos are controlled by the stage (no loop, `ended` of the
// window clip advances the stage); without them each one loops on its own while visible.
function StepStage({
  m,
  label,
  refs,
  onEnded,
}: {
  m: StepMedia;
  label: string;
  refs?: { win: RefObject<HTMLVideoElement | null>; ph: RefObject<HTMLVideoElement | null> };
  onEnded?: () => void;
}) {
  const winRef = refs?.win;
  useEffect(() => {
    const v = winRef?.current;
    if (!v || !onEnded) return;
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [winRef, onEnded]);

  const video = (c: Clip, ref?: RefObject<HTMLVideoElement | null>) =>
    ref ? <PosterVideo clip={c} label={label} loop={false} videoRef={ref} /> : <LoopVideo clip={c} label={label} />;

  if (!m.phone) {
    return (
      <BrowserFrame ratio="16 / 10" glow>
        {video(m.window, refs?.win)}
      </BrowserFrame>
    );
  }
  return <WindowWithPhone phoneShadow window={video(m.window, refs?.win)} phone={video(m.phone, refs?.ph)} />;
}
