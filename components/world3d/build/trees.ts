// Trees: poplar rows along the road through the villages and the valley,
// loose trees around them. All of them, together with the ones in yards and
// at the chaikhana, are planted at the end as three instanced meshes.

import { Color, CylinderGeometry, IcosahedronGeometry, InstancedMesh, Matrix4, Quaternion, SphereGeometry, Vector3, type Object3D } from "three";
import { distToRoad, LEN, N, PTS, TANS } from "../route";
import type { Kit } from "./kit";
import { mat } from "./materials";

// Poplars 9.5 m off the centre line on both sides, a gap now and then; not
// in the depots and not on the pass.
export function plantPoplars(k: Kit) {
  for (let s = 30; s < LEN; s += 7) {
    const i = Math.round((s / LEN) * N);
    const p = PTS[i];
    const t = TANS[i];
    if (p.z > 535 || (p.z < -125 && p.z > -545) || p.z < -815) continue;
    if (k.rnd() < 0.1) {
      s += 20;
      continue;
    }
    for (const side of [-1, 1]) {
      const x = p.x - t.z * 9.5 * side;
      const z = p.z + t.x * 9.5 * side;
      if (k.free(x, z, 1)) k.tree(x, z, true);
    }
  }
}

// Loose trees between the houses and fields, `n` tries in each z band.
export function scatterTrees(k: Kit, bands: [number, number][], n: number) {
  for (const [z0, z1] of bands)
    for (let i = 0; i < n; i++) {
      const x = (k.rnd() - 0.5) * 520;
      const z = z0 + k.rnd() * (z1 - z0);
      if (distToRoad(x, z) > 14 && k.free(x, z, 3)) k.tree(x, z, false);
    }
}

export function plantTrees(k: Kit, into: Object3D) {
  const n = k.trees.length;
  // poplars are tall narrow spheres, the others faceted balls; colour per tree
  const poplar = new InstancedMesh(new SphereGeometry(1, 7, 6), mat(0xffffff, { flatShading: true }), n);
  const round = new InstancedMesh(new IcosahedronGeometry(1, 1), mat(0xffffff, { flatShading: true }), n);
  const trunk = new InstancedMesh(new CylinderGeometry(0.22, 0.3, 1, 5), mat(0x7a6247), n);
  const m = new Matrix4();
  const q = new Quaternion();
  const c = new Color();
  const at = new Vector3();
  const size = new Vector3();
  let a = 0;
  let b = 0;
  k.trees.forEach((t, i) => {
    const th = t.poplar ? t.h * 0.3 : t.h * 0.45;
    trunk.setMatrixAt(i, m.compose(at.set(t.x, th / 2, t.z), q, size.set(1, th, 1)));
    if (t.poplar) {
      poplar.setMatrixAt(a, m.compose(at.set(t.x, th + (t.h - th) / 2, t.z), q, size.set(t.r, (t.h - th) / 2, t.r)));
      poplar.setColorAt(a++, c.setHex(t.color));
    } else {
      round.setMatrixAt(b, m.compose(at.set(t.x, t.h * 0.45 + t.r * 0.8, t.z), q, size.set(t.r, t.r * 0.9, t.r)));
      round.setColorAt(b++, c.setHex(t.color));
    }
  });
  poplar.count = a;
  round.count = b;
  for (const o of [poplar, round, trunk]) {
    o.castShadow = o.receiveShadow = true;
    into.add(o);
  }
}
