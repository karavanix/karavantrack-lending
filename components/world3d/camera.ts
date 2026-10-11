// The camera: three positions and four moves for the whole trip
// (docs/3d/plan.md, "Камера").
//
//   Close — the truck stands at a dock; the camera in front of it and to one
//           side, low, with the truck and the dock in frame. Start and end.
//   Road  — ahead of the truck and above it, looking back at it, so it
//           drives down the screen. Most of the trip.
//   Top   — the whole route from high above, nearly straight down: the world
//           becomes the cabinet's map. Chapter 1 (the plan) and the finale
//           (the track).
//
// A position is a Shot: the point looked at, from which direction and how
// far, and where on the screen that point lands (setViewOffset), so the
// truck stands between the cards and the participants on desktop, and above
// the card on a phone. Road and Close look at the truck (Close from the
// direction of its dock, so it holds still while the truck pulls up); Top
// stands still over the middle of the route.
//
// The moves are worked out from the scroll alone (station units, like the
// truck), so scrolling back plays them backwards and reduced motion makes
// them cuts. Between two shots the distance changes geometrically (an even
// zoom), and the point looked at moves along with the distance, not with
// the scroll: rising from 46 m to 2 km, the camera first backs off over the
// truck and only then glides over to the middle of the route, so the truck
// does not shoot out of frame in the first instant.

import { PerspectiveCamera, Vector3 } from "three";
import { K } from "../topdown/chapters";
import { PTS, roadAt, sAtPos } from "./route";
import type { View } from "./engine";

export const FOV = 38;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
const RAD = Math.PI / 180;

export type Shot = {
  t: Vector3; // the point looked at
  yaw: number; // direction from it to the camera, atan2(x, z)
  pitch: number; // elevation of the camera above it
  dist: number;
  ax: number; // where t lands on screen, px
  ay: number;
};

type Name = "close0" | "top" | "road" | "close9";

// The script, in scroll positions (station units: chapter i starts at
// i − LEAD = i − 0.04). Between two keys with the same shot the camera
// holds; between different ones it moves. Each move fits in the scroll
// between two chapters, never over a chapter's scene:
//   0 → 1  Close → Top    after the hero, done as "Load created" starts
//   1 → 2  Top → Road     after the plan, done as "Driver by link" starts
//   8 → 9  Road → Close   the truck pulls up to the Fergana dock
//   9 → ∞  Close → Top    after "Delivered", in the finale scroll
const KEYS: [number, Name][] = [
  [0.16, "close0"],
  [0.86, "top"],
  [1.22, "top"],
  [1.88, "road"],
  [8.36, "road"],
  [8.96, "close9"],
  [9.24, "close9"],
  [10.0, "top"],
];

const smooth = (t: number) => t * t * (3 - 2 * t);

// The two shots and the mix between them at scroll position `at`.
export function cutAt(at: number, reduce: boolean): { a: Name; b: Name; w: number } {
  if (at <= KEYS[0][0]) return { a: KEYS[0][1], b: KEYS[0][1], w: 0 };
  for (let j = 1; j < KEYS.length; j++) {
    const [s1, b] = KEYS[j];
    if (at > s1) continue;
    const [s0, a] = KEYS[j - 1];
    if (a === b) return { a, b, w: 0 };
    const t = (at - s0) / (s1 - s0);
    return { a, b, w: reduce ? (t < 0.5 ? 0 : 1) : smooth(t) };
  }
  const last = KEYS[KEYS.length - 1][1];
  return { a: last, b: last, w: 0 };
}

// Same picture: the moving truck aside, only a change of cut redraws.
export const cutKey = (c: ReturnType<typeof cutAt>) => (c.a === c.b ? c.a : `${c.a}>${c.b}:${c.w.toFixed(4)}`);

// ── the shots ─────────────────────────────────────────────────────────────

// Road: the offset from the truck, metres up and towards Fergana (−z).
const ROAD = { wide: { up: 74, back: 104 }, narrow: { up: 105, back: 130 } };

// Close: in front of the truck and `side` degrees off its nose, `dist`
// metres away, low. Its dock is on the far side: the Tashkent warehouse is
// on +x of the road, the Fergana one on −x.
const CLOSE = {
  wide: { dist: 46, pitch: 13 },
  narrow: { dist: 56, pitch: 14 },
  close0: { pos: 0, side: -34, lift: 0 },
  // from its side, a little behind: the dropoff flag stands 8 m ahead of
  // the truck on +x and would hide the cab from in front
  // and higher, so its dock and roof show over the truck
  close9: { pos: K - 1, side: 110, lift: 10 },
};

// Top: nearly straight down, the route fitted into the free part of the
// screen with this much room around it, px.
const TOP_PITCH = 70;
const TOP_PAD = { wide: 56, narrow: 22 };
// Phone: the route keeps above the card docked at the bottom (its top is
// at about 60 % of the screen in chapter 1, a little lower in the finale).
const TOP_BOTTOM = 0.56;
// Space the nav bar takes at the top, px.
const NAV = 64;

const at = { x: 0, z: 0, tx: 0, tz: -1 };

function road(x: number, z: number, v: View, out: Shot) {
  const o = v.wide ? ROAD.wide : ROAD.narrow;
  out.t.set(x, 1.5, z);
  out.yaw = Math.PI; // the camera on the −z side
  out.pitch = Math.atan2(o.up - 1.5, o.back);
  out.dist = Math.hypot(o.up - 1.5, o.back);
  out.ax = v.aimX;
  out.ay = v.aimY;
}

