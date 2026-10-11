// A flat strip along the road (the road itself, its casing, the track),
// with a way to show only a stretch of it without rebuilding anything.

import { BufferGeometry, Float32BufferAttribute, Mesh, type Material } from "three";
import { LEN, N, PTS, TANS } from "../route";

// Width w, height y above the ground, between samples a and b; v of the UVs
// runs along the strip, one unit per `period` metres. With `w` = 0 both
// edges stay on the centre line and `aSide` holds the step to each edge for
// a unit width (grow.ts widens it in the shader). `off` moves the strip off
// the centre line, to the right of the way to Fergana when positive.
export function ribbon(w: number, y: number, m: Material, a = 0, b = N, period = 24, off = 0): Mesh {
  const pos: number[] = [];
  const uv: number[] = [];
  const side: number[] = [];
  const idx: number[] = [];
  for (let i = a; i <= b; i++) {
    const p = PTS[i];
    const t = TANS[i];
    const nx = -t.z;
    const nz = t.x;
    const cx = p.x - nx * off;
    const cz = p.z - nz * off;
    pos.push(cx + (nx * w) / 2, y, cz + (nz * w) / 2, cx - (nx * w) / 2, y, cz - (nz * w) / 2);
    if (!w) side.push(nx / 2, nz / 2, -nx / 2, -nz / 2);
    const v = ((i - a) * LEN) / N / period;
    uv.push(0, v, 1, v);
    if (i > a) {
      const k = (i - a - 1) * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  if (w) g.computeVertexNormals();
  else g.setAttribute("aSide", new Float32BufferAttribute(side, 2));
  const o = new Mesh(g, m);
  o.receiveShadow = true;
  o.userData = { a, b };
  return o;
}

// Show only the samples [g0, g1] of a ribbon (global sample indices).
export function showRange(o: Mesh, g0: number, g1: number) {
  const { a, b } = o.userData as { a: number; b: number };
  const s = Math.max(Math.round(g0), a);
  const e = Math.min(Math.round(g1), b);
  o.geometry.setDrawRange((s - a) * 6, Math.max(0, e - s) * 6);
}
