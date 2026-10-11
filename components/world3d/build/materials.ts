// Palette (from the flat map) and shared materials. One material per colour
// and options, so static things can be merged per material (batch.ts).
//
// Two kinds of surface, so the world is not all one soft matte: plaster,
// earth and leaves are Lambert (`mat`), painted metal (roofs, trailers, the
// truck, masts) is Standard with a little sheen (`sheen`). And `grain`
// keeps big surfaces from looking poured: a faint noise in world space,
// and walls darkening where they meet the ground.

import {
  CanvasTexture,
  MeshLambertMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type MeshLambertMaterialParameters,
  type MeshStandardMaterialParameters,
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

const cache = new Map<string, MeshLambertMaterial | MeshStandardMaterial>();
// Materials and textures made outside the cache, freed with it.
const owned: { dispose(): void }[] = [];

// Options must be plain values: a texture in them would be serialised into
// the key. Textured materials are made with `own` instead.
export function mat(color: number, opts: MeshLambertMaterialParameters = {}): MeshLambertMaterial {
  const key = "l" + color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) cache.set(key, (m = new MeshLambertMaterial({ color, ...opts })));
  return m as MeshLambertMaterial;
}

// Painted metal: matte enough to keep its colour, with a soft highlight
// where the sun glances off it. Never metalness: with no environment to
// reflect, metal goes dark.
export function sheen(color: number, opts: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
  const key = "s" + color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) cache.set(key, (m = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...opts })));
  return m as MeshStandardMaterial;
}

// The grain: one small tile of soft noise, laid over a surface by its
// position in the world (along the plane it faces most), so it has the
// same size on a long wall as on a small one. Mipmaps fade it out with the
// distance instead of letting it shimmer.
let tile: CanvasTexture | null = null;
function grainTile() {
  if (tile) return tile;
  const N = 64;
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // two octaves of value noise that wrap around, plus a little fine noise
  const octave = (cells: number) => {
    const v = Array.from({ length: cells * cells }, r);
    const at = (x: number, y: number) => v[(((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)];
    return (x: number, y: number) => {
      const fx = (x / N) * cells;
      const fy = (y / N) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const sx = (fx - x0) * (fx - x0) * (3 - 2 * (fx - x0));
      const sy = (fy - y0) * (fy - y0) * (3 - 2 * (fy - y0));
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      return a + (b - a) * sy;
    };
  };
  const o1 = octave(4);
  const o2 = octave(16);
  tile = canvasTex(N, N, (g) => {
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const n = 0.45 * o1(x, y) + 0.4 * o2(x, y) + 0.15 * r();
        const c = Math.round(n * 255);
        const i = (y * N + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  });
  tile.colorSpace = NoColorSpace;
  return tile;
}

export type Grain = {
  amount: number; // ± this much of the colour
  size: number; // one tile of noise, m
  broad?: number; // a second, wide layer of tone (the land): its tile, m
  contact?: boolean; // walls darken towards the ground
};

// Grain on a material, once. The material's own colour, map and vertex
// colours stay; the noise multiplies them.
export function grain<T extends MeshLambertMaterial | MeshStandardMaterial>(m: T, g: Grain): T {
  if (m.userData.grain) return m;
  m.userData.grain = g;
  const key = `grain${g.broad ? "b" : ""}${g.contact ? "c" : ""}`;
  m.customProgramCacheKey = () => key;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.grainMap = { value: grainTile() };
    sh.uniforms.grainK = { value: [g.amount, 1 / g.size, g.broad ? 1 / g.broad : 0] };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGrainP;\nvarying vec3 vGrainN;")
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vec4 gW = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          gW = instanceMatrix * gW;
        #endif
        vGrainP = ( modelMatrix * gW ).xyz;
        vGrainN = normalize( mat3( modelMatrix ) * objectNormal );`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D grainMap;\nuniform vec3 grainK;\nvarying vec3 vGrainP;\nvarying vec3 vGrainN;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 gN = abs( vGrainN );
        vec2 gUV = gN.y > max( gN.x, gN.z ) ? vGrainP.xz : ( gN.x > gN.z ? vGrainP.zy : vGrainP.xy );
        float gV = texture2D( grainMap, gUV * grainK.y ).r - 0.5;
        ${g.broad ? "gV += 0.8 * ( texture2D( grainMap, vGrainP.xz * grainK.z + 0.37 ).r - 0.5 );" : ""}
        diffuseColor.rgb *= 1.0 + 2.0 * grainK.x * gV;
        ${g.contact ? "diffuseColor.rgb *= 1.0 - 0.32 * ( 1.0 - gN.y ) * ( 1.0 - smoothstep( 0.0, 1.6, vGrainP.y ) );" : ""}`,
      );
  };
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
  tile = null;
  glow.window.dispose();
  glow.lamp.dispose();
}
