"use client";

// The map itself: flat, top-down, a limited palette. Everything is generated
// from the layout so it fits any width: the depot in Tashkent, fields with
// poplar rows, the chaikhana, the Kamchik pass drawn with contour lines, the
// cotton valley and the depot in Fergana with its street lamps. The road and
// the track layers sit on top, and over everything the light of the hour:
// the map is the trip's timeline, so morning is at the top and dusk at the
// bottom.

import { memo, useMemo } from "react";
import { anchorOf, CHAPTERS, DEPOT_END, K, OFFLINE_FROM, OFFLINE_TO, STOP } from "./chapters";
import { DASH_SHIFT, dashRanges, minuteAt, type Layout, type Road } from "./road";
import s from "./topdown.module.css";

const C = {
  land: "#efece3",
  concrete: "#e3e1db",
  fence: "#b3ab9d",
  casing: "#cbc4b5",
  road: "#fdfcf9",
  dash: "#dcd5c6",
  shadow: "rgba(40, 46, 56, 0.16)",
  fields: ["#e2e7cc", "#e9e3c8", "#d8e2c0", "#ece6d2", "#dde5c9"],
  cotton: ["#e7ead9", "#e1e7d0", "#eceee2"],
  trees: ["#9db57f", "#8fac72", "#a8bf88", "#87a56b"],
  roofs: ["#d3cfc5", "#cbd3da", "#d9d3c4", "#c8cfd6"],
  hills: ["#e9e2d0", "#e2d8c1", "#d9cdb2", "#cfc1a3", "#c4b594", "#f4f1ea"],
  contour: "rgba(120, 100, 70, 0.32)",
  track: "#2563eb",
  plan: "#64748b",
  pending: "#94a3b8",
  coverage: "#3b82f6",
};

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

type Box = { x: number; y: number; w: number; h: number };
type Building = Box & { fill: string; kind?: "dock" | "office" };
type Field = Box & { fill: string; rows: "h" | "v" | "c" };
type Tree = { x: number; y: number; r: number; fill: string };
type Hill = { levels: string[] };
type Chaikhana = Box & { hall: Box; tapchans: Box[]; vines: Box; trees: Tree[] };

// Light of the hour, laid over the map: [minute, r, g, b, alpha].
const LIGHT: [number, number, number, number, number][] = [
  [460, 120, 150, 215, 0.13], // 07:40, cool morning haze
  [540, 150, 175, 220, 0.05],
  [620, 255, 255, 255, 0], // clear day
  [870, 255, 220, 150, 0.03],
  [960, 255, 170, 90, 0.1], // 16:00, the light turns gold
  [1030, 245, 135, 70, 0.15],
  [1060, 205, 105, 90, 0.18], // 17:40, sunset
  [1100, 70, 65, 115, 0.26], // and dusk below the last bend
];

function lightAt(minute: number): string {
  let j = 1;
  while (j < LIGHT.length - 1 && LIGHT[j][0] < minute) j++;
  const a = LIGHT[j - 1];
  const b = LIGHT[j];
  const u = Math.min(1, Math.max(0, (minute - a[0]) / (b[0] - a[0])));
  const c = a.map((v, i) => v + (b[i] - v) * u);
  return `rgba(${Math.round(c[1])},${Math.round(c[2])},${Math.round(c[3])},${c[4].toFixed(3)})`;
}

const overlaps = (a: Box, b: Box, m = 8) =>
  a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;

