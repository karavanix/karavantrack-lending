import type { CSSProperties, ReactNode, RefObject } from "react";
import { BrowserFrame } from "./BrowserFrame";
import { PhoneFrame } from "./PhoneFrame";

/**
 * The page's signature composition: a cabinet window with a phone over its right edge
 * (first screen, step 2 of «Как это работает»). The window leaves `reserve` free on the right
 * for the phone to hang over; the phone's size and height are set per use.
 */
export function WindowWithPhone({
  window,
  phone,
  ratio = "16 / 10",
  reserve = "10%",
  phoneRatio = "720 / 1528",
  phoneWidth = "23%",
  phoneMinWidth = "96px",
  phoneTop = "8%",
  phoneShadow,
  glow = true,
  className = "",
  wrapRef,
}: {
  window: ReactNode;
  phone: ReactNode;
  ratio?: string;
  /** Width kept free to the right of the window (the phone overhangs into it). */
  reserve?: string;
  phoneRatio?: string;
  phoneWidth?: string;
  phoneMinWidth?: string;
  phoneTop?: string;
  phoneShadow?: boolean;
  glow?: boolean;
  className?: string;
  wrapRef?: RefObject<HTMLDivElement | null>;
}) {
  const phoneStyle: CSSProperties = { width: phoneWidth, minWidth: phoneMinWidth, top: phoneTop };
  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ paddingRight: reserve }}>
      <BrowserFrame ratio={ratio} glow={glow}>
        {window}
      </BrowserFrame>
      <PhoneFrame
        ratio={phoneRatio}
        className={`absolute right-0 ${phoneShadow ? "shadow-[0_20px_60px_-20px_rgba(15,20,27,0.45)]" : ""}`}
        style={phoneStyle}
      >
        {phone}
      </PhoneFrame>
    </div>
  );
}
