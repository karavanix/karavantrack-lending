// The landscape of the trip, as parallax layers. Every layer is one wide SVG;
// the scroll timeline only translates it. An object that belongs at world
// position `xw` (the truck's coordinate along the road) is drawn at
// u = f * (xw + PAD) in a layer with parallax factor f, so it passes under the
// truck exactly when the truck reaches xw.

import type { ReactNode } from "react";
import {
  AHEAD,
  CHAIKHANA_X,
  DOCK_X,
  GATE_X,
  OFFLINE_FROM,
  PASS_X,
  ROUTE_END,
} from "./stations";

export const PAD = 2000;
export const SCENE_H = 900;
export const HORIZON_Y = 655;
export const ROAD_TOP = 700;
export const ROAD_BOTTOM = 805;
export const LANE_Y = 788; // where the truck's wheels touch the road
export const TRAIL_Y = 776;

export type LayerKey = "clouds" | "far" | "mid" | "near" | "front";

export const LAYER_F: Record<LayerKey, number> = {
  clouds: 0.04,
  far: 0.1,
  mid: 0.3,
  near: 1,
  front: 1,
};

export function layerRange(f: number) {
  return {
    umin: Math.floor(f * PAD - 2000),
    umax: Math.ceil(f * (ROUTE_END + PAD) + 2800),
  };
}

const at = (f: number, xw: number) => f * (xw + PAD);
const r1 = (n: number) => Math.round(n * 10) / 10;

