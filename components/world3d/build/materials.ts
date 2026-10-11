// Palette (from the flat map) and shared materials. One material per colour
// and options, so static things can later be merged per material.

import { MeshLambertMaterial, type MeshLambertMaterialParameters } from "three";

export const P = {
  sky: 0xe9e7df,
  land: 0xefece3,
  casing: 0xcbc4b5,
  road: 0xfdfcf9,
  dash: 0xdcd5c6,
  blue: 0x2081f8, // the truck's livery
  track: 0x2563eb, // the cabinet's track
};

const cache = new Map<string, MeshLambertMaterial>();

export function mat(color: number, opts: MeshLambertMaterialParameters = {}): MeshLambertMaterial {
  const key = color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) cache.set(key, (m = new MeshLambertMaterial({ color, ...opts })));
  return m;
}

export function disposeMaterials() {
  for (const m of cache.values()) m.dispose();
  cache.clear();
}