function close(name: "close0" | "close9", x: number, z: number, v: View, out: Shot) {
  const c = CLOSE[name];
  const o = v.wide ? CLOSE.wide : CLOSE.narrow;
  roadAt(sAtPos(c.pos), at);
  // forward is (tx, tz); right of it, seen from above, is (−tz, tx)
  const a = c.side * RAD;
  const dx = at.tx * Math.cos(a) - at.tz * Math.sin(a);
  const dz = at.tz * Math.cos(a) + at.tx * Math.sin(a);
  out.t.set(x + at.tx, 2.2, z + at.tz);
  out.yaw = Math.atan2(dx, dz);
  out.pitch = (o.pitch + c.lift) * RAD;
  out.dist = o.dist;
  out.ax = v.aimX;
  out.ay = v.aimY;
}

// The route's middle, and samples of it to fit on screen.
const ROUTE = PTS.filter((_, i) => i % 16 === 0);
const MID = (() => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const p of ROUTE) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    z0 = Math.min(z0, p.z);
    z1 = Math.max(z1, p.z);
  }
  return new Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2);
})();

const probe = new PerspectiveCamera(FOV, 1, 1, 10000);
const pv = new Vector3();
let topMemo = { key: "", dist: 0, ax: 0, ay: 0 };

// The smallest distance at which the whole route fits the free box. Worked
// out once per layout.
function top(v: View, w: number, h: number, out: Shot) {
  const pad = v.wide ? TOP_PAD.wide : TOP_PAD.narrow;
  const box = v.wide
    ? { x0: v.free[0] + pad, x1: v.free[1] - pad, y0: NAV + pad, y1: h - pad }
    : { x0: pad, x1: w - pad, y0: NAV + pad, y1: h * TOP_BOTTOM };
  out.t.copy(MID);
  out.yaw = Math.PI;
  out.pitch = TOP_PITCH * RAD;
  out.ax = (box.x0 + box.x1) / 2;
  out.ay = (box.y0 + box.y1) / 2;
  const key = `${w}:${h}:${box.x0}:${box.x1}:${box.y1}`;
  if (topMemo.key !== key) {
    const fits = (d: number) => {
      out.dist = d;
      apply(probe, out, w, h);
      probe.updateMatrixWorld();
      for (const p of ROUTE) {
        pv.copy(p).project(probe);
        const x = ((pv.x + 1) / 2) * w;
        const y = ((1 - pv.y) / 2) * h;
        if (pv.z > 1 || x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1) return false;
      }
      return true;
    };
    let lo = 200;
    let hi = 20000;
    for (let k = 0; k < 40; k++) {
      const m = Math.sqrt(lo * hi);
      if (fits(m)) hi = m;
      else lo = m;
    }
    topMemo = { key, dist: hi, ax: out.ax, ay: out.ay };
  }
  out.dist = topMemo.dist;
}

const blank = (): Shot => ({ t: new Vector3(), yaw: 0, pitch: 0, dist: 1, ax: 0, ay: 0 });
const A = blank();
const B = blank();

function shot(name: Name, x: number, z: number, v: View, w: number, h: number, out: Shot) {
  if (name === "road") road(x, z, v, out);
  else if (name === "top") top(v, w, h, out);
  else close(name, x, z, v, out);
}

// The camera's shot for a cut, the truck at (x, z).
export function shotAt(c: ReturnType<typeof cutAt>, x: number, z: number, v: View, w: number, h: number, out: Shot) {
  shot(c.a, x, z, v, w, h, A);
  if (c.a === c.b) return copy(A, out);
  shot(c.b, x, z, v, w, h, B);
  const k = c.w;
  out.dist = A.dist * (B.dist / A.dist) ** k;
  // the point looked at goes with the distance (see the top of the file)
  const m = Math.abs(B.dist - A.dist) > 1 ? (out.dist - A.dist) / (B.dist - A.dist) : k;
  out.t.lerpVectors(A.t, B.t, m);
  let dy = B.yaw - A.yaw;
  dy -= Math.round(dy / (2 * Math.PI)) * 2 * Math.PI; // the short way round
  out.yaw = A.yaw + dy * k;
  out.pitch = A.pitch + (B.pitch - A.pitch) * k;
  out.ax = A.ax + (B.ax - A.ax) * m;
  out.ay = A.ay + (B.ay - A.ay) * m;
  return out;
}

function copy(s: Shot, out: Shot) {
  out.t.copy(s.t);
  out.yaw = s.yaw;
  out.pitch = s.pitch;
  out.dist = s.dist;
  out.ax = s.ax;
  out.ay = s.ay;
  return out;
}

export const newShot = blank;

// Put the camera where a shot says. Near and far go with the distance, so
// the depth buffer is as fine from 2 km as from 40 m.
export function apply(cam: PerspectiveCamera, s: Shot, w: number, h: number) {
  const cp = Math.cos(s.pitch);
  cam.position.set(s.t.x + Math.sin(s.yaw) * cp * s.dist, s.t.y + Math.sin(s.pitch) * s.dist, s.t.z + Math.cos(s.yaw) * cp * s.dist);
  cam.lookAt(s.t);
  cam.aspect = w / h;
  cam.near = Math.max(1, s.dist * 0.04);
  cam.far = s.dist * 2.6 + 600;
  // the point looked at lands on (ax, ay) instead of the middle
  cam.setViewOffset(w, h, w / 2 - s.ax, h / 2 - s.ay, w, h);
  cam.updateProjectionMatrix();
}

// Screen pixels a metre takes at the point looked at.
export const pxPerMetre = (s: Shot, h: number) => h / (2 * s.dist * TAN);
