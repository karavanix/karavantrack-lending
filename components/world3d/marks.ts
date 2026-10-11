// What the cabinet draws on its map, laid on the 3D ground: the planned
// route as grey dots (chapter 1), the first track point (chapter 2), the
// points still waiting on the driver's phone on the pass (chapter 6) and the
// front of the wave that delivers them (chapter 7), the pickup and dropoff
// flags and the driver's step rings. And the waves of the tower that brings
// the network back (chapter 7).
//
// Colours are the cabinet's (docs/top-down-scenario.md, "Карта говорит
// языком кабинета"). Dots and the wave are unlit ink, like the track. Flags
// and rings stand in the light and take shadows: the truck stands on its
// ring at the dock, and its shadow should fall on it.
//
// Everything follows the Frame, so scrolling back simply shows less. A mark
// that comes on lands and pings, as the flat map's CSS does; update() says
// while that is going on, and the engine keeps drawing until it is over.

import {
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type Material,
  type Scene,
} from "three";
import { DROPOFF_AT, OFFLINE_FROM, OFFLINE_TO, PICKUP_AT, RINGS } from "../topdown/chapters";
import { roadAt, sAtPos } from "./route";
import type { Tower } from "./build/pass";
import type { Frame } from "./engine";
import { grow } from "./grow";

const C = {
  plan: 0x64748b,
  pending: 0x94a3b8,
  track: 0x2563eb,
  pickup: 0x16a34a,
  transit: 0xf59e0b,
  dropoff: 0xdc2626,
};
const RING_COLORS = [C.pickup, C.transit, C.dropoff];

// Heights above the ground: road 0.06, its dashes 0.10, track 0.12–0.13.
// The plan lies under the track (the cabinet draws it so), the rest over it.
const Y = { plan: 0.11, pending: 0.15, ring: 0.17, front: 0.2, ripple: 0.25 };

// Step ring: outer radius and rim, metres. The truck (2.6 × 12 m) stands
// on the first and the last; the rim shows on both sides of it.
const RING_R = 4.6;
const RING_W = 1.2;
// The flags stand this far off the road, on the side away from the depot
// buildings (+1: +x, the left of the screen as the camera looks south).
const FLAG_OFF = 7;
// Flag head: its top is where the HTML tag hangs (overlays.ts).
const HEAD_Y = 7.5;
const HEAD_R = 1.6;

const SEG = 12;

// The plan's dots: radius and spacing, metres.
const PLAN_R = 0.75;
const PLAN_STEP = 9;
// ...and never smaller on screen than this, px (Top camera, 2 km up).
const DOT_PX = 4;
const GAP_PX = 9;
const UP = -Math.PI / 2;

// Round dots along the road every `step` metres over [s0, s1]: a coloured
// disc, on a slightly larger white one when `rim` > 0. All in one geometry,
// dot after dot, so any run of them is one draw range. A row that `grows`
// keeps its size on screen from afar (grow.ts).
function dotRow(s0: number, s1: number, step: number, r: number, rim: number, color: number, y: number, grows = false) {
  const ss: number[] = [];
  for (let s = s0; s <= s1; s += step) ss.push(s);
  const pos: number[] = [];
  const col: number[] = [];
  const centre: number[] = [];
  const nth: number[] = [];
  const idx: number[] = [];
  const white = new Color(0xffffff);
  const ink = new Color(color);
  const at = { x: 0, z: 0, tx: 0, tz: -1 };
  const disc = (x: number, z: number, yy: number, rr: number, c: Color) => {
    const base = pos.length / 3;
    const k = centre.length / (3 * (SEG + 1) * (rim ? 2 : 1));
    for (let j = 0; j <= SEG; j++) {
      centre.push(x, yy, z);
      nth.push(Math.floor(k));
    }
    pos.push(x, yy, z);
    col.push(c.r, c.g, c.b);
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * Math.PI * 2;
      pos.push(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr);
      col.push(c.r, c.g, c.b);
      // counter-clockwise seen from above: facing up
      idx.push(base, base + 1 + ((j + 1) % SEG), base + 1 + j);
    }
  };
  for (const s of ss) {
    roadAt(s, at);
    if (rim) disc(at.x, at.z, y, r + rim, white);
    disc(at.x, at.z, y + 0.005, r, ink);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  const m = new MeshBasicMaterial({ vertexColors: true });
  if (grows) {
    g.setAttribute("aCentre", new Float32BufferAttribute(centre, 3));
    g.setAttribute("aIdx", new Float32BufferAttribute(nth, 1));
  }
  const u = grows ? grow(m, "dots") : null;
  const o = new Mesh(g, m);
  o.frustumCulled = false; // its bounds are the whole row; the draw range is what shows
  const per = (rim ? 2 : 1) * SEG * 3;
  // Dots with s in (a, b], as station positions.
  const show = (range: [number, number] | null) => {
    if (!range) return void (o.visible = false);
    const a = sAtPos(range[0]);
    const b = sAtPos(range[1]);
    const from = upper(ss, a);
    const n = upper(ss, b) - from;
    o.visible = n > 0;
    o.geometry.setDrawRange(from * per, Math.max(0, n) * per);
  };
  show(null);
  return { o, show, u };
}

