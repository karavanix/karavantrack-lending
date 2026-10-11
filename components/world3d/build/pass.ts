// The Kamchik pass: terraced hills with snow on the highest, rocks and
// shrubs, and the two cell towers on either side of it. Each tower's dome
// is its coverage; the road leaves the first dome exactly where the network
// drops (chapter 6) and enters the second where it comes back (chapter 7).

import {
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  RingGeometry,
  Shape,
  SphereGeometry,
  Vector3,
  type Object3D,
} from "three";
import { OFFLINE_FROM, OFFLINE_TO } from "../../topdown/chapters";
import { distToRoad, iAtZ, PTS, roadAt, sAtPos, TANS } from "../route";
import { box, type Kit } from "./kit";
import { mat, own, P } from "./materials";

const STEEL = 0x6b7684;
const COVER = 0x3b82f6;

export type Tower = { x: number; z: number; r: number };

// Tower 44 m off the road at z, on `side`, covering the road up to the
// station position `edge`.
export function buildTowers(k: Kit, into: Object3D): Tower[] {
  const dome = own(new MeshBasicMaterial({ color: COVER, transparent: true, opacity: 0.07, depthWrite: false, side: DoubleSide }));
  const rim = own(new MeshBasicMaterial({ color: COVER, transparent: true, opacity: 0.5, depthWrite: false }));
  const red = own(new MeshBasicMaterial({ color: 0xdc2626 }));
  const towers: Tower[] = [];
  for (const [tz, side, edge] of [[-205, 1, OFFLINE_FROM], [-490, -1, OFFLINE_TO]]) {
    const i = iAtZ(tz);
    const p = PTS[i];
    const t = TANS[i];
    const x = p.x - t.z * 44 * side;
    const z = p.z + t.x * 44 * side;
    const e = roadAt(sAtPos(edge));
    const r = Math.hypot(e.x - x, e.z - z);
    towers.push({ x, z, r });
    k.take(x, z, 14);

    const g = new Group();
    g.add(box(3, 0.6, 3, 0x9aa3ad, x, 0, z));
    const mast = new Mesh(new CylinderGeometry(0.25, 0.9, 30, 4, 1, true), mat(STEEL, { side: DoubleSide }));
    mast.position.set(x, 15, z);
    g.add(mast);
    for (const y of [12, 20, 27]) g.add(box(3, 0.25, 0.25, STEEL, x, y, z), box(0.25, 0.25, 3, STEEL, x, y, z));
    k.bake(g);
    const light = new Mesh(new SphereGeometry(0.6, 10, 8), red);
    light.position.set(x, 30.6, z);
    k.bake(light, false);

    const d = new Mesh(new SphereGeometry(r, 48, 14, 0, Math.PI * 2, 0, Math.PI / 2), dome);
    d.position.set(x, 0, z);
    const ring = new Mesh(new RingGeometry(r - 1, r, 160), rim);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.2, z);
    into.add(d, ring);
  }
  return towers;
}

// An irregular round outline, radius r, wobbling by the phases ph.
function blob(r: number, ph: number[]) {
  const s = new Shape();
  for (let a = 0; a <= 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    const q = r * (1 + 0.16 * Math.sin(3 * t + ph[0]) + 0.09 * Math.sin(5 * t + ph[1]) + 0.05 * Math.sin(8 * t + ph[2]));
    if (a) s.lineTo(Math.cos(t) * q, Math.sin(t) * q);
    else s.moveTo(Math.cos(t) * q, Math.sin(t) * q);
  }
  return s;
}

// Hills as stacks of shrinking terraces, darker going up; six levels or
// more get a snowy top.
export function buildHills(k: Kit) {
  for (let tries = 0, n = 0; tries < 600 && n < 46; tries++) {
    const r = 16 + k.rnd() * 34;
    const x = (k.rnd() - 0.5) * 620;
    const z = -140 - k.rnd() * 390;
    if (distToRoad(x, z) < r * 1.25 + 12 || !k.free(x, z, r)) continue;
    k.take(x, z, r * 0.9);
    n++;
    const ph = [k.rnd() * 6.28, k.rnd() * 6.28, k.rnd() * 6.28];
    const levels = 4 + Math.floor(k.rnd() * 3) + (r > 38 ? 1 : 0);
    const step = 2.4 + r * 0.055;
    const g = new Group();
    for (let j = 0; j < levels; j++) {
      const top = j === levels - 1 && levels >= 6;
      const o = new Mesh(
        new ExtrudeGeometry(blob(r * (1 - (j / levels) * 0.82), ph), { depth: step, bevelEnabled: false, curveSegments: 1 }),
        mat(top ? 0xf6f3ec : P.hills[Math.min(4, j)], { flatShading: true }),
      );
      o.rotation.x = -Math.PI / 2;
      const ox = (k.rnd() - 0.5) * r * 0.1 * j;
      const oz = (k.rnd() - 0.5) * r * 0.1 * j;
      o.position.set(x + ox, j * step, z + oz);
      g.add(o);
    }
    k.bake(g);
  }
}

// Rocks and shrubs over the pass, up to n of each.
export function scatterRocks(k: Kit, into: Object3D, n = 260) {
  const rock = new InstancedMesh(new DodecahedronGeometry(1, 0), mat(0xb9ab8c, { flatShading: true }), n);
  const bush = new InstancedMesh(new IcosahedronGeometry(1, 0), mat(0x9aa978, { flatShading: true }), n);
  const m = new Matrix4();
  const q = new Quaternion();
  const up = new Quaternion();
  const e = new Euler();
  const at = new Vector3();
  const size = new Vector3();
  let a = 0;
  let b = 0;
  for (let i = 0; i < n * 4 && (a < n || b < n); i++) {
    const x = (k.rnd() - 0.5) * 420;
    const z = -135 - k.rnd() * 400;
    if (distToRoad(x, z) < 9 || !k.free(x, z, 1)) continue;
    const s = 0.4 + k.rnd() * 1.1;
    const rx = k.rnd() * 3;
    const ry = k.rnd() * 3;
    q.setFromEuler(e.set(rx, ry, k.rnd() * 3));
    if (k.rnd() < 0.5 && a < n) rock.setMatrixAt(a++, m.compose(at.set(x, s * 0.3, z), q, size.set(s * 1.3, s * 0.7, s)));
    else if (b < n) bush.setMatrixAt(b++, m.compose(at.set(x, s * 0.4, z), up, size.set(s, s * 0.7, s)));
  }
  rock.count = a;
  bush.count = b;
  for (const o of [rock, bush]) {
    o.castShadow = o.receiveShadow = true;
    into.add(o);
  }
}
