// Villages along the road: one-storey houses with flat or gable roofs,
// windows on the long sides, every other one with a walled yard and a tree.

import { ExtrudeGeometry, Group, Mesh, Shape } from "three";
import { distToRoad } from "../route";
import { box, type Kit } from "./kit";
import { glow, mat, P } from "./materials";

function house(k: Kit, x: number, z: number, w: number, d: number, h: number, rotY: number) {
  const g = new Group();
  g.add(box(w, h, d, k.pick(P.walls), 0, 0, 0));
  if (k.rnd() < 0.6) {
    // flat roof with a parapet
    g.add(box(w + 0.4, 0.5, d + 0.4, 0xd9cfbb, 0, h, 0), box(w - 1, 0.1, d - 1, 0xcfc4ad, 0, h + 0.5, 0));
  } else {
    const s = new Shape();
    s.moveTo(-w / 2 - 0.4, 0);
    s.lineTo(w / 2 + 0.4, 0);
    s.lineTo(0, Math.min(w, 8) * 0.35);
    s.closePath();
    const r = new Mesh(new ExtrudeGeometry(s, { depth: d + 0.8, bevelEnabled: false }), mat(k.pick(P.roofs), { flatShading: true }));
    r.position.set(0, h, -d / 2 - 0.4);
    g.add(r);
  }
  for (const sz of [-1, 1]) {
    const n = Math.max(1, Math.floor(w / 4));
    for (let i = 0; i < n; i++) g.add(box(1.1, 1.2, 0.1, 0, -w / 2 + (w / n) * (i + 0.5), h * 0.45, sz * (d / 2 + 0.03), glow.window));
  }
  if (k.rnd() < 0.5) {
    const yd = 6 + k.rnd() * 4;
    const c = 0xe0d6c2;
    g.add(box(w, 1.6, 0.4, c, 0, 0, d / 2 + yd), box(0.4, 1.6, yd, c, -w / 2, 0, d / 2 + yd / 2), box(0.4, 1.6, yd, c, w / 2, 0, d / 2 + yd / 2));
    // a tree in the yard, turned with the house
    const lx = (k.rnd() - 0.5) * w * 0.6;
    const lz = d / 2 + yd / 2;
    k.tree(x + lx * Math.cos(rotY) + lz * Math.sin(rotY), z - lx * Math.sin(rotY) + lz * Math.cos(rotY), false);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  k.bake(g);
}

// Up to `count` houses between z0 and z1, near the road but not on it.
export function buildVillage(k: Kit, z0: number, z1: number, count: number) {
  for (let tries = 0, n = 0; tries < count * 14 && n < count; tries++) {
    const x = (k.rnd() - 0.5) * 330;
    const z = z0 + k.rnd() * (z1 - z0);
    const w = 7 + k.rnd() * 6;
    const d = 6 + k.rnd() * 4;
    const r = Math.hypot(w, d) / 2 + 6;
    const dr = distToRoad(x, z);
    if (dr < r + 8 || dr > 120 || !k.free(x, z, r)) continue;
    k.take(x, z, r);
    const h = 3.2 + k.rnd() * 2.2;
    const rotY = Math.round(k.rnd() * 3) * (Math.PI / 2) + (k.rnd() - 0.5) * 0.2;
    house(k, x, z, w, d, h, rotY);
    n++;
  }
}
