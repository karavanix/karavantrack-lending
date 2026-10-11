// The chaikhana where the truck stops for lunch (chapter 5): a hall with a
// turquoise eave, a canopy on posts overgrown with vine, three tapchans with
// tea on them, a yard and trees. It stands on the right of the road where
// the truck pulls over.

import { CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, Matrix4, Mesh, PlaneGeometry, Quaternion, Vector3, type Object3D } from "three";
import { box, type Kit } from "./kit";
import { glow, mat, sheen } from "./materials";

export const CHAI = { x: 81, z: 82 };
// Kept clear of houses, fields and trees before anything else is laid out.
export const CHAI_R = 26;

const WOOD = 0x7a5a3a;

export function buildChaikhana(k: Kit, into: Object3D) {
  const yard = new Mesh(new PlaneGeometry(40, 32), mat(0xe7dfcd));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(CHAI.x, 0.04, CHAI.z);
  k.bake(yard, false);

  const h = new Group();
  // the hall
  h.add(box(13, 5, 18, 0xf2ead8, 10, 0, 0), box(13.6, 0.5, 18.6, 0, 10, 5, 0, sheen(0x2f8f9d)), box(12.4, 0.15, 17.4, 0xe6dcc6, 10, 5.3, 0));
  for (let i = 0; i < 4; i++) h.add(box(0.12, 2.6, 1.6, 0, 3.45, 1, -6 + i * 4, glow.window));
  // the canopy: posts and a lattice of beams
  const tx = -6;
  const tw = 16;
  const td = 24;
  const th = 3.6;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 5; j++) {
      const p = new Mesh(new CylinderGeometry(0.13, 0.13, th, 6), mat(WOOD));
      p.position.set(tx - tw / 2 + (tw / 3) * i, th / 2, -td / 2 + (td / 4) * j);
      h.add(p);
    }
  for (let j = 0; j <= 8; j++) h.add(box(tw, 0.12, 0.12, WOOD, tx, th, -td / 2 + (td / 8) * j));
  for (let i = 0; i <= 5; i++) h.add(box(0.12, 0.12, td, WOOD, tx - tw / 2 + (tw / 5) * i, th, 0));
  const leaves: [number, number, number][] = [];
  for (let i = 0; i < 300; i++) leaves.push([CHAI.x + tx - tw / 2 + k.rnd() * tw, th + 0.12, CHAI.z - td / 2 + k.rnd() * td]);
  // tapchans: platform, carpet, low table, a tray
  for (const [x, z] of [[-9, -7], [-3, 0], [-9, 7]]) {
    h.add(
      box(4.2, 0.6, 3.4, 0x8a5a36, x, 0, z),
      box(3.6, 0.12, 2.8, 0xb23a33, x, 0.6, z),
      box(1.2, 0.35, 0.9, 0x6d4529, x, 0.72, z),
      box(0.5, 0.15, 0.5, 0xf6efe2, x, 1.07, z),
    );
  }
  h.position.set(CHAI.x, 0, CHAI.z);
  k.bake(h);
  k.tree(CHAI.x + 17, CHAI.z + 13, false);
  k.tree(CHAI.x - 16, CHAI.z + 14, false);
  k.tree(CHAI.x + 16, CHAI.z - 13, false);

  // the vine on the canopy: flat faceted clumps, their shadow a dappled
  // lattice on the tapchans
  const vine = new InstancedMesh(new IcosahedronGeometry(0.55, 0), mat(0x86ad62, { flatShading: true }), leaves.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const s = new Vector3(1, 0.35, 1);
  const at = new Vector3();
  leaves.forEach(([x, y, z], i) => vine.setMatrixAt(i, m.compose(at.set(x, y, z), q, s)));
  vine.castShadow = vine.receiveShadow = true;
  into.add(vine);
}
