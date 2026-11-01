import type { CSSProperties, ReactNode } from "react";

// Navy phone body around a screen recording. The screen keeps the recording's exact ratio
// (720×1528 or 720×1558) so nothing is cropped; the body scales its bezel and corners with width.
// `cut="bottom"`: the device continues past the edge it sits on (no bottom bezel or corners) —
// for recordings that show only the top of the screen (the driver app, 720×660).
export function PhoneFrame({
  children,
  ratio = "720 / 1528",
  cut,
  className = "",
  style,
}: {
  children: ReactNode;
  ratio?: string;
  cut?: "bottom";
  className?: string;
  style?: CSSProperties;
}) {
  const open = cut === "bottom";
  return (
    <div
      className={`box-border rounded-[clamp(20px,3vw,40px)] bg-bg p-[clamp(6px,0.8vw,12px)] ${
        open ? "rounded-b-none pb-0" : ""
      } ${className}`}
      style={style}
    >
      <div
        className={`relative w-full overflow-hidden rounded-[clamp(14px,2.2vw,30px)] bg-card ${open ? "rounded-b-none" : ""}`}
        style={{ aspectRatio: ratio } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
