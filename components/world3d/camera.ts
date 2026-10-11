// Camera positions. Session 1 has only "Road": ahead of the truck and above
// it, looking back at it, so it drives down the screen. The offset is fixed
// in the world (the camera always faces south); on bends the truck turns,
// not the camera. Close and Top, and the moves between them, come in
// session 4.

import type { PerspectiveCamera } from "three";

export const FOV = 38;

// Offset from the truck, metres: up and towards Fergana (−z).
const ROAD = { wide: { up: 74, back: 104 }, narrow: { up: 105, back: 130 } };

export function roadShot(cam: PerspectiveCamera, x: number, z: number, wide: boolean) {
  const o = wide ? ROAD.wide : ROAD.narrow;
  cam.position.set(x, o.up, z - o.back);
  cam.lookAt(x, 1.5, z);
  return Math.hypot(o.up, o.back);
}
