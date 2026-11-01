import type { CSSProperties, ReactNode } from "react";

// Navy phone body around a screen recording. The screen keeps the recording's exact ratio
// (720×1528 or 720×1558) so nothing is cropped; the body scales its bezel and corners with width.
export function PhoneFrame({
  children,
  ratio = "720 / 1528",
  className = "",
  style,
}: {
  children: ReactNode;
  ratio?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`box-border rounded-[clamp(20px,3vw,40px)] bg-bg p-[clamp(6px,0.8vw,12px)] ${className}`}
      style={style}
    >
      <div
        className="relative w-full overflow-hidden rounded-[clamp(14px,2.2vw,30px)] bg-card"
        style={{ aspectRatio: ratio } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
