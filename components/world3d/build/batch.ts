// Static things are built as ordinary groups of meshes, then merged: a
// village of a hundred houses costs a couple of draw calls.
//
// Plain colours (most of the world) are moved from the material into the
// vertices, so all of them share one material and merge into one mesh;
// Lambert lights a vertex colour exactly as it lights a material colour.
// Painted metal (Standard) does the same into its own shared material.
// Both shared materials carry the grain (materials.ts).
// Textured, glowing (windows, lamps) and unlit materials keep their own
// mesh. Shadow casters and the flat things that only receive (yards,
// fields) go into separate meshes.
//
// The trip is also cut into bands of BAND metres along z, merged apart: a
// band out of the camera's view, or out of the shadow camera's, is skipped
// whole, and no single merge gets long.

import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  type Material,
  type Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { grain, mat, sheen } from "./materials";

export type Batch = {
  // Bake obj's meshes as they stand in the world now; obj itself is dropped.
  bake(obj: Object3D, cast?: boolean): void;
  // Merge everything baked so far into `into`, yielding now and then: the
  // merging is the longest part of building the world.
  flush(into: Object3D): Generator<void>;
};

const BAND = 250;

const plain = (m: Material): m is MeshLambertMaterial | MeshStandardMaterial =>
  (m instanceof MeshLambertMaterial || m instanceof MeshStandardMaterial) &&
  !m.map &&
  !m.transparent &&
  m.emissive.getHex() === 0 &&
  !m.vertexColors;

// The shared material a plain one is merged into.
const GRAIN = { amount: 0.07, size: 3, contact: true };
// Without grain (the truck: clean paint) it is a material of its own.
const shared = (m: MeshLambertMaterial | MeshStandardMaterial, grained: boolean): Material => {
  // always faceted: on boxes it changes nothing, and one shared material
  // instead of two halves the draw calls
  const o = { vertexColors: true, flatShading: true, side: m.side };
  if (m instanceof MeshStandardMaterial) {
    // two finishes only, paint and glass: every other roughness would be
    // one more draw call in each band
    const s = sheen(0xffffff, { ...o, roughness: m.roughness < 0.25 ? 0.15 : 0.45, ...(grained ? {} : { name: "clean" }) });
    return grained ? grain(s, { ...GRAIN, amount: 0.04 }) : s;
  }
  const l = mat(0xffffff, { ...o, ...(grained ? {} : { name: "clean" }) });
  return grained ? grain(l, GRAIN) : l;
};

export function createBatch(grained = true): Batch {
  const buckets = new Map<string, { m: Material; cast: boolean; gs: BufferGeometry[] }>();
  return {
    bake(obj, cast = true) {
      obj.updateMatrixWorld(true);
      obj.traverse((o) => {
        if (!(o instanceof Mesh) || o instanceof InstancedMesh) return;
        const src = o.geometry as BufferGeometry;
        const g = (src.index ? src.toNonIndexed() : src.clone()).applyMatrix4(o.matrixWorld);
        src.dispose();
        // mergeGeometries needs the same attributes everywhere
        for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
        const n = g.attributes.position.count;
        if (!g.attributes.uv) g.setAttribute("uv", new Float32BufferAttribute(new Float32Array(n * 2), 2));
        g.clearGroups();
        let m = o.material as Material;
        if (plain(m)) {
          const { r, g: gr, b } = m.color; // linear, as vertex colours are
          const c = new Float32Array(n * 3);
          for (let i = 0; i < n * 3; i += 3) {
            c[i] = r;
            c[i + 1] = gr;
            c[i + 2] = b;
          }
          g.setAttribute("color", new Float32BufferAttribute(c, 3));
          m = shared(m, grained);
        }
        // by where the geometry is, not the object: a strip along the road
        // has its vertices in the world and stands at the origin
        g.computeBoundingBox();
        const band = Math.round((g.boundingBox!.min.z + g.boundingBox!.max.z) / 2 / BAND);
        const key = `${m.uuid}${cast ? "c" : ""}${band}`;
        let bucket = buckets.get(key);
        if (!bucket) buckets.set(key, (bucket = { m, cast, gs: [] }));
        bucket.gs.push(g);
      });
    },
    *flush(into) {
      let n = 0;
      for (const { m, cast, gs } of buckets.values()) {
        const o = new Mesh(mergeGeometries(gs), m);
        for (const g of gs) g.dispose();
        o.castShadow = cast;
        o.receiveShadow = true;
        into.add(o);
        n += gs.length;
        if (n > 600) {
          n = 0;
          yield;
        }
      }
      buckets.clear();
    },
  };
}