// Index of the first value > v in an ascending list.
function upper(a: number[], v: number) {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] <= v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

const flat = (g: BufferGeometry, m: Material, y: number) => {
  const o = new Mesh(g.rotateX(UP), m);
  o.position.y = y;
  return o;
};

// Overshoots a little and settles, like the flat map's "land" (CSS
// cubic-bezier(0.3, 1.6, 0.5, 1)).
const backOut = (t: number) => {
  const c = 2.2;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
const easeOut = (t: number) => 1 - (1 - t) ** 2;

const LAND_MS = 500;

// A thin ring on the ground that grows from r0 to r1 and fades out from
// `peak` opacity, `times` over, each `ms` long, after `delay` ms: the flat
// map's CSS pings.
function ripple(x: number, z: number, color: number, r0: number, r1: number, rim: number, ms: number, times: number, delay = 0, peak = 0.9) {
  const o = flat(
    new RingGeometry(1 - rim, 1, 96),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }),
    Y.ripple,
  );
  o.position.x = x;
  o.position.z = z;
  o.visible = false;
  // at `t` ms since its mark came on; false once it is over
  const at = (t: number) => {
    const p = (t - delay) / ms;
    o.visible = p >= 0 && p < times;
    if (o.visible) {
      const k = p % 1;
      o.scale.setScalar(r0 + (r1 - r0) * easeOut(k));
      (o.material as MeshBasicMaterial).opacity = peak * (1 - k);
    }
    return p < times;
  };
  return { o, at };
}

type Mark = { on: boolean; t0: number };

