// The truck as in the probe: a box model, nose towards −z. Session 6 gives
// it a real cab shape. Its thirty boxes are merged per material (eight draw
// calls instead of thirty) into one group that moves as a whole.

import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { createBatch } from "./build/batch";
import { box } from "./build/kit";
import { mat, P } from "./build/materials";

export function buildTruck(): Group {
  const parts = new Group();
  const lights = new Group();
  const add = (o: Mesh) => void parts.add(o);
  add(box(2.2, 0.5, 11.4, 0x2b3340, 0, 0.75, 0.3)); // chassis
  add(box(2.55, 3.3, 8.4, 0xf5f7f9, 0, 1.15, 1.9)); // trailer
  add(box(2.6, 0.55, 8.2, P.blue, 0, 2.3, 1.9));
  add(box(0.7, 0.06, 7.8, P.blue, 0, 4.45, 1.9));
  for (let i = 0; i < 6; i++) add(box(2.58, 0.05, 0.12, 0xdfe5ec, 0, 4.45, -1.6 + i * 1.4));
  add(box(2.5, 2.4, 2.7, P.blue, 0, 1.0, -4.15)); // cab
  add(box(2.3, 0.5, 2.1, 0x1563c9, 0, 3.4, -4.0));
  add(box(2.3, 1.05, 0.08, 0x1b2a3d, 0, 2.15, -5.52)); // windscreen
  for (const sx of [-1, 1]) add(box(0.08, 0.85, 1.2, 0x1b2a3d, sx * 1.26, 2.25, -4.6));
  for (const sx of [-1, 1]) add(box(0.12, 0.5, 0.2, 0x1b2430, sx * 1.42, 2.4, -5.3)); // mirrors
  add(box(2.3, 0.5, 0.1, 0x1b2430, 0, 1.0, -5.55)); // bumper
  const head = new MeshBasicMaterial({ color: 0xfff3c4 });
  const tail = new MeshBasicMaterial({ color: 0xdc2626 });
  for (const sx of [-1, 1]) {
    const l = new Mesh(new BoxGeometry(0.45, 0.28, 0.06), head);
    l.position.set(sx * 0.85, 1.25, -5.58);
    const r = new Mesh(new BoxGeometry(0.3, 0.25, 0.06), tail);
    r.position.set(sx * 1.0, 1.4, 6.12);
    lights.add(l, r);
  }
  const wheel = new CylinderGeometry(0.55, 0.55, 0.45, 14);
  wheel.rotateZ(Math.PI / 2);
  for (const z of [-4.3, 2.6, 4.0])
    for (const sx of [-1, 1]) {
      const w = new Mesh(wheel, mat(0x1b2430));
      w.position.set(sx * 1.1, 0.55, z);
      add(w);
    }
  const b = createBatch();
  b.bake(parts);
  b.bake(lights, false);
  const g = new Group();
  for (const _ of b.flush(g));
  return g;
}