// Deterministic pseudo-noise: a few sines with fixed phases, mapped to 0..1.
function noise(x: number, seed: number) {
  const s =
    Math.sin(x * 0.0021 + seed * 1.7) * 0.5 +
    Math.sin(x * 0.0057 + seed * 3.1) * 0.3 +
    Math.sin(x * 0.013 + seed * 5.3) * 0.2;
  return (s + 1) / 2;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// How mountainous the land is around world position xw.
function relief(xw: number) {
  return Math.max(gauss(xw, PASS_X, 1500), 0.32 * smooth(7600, 9800, xw) + 0.18 * gauss(xw, 2400, 900));
}

type RidgeOpts = {
  f: number;
  seed: number;
  low: number;
  high: number;
  step: number;
  sigmaScale?: number;
};

function ridgePoints({ f, seed, low, high, step, sigmaScale = 1 }: RidgeOpts) {
  const { umin, umax } = layerRange(f);
  const pts: [number, number][] = [];
  for (let u = umin; u <= umax; u += step) {
    const xw = u / f - PAD;
    // Far layers squeeze the world, so stretch the relief back out a little.
    const m = relief(PASS_X + (xw - PASS_X) / sigmaScale);
    const h = low * (0.55 + 0.45 * noise(u * 3, seed)) + m * high * (0.5 + 0.5 * noise(u * 5, seed + 9));
    pts.push([u, HORIZON_Y - h]);
  }
  return pts;
}

function ridgePath(pts: [number, number][], base = HORIZON_Y + 4, dy?: (h: number) => number) {
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M${first[0]} ${base}`;
  for (const [u, y] of pts) {
    const h = HORIZON_Y - y;
    d += ` L${u} ${r1(dy ? y + dy(h) : y)}`;
  }
  d += ` L${last[0]} ${base} Z`;
  return d;
}

// Snow sits on the top of a peak only once the peak is tall enough.
const snowCut = (line: number, depth: number) => (h: number) => (h > line ? Math.min(depth, (h - line) * 0.6) : 0);

function LayerSvg({ layer, children }: { layer: LayerKey; children: ReactNode }) {
  const { umin, umax } = layerRange(LAYER_F[layer]);
  const w = umax - umin;
  return (
    <svg
      viewBox={`${umin} 0 ${w} ${SCENE_H}`}
      preserveAspectRatio="xMinYMin meet"
      style={{ height: "100%", aspectRatio: `${w} / ${SCENE_H}`, display: "block" }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ───────────────────────── clouds ───────────────────────── */

export function CloudsLayer() {
  const f = LAYER_F.clouds;
  const { umin, umax } = layerRange(f);
  const rand = rng(7);
  const clouds: ReactNode[] = [];
  for (let u = umin + 120; u < umax; u += 420 + rand() * 380) {
    const y = 90 + rand() * 170;
    const s = 0.6 + rand() * 0.8;
    clouds.push(
      <g key={u} transform={`translate(${r1(u)} ${r1(y)}) scale(${r1(s)})`} fill="#FFFFFF" opacity="0.8">
        <ellipse cx="0" cy="0" rx="90" ry="22" />
        <ellipse cx="-34" cy="-14" rx="40" ry="24" />
        <ellipse cx="22" cy="-20" rx="48" ry="30" />
      </g>,
    );
  }
  return <LayerSvg layer="clouds">{clouds}</LayerSvg>;
}

/* ───────────────────────── far: mountains, Tashkent ───────────────────────── */

function TvTower({ x }: { x: number }) {
  // Tashkent TV Tower: three splayed legs, a tall shaft, the pod and the spire.
  const b = HORIZON_Y;
  return (
    <g fill="#9DB0C5">
      <path d={`M${x - 26} ${b} L${x - 4} ${b - 90} L${x + 4} ${b - 90} L${x + 26} ${b} L${x + 16} ${b} L${x} ${b - 60} L${x - 16} ${b} Z`} />
      <rect x={x - 4} y={b - 300} width="8" height="215" />
      <ellipse cx={x} cy={b - 250} rx="18" ry="9" />
      <rect x={x - 11} y={b - 262} width="22" height="10" rx="3" />
      <rect x={x - 1.5} y={b - 385} width="3" height="90" />
    </g>
  );
}

export function FarLayer() {
  const f = LAYER_F.far;
  const back = ridgePoints({ f, seed: 2, low: 40, high: 420, step: 18, sigmaScale: 3.2 });
  const front = ridgePoints({ f, seed: 5, low: 26, high: 300, step: 14, sigmaScale: 2.6 });

  const rand = rng(11);
  const city: ReactNode[] = [];
  for (let xw = -9000; xw < -400; xw += 260 + rand() * 300) {
    const w = 22 + rand() * 30;
    const h = 24 + rand() * 60;
    city.push(<rect key={xw} x={r1(at(f, xw))} y={r1(HORIZON_Y - h)} width={r1(w)} height={r1(h + 4)} fill="#AFC0D2" />);
  }

  return (
    <LayerSvg layer="far">
      <path d={ridgePath(back)} fill="#F4F7FA" />
      <path d={ridgePath(back, HORIZON_Y + 4, snowCut(250, 46))} fill="#B9C8D8" />
      <TvTower x={at(f, -3600)} />
      {city}
      <path d={ridgePath(front)} fill="#EEF3F7" />
      <path d={ridgePath(front, HORIZON_Y + 4, snowCut(200, 34))} fill="#A6B9CC" />
    </LayerSvg>
  );
}

/* ───────────────────────── mid: hills, poplars, blocks, villages ───────────────────────── */

function Poplar({ x, base, h, tone = 0 }: { x: number; base: number; h: number; tone?: number }) {
  const fills = ["#5F8B4C", "#557F44", "#6C9555"];
  return (
    <g>
      <rect x={r1(x - 1.6)} y={r1(base - h * 0.18)} width="3.2" height={r1(h * 0.18)} fill="#6B5A48" />
      <ellipse cx={r1(x)} cy={r1(base - h * 0.58)} rx={r1(h * 0.085)} ry={r1(h * 0.44)} fill={fills[tone % 3]} />
    </g>
  );
}

function Block({ x, w, h, base }: { x: number; w: number; h: number; base: number }) {
  const rows = Math.floor(h / 18);
  const cols = Math.floor(w / 14);
  const win: ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      win.push(<rect key={`${r}-${c}`} x={r1(x + 5 + c * 14)} y={r1(base - h + 7 + r * 18)} width="6" height="8" fill="#B6C3CF" />);
  return (
    <g>
      <rect x={r1(x)} y={r1(base - h)} width={w} height={h} fill="#CAD3DB" />
      <rect x={r1(x)} y={r1(base - h)} width={w} height="5" fill="#B9C3CC" />
      {win}
    </g>
  );
}

function House({ x, base, gate = true }: { x: number; base: number; gate?: boolean }) {
  return (
    <g>
      <rect x={x} y={base - 34} width="62" height="34" fill="#E9E1D3" />
      <rect x={x - 4} y={base - 38} width="70" height="6" fill="#CDBFA9" />
      <rect x={x + 8} y={base - 26} width="12" height="12" fill="#8FA9BF" />
      {gate && <rect x={x + 36} y={base - 24} width="20" height="24" fill="#2F7FD0" />}
    </g>
  );
}

export function MidLayer() {
  const f = LAYER_F.mid;
  const { umin, umax } = layerRange(f);
  const hills = ridgePoints({ f, seed: 8, low: 34, high: 250, step: 12, sigmaScale: 1.3 });

  // Ground colour drifts with the land: green suburbs, dry steppe, grey rock,
  // then the green Fergana valley.
  const grad = (
    <linearGradient id="mid-land" gradientUnits="userSpaceOnUse" x1={umin} x2={umax} y1="0" y2="0">
      <stop offset={(at(f, -500) - umin) / (umax - umin)} stopColor="#A5B98A" />
      <stop offset={(at(f, 2600) - umin) / (umax - umin)} stopColor="#BDB98A" />
      <stop offset={(at(f, 4900) - umin) / (umax - umin)} stopColor="#A0988A" />
      <stop offset={(at(f, PASS_X) - umin) / (umax - umin)} stopColor="#8F8B88" />
      <stop offset={(at(f, 7700) - umin) / (umax - umin)} stopColor="#98A686" />
      <stop offset={(at(f, 9300) - umin) / (umax - umin)} stopColor="#88AE77" />
    </linearGradient>
  );

  const rand = rng(21);
  const things: ReactNode[] = [];

  // Tashkent suburbs: nine-storey panel blocks.
  for (let xw = -5200; xw < 1800; xw += 380 + rand() * 420) {
    things.push(<Block key={`b${xw}`} x={r1(at(f, xw))} w={50 + Math.round(rand() * 3) * 14} h={110 + Math.round(rand() * 4) * 18} base={HORIZON_Y + 6} />);
  }
  // Rows of poplars along fields, everywhere but the pass.
  for (let xw = -3000; xw < ROUTE_END + 6000; xw += 70 + rand() * 90) {
    if (relief(xw) > 0.45) continue;
    if (rand() < 0.35) continue;
    things.push(<Poplar key={`p${xw}`} x={at(f, xw)} base={HORIZON_Y + 8} h={70 + rand() * 50} tone={Math.floor(rand() * 3)} />);
  }
  // Valley villages with the blue gates.
  for (let xw = 7900; xw < ROUTE_END + 3000; xw += 700 + rand() * 900) {
    things.push(<House key={`h${xw}`} x={r1(at(f, xw))} base={HORIZON_Y + 8} gate={rand() > 0.3} />);
  }

  return (
    <LayerSvg layer="mid">
      <defs>{grad}</defs>
      {/* snow shows only on the hills tall enough to hold it */}
      <path d={ridgePath(hills, HORIZON_Y + 12)} fill="#F4F7FA" />
      <path d={ridgePath(hills, HORIZON_Y + 12, snowCut(170, 26))} fill="url(#mid-land)" />
      {things}
    </LayerSvg>
  );
}

/* ───────────────────────── near: ground, road, depot, signs ───────────────────────── */

function RoadSign({ x, lines, badge }: { x: number; lines: string[]; badge?: string }) {
  const w = 230;
  const h = 30 + lines.length * 34;
  const top = 470;
  return (
    <g>
      <rect x={x + 30} y={top + h} width="7" height={HORIZON_Y + 40 - top - h} fill="#7C8794" />
      <rect x={x + w - 37} y={top + h} width="7" height={HORIZON_Y + 40 - top - h} fill="#7C8794" />
      <rect x={x} y={top} width={w} height={h} rx="8" fill="#1E5FB4" stroke="#FFFFFF" strokeWidth="4" />
      {lines.map((l, i) => (
        <text
          key={l}
          x={x + 18}
          y={top + 44 + i * 34}
          fill="#FFFFFF"
          fontFamily="var(--font-mono), monospace"
          fontSize="25"
          fontWeight="700"
        >
          {l}
        </text>
      ))}
      {badge && (
        <g>
          <rect x={x + w - 74} y={top - 22} width="62" height="30" rx="5" fill="#C9302C" stroke="#FFFFFF" strokeWidth="3" />
          <text x={x + w - 43} y={top} textAnchor="middle" fill="#FFF" fontFamily="var(--font-mono), monospace" fontSize="19" fontWeight="700">
            {badge}
          </text>
        </g>
      )}
    </g>
  );
}

function Lamp({ x, base = 694 }: { x: number; base?: number }) {
  return (
    <g>
      <circle cx={x + 34} cy={base - 236} r="90" fill="url(#lamp-glow)" style={{ opacity: "var(--lamps, 0)" }} />
      <rect x={x - 3} y={base - 240} width="6" height="240" fill="#5F6874" />
      <path d={`M${x} ${base - 238} Q${x + 10} ${base - 250} ${x + 34} ${base - 242}`} stroke="#5F6874" strokeWidth="5" fill="none" />
      <rect x={x + 24} y={base - 242} width="22" height="8" rx="3" fill="#E8EDF2" />
    </g>
  );
}

function Warehouse({
  x0,
  x1,
  label,
  labelX,
  doors,
}: {
  x0: number;
  x1: number;
  label: string;
  labelX: number;
  doors: number[];
}) {
  const top = 470;
  const base = 694;
  const ribs: ReactNode[] = [];
  for (let x = x0 + 12; x < x1; x += 22) ribs.push(<line key={x} x1={x} y1={top + 26} x2={x} y2={base} stroke="#C7D0D9" strokeWidth="3" />);
  return (
    <g>
      <rect x={x0} y={top} width={x1 - x0} height={base - top} fill="#DDE4EA" />
      {ribs}
      <rect x={x0 - 10} y={top - 8} width={x1 - x0 + 20} height="30" fill="#8A97A6" />
      <rect x={labelX} y={top + 34} width={label.length * 21 + 40} height="52" rx="4" fill="#1F2A37" />
      <text x={labelX + 20} y={top + 70} fill="#F5F7FA" fontFamily="var(--font-display), sans-serif" fontWeight="800" fontSize="30" letterSpacing="2">
        {label}
      </text>
      {doors.map((d) => (
        <g key={d}>
          <rect x={d - 80} y={base - 130} width="160" height="130" fill="#9AA6B3" />
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1={d - 80} x2={d + 80} y1={base - 120 + i * 18} y2={base - 120 + i * 18} stroke="#86929F" strokeWidth="3" />
          ))}
        </g>
      ))}
    </g>
  );
}

function Pallets({ x }: { x: number }) {
  const box = (bx: number, by: number, k: string) => (
    <g key={k}>
      <rect x={bx} y={by} width="44" height="36" fill="#C99A62" />
      <rect x={bx} y={by + 14} width="44" height="6" fill="#E3C79C" />
    </g>
  );
  return (
    <g>
      <rect x={x - 130} y={640} width="260" height="54" fill="#B9C1CA" />
      <rect x={x - 130} y={640} width="260" height="8" fill="#9AA4AF" />
      <rect x={x - 122} y={628} width="100" height="12" fill="#8C6E4C" />
      {box(x - 120, 556, "a")}
      {box(x - 72, 556, "b")}
      {box(x - 98, 520, "c")}
      {box(x - 120, 592, "d")}
      {box(x - 72, 592, "e")}
    </g>
  );
}

function PowerLine({ from, to, step }: { from: number; to: number; step: number }) {
  const out: ReactNode[] = [];
  let prev: number | null = null;
  for (let x = from; x <= to; x += step) {
    out.push(
      <g key={x}>
        <rect x={x - 4} y={470} width="8" height="226" fill="#8E7A62" />
        <rect x={x - 34} y={482} width="68" height="7" fill="#8E7A62" />
      </g>,
    );
    if (prev !== null) {
      const mid = (prev + x) / 2;
      out.push(
        <path key={`w${x}`} d={`M${prev - 30} 484 Q${mid} 520 ${x - 30} 484 M${prev + 30} 484 Q${mid} 520 ${x + 30} 484`} stroke="#5D646E" strokeWidth="1.6" fill="none" />,
      );
    }
    prev = x;
  }
  return <g>{out}</g>;
}

function Chaikhana({ x }: { x: number }) {
  // Raised tapchan under an awning, a samovar and the van every
  // roadside chaikhana has parked in front: a Damas.
  return (
    <g>
      {/* awning posts + roof */}
      <rect x={x} y={540} width="8" height="150" fill="#7A5A3C" />
      <rect x={x + 300} y={540} width="8" height="150" fill="#7A5A3C" />
      <path d={`M${x - 24} 548 L${x + 332} 548 L${x + 310} 516 L${x - 2} 516 Z`} fill="#2E8C8A" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={x - 18 + i * 44} y={548} width="22" height="14" fill={i % 2 ? "#2E8C8A" : "#F1E6D2"} />
      ))}
      {/* tapchan */}
      <rect x={x + 20} y={640} width="270" height="16" fill="#8B6440" />
      <rect x={x + 26} y={656} width="8" height="36" fill="#7A5A3C" />
      <rect x={x + 276} y={656} width="8" height="36" fill="#7A5A3C" />
      <rect x={x + 30} y={630} width="250" height="12" fill="#B3363A" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={x + 40 + i * 24} y={633} width="10" height="6" fill="#E8B04A" />
      ))}
      {/* low table + teapot */}
      <rect x={x + 120} y={612} width="80" height="8" fill="#6E4D30" />
      <ellipse cx={x + 160} cy={604} rx="12" ry="9" fill="#2F6FB5" />
      <path d={`M${x + 172} 600 l10 -6`} stroke="#2F6FB5" strokeWidth="4" />
      <path className="steam" d={`M${x + 160} 590 q-8 -14 0 -26 q8 -12 0 -24`} stroke="#FFFFFF" strokeWidth="4" fill="none" opacity="0.8" />
      {/* sign */}
      <rect x={x + 70} y={470} width="168" height="40" rx="6" fill="#F3EBDD" stroke="#B3363A" strokeWidth="3" />
      <text x={x + 154} y={498} textAnchor="middle" fill="#B3363A" fontFamily="var(--font-display), sans-serif" fontWeight="800" fontSize="24" letterSpacing="2">
        CHOYXONA
      </text>
    </g>
  );
}

function Damas({ x }: { x: number }) {
  return (
    <g>
      <g transform={`translate(${x} 600)`}>
        <path d="M0 80 L0 22 Q0 6 16 6 L96 6 Q112 6 118 20 L130 50 L130 80 Z" fill="#F2F4F6" stroke="#C3CBD3" strokeWidth="2" />
        <rect x="12" y="16" width="34" height="24" rx="3" fill="#9CC0DE" />
        <rect x="54" y="16" width="34" height="24" rx="3" fill="#9CC0DE" />
        <path d="M96 16 L110 16 L120 42 L96 42 Z" fill="#9CC0DE" />
        <circle cx="28" cy="82" r="12" fill="#23272F" />
        <circle cx="102" cy="82" r="12" fill="#23272F" />
      </g>
    </g>
  );
}

function RockCut({ from, to }: { from: number; to: number }) {
  const rand = rng(31);
  let d = `M${from} 696`;
  for (let x = from; x <= to; x += 60) {
    const k = smooth(from, from + 700, x) * (1 - smooth(to - 700, to, x));
    const y = 690 - k * (170 + rand() * 120);
    d += ` L${x} ${r1(y)}`;
  }
  d += ` L${to} 696 Z`;
  return (
    <g>
      <path d={d} fill="#9A938B" />
      <path d={d} fill="#857E77" transform="translate(0 40)" />
    </g>
  );
}

function CellTower({ x }: { x: number }) {
  const lat: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const y0 = 694 - i * 40;
    const w0 = 34 - i * 3.4;
    const w1 = 34 - (i + 1) * 3.4;
    lat.push(<path key={i} d={`M${x - w0} ${y0} L${x + w1} ${y0 - 40} M${x + w0} ${y0} L${x - w1} ${y0 - 40}`} stroke="#B33B3B" strokeWidth="3" />);
  }
  return (
    <g>
      <path d={`M${x - 34} 694 L${x - 6} 364 M${x + 34} 694 L${x + 6} 364`} stroke="#B33B3B" strokeWidth="6" />
      {lat}
      <rect x={x - 18} y={350} width="9" height="34" fill="#E9EDF1" />
      <rect x={x + 9} y={350} width="9" height="34" fill="#E9EDF1" />
      <g className="tower-waves" fill="none" stroke="#1C78EA" strokeWidth="5" strokeLinecap="round" style={{ opacity: "var(--signal, 0)" }}>
        <path d={`M${x + 34} 340 a40 40 0 0 1 0 50`} />
        <path d={`M${x + 50} 324 a62 62 0 0 1 0 82`} />
        <path d={`M${x - 34} 340 a40 40 0 0 0 0 50`} />
        <path d={`M${x - 50} 324 a62 62 0 0 0 0 82`} />
      </g>
    </g>
  );
}

function CottonField({ from, to }: { from: number; to: number }) {
  const rand = rng(41);
  const bolls: ReactNode[] = [];
  for (let x = from; x < to; x += 26) {
    for (let row = 0; row < 3; row++) {
      const y = 664 + row * 12;
      bolls.push(<ellipse key={`${x}-${row}`} cx={x + row * 9} cy={y} rx="14" ry="6" fill="#4F7F3F" />);
      if (rand() > 0.25) bolls.push(<circle key={`c${x}-${row}`} cx={x + row * 9 + (rand() * 10 - 5)} cy={y - 4} r="3.6" fill="#FFFFFF" />);
    }
  }
  return <g>{bolls}</g>;
}

export function NearLayer() {
  const f = LAYER_F.near;
  const { umin, umax } = layerRange(f);
  const X = (xw: number) => at(f, xw);
  const w = umax - umin;
  const stop = (xw: number) => (X(xw) - umin) / w;

  const rand = rng(51);
  const roadsidePoplars: ReactNode[] = [];
  const poplarStretches: [number, number][] = [
    [1600, 2700],
    [3500, 4300],
    [4800, 5100],
    [7700, 8000],
    [9450, 10050],
  ];
  for (const [a, b] of poplarStretches) {
    for (let xw = a; xw < b; xw += 95 + rand() * 40) {
      roadsidePoplars.push(<Poplar key={xw} x={X(xw)} base={688} h={190 + rand() * 70} tone={Math.floor(rand() * 3)} />);
    }
  }

  return (
    <LayerSvg layer="near">
      <defs>
        <linearGradient id="near-verge" gradientUnits="userSpaceOnUse" x1={umin} x2={umax} y1="0" y2="0">
          <stop offset={stop(-500)} stopColor="#B9C2B0" />
          <stop offset={stop(1200)} stopColor="#C9C79A" />
          <stop offset={stop(4600)} stopColor="#C4B98E" />
          <stop offset={stop(5400)} stopColor="#ABA393" />
          <stop offset={stop(7200)} stopColor="#AAA699" />
          <stop offset={stop(8000)} stopColor="#9DBB7E" />
          <stop offset={stop(ROUTE_END)} stopColor="#A7C186" />
        </linearGradient>
        <radialGradient id="lamp-glow">
          <stop offset="0" stopColor="#FFE1A0" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFE1A0" stopOpacity="0" />
        </radialGradient>
        <clipPath id="trail-sent">
          <rect className="trail-sent-rect" x={umin} y="740" width="0" height="80" />
        </clipPath>
        <clipPath id="trail-pending">
          <rect className="trail-pending-rect" x={X(OFFLINE_FROM)} y="740" width="0" height="80" />
        </clipPath>
      </defs>

      {/* verge behind the road */}
      <rect x={umin} y={HORIZON_Y} width={w} height={ROAD_TOP - HORIZON_Y + 2} fill="url(#near-verge)" />

      {/* Tashkent depot */}
      <Warehouse
        x0={X(-1400)}
        x1={X(1000)}
        label="TOSHKENT · OMBOR 3"
        labelX={X(AHEAD - 150)}
        doors={[X(-900), X(-480), X(DOCK_X)]}
      />
      <Pallets x={X(DOCK_X + AHEAD + 130)} />
      <Lamp x={X(-1550)} />
      <Lamp x={X(1080)} />
      {/* depot fence and guard booth at the exit */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={X(GATE_X - 340 + i * 34)} y={612} width="5" height="82" fill="#8F99A5" />
      ))}
      <rect x={X(GATE_X - 340)} y={616} width={340} height="5" fill="#8F99A5" />
      <rect x={X(GATE_X) + 20} y={590} width="90" height="104" fill="#E5E9EE" />
      <rect x={X(GATE_X) + 32} y={606} width="66" height="34" fill="#9CC0DE" />
      <rect x={X(GATE_X) + 12} y={580} width="106" height="12" fill="#6F7B88" />

      {roadsidePoplars}
      <PowerLine from={X(1500)} to={X(4100)} step={520} />
      <PowerLine from={X(7700)} to={X(10200)} step={520} />

      <RoadSign x={X(2700 + AHEAD)} lines={["Farg‘ona 290", "Qo‘qon 205"]} badge="A373" />
      <Damas x={X(CHAIKHANA_X - 520)} />
      <Chaikhana x={X(CHAIKHANA_X + AHEAD + 20)} />

      {/* the pass */}
      <RockCut from={X(5050)} to={X(7650)} />
      <RoadSign x={X(PASS_X + AHEAD)} lines={["Qamchiq dovoni", "2268 m"]} />
      <CellTower x={X(7450 + AHEAD + 80)} />

      {/* Fergana valley */}
      <CottonField from={X(7950)} to={X(8900)} />
      <House x={X(8500) - 30} base={694} />
      <House x={X(8660) - 30} base={694} />
      <RoadSign x={X(9150 + AHEAD)} lines={["Farg‘ona 12"]} />
      <Warehouse
        x0={X(10050)}
        x1={X(12100)}
        label="FARG‘ONA · OMBOR"
        labelX={X(ROUTE_END + AHEAD - 150)}
        doors={[X(ROUTE_END), X(11700)]}
      />
      <Lamp x={X(9900)} />
      <Lamp x={X(11400)} />

      {/* road */}
      <rect x={umin} y={ROAD_TOP} width={w} height={ROAD_BOTTOM - ROAD_TOP} fill="#545A63" />
      <rect x={umin} y={ROAD_TOP} width={w} height="5" fill="#E8ECEF" />
      <rect x={umin} y={ROAD_BOTTOM - 6} width={w} height="5" fill="#E8ECEF" />
      {/* centre-line dashes are an HTML strip in Trip, so they can keep
          rolling while a cruising chapter is read */}

      {/* GPS points the phone records: blue once the server has them, grey
          while they wait on the phone for the network. */}
      <path
        d={`M${X(DOCK_X)} ${TRAIL_Y} H${X(ROUTE_END)}`}
        stroke="#9AA6B4"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="0 30"
        clipPath="url(#trail-pending)"
      />
      <path
        d={`M${X(DOCK_X)} ${TRAIL_Y} H${X(ROUTE_END)}`}
        stroke="#2E86F5"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="0 30"
        clipPath="url(#trail-sent)"
      />

      {/* verge in front of the road */}
      <rect x={umin} y={ROAD_BOTTOM} width={w} height={SCENE_H - ROAD_BOTTOM} fill="url(#near-verge)" />
      <rect x={umin} y={ROAD_BOTTOM} width={w} height={SCENE_H - ROAD_BOTTOM} fill="#000" opacity="0.06" />
    </LayerSvg>
  );
}

/* ───────────────────────── front: guardrail, grass ───────────────────────── */

export function FrontLayer() {
  const f = LAYER_F.front;
  const X = (xw: number) => at(f, xw);
  const rand = rng(61);
  const tufts: ReactNode[] = [];
  for (let xw = -2500; xw < ROUTE_END + 2500; xw += 160 + rand() * 260) {
    if (xw > 5200 && xw < 7500) continue;
    const y = 830 + rand() * 50;
    tufts.push(
      <path
        key={xw}
        d={`M${X(xw)} ${y} q-6 -26 -18 -34 M${X(xw)} ${y} q2 -30 4 -40 M${X(xw)} ${y} q8 -22 20 -28`}
        stroke="#6E8B55"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />,
    );
  }
  const rail: ReactNode[] = [];
  for (let xw = 5300; xw < 7450; xw += 90) {
    rail.push(<rect key={xw} x={X(xw)} y={812} width="7" height="40" fill="#8A929C" />);
  }
  return (
    <LayerSvg layer="front">
      {tufts}
      {rail}
      <rect x={X(5300)} y={812} width={X(7450) - X(5300)} height="14" rx="4" fill="#C9D0D7" />
    </LayerSvg>
  );
}