export function buildMarks(scene: Scene, reduce: boolean, tower: Tower) {
  // ── the planned route and the queued points ────────────────────────────
  const plan = dotRow(sAtPos(PICKUP_AT), sAtPos(DROPOFF_AT), PLAN_STEP, PLAN_R, 0, C.plan, Y.plan, true);
  const pend = dotRow(sAtPos(OFFLINE_FROM) + 4, sAtPos(OFFLINE_TO), 6, 0.9, 0.4, C.pending, Y.pending);

  // A track point as the cabinet draws it: blue with a white rim.
  const point = (x: number, z: number, y: number) => {
    const g = new Group();
    g.add(
      flat(new CircleGeometry(1.6, 16), new MeshBasicMaterial({ color: 0xffffff }), y),
      flat(new CircleGeometry(1.15, 16), new MeshBasicMaterial({ color: C.track }), y + 0.01),
    );
    g.position.set(x, 0, z);
    return g;
  };

  // the wave's front: a point in a pale halo
  const front = point(0, 0, Y.front + 0.01);
  front.add(flat(new CircleGeometry(3.4, 24), new MeshBasicMaterial({ color: C.track, transparent: true, opacity: 0.22, depthWrite: false }), Y.front));
  front.visible = false;

  // the first point of the track, where the driver accepted the load; it
  // lands under the truck and pings out from under it, three times
  const r0 = roadAt(sAtPos(2));
  const first = { g: point(r0.x, r0.z, Y.front), on: false, t0: 0, pings: [ripple(r0.x, r0.z, C.track, 1.6, 6.4, 0.14, 1600, 3)] };
  first.g.visible = false;

  // ── pickup and dropoff flags ───────────────────────────────────────────
  const flag = (pos: number, color: number, side: 1 | -1) => {
    const r = roadAt(sAtPos(pos));
    const g = new Group();
    const m = new MeshLambertMaterial({ color });
    const head = new Mesh(new SphereGeometry(HEAD_R, 16, 12), m);
    head.position.y = HEAD_Y;
    const cone = new Mesh(new ConeGeometry(1.1, 6, 12), m);
    cone.rotation.x = Math.PI;
    cone.position.y = 3.6;
    for (const o of [head, cone]) {
      o.castShadow = true;
      g.add(o);
    }
    g.position.set(r.x - r.tz * FLAG_OFF * side, 0, r.z + r.tx * FLAG_OFF * side);
    g.visible = false;
    return { g, top: new Vector3(g.position.x, HEAD_Y + HEAD_R, g.position.z), on: false, t0: 0 };
  };
  // the Tashkent warehouse is on +x of the road, the Fergana one on −x
  const flags = [flag(PICKUP_AT, C.pickup, -1), flag(DROPOFF_AT, C.dropoff, 1)];

  // ── the driver's step rings: white centre, coloured rim; ping twice ────
  const white = new MeshLambertMaterial({ color: 0xffffff });
  const rings = RINGS.map((pos, i) => {
    const r = roadAt(sAtPos(pos));
    const g = new Group();
    const rim = new MeshLambertMaterial({ color: RING_COLORS[i] });
    const centre = flat(new CircleGeometry(RING_R - RING_W, 32), white, Y.ring);
    const band = flat(new RingGeometry(RING_R - RING_W, RING_R, 40), rim, Y.ring + 0.01);
    centre.receiveShadow = band.receiveShadow = true;
    g.add(centre, band);
    g.position.set(r.x, 0, r.z);
    g.visible = false;
    return { g, on: false, t0: 0, pings: [ripple(r.x, r.z, RING_COLORS[i], RING_R, RING_R * 2.3, 0.1, 1400, 2)] };
  });

  // ── network back (chapter 7): the tower below the pass sends three
  // waves over its dome, twice; they cross the road at the truck ────────
  const waves = {
    on: false,
    t0: 0,
    pings: [0, 300, 600].map((delay) => ripple(tower.x, tower.z, C.track, 2, tower.r, 0.025, 1500, 2, delay, 0.6)),
  };

  const pings = [first, ...rings, waves].flatMap((m) => m.pings.map((p) => p.o));
  scene.add(plan.o, pend.o, front, first.g, ...flags.map((f) => f.g), ...rings.map((r) => r.g), ...pings);

  // Turn a mark on or off; when it comes on it starts its landing.
  const toggle = (m: Mark, on: boolean, now: number) => {
    if (on && !m.on) m.t0 = reduce ? -Infinity : now;
    m.on = on;
  };
  // Lands a mark (scale with a little overshoot); true while it still is.
  const land = (m: Mark & { g: Group }, from: number, now: number) => {
    m.g.visible = m.on;
    if (!m.on) return false;
    const t = Math.min(1, (now - m.t0) / LAND_MS);
    m.g.scale.setScalar(from + (1 - from) * backOut(t));
    return t < 1;
  };
  // Runs a mark's pings; true while any still runs.
  const ping = (m: Mark & { pings: ReturnType<typeof ripple>[] }, now: number) => {
    let busy = false;
    for (const p of m.pings) busy = (m.on ? p.at(now - m.t0) : (p.o.visible = false)) || busy;
    return busy;
  };

  return {
    flagTops: flags.map((f) => f.top), // where the tags hang
    flagHeads: flags.map((f) => f.g.position.clone().setY(HEAD_Y)), // where impulses land
    // Lays the marks out for this frame, with `pxm` screen pixels to a
    // metre where the camera looks; true while something is still landing
    // or pinging, so the engine draws again.
    update(f: Frame, now: number, pxm: number): boolean {
      let busy = false;
      plan.show(f.plan);
      // from afar: dots at least DOT_PX across, at least GAP_PX apart
      plan.u!.scale.value = Math.max(1, DOT_PX / (2 * PLAN_R * pxm));
      plan.u!.every.value = Math.max(1, Math.ceil(GAP_PX / (PLAN_STEP * pxm)));
      pend.show(f.pend);
      front.visible = f.front !== null;
      if (f.front !== null) {
        const r = roadAt(sAtPos(f.front));
        front.position.set(r.x, 0, r.z);
      }
      toggle(first, f.first, now);
      busy = land(first, 0.3, now) || busy;
      busy = ping(first, now) || busy;
      for (const fl of flags) {
        toggle(fl, f.pins, now);
        busy = land(fl, 0.2, now) || busy;
      }
      rings.forEach((r, i) => {
        toggle(r, i < f.rings, now);
        busy = land(r, 0.3, now) || busy;
        busy = ping(r, now) || busy;
      });
      toggle(waves, f.waves, now);
      busy = ping(waves, now) || busy;
      return busy;
    },
  };
}

export type Marks = ReturnType<typeof buildMarks>;
