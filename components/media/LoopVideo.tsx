"use client";

import { useEffect, useRef } from "react";
import type { Clip } from "@/lib/media";
import { allowPreload, play, prefersReducedMotion, useVisible } from "@/lib/video";
import { PosterVideo } from "./PosterVideo";

/** A single looping recording: plays while on screen, pauses when scrolled away. */
export function LoopVideo({ clip, label, priority }: { clip: Clip; label: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useVisible(ref);

  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;
    if (visible) {
      allowPreload([v]);
      play(v);
    } else {
      v.pause();
    }
  }, [visible]);

  return <PosterVideo clip={clip} label={label} priority={priority} videoRef={ref} />;
}
