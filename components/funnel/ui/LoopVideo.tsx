"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Poster + video that fills its frame. The <img> underneath is what paints first (and is the LCP
 * candidate on the first screen); the <video> sits on top with the same poster, so the swap to the
 * first frame is invisible. The video is always rendered with preload="none": under
 * `prefers-reduced-motion: reduce` it is hidden and never played, so nothing is downloaded.
 * The first-screen pair upgrades to preload="metadata" from an effect once motion is allowed.
 */
export function PosterVideo({
  src,
  poster,
  label,
  width,
  height,
  priority,
  loop = true,
  videoRef,
}: {
  src: string;
  poster: string;
  /** What the recording shows, for people who cannot see it. */
  label: string;
  width: number;
  height: number;
  /** First-screen media: eager poster with high fetch priority (the LCP candidate). */
  priority?: boolean;
  loop?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
}) {
  const fill = "absolute inset-0 h-full w-full object-cover";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={label}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={fill}
      />
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        loop={loop}
        preload="none"
        aria-label={label}
        className={`${fill} motion-reduce:hidden`}
        tabIndex={-1}
      />
    </>
  );
}

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

export function play(v: HTMLVideoElement | null) {
  // play() rejects when the tab is hidden or autoplay is refused; the poster is still there.
  v?.play().catch(() => {});
}

/** A single looping recording: plays while on screen, pauses when scrolled away. */
export function LoopVideo(props: Omit<Parameters<typeof PosterVideo>[0], "videoRef" | "loop">) {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useVisible(ref);

  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;
    if (visible) play(v);
    else v.pause();
  }, [visible]);

  return <PosterVideo {...props} videoRef={ref} />;
}
