// Trees: poplar rows along the road through the villages and the valley,
// loose trees around them. All of them, together with the ones in yards and
// at the chaikhana, are planted at the end as instanced meshes.
//
// Shapes with edges rather than balls: a round tree is a crown of three
// faceted clumps, a poplar a tall spindle with a point. Each tree is turned
// its own way (by a hash of where it stands: the world's random sequence
// must not move). A soft dark patch under each one sets it on the ground.

import {
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { distToRoad, LEN, N, PTS, TANS } from "../route";
import type { Kit } from "./kit";
import { mat, own } from "./materials";

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

// 0…1 from a place, the same every time.
export const hash = (x: number, z: number) => {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return h - Math.floor(h);
};

// A crown of three clumps in a unit ball: a big one and two smaller ones
// leaning out at different heights, so the outline is uneven.
function crown(): BufferGeometry {
  const parts = [
    [0, 0.05, 0, 0.82],
    [0.42, -0.22, 0.18, 0.6],
    [-0.3, 0.12, -0.38, 0.58],
  ].map(([x, y, z, r]) => new IcosahedronGeometry(r, 0).translate(x, y, z));
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  g.computeVertexNormals();
  return g;
}

// A poplar: a spindle widest a third of the way up, pointed at the top,
// six-sided (y from −1 to 1, radius 1 at the widest).
function spindle(): BufferGeometry {
  const prof = [[0, -1], [0.55, -0.9], [0.95, -0.55], [1, -0.25], [0.85, 0.2], [0.55, 0.62], [0.22, 0.9], [0, 1]];
  return new LatheGeometry(prof.map(([r, y]) => new Vector2(r, y)), 6).toNonIndexed();
}

function patchTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.5, "rgba(255,255,255,0.6)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = own(new CanvasTexture(c));
  t.colorSpace = SRGBColorSpace;
  return t;
}

// The dark patch under a tree or the truck: a soft round spot, darkening
// what is under it.
export const contactMaterial = () =>
  own(new MeshBasicMaterial({ color: 0x3d3a30, map: patchTexture(), transparent: true, opacity: 0.32, depthWrite: false }));

export function plantTrees(k: Kit, into: Object3D) {
  const n = k.trees.length;
  const poplar = new InstancedMesh(spindle(), mat(0xffffff, { flatShading: true }), n);
  const round = new InstancedMesh(crown(), mat(0xffffff, { flatShading: true }), n);
  const trunk = new InstancedMesh(new CylinderGeometry(0.22, 0.3, 1, 5), mat(0x7a6247), n);
  const patch = new InstancedMesh(new PlaneGeometry(2, 2).rotateX(-Math.PI / 2), contactMaterial(), n);
  const m = new Matrix4();
  const q = new Quaternion();
  const turn = new Quaternion();
  const c = new Color();
  const at = new Vector3();
  const size = new Vector3();
  const up = new Vector3(0, 1, 0);
  let a = 0;
  let b = 0;
  k.trees.forEach((t, i) => {
    const th = t.poplar ? t.h * 0.3 : t.h * 0.45;
    const hz = hash(t.x, t.z);
    turn.setFromAxisAngle(up, hz * Math.PI * 2);
    trunk.setMatrixAt(i, m.compose(at.set(t.x, th / 2, t.z), q, size.set(1, th, 1)));
    patch.setMatrixAt(i, m.compose(at.set(t.x, 0.1, t.z), q, size.setScalar(t.poplar ? t.r * 1.5 : t.r * 1.15)));
    // a little lighter or darker than its neighbours
    c.setHex(t.color).multiplyScalar(0.92 + 0.16 * hash(t.z, t.x));
    if (t.poplar) {
      poplar.setMatrixAt(a, m.compose(at.set(t.x, th + (t.h - th) / 2, t.z), turn, size.set(t.r, (t.h - th) / 2, t.r)));
      poplar.setColorAt(a++, c);
    } else {
      round.setMatrixAt(b, m.compose(at.set(t.x, t.h * 0.45 + t.r * 0.8, t.z), turn, size.set(t.r, t.r * 0.9, t.r)));
      round.setColorAt(b++, c);
    }
  });
  poplar.count = a;
  round.count = b;
  for (const o of [poplar, round, trunk]) {
    o.castShadow = o.receiveShadow = true;
    into.add(o);
  }
  patch.renderOrder = 1;
  into.add(patch);
}
