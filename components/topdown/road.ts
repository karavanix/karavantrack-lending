// Geometry of the top-down map: where the road runs, how long it is up to any
// height, and where the truck is for a given scroll position.
//
// The road is a function x(y): between two bends it swings across with a
// half cosine, so at every bend it runs straight down and y only grows. That
// makes "y → length along the road" a plain lookup table.

import { CAMERA, CHAPTERS, K, SECTION_SCREENS, STEP, anchorOf } from "./chapters";

export type Layout = {
  vw: number;
  vh: number; // px in one screen (100svh)
  wide: boolean; // desktop: participants live in a column on the right
  roadW: number; // the road snakes inside [0, roadW]
  k: number; // drawing scale for the truck and road widths
  anchors: number[]; // world y of each bend, px
  bends: number[]; // road x at each bend, px
  height: number; // section height, px
};

export const WIDE_MIN = 1024;

export function makeLayout(vw: number, vh: number): Layout {
  const wide = vw >= WIDE_MIN;
  const roadW = wide ? (vw * 2) / 3 : vw;
  const anchors = CHAPTERS.map((_, i) => anchorOf(i) * vh);
  // The bend sits on the side away from the card.
  const far = wide ? 0.74 : 0.75;
  const near = wide ? 0.27 : 0.25;
  const bends = CHAPTERS.map((c) => roadW * (c.side === "L" ? far : near));
  return { vw, vh, wide, roadW, k: wide ? 1 : 0.72, anchors, bends, height: SECTION_SCREENS * vh };
}

const SAMPLE = 6; // px between samples of the lookup table

export class Road {
  readonly y0: number;
  readonly y1: number;
  readonly total: number;
  readonly d: string;
  private readonly lens: Float64Array;
  private readonly L: Layout;

