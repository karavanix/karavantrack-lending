// Things along the highway that give the eye its scale: edge lines on
// the asphalt, an aryk (an irrigation ditch) under each poplar row, a power line on concrete poles
// down the whole trip, and a road sign past the Tashkent gate.
//
// None of it draws from the world's random sequence: it only asks where
// the place is free (k.free), so the villages and fields stay where they
// were.

import {
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  type Material,
  type Object3D,
} from "three";
import { iAtZ, LEN, N, PTS, TANS } from "../route";
import { box, type Kit } from "./kit";
import { canvasTex, mat, own, P, sheen } from "./materials";
import { ribbon } from "./ribbon";

const POLE = 0xbdb8ad; // concrete
const WIRE = 0x5b6470;
// The power line runs this far to the left of the way to Fergana, a pole
// every SPAN metres, the wires at these heights.
const LINE_OFF = 17;
const SPAN = 46;
const WIRES = [8.6, 8.6, 7.4];
const WIRE_X = [-1.1, 1.1, 0];

// [from z, to z] where the poplars stand: not in the depots, not on the pass.
const ROWS: [number, number][] = [
  [535, -125],
  [-545, -815],
];

const sampleAt = (s: number) => Math.round((s / LEN) * N);
// samples per baked piece of a strip (~200 m)
const PIECE = 180;

export function buildRoadside(k: Kit, into: Object3D) {
  // aryks: a strip of still water with a darker bank, outside each row
  const water = mat(0xa9bcbc);
  const bank = mat(0xcfc6b2);
  // Strips are baked in pieces, so each lands in its own band of the world
  // (batch.ts) and is skipped with it out of view.
  const strip = (w: number, y: number, m: Material, a: number, b: number, off: number) => {
    for (let i = a; i < b; i += PIECE) k.bake(ribbon(w, y, m, i, Math.min(b, i + PIECE), 24, off), false);
  };
  for (const [z0, z1] of ROWS)
    for (const side of [-1, 1]) {
      strip(1.9, 0.03, bank, iAtZ(z0), iAtZ(z1), side * 12.2);
      strip(0.9, 0.04, water, iAtZ(z0), iAtZ(z1), side * 12.2);
    }
  // solid edge lines on the asphalt
  for (const side of [-1, 1]) strip(0.2, 0.07, mat(P.dash), 12, N - 12, side * 4.05);

  // the power line: poles with a cross-arm, wires sagging between them
  const poles = new Group();
  const tops: [number, number, number, number][] = []; // x, z, and the arm's direction
  for (let s = 40; s < LEN - 40; s += SPAN) {
    const i = sampleAt(s);
    const p = PTS[i];
    if (p.z > 548 || p.z < -828) continue; // inside the depots' fences
    const t = TANS[i];
    const x = p.x + t.z * LINE_OFF;
    const z = p.z - t.x * LINE_OFF;
    if (!k.free(x, z, 1.5)) {
      tops.push([NaN, NaN, 0, 0]); // a gap: no wires across it
      continue;
    }
    const pole = new Mesh(new CylinderGeometry(0.13, 0.2, 9.2, 6), mat(POLE));
    pole.position.set(x, 4.6, z);
    const arm = box(2.8, 0.18, 0.18, 0, 0, 0, 0, sheen(0x6b7684));
    arm.position.set(x, 8.4, z);
    arm.rotation.y = Math.atan2(t.x, t.z); // across the road
    poles.add(pole, arm);
    tops.push([x, z, -t.z, t.x]);
  }
  k.bake(poles);

  const pos: number[] = [];
  const SAG = 6;
  for (let j = 1; j < tops.length; j++) {
    const [ax, az, adx, adz] = tops[j - 1];
    const [bx, bz, bdx, bdz] = tops[j];
    if (Number.isNaN(ax) || Number.isNaN(bx)) continue;
    WIRES.forEach((h, w) => {
      const a = [ax + adx * WIRE_X[w], az + adz * WIRE_X[w]];
      const b = [bx + bdx * WIRE_X[w], bz + bdz * WIRE_X[w]];
      for (let q = 0; q < SAG; q++) {
        for (const u of [q / SAG, (q + 1) / SAG])
          pos.push(a[0] + (b[0] - a[0]) * u, h - 0.9 * 4 * u * (1 - u), a[1] + (b[1] - a[1]) * u);
      }
    });
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  const wires = new LineSegments(g, own(new LineBasicMaterial({ color: WIRE, transparent: true, opacity: 0.7 })));
  wires.name = "wires";
  into.add(wires);

  // a route sign past the Tashkent gate, facing the camera that looks back
  const face = canvasTex(128, 64, (c) => {
    c.fillStyle = "#2f5fa8";
    c.fillRect(0, 0, 128, 64);
    c.strokeStyle = "#f4f6f8";
    c.lineWidth = 5;
    c.strokeRect(6, 6, 116, 52);
    c.fillStyle = "#f4f6f8";
    c.fillRect(22, 22, 60, 6);
    c.fillRect(22, 36, 84, 6);
  });
  const i = iAtZ(470);
  const p = PTS[i];
  const t = TANS[i];
  const sx = p.x + t.z * 7.5;
  const sz = p.z - t.x * 7.5;
  const sign = new Group();
  const front = new Mesh(new PlaneGeometry(4.2, 2.1), own(new MeshLambertMaterial({ map: face })));
  front.position.set(0, 4.2 + 1.05, 0.07);
  sign.add(box(4.2, 2.1, 0.12, 0, 0, 4.2, 0, sheen(0x8b95a3)), front);
  for (const dx of [-1.4, 1.4]) sign.add(box(0.14, 3.2, 0.14, 0, dx, 0, 0, sheen(0x8b95a3)));
  sign.position.set(sx, 0, sz);
  sign.rotation.y = Math.atan2(t.x, t.z);
  k.bake(sign);

  return wires;
}
