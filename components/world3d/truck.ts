// The truck, nose towards −z: a cab-over tractor and a box trailer in the
// carrier's blue. Still low-poly, but shaped: the cab is drawn as a side
// profile (sloping windscreen, a fairing on the roof) and extruded across
// with its edges chamfered; a grille, a bumper, a step, wheel arches, wheels
// with hubs, a fuel tank and an exhaust; the trailer has corner posts,
// rails, rear doors and side guards. Painted parts are metal with a little
// sheen (materials.ts). Everything is merged per material (about ten draw
// calls) into one group that moves as a whole, with a soft dark patch on
// the ground under it.

import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  type Material,
} from "three";
import { createBatch } from "./build/batch";
import { box } from "./build/kit";
import { mat, P, sheen } from "./build/materials";
import { contactMaterial } from "./build/trees";

const W = 2.5; // cab width
const DARK = 0x1b2430;
const STEEL = 0xc9ced6;

// A flat shape in the truck's side plane (z forward-back, y up), extruded
// across x by `w` and centred; `bevel` chamfers its outline.
function side(pts: [number, number][], w: number, m: Material, bevel = 0) {
  const s = new Shape();
  pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: w - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1 });
  // shape x → z, extrusion → −x
  g.rotateY(-Math.PI / 2).translate(w / 2 - bevel, 0, 0);
  return new Mesh(g, m);
}

