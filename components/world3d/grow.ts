// Ink that keeps its size on screen. From the Road camera the track is a
// 1.1 m ribbon and the plan dots 1.5 m across; from 2 km (Top) that is under
// a pixel, and the cabinet's map would be blank. So the track's width and
// the dots' size are uniforms the engine sets each frame: never thinner than
// their real size, never thinner than a few pixels. Same geometry, same
// draw call, no second "thick" copy to fade in.
//
// The vertex shader does it. A ribbon keeps its centre line in `position`
// and the half-step to its edge in `aSide`; a dot keeps its centre in
// `aCentre`, and every `uEvery`-th dot is kept, so from afar the plan stays
// a dotted line instead of melting into a solid one.

import type { Material } from "three";

export type Grow = { width: { value: number }; scale: { value: number }; every: { value: number } };

export function grow(m: Material, kind: "ribbon" | "dots"): Grow {
  const u: Grow = { width: { value: 1 }, scale: { value: 1 }, every: { value: 1 } };
  m.onBeforeCompile = (sh) => {
    if (kind === "ribbon") {
      sh.uniforms.uWidth = u.width;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aSide;\nuniform float uWidth;")
        .replace("#include <begin_vertex>", "vec3 transformed = position + vec3(aSide.x, 0.0, aSide.y) * uWidth;");
    } else {
      sh.uniforms.uScale = u.scale;
      sh.uniforms.uEvery = u.every;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec3 aCentre;\nattribute float aIdx;\nuniform float uScale;\nuniform float uEvery;")
        .replace(
          "#include <begin_vertex>",
          "float keep = mod(aIdx + 0.5, uEvery) < 1.0 ? uScale : 0.0;\nvec3 transformed = aCentre + (position - aCentre) * keep;",
        );
    }
  };
  m.customProgramCacheKey = () => `grow-${kind}`;
  return u;
}