// Smooth closed path through points (Catmull-Rom → cubic Bézier).
function closedPath(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

function build(L: Layout, road: Road) {
  const r = rng(2031);
  const Y = (pos: number) => anchorOf(pos) * L.vh;
  const W = L.vw;
  const k = L.k;
  const half = 11 * k; // road casing half width

  // Is the box at least m away from the road?
  const clear = (b: Box, m: number) => {
    if (b.y + b.h < road.y0 - m || b.y > road.y1 + m) return true;
    for (let y = b.y - m; y <= b.y + b.h + m; y += 8) {
      const x = road.xAt(y);
      if (x + half + m > b.x && x - half - m < b.x + b.w) return false;
    }
    return true;
  };

  // ── the chaikhana at the lunch stop, on the outer side of its bend ──────
  // (the "P" and its minutes take the other side)
  const sx = L.bends[STOP];
  const sy = Y(STOP);
  const outLeft = sx < L.roadW / 2;
  const roomOut = (outLeft ? sx : W - sx) - half - 22;
  const cw = Math.min(190 * k, roomOut - 12);
  const ch = 150 * k;
  const cx0 = outLeft ? sx - half - 22 - cw : sx + half + 22;
  const chai: Chaikhana = (() => {
    const box = { x: cx0, y: sy - ch * 0.62, w: cw, h: ch };
    const far = (f: number, w: number) => (outLeft ? box.x + box.w * f : box.x + box.w * (1 - f) - w); // f from the far edge
    const hallW = cw * 0.42;
    const hall = { x: far(0, hallW), y: box.y + ch * 0.06, w: hallW, h: ch * 0.6 };
    const vines = { x: far(0.46, cw * 0.5), y: box.y + ch * 0.02, w: cw * 0.5, h: ch * 0.7 };
    const tw = Math.max(14, cw * 0.17);
    const tapchans = [0, 1, 2].map((j) => ({ x: far(0.5 + (j % 2) * 0.22, tw), y: box.y + ch * (0.1 + j * 0.27), w: tw, h: tw * 0.78 }));
    const trees: Tree[] = [
      { x: far(0.08, 0), y: box.y + ch * 0.86, r: 13 * k, fill: C.trees[1] },
      { x: far(0.38, 0), y: box.y + ch * 0.92, r: 10 * k, fill: C.trees[3] },
      { x: far(0.96, 0), y: box.y + ch * 0.08, r: 9 * k, fill: C.trees[0] },
    ];
    return { ...box, hall, tapchans, vines, trees };
  })();

  const buildings: Building[] = [];
  const fields: Field[] = [];
  const trees: Tree[] = [];
  const parked: Box[] = [];
  const hills: Hill[] = [];
  const grounds: Box[] = [];

  const place = (b: Building, m: number) => {
    if (b.x < 18 || b.x + b.w > W - 18) return false;
    if (!clear(b, m) || overlaps(b, chai, 10)) return false;
    if (buildings.some((o) => overlaps(o, b, 14))) return false;
    buildings.push(b);
    return true;
  };

  // ── depots ──────────────────────────────────────────────────────────────
  const depots = [
    { y0: 0, y1: Y(DEPOT_END), dock: 3, office: 1 },
    { y0: Y(8.62), y1: L.height, dock: 9, office: -1 },
  ];
  for (const dp of depots) {
    grounds.push({ x: 0, y: dp.y0, w: W, h: dp.y1 - dp.y0 });
    // loading dock right beside its bend, doors facing the road
    const dy = Y(dp.dock);
    const bx = L.bends[dp.dock];
    const left = bx < L.roadW / 2;
    const dw = Math.min(260 * k, (left ? bx : W - bx) - half - 46);
    buildings.push({
      x: left ? bx - half - 30 - dw : bx + half + 30,
      y: dy - 0.2 * L.vh,
      w: dw,
      h: 0.4 * L.vh,
      fill: "#cdd6de",
      kind: "dock",
    });
    if (dp.office >= 0) {
      const oy = Y(dp.office);
      const ox = L.bends[dp.office];
      const ol = ox < L.roadW / 2;
      const ow = Math.min(150 * k, (ol ? ox : W - ox) - half - 50);
      buildings.push({ x: ol ? ox - half - 34 - ow : ox + half + 34, y: oy - 50 * k, w: ow, h: 100 * k, fill: "#b9cbe0", kind: "office" });
    }
    for (let tries = 0; tries < 160; tries++) {
      const w = (110 + r() * 170) * k;
      const h = (70 + r() * 60) * k;
      const b = { x: 18 + r() * (W - 36 - w), y: dp.y0 + 30 + r() * (dp.y1 - dp.y0 - 60 - h), w, h, fill: C.roofs[Math.floor(r() * C.roofs.length)] };
      place(b, 40 * k);
    }
    // parked trailers in rows
    for (let tries = 0; tries < 220; tries++) {
      const b = { x: 18 + r() * (W - 40), y: dp.y0 + 20 + r() * (dp.y1 - dp.y0 - 80), w: 13 * k, h: 44 * k };
      if (!clear(b, 26 * k) || buildings.some((o) => overlaps(o, b, 10)) || parked.some((o) => overlaps(o, b, 4))) continue;
      // a row of 3-6 side by side
      const n = 3 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) {
        const t = { ...b, x: b.x + j * 21 * k };
        if (t.x + t.w > W - 18 || !clear(t, 26 * k) || buildings.some((o) => overlaps(o, t, 10))) break;
        parked.push(t);
      }
      if (parked.length > 40) break;
    }
  }

  // ── countryside: field parcels ─────────────────────────────────────────
  const bands: [number, number, "plain" | "cotton"][] = [
    [Y(DEPOT_END) + 30, Y(5.42), "plain"],
    [Y(7.42), Y(8.6), "cotton"],
  ];
  for (const [y0, y1, kind] of bands) {
    let y = y0;
    while (y < y1 - 40) {
      const h = Math.min(y1 - y, (80 + r() * 70) * k);
      let x = -20 + r() * 20;
      while (x < W) {
        const w = (90 + r() * 150) * k;
        const f: Field = {
          x,
          y,
          w: w - 8,
          h: h - 8,
          fill: (kind === "cotton" ? C.cotton : C.fields)[Math.floor(r() * 5) % (kind === "cotton" ? 3 : 5)],
          rows: kind === "cotton" && r() < 0.6 ? "c" : r() < 0.5 ? "h" : "v",
        };
        if (clear(f, 26 * k) && !overlaps(f, chai, 4)) fields.push(f);
        x += w;
      }
      y += h;
    }
  }

  // village around the chaikhana bend
  for (let tries = 0; tries < 90; tries++) {
    const w = (26 + r() * 24) * k;
    const h = (22 + r() * 18) * k;
    const b = { x: r() * W, y: Y(5) - 0.4 * L.vh + r() * 0.8 * L.vh, w, h, fill: C.roofs[Math.floor(r() * 4)] };
    if (!fields.some((f) => overlaps(f, b, -10))) continue;
    place(b, 22 * k);
  }

  // ── the pass: hills drawn as contour lines ─────────────────────────────
  const py0 = Y(5.4);
  const py1 = Y(7.45);
  grounds.push({ x: 0, y: py0, w: W, h: py1 - py0 });
  const centers: [number, number, number][] = [];
  for (let tries = 0; tries < 400 && centers.length < 40; tries++) {
    const R = (70 + r() * 120) * Math.min(1, W / 900 + 0.25);
    const cx = r() * W;
    const cy = py0 + R * 0.6 + r() * (py1 - py0 - R * 1.2);
    if (!clear({ x: cx - R, y: cy - R, w: 2 * R, h: 2 * R }, 18 * k)) continue;
    if (centers.some(([x, y, q]) => Math.hypot(x - cx, y - cy) < (q + R) * 0.75)) continue;
    centers.push([cx, cy, R]);
    const phase = [r() * 6.28, r() * 6.28, r() * 6.28];
    const levels: string[] = [];
    const n = 4 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++) {
      const rr = R * (1 - (j / n) * 0.82);
      const ox = (r() - 0.5) * R * 0.08 * j;
      const oy = (r() - 0.5) * R * 0.08 * j;
      const pts: [number, number][] = [];
      for (let a = 0; a < 26; a++) {
        const t = (a / 26) * Math.PI * 2;
        const q = rr * (1 + 0.16 * Math.sin(3 * t + phase[0]) + 0.09 * Math.sin(5 * t + phase[1]) + 0.05 * Math.sin(8 * t + phase[2]));
        pts.push([cx + ox + Math.cos(t) * q, cy + oy + Math.sin(t) * q * 0.82]);
      }
      levels.push(closedPath(pts));
    }
    hills.push({ levels });
  }

  // ── poplar rows along the road outside the depots and the pass ─────────
  const rows: [number, number][] = [
    [road.lenAt(Y(DEPOT_END) + 40), road.lenAt(Y(5.3))],
    [road.lenAt(Y(7.5)), road.lenAt(Y(8.55))],
  ];
  for (const [l0, l1] of rows) {
    for (let l = l0; l < l1; l += 17 * k) {
      if (r() < 0.12) {
        l += 40 * k;
        continue;
      }
      const p = road.at(l);
      for (const side of [-1, 1]) {
        const off = (half + 11 * k) * side;
        trees.push({ x: p.x + p.nx * off, y: p.y + p.ny * off, r: (4.6 + r() * 2) * k, fill: C.trees[Math.floor(r() * 4)] });
      }
    }
  }
  // loose trees in the fields
  for (let i = 0; i < 260; i++) {
    const f = fields[Math.floor(r() * fields.length)];
    if (!f) break;
    const x = f.x + (r() < 0.5 ? 2 : f.w - 2);
    const y = f.y + r() * f.h;
    trees.push({ x, y, r: (4 + r() * 3) * k, fill: C.trees[Math.floor(r() * 4)] });
  }
  trees.push(...chai.trees);

  // ── street lamps along the road through the Fergana depot ──────────────
  const lamps: { x: number; y: number }[] = [];
  const lampsFrom = road.lenAt(Y(8.55));
  for (let l = lampsFrom, j = 0; l < road.total - 20; l += 120 * k, j++) {
    const p = road.at(l);
    const side = j % 2 ? 1 : -1;
    lamps.push({ x: p.x + p.nx * (half + 9 * k) * side, y: p.y + p.ny * (half + 9 * k) * side });
  }

  // ── light of the hour, sampled down the map (beyond the last bend the
  // clock is stopped, so dusk deepens with the distance) ─────────────────
  const stops: string[] = [];
  const last = L.anchors[K - 1];
  for (let y = 0; y <= L.height + 1; y += L.vh / 3) {
    const minute = y > last ? CHAPTERS[K - 1].minute + ((y - last) / L.vh) * 60 : minuteAt(y, L);
    stops.push(`${lightAt(minute)} ${Math.round(y)}px`);
  }
  const light = `linear-gradient(to bottom, ${stops.join(", ")})`;

  // pending points on the pass (shown only while there is no network)
  const dots: number[] = [];
  const lOff = road.lenAt(Y(OFFLINE_FROM));
  const lOn = road.lenAt(Y(OFFLINE_TO));
  for (let l = lOff + 8; l < lOn; l += 13 * k) dots.push(l);

  // ── coverage: two cell towers either side of the pass ───────────────────
  // The road leaves the first circle exactly where the network drops and
  // enters the second exactly where it comes back, so the map alone shows why
  // the track goes grey. The centre lies along the road's direction at that
  // point, turned by the smallest angle that keeps the mast on screen, clear
  // of the road, and the whole offline stretch outside both circles.
  const R = Math.min(0.42 * L.vh, 0.55 * L.roadW);
  const roadPts: { x: number; y: number }[] = [];
  for (let l = 0; l < road.total; l += 10) roadPts.push(road.at(l));
  const offline = roadPts.filter((_, j) => j * 10 > lOff + 6 && j * 10 < lOn - 6);
  const tower = (l: number, dir: -1 | 1) => {
    const p = road.at(l);
    const sl = road.slopeAt(p.y);
    const n = Math.hypot(sl, 1);
    const tx = sl / n;
    const ty = 1 / n;
    const at = (a: number, R: number) => {
      const ux = tx * Math.cos(a) - ty * Math.sin(a);
      const uy = tx * Math.sin(a) + ty * Math.cos(a);
      return { x: p.x + ux * R * dir, y: p.y + uy * R * dir, R };
    };
    // narrow screens: chapter cards sit right under the truck, keep out of them
    const underCard = (y: number) => !L.wide && L.anchors.some((ay) => y > ay + 30 && y < ay + 360);
    const fits = (c: { x: number; y: number; R: number }) =>
      c.x > 28 && c.x < L.roadW - 28 && !underCard(c.y) &&
      roadPts.every((q) => Math.hypot(q.x - c.x, q.y - c.y) > 40 * k) &&
      offline.every((q) => Math.hypot(q.x - c.x, q.y - c.y) > c.R);
    // a smaller circle only if no turn works at full size
    for (const rr of [R, R * 0.8, R * 0.62]) {
      for (let j = 0; j <= 28; j++) {
        for (const sign of j ? [1, -1] : [1]) {
          const c = at(sign * j * 0.05, rr);
          if (fits(c)) return c;
        }
      }
    }
    return at(0, R);
  };
  const towers = [tower(lOff, -1), tower(lOn, 1)];

  // ── fog over the top of the pass ───────────────────────────────────────
  const fog: { x: number; y: number; rx: number; ry: number }[] = [];
  for (let i = 0; i < 9; i++) {
    fog.push({
      x: r() * W,
      y: Y(6.08) + r() * (Y(6.85) - Y(6.08)),
      rx: (0.22 + r() * 0.2) * W,
      ry: (0.06 + r() * 0.06) * L.vh,
    });
  }

  return { buildings, fields, trees, parked, hills, grounds, dots, half, depots, towers, fog, chai, lamps, light };
}

