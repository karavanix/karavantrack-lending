import { useEffect, useState, type RefObject } from "react";

// Browser-side helpers for the recordings. Only client components import this file.

/** True while `ref` is at least `threshold` visible in the viewport. */
export function useVisible(ref: RefObject<Element | null>, threshold = 0.25) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return visible;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Video = HTMLVideoElement | null | undefined;

/** play() rejects when the tab is hidden or autoplay is refused; the poster is still there. */
export function play(v: Video) {
  v?.play().catch(() => {});
}

export function playAll(videos: Video[]) {
  videos.forEach(play);
}

export function pauseAll(videos: Video[]) {
  videos.forEach((v) => v?.pause());
}

export function rewindAll(videos: Video[]) {
  videos.forEach((v) => {
    if (v) v.currentTime = 0;
  });
}

/**
 * Server HTML always says preload="none" so reduced-motion visitors download nothing;
 * once a clip is about to play, let the browser fetch ahead.
 */
export function allowPreload(videos: Video[], value: "metadata" | "auto" = "metadata") {
  videos.forEach((v) => {
    if (v && v.preload === "none") v.preload = value;
  });
}
