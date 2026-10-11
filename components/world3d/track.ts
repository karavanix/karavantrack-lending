// The track as the cabinet draws it: blue where the server has the points.
// TopDown already works out which stretches those are (the gap on the pass,
// the wave filling it); it hands them over as station ranges, and here each
// range is one ribbon showing just that stretch. Its width is set per frame
// (grow.ts): 1.1 m close up, a few pixels from high above.

import { MeshBasicMaterial, type Scene } from "three";
import { ribbon, showRange } from "./build/ribbon";
import { grow } from "./grow";
import { P } from "./build/materials";
import { N, idxOf, sAtPos } from "./route";

// At most: from the start to where the wave has got, and after the tower.
const RANGES = 2;

export function buildTrack(scene: Scene) {
  const m = new MeshBasicMaterial({ color: P.track });
  const u = grow(m, "ribbon");
  // slightly different heights so overlapping ends don't flicker
  const parts = Array.from({ length: RANGES }, (_, k) => ribbon(0, 0.12 + k * 0.01, m, 0, N));
  for (const o of parts) {
    o.receiveShadow = false;
    showRange(o, 0, 0);
    scene.add(o);
  }
  return (ranges: [number, number][], width: number) => {
    u.width.value = width;
    parts.forEach((o, k) => {
      const r = ranges[k];
      if (r) showRange(o, idxOf(sAtPos(r[0])), idxOf(sAtPos(r[1])));
      else showRange(o, 0, 0);
    });
  };
}
