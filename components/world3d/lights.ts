// Lights of the evening: pools under the depot lamps and the truck's
// headlight beam on the road ahead. Not real lights: a point or spot light
// would be worked out for every pixel of the world all day long, and pixels
// are what a phone runs short of. They are glowing patches on the ground
// instead, added on top of it, hidden (no draw call) by day.
//
// The windows and the lamp heads themselves glow through their materials
// (glow in materials.ts).

import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  type Scene,
} from "three";
import { FERGANA, TASHKENT, lampsOf } from "./build/depot";
import { glow, own } from "./build/materials";

// Pool radius, m, and how far ahead of the truck's nose the beam reaches.
const POOL = 9;
const BEAM = { from: 5.4, len: 30, w: 15 };
// Above the yard and the road, under the track and the marks.
const Y = 0.07;

function texture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = own(new CanvasTexture(c));
  t.colorSpace = SRGBColorSpace;
  return t;
}

const glowing = (color: number, map: CanvasTexture) =>
  own(new MeshBasicMaterial({ color, map, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false }));

export function buildLights(scene: Scene, truck: Group) {
  // a round pool, brightest under the lamp
  const pool = texture(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.45, "rgba(255,255,255,0.45)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  });
  const lamps = [...lampsOf(TASHKENT), ...lampsOf(FERGANA)];
  const pools = new InstancedMesh(new PlaneGeometry(2 * POOL, 2 * POOL).rotateX(-Math.PI / 2), glowing(0xffc978, pool), lamps.length);
  const o = new Object3D();
  lamps.forEach(([x, z], i) => {
    o.position.set(x + 1.3, Y, z);
    o.updateMatrix();
    pools.setMatrixAt(i, o.matrix);
  });
  pools.computeBoundingSphere();

  // the beam: a fan widening from the nose, fading with the distance
  // (the texture's top is the far end)
  const fan = texture(64, 128, (g) => {
    for (let y = 0; y < 128; y++) {
      const near = y / 127; // 1 at the nose
      const half = 32 * (0.18 + 0.82 * (1 - near));
      const a = Math.pow(near, 1.6) * 0.95 + 0.05 * near;
      const row = g.createLinearGradient(32 - half, 0, 32 + half, 0);
      row.addColorStop(0, "rgba(255,255,255,0)");
      row.addColorStop(0.5, `rgba(255,255,255,${a.toFixed(3)})`);
      row.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = row;
      g.fillRect(32 - half, y, 2 * half, 1);
    }
  });
  const beam = new Mesh(new PlaneGeometry(BEAM.w, BEAM.len).rotateX(-Math.PI / 2), glowing(0xfff0c8, fan));
  beam.position.set(0, Y, -BEAM.from - BEAM.len / 2);

  for (const m of [pools, beam]) {
    m.visible = false;
    m.renderOrder = 1;
    m.castShadow = m.receiveShadow = false;
    m.matrixAutoUpdate = m !== pools;
  }
  scene.add(pools);
  truck.add(beam);

  // lamps, beams: 0 by day, 1 lit
  return (lit: number, beams: number) => {
    glow.window.emissiveIntensity = lit * 1.1;
    glow.lamp.emissiveIntensity = lit * 1.6;
    (pools.material as MeshBasicMaterial).opacity = lit * 0.55;
    pools.visible = lit > 0.01;
    (beam.material as MeshBasicMaterial).opacity = beams * 0.5;
    beam.visible = beams > 0.01;
  };
}