export type Art = ReturnType<typeof build>;

export const MapArt = memo(function MapArt({ L, road }: { L: Layout; road: Road }) {
  const a = useMemo(() => build(L, road), [L, road]);
  const k = L.k;
  const gate = a.depots[0].y1;
  const gx = road.xAt(gate);

  return (
    <>
      <svg width={L.vw} height={L.height} viewBox={`0 0 ${L.vw} ${L.height}`} aria-hidden>
        <defs>
          <radialGradient id="td-fog">
            <stop offset="0" stopColor="#fbfaf6" stopOpacity="0.85" />
            <stop offset="0.6" stopColor="#fbfaf6" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fbfaf6" stopOpacity="0" />
          </radialGradient>
          <pattern id="td-rows-h" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4h8" stroke="#8a9a5b" strokeOpacity="0.16" strokeWidth="2" />
          </pattern>
          <pattern id="td-rows-v" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M4 0v8" stroke="#8a9a5b" strokeOpacity="0.16" strokeWidth="2" />
          </pattern>
          {/* the planned route shows between these heights (TopDown moves them):
              the road only goes down, so a stretch of it is a band of y */}
          <clipPath id="td-plan" clipPathUnits="userSpaceOnUse">
            <rect data-plan-clip x="0" y="0" width={L.vw} height="0" />
          </clipPath>
          <pattern id="td-vines" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5h10M5 0v10" stroke="#5f8a43" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="2.5" cy="2.5" r="2.2" fill="#7da35a" fillOpacity="0.55" />
            <circle cx="7.5" cy="7.5" r="2" fill="#7da35a" fillOpacity="0.45" />
          </pattern>
          <pattern id="td-cotton" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.6" fill="#fff" />
            <circle cx="7" cy="6.5" r="1.3" fill="#fff" fillOpacity="0.85" />
          </pattern>
        </defs>

        <rect width={L.vw} height={L.height} fill={C.land} />
        <rect x="0" y={a.grounds[2].y} width={L.vw} height={a.grounds[2].h} fill="#e9e3d3" />

        {a.fields.map((f, i) => (
          <g key={i}>
            <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="3" fill={f.fill} />
            <rect
              x={f.x}
              y={f.y}
              width={f.w}
              height={f.h}
              rx="3"
              fill={`url(#${f.rows === "c" ? "td-cotton" : f.rows === "h" ? "td-rows-h" : "td-rows-v"})`}
            />
          </g>
        ))}

        {a.depots.map((d, i) => (
          <g key={i}>
            <rect x="0" y={d.y0} width={L.vw} height={d.y1 - d.y0} fill={C.concrete} />
            <rect
              x="10"
              y={d.y0 + (i ? 10 : -20)}
              width={L.vw - 20}
              height={d.y1 - d.y0 - (i ? 0 : -10)}
              fill="none"
              stroke={C.fence}
              strokeWidth="2"
              strokeDasharray="7 5"
            />
          </g>
        ))}
        {/* gate of the Tashkent depot */}
        <rect x={gx - a.half - 26} y={gate - 22} width={a.half * 2 + 52} height="34" fill={C.concrete} />
        <rect x={gx - a.half - 16} y={gate - 6} width="8" height="12" rx="2" fill="#7b8594" />
        <rect x={gx + a.half + 8} y={gate - 6} width="8" height="12" rx="2" fill="#7b8594" />

        {a.hills.map((h, i) => (
          <g key={i}>
            {h.levels.map((d, j) => (
              <path
                key={j}
                d={d}
                fill={j === h.levels.length - 1 && h.levels.length > 5 ? C.hills[5] : C.hills[Math.min(4, j)]}
                stroke={C.contour}
                strokeWidth="1"
              />
            ))}
          </g>
        ))}

        {a.fog.map((f, i) => (
          <ellipse key={i} cx={f.x} cy={f.y} rx={f.rx} ry={f.ry} fill="url(#td-fog)" />
        ))}

        {a.towers.map((t, i) => (
          <circle
            key={i}
            cx={t.x}
            cy={t.y}
            r={t.R}
            fill={C.coverage}
            fillOpacity="0.07"
            stroke={C.coverage}
            strokeOpacity="0.38"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        ))}

        {a.parked.map((b, i) => (
          <g key={i}>
            <rect x={b.x + 3} y={b.y + 4} width={b.w} height={b.h} rx="2" fill={C.shadow} />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="#f4f6f8" stroke="#b9c3cf" />
            <rect x={b.x + 1} y={b.y + b.h - 11 * k} width={b.w - 2} height={10 * k} rx="2" fill={i % 3 ? "#8b98a8" : "#d9534f"} />
          </g>
        ))}

        {a.buildings.map((b, i) => (
          <g key={i}>
            <rect x={b.x + 5} y={b.y + 7} width={b.w} height={b.h} rx="2" fill={C.shadow} />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill={b.fill} stroke="rgba(0,0,0,0.08)" />
            {b.kind !== "office" && b.w > 60 && (
              <path d={`M${b.x + 4} ${b.y + b.h / 2}h${b.w - 8}`} stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
            )}
            {b.kind === "dock" &&
              Array.from({ length: Math.floor((b.h - 20) / (26 * k)) }, (_, j) => {
                const right = b.x + b.w / 2 < road.xAt(b.y + b.h / 2);
                return (
                  <rect
                    key={j}
                    x={right ? b.x + b.w - 4 : b.x - 4}
                    y={b.y + 14 + j * 26 * k}
                    width="8"
                    height={16 * k}
                    rx="1.5"
                    fill="#5b6675"
                  />
                );
              })}
          </g>
        ))}

        {/* the chaikhana: a hall, tapchans with carpets under a vine trellis */}
        <g>
          <rect x={a.chai.x - 6} y={a.chai.y - 6} width={a.chai.w + 12} height={a.chai.h + 12} rx="8" fill="#e7dfcd" />
          <rect x={a.chai.hall.x + 5} y={a.chai.hall.y + 7} width={a.chai.hall.w} height={a.chai.hall.h} rx="2" fill={C.shadow} />
          <rect x={a.chai.hall.x} y={a.chai.hall.y} width={a.chai.hall.w} height={a.chai.hall.h} rx="2" fill="#f2ead8" stroke="#2f8f9d" strokeWidth={3 * k} />
          <path
            d={`M${a.chai.hall.x + 4} ${a.chai.hall.y + a.chai.hall.h / 2}h${a.chai.hall.w - 8}`}
            stroke="#2f8f9d"
            strokeOpacity="0.45"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {a.chai.tapchans.map((t, i) => (
            <g key={i}>
              <rect x={t.x + 2} y={t.y + 3} width={t.w} height={t.h} rx="1.5" fill={C.shadow} />
              <rect x={t.x} y={t.y} width={t.w} height={t.h} rx="1.5" fill="#9a6b43" />
              <rect x={t.x + 2.5} y={t.y + 2.5} width={t.w - 5} height={t.h - 5} rx="1" fill="#b23a33" />
              <circle cx={t.x + t.w / 2} cy={t.y + t.h / 2} r={Math.min(t.w, t.h) * 0.2} fill="#f6efe2" />
            </g>
          ))}
          <rect x={a.chai.vines.x} y={a.chai.vines.y} width={a.chai.vines.w} height={a.chai.vines.h} rx="4" fill="#8fb36b" fillOpacity="0.38" />
          <rect x={a.chai.vines.x} y={a.chai.vines.y} width={a.chai.vines.w} height={a.chai.vines.h} rx="4" fill="url(#td-vines)" />
        </g>

        {a.trees.map((t, i) => (
          <g key={i}>
            <circle cx={t.x + 2} cy={t.y + 3} r={t.r} fill={C.shadow} />
            <circle cx={t.x} cy={t.y} r={t.r} fill={t.fill} />
          </g>
        ))}

        <path d={road.d} fill="none" stroke={C.casing} strokeWidth={22 * k} strokeLinecap="round" strokeLinejoin="round" />
        <path d={road.d} fill="none" stroke={C.road} strokeWidth={17 * k} strokeLinecap="round" strokeLinejoin="round" />
        <path d={road.d} fill="none" stroke={C.dash} strokeWidth={1.6 * k} strokeDasharray="10 12" />

        {/* the planned route, pickup → dropoff, as the cabinet draws it: grey dots */}
        <path
          d={road.d}
          fill="none"
          stroke={C.plan}
          strokeWidth={4.2 * k}
          strokeLinecap="round"
          strokeDasharray={`0 ${(11 * k).toFixed(1)}`}
          clipPath="url(#td-plan)"
        />

        {/* the track, drawn by TopDown along the same path */}
        <path data-track="casing" d={road.d} fill="none" stroke="#fff" strokeWidth={10 * k} strokeLinecap="round" strokeDasharray={dashRanges([], road.total)} strokeDashoffset={DASH_SHIFT} />
        <path data-track="line" d={road.d} fill="none" stroke={C.track} strokeWidth={5.5 * k} strokeLinecap="round" strokeDasharray={dashRanges([], road.total)} strokeDashoffset={DASH_SHIFT} />
        <g data-track="dots">
          {a.dots.map((l, i) => {
            const p = road.at(l);
            return <circle key={i} data-l={l.toFixed(1)} cx={p.x} cy={p.y} r={3.4 * k} fill={C.pending} stroke="#fff" strokeWidth="1.5" style={{ display: "none" }} />;
          })}
        </g>
        {/* front of the wave that turns the queued points blue (chapter 7) */}
        <g data-track="front" style={{ display: "none" }}>
          <circle r={13 * k} fill={C.track} fillOpacity="0.22" />
          <circle r={5.5 * k} fill={C.track} stroke="#fff" strokeWidth="2" />
        </g>
      </svg>
      {/* masts as HTML so their waves repaint a small box, not the whole map */}
      {a.towers.map((t, i) => (
        <span key={i} className={s.tower} data-tower={i} style={{ left: t.x, top: t.y }}>
          <i />
          <i />
          <i />
          <svg width="26" height="26" viewBox="-13 -13 26 26">
            <circle r="12" fill="#fff" stroke="#334155" strokeWidth="1.5" />
            <path d="M0 -7L6 5H-6Z M0 -7V5 M-3 -1H3 M-4.5 2H4.5" fill="none" stroke="#334155" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cy="-7" r="1.8" fill="#dc2626" />
          </svg>
        </span>
      ))}
      <div className={s.light} style={{ height: L.height, background: a.light }} />
      {/* lamps come on at dusk (data-dusk on the section), one after another */}
      {a.lamps.map((p, i) => (
        <span key={i} className={s.lamp} style={{ left: p.x, top: p.y, transitionDelay: `${(i % 12) * 0.12}s` }}>
          <i />
        </span>
      ))}
    </>
  );
});
