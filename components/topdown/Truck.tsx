// The truck seen from above, nose pointing down (+y). The drawing is centred
// on (0, 0) so it can be rotated in place along the road. While it is on the
// move, air streams past the trailer (CSS), so it still reads as driving when
// the scroll stops.

import s from "./topdown.module.css";

export const TRUCK_W = 34;
export const TRUCK_H = 92;

export function Truck() {
  return (
    <svg viewBox="-17 -46 34 92" width={TRUCK_W} height={TRUCK_H} aria-hidden>
      <g className={s.wake}>
        <path d="M-17 -30V-62" />
        <path d="M17 -18V-58" />
        <path d="M-17 4V-20" />
        <path d="M17 12V-8" />
      </g>
      {/* shadow, thrown down-right */}
      <rect x="-11" y="-40" width="26" height="85" rx="4" fill="#1f2a37" opacity="0.18" transform="translate(4 4)" />
      {/* trailer */}
      <rect x="-13" y="-43" width="26" height="62" rx="2.5" fill="#f5f7f9" stroke="#b9c3cf" strokeWidth="1.2" />
      {[-35, -27, -19, -11, -3, 5, 13].map((y) => (
        <line key={y} x1="-11.5" x2="11.5" y1={y} y2={y} stroke="#dfe5ec" strokeWidth="1" />
      ))}
      <rect x="-3" y="-39" width="6" height="54" rx="1.5" fill="#2081f8" opacity="0.9" />
      {/* hitch */}
      <rect x="-3" y="19" width="6" height="4" fill="#4b5667" />
      {/* cab */}
      <rect x="-12" y="22" width="24" height="21" rx="5" fill="#2081f8" stroke="#1563c9" strokeWidth="1" />
      <rect x="-9" y="24.5" width="18" height="9" rx="2" fill="#4f9cfb" />
      <rect x="-11" y="37" width="22" height="4.5" rx="1.5" fill="#1b2430" />
      {/* mirrors */}
      <rect x="-15.5" y="35" width="3.5" height="2" rx="1" fill="#1b2430" />
      <rect x="12" y="35" width="3.5" height="2" rx="1" fill="#1b2430" />
    </svg>
  );
}
