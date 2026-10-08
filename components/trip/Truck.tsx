// Side view of a box truck facing right, drawn in a 400×210 box with the
// wheels touching y = 200. Wheels are separate groups so the scroll timeline
// can spin them; the headlight beam fades in at dusk via --beam.

export const TRUCK_W = 400;
export const TRUCK_H = 210;
export const WHEEL_R = 27;

const WHEELS = [86, 146, 318];

export function Truck() {
  return (
    <svg
      viewBox={`-30 0 ${TRUCK_W + 260} ${TRUCK_H}`}
      width="100%"
      height="100%"
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="tr-beam" x1="0" x2="1">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tr-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7F9FB" />
          <stop offset="1" stopColor="#DCE3EA" />
        </linearGradient>
        <linearGradient id="tr-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#CFE4F5" />
          <stop offset="1" stopColor="#7FA9CF" />
        </linearGradient>
      </defs>

      {/* headlight beam, only visible at dusk */}
      <polygon
        points="392,128 640,96 640,196 392,146"
        fill="url(#tr-beam)"
        style={{ opacity: "var(--beam, 0)" }}
      />

      {/* shadow */}
      <ellipse cx="200" cy="203" rx="205" ry="9" fill="#000" opacity="0.18" />

      {/* chassis */}
      <rect x="14" y="150" width="372" height="14" rx="3" fill="#2B3039" />

      {/* cargo box */}
      <rect x="10" y="22" width="248" height="130" rx="5" fill="url(#tr-box)" stroke="#B7C1CC" strokeWidth="2" />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={42 + i * 31} y1="26" x2={42 + i * 31} y2="148" stroke="#C9D2DB" strokeWidth="2" />
      ))}
      <rect x="10" y="104" width="248" height="10" fill="#1C78EA" />
      <rect x="10" y="114" width="248" height="4" fill="#13A3A0" />
      {/* rear door hinge strip */}
      <rect x="10" y="22" width="9" height="130" rx="3" fill="#C3CCD6" />

      {/* exhaust stack */}
      <rect x="262" y="34" width="7" height="78" rx="3" fill="#6B7380" />
      <rect x="261" y="30" width="9" height="8" rx="2" fill="#4A515C" />

      {/* cab */}
      <path
        d="M270 152 L270 52 Q270 44 278 44 L326 44 Q334 44 338 51 L362 92 L382 98 Q390 100 390 108 L390 152 Z"
        fill="#1F6FD6"
      />
      <path d="M270 128 L390 128 L390 152 L270 152 Z" fill="#1A5CB3" />
      {/* window */}
      <path d="M283 56 L322 56 Q327 56 330 61 L351 94 L283 94 Z" fill="url(#tr-glass)" />
      {/* driver */}
      <circle cx="306" cy="74" r="8" fill="#2A3442" opacity="0.75" />
      <path d="M292 94 Q306 80 320 94 Z" fill="#2A3442" opacity="0.75" />
      {/* door seam + handle */}
      <path d="M278 100 L278 146" stroke="#174E99" strokeWidth="2" />
      <rect x="333" y="104" width="14" height="4" rx="2" fill="#E8EEF5" />
      {/* mirror */}
      <path d="M356 68 L368 60 L368 84" stroke="#2B3039" strokeWidth="3" fill="none" />
      <rect x="364" y="58" width="7" height="22" rx="2" fill="#2B3039" />
      {/* headlight + bumper */}
      <rect x="380" y="118" width="11" height="12" rx="2" fill="#FFF2C2" />
      <rect x="374" y="142" width="20" height="14" rx="3" fill="#2B3039" />
      {/* mud flap */}
      <rect x="182" y="152" width="8" height="34" fill="#2B3039" />

      {WHEELS.map((cx) => (
        <g key={cx} transform={`translate(${cx} 172)`}>
          <circle r={WHEEL_R + 4} fill="#1C2028" opacity="0.25" />
          <circle r={WHEEL_R} fill="#23272F" />
          <g className="truck-wheel">
            <circle r="13" fill="#A7B1BE" />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle
                key={a}
                cx={Math.round(Math.cos((a * Math.PI) / 180) * 800) / 100}
                cy={Math.round(Math.sin((a * Math.PI) / 180) * 800) / 100}
                r="2.4"
                fill="#5A626E"
              />
            ))}
            <rect x="-1.5" y="-13" width="3" height="7" fill="#5A626E" />
            <circle r="3.5" fill="#5A626E" />
          </g>
        </g>
      ))}
    </svg>
  );
}
