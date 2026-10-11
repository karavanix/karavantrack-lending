// A depot: concrete yard behind a fence, a gate with a raised barrier, a
// warehouse with its dock doors facing the road, an office, rows of parked
// trailers and lamps along the road inside. Tashkent at the start, Fergana
// at the end; the road runs through the yard to the dock.

import { ExtrudeGeometry, Group, Mesh, PlaneGeometry, Shape } from "three";
import { iAtZ, PTS } from "../route";
import { box, type Kit } from "./kit";
import { glow, mat, P } from "./materials";

export type DepotPlan = {
  z0: number; // fence on the far side
  z1: number; // fence on the gate side
  gateZ: number;
  wx0: number; // warehouse
  wx1: number;
  wz0: number;
  wz1: number;
  ox: number; // office
  oz: number;
  parkX0: number; // trailer rows
  parkX1: number;
  parkZ0: number;
  parkZ1: number;
  lampsFrom: number; // lamps every 22 m, from → to in z
  lampsTo: number;
};

export const TASHKENT: DepotPlan = {
  z0: 700, z1: 548, gateZ: 548, wx0: 14, wx1: 46, wz0: 690, wz1: 600, ox: -45, oz: 610,
  parkX0: -100, parkX1: -60, parkZ0: 630, parkZ1: 690, lampsFrom: 690, lampsTo: 560,
};
export const FERGANA: DepotPlan = {
  z0: -828, z1: -990, gateZ: -828, wx0: -44, wx1: -13, wz0: -955, wz1: -870, ox: 45, oz: -900,
  parkX0: 60, parkX1: 100, parkZ0: -980, parkZ1: -930, lampsFrom: -840, lampsTo: -935,
};

const FENCE = 0xb3ab9d;

// The lamp posts along the road through a yard, [x, z] of their foot; the
// head hangs 1.3 m towards the road at 6.85 m (its pool of light, lights.ts).
export function lampsOf(d: DepotPlan): [number, number][] {
  const out: [number, number][] = [];
  const dir = Math.sign(d.lampsTo - d.lampsFrom);
  for (let z = d.lampsFrom; dir * (d.lampsTo - z) > 0; z += dir * 22) out.push([PTS[iAtZ(z)].x - 8, z]);
  return out;
}

export function buildDepot(k: Kit, d: DepotPlan) {
  const { z0, z1, gateZ, wx0, wx1, wz0, wz1, ox, oz } = d;
  const g = new Group();
  const yard = new Mesh(new PlaneGeometry(260, z1 - z0), mat(P.concrete));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, 0.015, (z0 + z1) / 2);
  k.bake(yard, false);

  // fence, broken for the gate
  for (let x = -128; x < 128; x += 5)
    for (const z of [z0, z1]) if (!(z === gateZ && Math.abs(x) < 16)) g.add(box(3.4, 1.8, 0.25, FENCE, x + 1.7, 0, z));
  for (let z = Math.min(z0, z1); z < Math.max(z0, z1); z += 5) for (const x of [-130, 130]) g.add(box(0.25, 1.8, 3.4, FENCE, x, 0, z + 1.7));
  // gate: booth and a raised barrier
  g.add(box(3.2, 2.8, 3.2, 0xe8e2d4, -12, 0, gateZ), box(4, 0.3, 4, 0x8a96a8, -12, 2.8, gateZ));
  g.add(box(0.3, 9, 0.3, 0xd9534f, -9.5, 0.9, gateZ));

  // warehouse: gable metal roof, dock doors facing the road
  const ww = wx1 - wx0;
  const wd = Math.abs(wz1 - wz0);
  const wcx = (wx0 + wx1) / 2;
  const wcz = (wz0 + wz1) / 2;
  g.add(box(ww, 9, wd, 0xe9e4d8, wcx, 0, wcz));
  const s = new Shape();
  s.moveTo(-ww / 2 - 0.6, 0);
  s.lineTo(ww / 2 + 0.6, 0);
  s.lineTo(0, 4.5);
  s.closePath();
  const roof = new Mesh(new ExtrudeGeometry(s, { depth: wd + 1.2, bevelEnabled: false }), mat(0xc5ced8, { flatShading: true }));
  roof.position.set(wcx, 9, wcz - wd / 2 - 0.6);
  g.add(roof);
  const doorX = Math.abs(wx0) < Math.abs(wx1) ? wx0 - 0.06 : wx1 + 0.06;
  const out = -Math.sign(wcx); // towards the road
  for (let z = Math.min(wz0, wz1) + 8; z < Math.max(wz0, wz1) - 6; z += 12) {
    g.add(box(0.12, 4.2, 4.6, 0x5b6675, doorX, 0.6, z));
    g.add(box(0.3, 0.5, 5.4, 0x2b2f36, doorX + out * 0.2, 0.5, z)); // bumper
    g.add(box(0.3, 0.5, 0.6, 0xf2c94c, doorX + out * 0.2, 0.5, z - 2.9), box(0.3, 0.5, 0.6, 0xf2c94c, doorX + out * 0.2, 0.5, z + 2.9));
  }

  // office with windows
  g.add(box(22, 8, 14, 0xdbe4ee, ox, 0, oz), box(22.6, 0.5, 14.6, 0xb9cbe0, ox, 8, oz));
  for (let i = 0; i < 5; i++)
    for (const fl of [1.6, 5]) for (const sz of [-1, 1]) g.add(box(2.2, 1.6, 0.1, 0, ox - 8.8 + i * 4.4, fl, oz + sz * 7.03, glow.window));

  // parked trailers in rows, a few gaps
  for (let x = d.parkX0; x < d.parkX1; x += 4.5)
    for (let z = d.parkZ0; z < d.parkZ1; z += 18) {
      if (k.rnd() < 0.18) continue;
      g.add(box(2.5, 3.4, 12, 0xf4f6f8, x, 0.9, z));
      g.add(box(2.52, 0.6, 2, k.rnd() < 0.3 ? 0xd9534f : 0x8b98a8, x, 2.4, z + 5));
      g.add(box(2, 0.9, 11, 0x2b3340, x, 0, z));
    }

  // lamps along the road inside the yard
  for (const [x, z] of lampsOf(d))
    g.add(box(0.25, 7, 0.25, 0x4b5563, x, 0, z), box(1.6, 0.25, 0.4, 0x4b5563, x + 0.7, 7, z), box(0.8, 0.25, 0.7, 0, x + 1.3, 6.85, z, glow.lamp));

  k.bake(g);
  k.take(0, (z0 + z1) / 2, Math.abs(z1 - z0) / 2);
}
