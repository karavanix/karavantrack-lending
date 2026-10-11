// Palette (from the flat map) and shared materials. One material per colour
// and options, so static things can be merged per material (batch.ts).

import {
  CanvasTexture,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type MeshLambertMaterialParameters,
} from "three";

export const P = {
  sky: 0xe9e7df,
  land: 0xefece3,
  concrete: 0xe3e1db,
  casing: 0xcbc4b5,
  road: 0xfdfcf9,
  dash: 0xdcd5c6,
  fields: [0xdfe6c6, 0xe8e1c2, 0xd3dfb8, 0xebe4cc, 0xd9e3c2],
  trees: [0x8fae6e, 0x7fa262, 0x9cb87e, 0x78995c],
  walls: [0xeee6d6, 0xe8dfcc, 0xf1ebdf, 0xe4dccb],
  roofs: [0xc9cfd6, 0xd6cfc1, 0xbfc9d3, 0xcdc6b6],
  hills: [0xe6dec9, 0xddd1b6, 0xd3c5a5, 0xc8b893, 0xbcab84],
  blue: 0x2081f8, // the truck's livery
  track: 0x2563eb, // the cabinet's track
};

const cache = new Map<string, MeshLambertMaterial>();
// Materials and textures made outside the cache, freed with it.
const owned: { dispose(): void }[] = [];

// Options must be plain values: a texture in them would be serialised into
// the key. Textured materials are made with `own` instead.
export function mat(color: number, opts: MeshLambertMaterialParameters = {}): MeshLambertMaterial {
  const key = color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) cache.set(key, (m = new MeshLambertMaterial({ color, ...opts })));
  return m;
}

export function own<T extends { dispose(): void }>(x: T): T {
  owned.push(x);
  return x;
}

// Windows and street lamps: dark by day, they glow at dusk (session 5 turns
// up emissiveIntensity by the minute of the trip). They live as long as the
// module: a disposed material is simply uploaded again by the next engine.
export const glow = {
  window: new MeshLambertMaterial({ color: 0x5c6b7a, emissive: 0xffc96b, emissiveIntensity: 0 }),
  lamp: new MeshLambertMaterial({ color: 0xf3f0e6, emissive: 0xffe2a0, emissiveIntensity: 0 }),
};

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = own(new CanvasTexture(c));
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function disposeMaterials() {
  for (const m of cache.values()) m.dispose();
  cache.clear();
  for (const x of owned) x.dispose();
  owned.length = 0;
  glow.window.dispose();
  glow.lamp.dispose();
}