  constructor(L: Layout) {
    this.L = L;
    this.y0 = L.anchors[0] - 0.24 * L.vh;
    this.y1 = L.anchors[K - 1] + 0.2 * L.vh;
    const n = Math.ceil((this.y1 - this.y0) / SAMPLE) + 1;
    this.lens = new Float64Array(n);
    const parts: string[] = [];
    let px = this.xAt(this.y0);
    let py = this.y0;
    let len = 0;
    for (let j = 0; j < n; j++) {
      const y = Math.min(this.y1, this.y0 + j * SAMPLE);
      const x = this.xAt(y);
      len += Math.hypot(x - px, y - py);
      this.lens[j] = len;
      parts.push(`${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
      px = x;
      py = y;
    }
    this.total = len;
    this.d = parts.join("");
  }

  private seg(y: number): [number, number] {
    const { anchors } = this.L;
    const step = STEP * this.L.vh;
    const i = Math.min(K - 2, Math.max(0, Math.floor((y - anchors[0]) / step)));
    const u = Math.min(1, Math.max(0, (y - anchors[i]) / step));
    return [i, u];
  }

  xAt(y: number): number {
    const { bends, anchors } = this.L;
    if (y <= anchors[0]) return bends[0];
    if (y >= anchors[K - 1]) return bends[K - 1];
    const [i, u] = this.seg(y);
    return bends[i] + ((bends[i + 1] - bends[i]) * (1 - Math.cos(Math.PI * u))) / 2;
  }

  // dx/dy of the road at y.
  slopeAt(y: number): number {
    const { bends, anchors } = this.L;
    if (y <= anchors[0] || y >= anchors[K - 1]) return 0;
    const [i, u] = this.seg(y);
    return ((bends[i + 1] - bends[i]) * Math.PI * Math.sin(Math.PI * u)) / (2 * STEP * this.L.vh);
  }

  lenAt(y: number): number {
    const f = (Math.min(this.y1, Math.max(this.y0, y)) - this.y0) / SAMPLE;
    const j = Math.min(this.lens.length - 2, Math.floor(f));
    return this.lens[j] + (this.lens[j + 1] - this.lens[j]) * (f - j);
  }

  yAtLen(l: number): number {
    let lo = 0;
    let hi = this.lens.length - 1;
    if (l <= 0) return this.y0;
    if (l >= this.total) return this.y1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.lens[mid] < l) lo = mid;
      else hi = mid;
    }
    const k = (l - this.lens[lo]) / (this.lens[hi] - this.lens[lo] || 1);
    return this.y0 + (lo + k) * SAMPLE;
  }

  // Point at a distance along the road, with the unit normal (pointing right
  // of the direction of travel) for placing things beside the road.
  at(l: number) {
    const y = this.yAtLen(l);
    const x = this.xAt(y);
    const s = this.slopeAt(y);
    const n = Math.hypot(s, 1);
    return { x, y, nx: -1 / n, ny: s / n };
  }

  // Length along the road at a position between bends (2.5 = halfway from
  // bend 2 to bend 3).
  lenAtStation(pos: number): number {
    return this.lenAt(anchorOf(pos) * this.L.vh);
  }
}

// ── camera and truck ──────────────────────────────────────────────────────
// The camera is the world y at CAMERA of the screen: s = scrollTop + CAMERA·vh.
// Normally the truck is right there. At a chapter with a hold it brakes into
// its bend, stands while the camera moves on (so it drifts up the screen),
// then catches up again.

const APPROACH = 0.08; // screens of braking before a hold
const CATCH_UP = 0.42; // screens to catch the camera again after it

export function truckY(s: number, L: Layout): number {
  let lag = 0;
  for (let i = 0; i < K; i++) {
    const h = CHAPTERS[i].hold * L.vh;
    if (!h) continue;
    const a = (i === 0 ? 0 : APPROACH) * L.vh;
    const c = CATCH_UP * L.vh;
    const A = L.anchors[i] + a / 2; // so it stands exactly at the bend
    if (s < A - a || s > A + h + c) continue;
    if (s < A) lag += (s - A + a) ** 2 / (2 * a);
    else if (s < A + h) lag += a / 2 + (s - A);
    else {
      const u = (s - A - h) / c;
      const L0 = a / 2 + h;
      lag += (2 * u ** 3 - 3 * u ** 2 + 1) * L0 + (u ** 3 - 2 * u ** 2 + u) * c;
    }
  }
  return Math.min(L.anchors[K - 1], Math.max(L.anchors[0], s - lag));
}

// Station position of a world y: 2.5 = halfway from bend 2 to bend 3 (the
// inverse of anchorOf). The 3D world places its truck by it.
export const posAtY = (y: number, L: Layout) => (y / L.vh - CAMERA) / STEP;

// Camera position at which the truck standing at bend i drives off again.
export const departOf = (i: number, L: Layout) => L.anchors[i] + (APPROACH / 2 + CHAPTERS[i].hold) * L.vh;

// Trip clock for camera position s: it keeps running while the truck stands.
// At a chapter with a `stand`, those minutes pass during the hold itself.
export function minuteAt(s: number, L: Layout): number {
  const { anchors } = L;
  if (s <= anchors[0]) return CHAPTERS[0].minute;
  if (s >= anchors[K - 1]) return CHAPTERS[K - 1].minute;
  const i = Math.min(K - 2, Math.floor((s - anchors[0]) / (STEP * L.vh)));
  const m0 = CHAPTERS[i].minute;
  const m1 = CHAPTERS[i + 1].minute;
  const stand = CHAPTERS[i].stand;
  if (stand) {
    const d = departOf(i, L);
    if (s < d) return m0 + (stand * (s - anchors[i])) / (d - anchors[i]);
    return m0 + stand + ((m1 - m0 - stand) * (s - d)) / (anchors[i + 1] - d);
  }
  return m0 + ((m1 - m0) * (s - anchors[i])) / (anchors[i + 1] - anchors[i]);
}

export const cameraOf = (scrollInSection: number, L: Layout) => scrollInSection + CAMERA * L.vh;

// stroke-dasharray that draws only the given [from, to] stretches of a path.
// The pattern has to open with a gap, i.e. an empty dash, and a round cap
// would draw that as a dot; so the pattern runs 1 px ahead of the path
// (stroke-dashoffset="1" on the path) and the dot falls before its start.
export const DASH_SHIFT = 1;
export function dashRanges(ranges: [number, number][], total: number): string {
  const out = [0];
  let pos = -DASH_SHIFT;
  for (const [a0, b0] of ranges) {
    const a = Math.max(pos, a0);
    const b = Math.max(a, b0);
    out.push(a - pos, b - a);
    pos = b;
  }
  out.push(total - pos + 10); // and past its end, so it never comes round again
  return out.map((v) => v.toFixed(1)).join(" ");
}
