"use client";

import { useEffect, useRef } from "react";
import { BrowserFrame } from "./ui/BrowserFrame";
import { PhoneFrame } from "./ui/PhoneFrame";
import { PosterVideo, play, prefersReducedMotion, useVisible } from "./ui/LoopVideo";

/**
 * The first-screen pair: the cabinet window (#1, 19.5 s) and the driver's phone (#2, 19.4 s)
 * recorded together, so they play together. Neither loops on its own: when the longer window
 * ends, both rewind to 0 and start again; the phone, 0.07 s shorter, waits on its last frame.
 * Both pause when the first screen is out of view.
 */
export function HeroMedia({ cabinetLabel, phoneLabel }: { cabinetLabel: string; phoneLabel: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cabinet = useRef<HTMLVideoElement>(null);
  const phone = useRef<HTMLVideoElement>(null);
  const visible = useVisible(wrap, 0.25);

  useEffect(() => {
    const a = cabinet.current;
    const b = phone.current;
    if (!a || !b || prefersReducedMotion()) return;
    // Server HTML says preload="none" so reduced-motion visitors download nothing;
    // for everyone else fetch the metadata early (play() loads the rest).
    a.preload = "metadata";
    b.preload = "metadata";
    const restart = () => {
      a.currentTime = 0;
      b.currentTime = 0;
      play(a);
      play(b);
    };
    a.addEventListener("ended", restart);
    return () => a.removeEventListener("ended", restart);
  }, []);

  useEffect(() => {
    const a = cabinet.current;
    const b = phone.current;
    if (!a || !b || prefersReducedMotion()) return;
    if (visible) {
      play(a);
      play(b);
    } else {
      a.pause();
      b.pause();
    }
  }, [visible]);

  return (
    <div ref={wrap} className="relative mt-[clamp(8px,2vw,24px)] pr-[12%]">
      <BrowserFrame ratio="16 / 9" glow>
        <PosterVideo
          videoRef={cabinet}
          src="/media/01-hero-cabinet.ru.mp4"
          poster="/media/01-hero-cabinet.ru.webp"
          label={cabinetLabel}
          width={1920}
          height={1080}
          priority
          loop={false}
        />
      </BrowserFrame>
      <PhoneFrame
        ratio="720 / 1528"
        className="absolute right-0 top-[14%] w-[22%] min-w-[108px]"
      >
        <PosterVideo
          videoRef={phone}
          src="/media/02-hero-phone.ru.mp4"
          poster="/media/02-hero-phone.ru.webp"
          label={phoneLabel}
          width={720}
          height={1528}
          priority
          loop={false}
        />
      </PhoneFrame>
    </div>
  );
}
