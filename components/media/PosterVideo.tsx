import type { RefObject } from "react";
import type { Clip } from "@/lib/media";

/**
 * Poster + video that fills its frame. The <img> underneath is the poster (and the LCP candidate on
 * the first screen); the <video> on top is transparent until it has a frame, so the swap to the first
 * frame is invisible. The video carries NO `poster` attribute on purpose: browsers fetch a video's
 * poster eagerly even far below the fold, and ten posters (~460 KB) in parallel with the stylesheet
 * pushed the LCP on a slow network from 0.7 s to 2.8 s. The <img> is lazy instead and yields to the
 * critical resources. The video is always rendered with preload="none": under
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
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        className={fill}
      />
      <video
        ref={videoRef}
        src={clip.src}
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
