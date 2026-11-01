import type { RefObject } from "react";
import type { Clip } from "@/lib/media";

/**
 * Poster + video that fills its frame. The <img> underneath is what paints first (and is the LCP
 * candidate on the first screen); the <video> sits on top with the same poster, so the swap to the
 * first frame is invisible. The video is always rendered with preload="none": under
 * `prefers-reduced-motion: reduce` it is hidden and never played, so nothing is downloaded.
 * Whoever plays it raises `preload` from an effect (lib/video.ts → allowPreload).
 */
export function PosterVideo({
  clip,
  label,
  priority,
  loop = true,
  videoRef,
}: {
  clip: Clip;
  /** What the recording shows, for people who cannot see it. */
  label: string;
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
        src={clip.poster}
        alt={label}
        width={clip.width}
        height={clip.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={fill}
      />
      <video
        ref={videoRef}
        src={clip.src}
        poster={clip.poster}
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
