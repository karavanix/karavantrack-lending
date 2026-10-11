// What every builder of the world shares: one seeded random sequence, the
// list of places already taken, the static batch and the trees.
//
// The world is laid out by chance, but always the same chance: builders run
// in a fixed order (world.ts) and draw from one sequence seeded as in the
// probe, so the villages, fields and hills stand where the owner saw them.

import { BoxGeometry, Mesh, type Material } from "three";
import { createBatch } from "./batch";
import { mat, P } from "./materials";

export type Tree = { x: number; z: number; poplar: boolean; h: number; r: number; color: number };

export type Kit = ReturnType<typeof createKit>;

export function createKit(seed: number) {
  let s = seed;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];

  // Circles already used by a depot, a house, a hill, a tower.
  const taken: { x: number; z: number; r: number }[] = [];
  const free = (x: number, z: number, r: number) => taken.every((t) => Math.hypot(t.x - x, t.z - z) > t.r + r);
  const take = (x: number, z: number, r: number) => void taken.push({ x, z, r });

  // Trees are collected from everywhere (roadsides, yards, the chaikhana)
  // and planted at the end as instances (trees.ts).
  const trees: Tree[] = [];
  // (h, r, colour: the order the probe drew them in)
  const tree = (x: number, z: number, poplar: boolean) =>
    void trees.push(
      poplar
        ? { x, z, poplar, h: 10 + rnd() * 4, r: 1.3 + rnd() * 0.4, color: pick(P.trees) }
        : { x, z, poplar, h: 4 + rnd() * 2, r: 2.4 + rnd() * 1.4, color: pick(P.trees) },
    );

  return { rnd, pick, free, take, trees, tree, ...createBatch() };
}

// A box standing on y, centred on (x, z).
export function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, m?: Material) {
  const o = new Mesh(new BoxGeometry(w, h, d), m ?? mat(color));
  o.position.set(x, y + h / 2, z);
  return o;
}
