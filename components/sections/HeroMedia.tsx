"use client";

import { useEffect, useRef } from "react";
import type { Clip } from "@/lib/media";
import { allowPreload, pauseAll, playAll, prefersReducedMotion, rewindAll, useVisible } from "@/lib/video";
import { PosterVideo } from "@/components/media/PosterVideo";
import { WindowWithPhone } from "@/components/media/WindowWithPhone";

/**
 * The first-screen pair: the cabinet window (19.5 s) and the driver's phone (19.4 s) were
 * recorded together, so they play together. Neither loops on its own: when the longer window
 * ends, both rewind to 0 and start again; the phone, 0.07 s shorter, waits on its last frame.
 * Both pause when the first screen is out of view.
 */
export function HeroMedia({
  cabinet,
  phone,
  cabinetLabel,
  phoneLabel,
}: {
  cabinet: Clip;
  phone: Clip;
  cabinetLabel: string;
  phoneLabel: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const cabinetRef = useRef<HTMLVideoElement>(null);
  const phoneRef = useRef<HTMLVideoElement>(null);
  const visible = useVisible(wrap);

  useEffect(() => {
    const window = cabinetRef.current;
    const pair = [window, phoneRef.current];
    if (!window || prefersReducedMotion()) return;
    allowPreload(pair, "metadata");
    const restart = () => {
      rewindAll(pair);
      playAll(pair);
    };
    window.addEventListener("ended", restart);
    return () => window.removeEventListener("ended", restart);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const pair = [cabinetRef.current, phoneRef.current];
    if (visible) playAll(pair);
    else pauseAll(pair);
  }, [visible]);

  return (
    <WindowWithPhone
      wrapRef={wrap}
      className="mt-[clamp(8px,2vw,24px)]"
      ratio="16 / 9"
      reserve="12%"
      phoneTop="14%"
      phoneWidth="22%"
      phoneMinWidth="108px"
      window={<PosterVideo clip={cabinet} label={cabinetLabel} priority loop={false} videoRef={cabinetRef} />}
      phone={<PosterVideo clip={phone} label={phoneLabel} priority loop={false} videoRef={phoneRef} />}
    />
  );
}