export function buildTruck(): Group {
  const parts = new Group();
  const lights = new Group();
  const add = (...o: Mesh[]) => void parts.add(...o);
  const blue = sheen(P.blue, { roughness: 0.35 });
  const white = sheen(0xf5f7f9, { roughness: 0.5 });
  const glass = sheen(0x1b2a3d, { roughness: 0.15 });

  // chassis and the fifth wheel under the trailer's nose
  add(box(2.0, 0.45, 11.2, DARK, 0, 0.7, 0.35));

  // the cab: rear, floor, nose, windscreen up and back, roof with fairing
  add(
    side(
      [[-2.75, 0.95], [-5.4, 0.95], [-5.5, 2.15], [-5.4, 2.3], [-5.0, 3.45], [-4.75, 3.62], [-3.4, 3.7], [-2.9, 4.2], [-2.75, 4.2]],
      W,
      blue,
      0.12,
    ),
  );
  // windscreen and side windows, a hair proud of the cab
  // (the chamfer puts the cab's skin BEVEL outside its profile)
  const ws = box(2.18, 1.2, 0.05, 0, 0, 0, 0, glass);
  ws.position.set(0, 2.92, -5.33);
  ws.rotation.x = Math.atan2(0.4, 1.15);
  add(ws);
  for (const sx of [-1, 1]) {
    const win = side([[-5.25, 2.35], [-4.9, 3.36], [-3.95, 3.36], [-3.95, 2.35]], 0.04, glass);
    win.position.x = sx * (W / 2 + 0.01);
    add(win);
    // door line and handle
    add(box(0.03, 1.85, 0.05, 0, sx * (W / 2 + 0.015), 1.0, -3.85, mat(0x13427f)));
    add(box(0.05, 0.06, 0.32, DARK, sx * (W / 2 + 0.03), 2.1, -4.1));
    // mirror on its arm
    add(box(0.5, 0.05, 0.05, DARK, sx * 1.45, 3.05, -5.15), box(0.1, 0.55, 0.22, DARK, sx * 1.68, 2.75, -5.15));
    // step under the door
    add(box(0.35, 0.08, 0.7, DARK, sx * 1.12, 0.55, -4.3));
  }
  // grille, bumper, headlights
  add(box(1.6, 0.75, 0.06, DARK, 0, 1.25, -5.66));
  for (let i = 0; i < 3; i++) add(box(1.5, 0.06, 0.04, 0x55667a, 0, 1.38 + i * 0.22, -5.7));
  add(box(2.5, 0.42, 0.28, 0x2b3340, 0, 0.55, -5.66));
  const head = new MeshBasicMaterial({ color: 0xfff3c4 });
  const tail = new MeshBasicMaterial({ color: 0xdc2626 });
  for (const sx of [-1, 1]) {
    const l = new Mesh(new BoxGeometry(0.42, 0.24, 0.06), head);
    l.position.set(sx * 0.95, 1.12, -5.68);
    const r = new Mesh(new BoxGeometry(0.3, 0.22, 0.06), tail);
    r.position.set(sx * 1.0, 1.2, 6.13);
    lights.add(l, r);
  }
  // fuel tank on the left, exhaust behind the cab on the right
  const tank = new Mesh(new CylinderGeometry(0.34, 0.34, 1.3, 10).rotateX(Math.PI / 2), sheen(STEEL, { roughness: 0.3 }));
  tank.position.set(-1.08, 0.75, -2.0);
  const pipe = new Mesh(new CylinderGeometry(0.08, 0.08, 3.1, 6), sheen(STEEL, { roughness: 0.3 }));
  pipe.position.set(1.12, 2.45, -2.45);
  add(tank, pipe);

  // the trailer: body, livery, roof ribs, corner posts, rails, rear doors
  add(box(2.55, 3.3, 8.4, 0, 0, 1.15, 1.9, white));
  add(box(2.6, 0.55, 8.2, 0, 0, 2.3, 1.9, blue));
  add(box(0.7, 0.06, 7.8, 0, 0, 4.45, 1.9, blue));
  for (let i = 0; i < 6; i++) add(box(2.58, 0.05, 0.12, 0xdfe5ec, 0, 4.45, -1.6 + i * 1.4));
  const rail = sheen(0xb8c0cc, { roughness: 0.4 });
  for (const sx of [-1, 1]) {
    for (const z of [-2.3, 6.1]) add(box(0.1, 3.32, 0.1, 0, sx * 1.27, 1.14, z, rail));
    add(box(0.08, 0.16, 8.4, 0, sx * 1.28, 1.12, 1.9, rail), box(0.08, 0.1, 8.4, 0, sx * 1.28, 4.36, 1.9, rail));
    // side guard between the cab and the trailer wheels
    add(box(0.05, 0.08, 3.6, 0, sx * 1.2, 0.55, 0.1, rail), box(0.05, 0.08, 3.6, 0, sx * 1.2, 0.85, 0.1, rail));
  }
  add(box(0.06, 3.1, 0.04, DARK, 0, 1.25, 6.12));
  for (const sx of [-0.6, 0.6]) add(box(0.05, 2.6, 0.05, 0x8b95a3, sx, 1.5, 6.13));

  // wheels: tyre, hub, cap; arches over the front ones, guards over the rear
  const tyre = new CylinderGeometry(0.55, 0.55, 0.45, 14).rotateZ(Math.PI / 2);
  const hub = new CylinderGeometry(0.3, 0.3, 0.47, 10).rotateZ(Math.PI / 2);
  const cap = new CylinderGeometry(0.1, 0.1, 0.5, 6).rotateZ(Math.PI / 2);
  for (const z of [-4.3, 2.6, 4.0])
    for (const sx of [-1, 1]) {
      const t = new Mesh(tyre, mat(DARK));
      const h = new Mesh(hub, sheen(STEEL, { roughness: 0.3 }));
      const c = new Mesh(cap, mat(0x4b5563));
      for (const o of [t, h, c]) o.position.set(sx * 1.1, 0.55, z);
      add(t, h, c);
    }
  const arch = new CylinderGeometry(0.72, 0.72, 0.5, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) {
    const a = new Mesh(arch, mat(DARK, { side: DoubleSide }));
    a.position.set(sx * 1.08, 0.6, -4.3);
    add(a);
    add(box(0.5, 0.06, 2.3, DARK, sx * 1.08, 1.22, 3.3));
  }

  const b = createBatch(false);
  b.bake(parts);
  b.bake(lights, false);
  // the patch under it, as under the trees
  const under = new Mesh(new PlaneGeometry(4, 14).rotateX(-Math.PI / 2), contactMaterial());
  under.position.set(0, 0.1, 0.3);
  under.renderOrder = 1;
  b.bake(under, false);
  const g = new Group();
  for (const _ of b.flush(g));
  return g;
}
