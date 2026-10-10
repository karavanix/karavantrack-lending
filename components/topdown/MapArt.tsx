"use client";

// The map itself: flat, top-down, a limited palette. Everything is generated
// from the layout so it fits any width: the depot in Tashkent, fields with
// poplar rows, the Kamchik pass drawn with contour lines, the cotton valley
// and the depot in Fergana. The road and the track layers sit on top.
//
// Places only get rough shapes here; each chapter's session dresses its own.

import { memo, useMemo } from "react";
import { anchorOf, DEPOT_END, OFFLINE_FROM, OFFLINE_TO } from "./chapters";
import type { Layout, Road } from "./road";

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
  pending: "#94a3b8",
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

  const buildings: Building[] = [];
  const fields: Field[] = [];
  const trees: Tree[] = [];
  const parked: Box[] = [];
  const hills: Hill[] = [];
  const grounds: Box[] = [];

  const place = (b: Building, m: number) => {
    if (b.x < 18 || b.x + b.w > W - 18) return false;
    if (!clear(b, m)) return false;
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
        if (clear(f, 26 * k)) fields.push(f);
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

  // pending points on the pass (shown only while there is no network)
  const dots: number[] = [];
  const lOff = road.lenAt(Y(OFFLINE_FROM));
  const lOn = road.lenAt(Y(OFFLINE_TO));
  for (let l = lOff + 8; l < lOn; l += 13 * k) dots.push(l);

  return { buildings, fields, trees, parked, hills, grounds, dots, half, depots };
}

export type Art = ReturnType<typeof build>;

export const MapArt = memo(function MapArt({ L, road }: { L: Layout; road: Road }) {
  const a = useMemo(() => build(L, road), [L, road]);
  const k = L.k;
  const gate = a.depots[0].y1;
  const gx = road.xAt(gate);

  return (
    <svg width={L.vw} height={L.height} viewBox={`0 0 ${L.vw} ${L.height}`} aria-hidden>
      <defs>
        <pattern id="td-rows-h" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4h8" stroke="#8a9a5b" strokeOpacity="0.16" strokeWidth="2" />
        </pattern>
        <pattern id="td-rows-v" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M4 0v8" stroke="#8a9a5b" strokeOpacity="0.16" strokeWidth="2" />
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

      {a.trees.map((t, i) => (
        <g key={i}>
          <circle cx={t.x + 2} cy={t.y + 3} r={t.r} fill={C.shadow} />
          <circle cx={t.x} cy={t.y} r={t.r} fill={t.fill} />
        </g>
      ))}

      <path d={road.d} fill="none" stroke={C.casing} strokeWidth={22 * k} strokeLinecap="round" strokeLinejoin="round" />
      <path d={road.d} fill="none" stroke={C.road} strokeWidth={17 * k} strokeLinecap="round" strokeLinejoin="round" />
      <path d={road.d} fill="none" stroke={C.dash} strokeWidth={1.6 * k} strokeDasharray="10 12" />

      {/* the track, drawn by TopDown along the same path */}
      <path data-track="casing" d={road.d} fill="none" stroke="#fff" strokeWidth={10 * k} strokeLinecap="round" strokeDasharray={`0 ${road.total + 1}`} />
      <path data-track="line" d={road.d} fill="none" stroke={C.track} strokeWidth={5.5 * k} strokeLinecap="round" strokeDasharray={`0 ${road.total + 1}`} />
      <g data-track="dots">
        {a.dots.map((l, i) => {
          const p = road.at(l);
          return <circle key={i} data-l={l.toFixed(1)} cx={p.x} cy={p.y} r={3.4 * k} fill={C.pending} stroke="#fff" strokeWidth="1.5" style={{ display: "none" }} />;
        })}
      </g>
    </svg>
  );
});
