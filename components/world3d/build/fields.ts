// Fields in a loose grid on both sides of the road: green and wheat
// patches with furrows between the villages, cotton in the Fergana valley.
// Each patch's furrows run along or across it, by chance.

import { Mesh, MeshLambertMaterial, PlaneGeometry } from "three";
import { distToRoad } from "../route";
import type { Kit } from "./kit";
import { canvasTex, grain, own, P } from "./materials";

// Fields are big: a coarser grain with patches, as soil and crops go.
const FIELD = { amount: 0.06, size: 7, broad: 40 };

export function fieldMaterials() {
  const rows = canvasTex(64, 64, (g) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "rgba(110,125,70,0.22)";
    for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 6);
  });
  const cotton = canvasTex(64, 64, (g) => {
    g.fillStyle = "#d3dbc2";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#fff";
    for (let y = 4; y < 64; y += 16)
      for (let x = 0; x < 64; x += 9) {
        g.beginPath();
        g.arc(x + ((y / 16) % 2) * 4, y + 4, 2.6, 0, 7);
        g.fill();
      }
  });
  return {
    crops: P.fields.map((color) => grain(own(new MeshLambertMaterial({ color, map: rows })), FIELD)),
    cotton: grain(own(new MeshLambertMaterial({ color: 0xffffff, map: cotton })), FIELD),
  };
}

export type FieldMaterials = ReturnType<typeof fieldMaterials>;

// Rows of patches from z0 to z1; one texture repeat is 6 m.
export function buildFields(k: Kit, m: FieldMaterials, z0: number, z1: number, cotton: boolean) {
  for (let z = z0; z < z1; ) {
    const d = 22 + k.rnd() * 26;
    for (let x = -330; x < 330; ) {
      const w = 26 + k.rnd() * 40;
      const cx = x + w / 2;
      const cz = z + d / 2;
      if (distToRoad(cx, cz) > Math.max(w, d) / 2 + 9 && k.free(cx, cz, Math.max(w, d) / 2 - 4) && k.rnd() < 0.88) {
        const g = new PlaneGeometry(w - 3, d - 3);
        const uv = g.attributes.uv;
        const along = k.rnd() < 0.5;
        for (let i = 0; i < uv.count; i++) {
          const a = uv.getX(i);
          const b = uv.getY(i);
          uv.setXY(i, along ? a * (w / 6) : b * (d / 6), along ? b * (d / 6) : a * (w / 6));
        }
        const f = new Mesh(g, cotton ? m.cotton : k.pick(m.crops));
        f.rotation.x = -Math.PI / 2;
        f.position.set(cx, 0.02, cz);
        k.bake(f, false);
      }
      x += w;
    }
    z += d;
  }
}
