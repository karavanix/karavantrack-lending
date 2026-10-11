// The road of the 3D world, Tashkent depot (south, +z) → Fergana depot
// (north, −z), in metres, and where the truck is on it for a scroll position.
//
// The flat map already knows where the truck is: truckY() in topdown/road.ts
// brakes it into a chapter's bend, holds it there and lets it catch up. We
// keep all of that and only translate its answer. A position on the flat map
// becomes a station number (posAtY in road.ts: 2.5 = halfway from chapter
// 2's bend to chapter 3's), and the station number becomes metres along this
// road through a smooth curve over STATION_S. So every chapter starts at the
// same scroll offset as before, and stands at its own place in the 3D world.

import { CatmullRomCurve3, Vector3 } from "three";
import { K } from "../topdown/chapters";

// Same line as the probe (docs/3d/probe-trip.html), which the owner approved.
const KNOTS: [number, number][] = [
  [6, 660], [4, 600], [0, 540], [-30, 450], [40, 330], [-35, 210], [48, 80], [-30, -60],
  [10, -190], [-25, -330], [20, -470], [-20, -600], [15, -720], [0, -830], [-4, -890], [-6, -935],
];

const curve = new CatmullRomCurve3(
  KNOTS.map(([x, z]) => new Vector3(x, 0, z)),
  false,
  "centripetal",
);

export const LEN = curve.getLength();
// Samples along the road, evenly spaced by length (about a metre apart).
export const N = 1600;
export const PTS = curve.getSpacedPoints(N);
export const TANS = PTS.map((_, i) => curve.getTangentAt(i / N));

export const idxOf = (s: number) => Math.min(N, Math.max(0, (s / LEN) * N));

// Metres along the road where it first comes down to z (it only runs north).
export function sAtZ(z: number): number {
  let i = 0;
  while (i < N && PTS[i].z > z) i++;
  return (i / N) * LEN;
}

// Where the truck stands at each chapter's bend, metres along the road.
// 0–3 are in the Tashkent yard: it waits, pulls up to the dock, is loaded,
// so it only creeps there. 4 is past the gate, 5 the chaikhana, 6 and 7 the
// two ends of the pass without network, 8 the cotton valley, 9 the Fergana
// dock at the end of the road.
export const STATION_S = [8, 13, 18, 26, sAtZ(495), sAtZ(84), sAtZ(-262), sAtZ(-452), sAtZ(-610), LEN - 16];
// Past the last bend (the dropoff pin stands a little beyond it).
const TAIL_M = 50;

// Monotone cubic through (i, STATION_S[i]): the truck never runs back and
// changes speed smoothly between a slow yard and a fast highway.
const slopes = (() => {
  const y = STATION_S;
  const n = y.length;
  const d = y.slice(1).map((v, i) => v - y[i]);
  const m = y.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (!d[i]) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
})();

// Metres along the road at a station position.
export function sAtPos(pos: number): number {
  if (pos <= 0) return STATION_S[0];
  if (pos >= K - 1) return Math.min(LEN, STATION_S[K - 1] + (pos - (K - 1)) * TAIL_M);
  const i = Math.floor(pos);
  const t = pos - i;
  const y0 = STATION_S[i];
  const y1 = STATION_S[i + 1];
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * slopes[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * slopes[i + 1];
}

// Point and heading at s metres along the road.
export function roadAt(s: number, out = { x: 0, z: 0, tx: 0, tz: -1 }) {
  const f = idxOf(s);
  const i = Math.min(N - 1, Math.floor(f));
  const k = f - i;
  const a = PTS[i];
  const b = PTS[i + 1];
  out.x = a.x + (b.x - a.x) * k;
  out.z = a.z + (b.z - a.z) * k;
  const ta = TANS[i];
  const tb = TANS[i + 1];
  const tx = ta.x + (tb.x - ta.x) * k;
  const tz = ta.z + (tb.z - ta.z) * k;
  const n = Math.hypot(tx, tz) || 1;
  out.tx = tx / n;
  out.tz = tz / n;
  return out;
}
