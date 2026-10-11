// Where each word of the 3D map (Overlays.tsx) stands in the world, and
// moving it there after every frame.
//
// A word sits at the screen position of its point and fades out with the
// distance from the camera: the camera looks back along the road, so the far
// top of the screen is where the trip has been, and names there would pile
// up over a world that is already lost in the haze. On desktop it also fades
// as it slides under the participants' column. Behind the camera, or well
// off screen, it is not shown at all. A place name is kept whole on screen,
// as maps do: it slides in from the edge rather than being cut. From high
// above (Top) the road numbers go: they would sit on the place names; so do
// the depots' names once the flags are up, whose tags stand on the same spot
// and say it in the cabinet's words.

import { Vector3, type PerspectiveCamera } from "three";
import { STOP } from "../topdown/chapters";
import { CHAI } from "./build/chaikhana";
import { FERGANA, TASHKENT, type DepotPlan } from "./build/depot";
import { roadAt, sAtPos, sAtZ } from "./route";
import type { Frame } from "./engine";

// Beside the road at s metres, `off` metres to the left of the screen (+x
// when heading north; negative for the right), `y` up.
function beside(s: number, off: number, y = 0.3) {
  const r = roadAt(s);
  return new Vector3(r.x - r.tz * off, y, r.z + r.tx * off);
}

// Above a depot's warehouse, on the side of the road (its roof tops out at
// 13.5 m): its middle would be under the cards or the participants' column.
const roofOf = (d: DepotPlan) => new Vector3(Math.abs(d.wx0) < Math.abs(d.wx1) ? d.wx0 + 6 : d.wx1 - 6, 15, (d.wz0 + d.wz1) / 2);

// The camera hangs ahead of the truck looking back: the screen shows some
// 250 m of road behind it and only 50 m ahead. So a name goes where the
// truck has just been when its chapter is on, and to the left of the road
// (the right is the participants' column on desktop).
export function overlayPoints(flagTops: Vector3[]): Record<string, Vector3> {
  return {
    depot: roofOf(TASHKENT),
    "road-1": beside(sAtZ(470), -8, 1),
    chaikhana: new Vector3(CHAI.x + 10, 8, CHAI.z),
    pass: beside(sAtZ(-370), 28, 22),
    "road-2": beside(sAtZ(-560), -8, 1),
    valley: beside(sAtZ(-555), 32, 2),
    fergana: roofOf(FERGANA),
    pickup: flagTops[0],
    estimate: flagTops[0],
    dropoff: flagTops[1],
    park: beside(sAtPos(STOP), 0),
  };
}

// The grey run on the pass: the tag stands beside it, near the truck so it
// stays on screen while the run grows behind it.
const PEND_MIN = 12; // metres of grey before it is worth a word
const PEND_REACH = 40;
// Under the participants' column a word fades over this many px.
const RAIL_FADE = 80;
// Rough width of a tag's text, px a character (semibold 12–12.5 px).
const CHAR_W = 6.5;

export function createOverlays(host: HTMLElement, points: Record<string, Vector3>) {
  const items = Array.from(host.querySelectorAll<HTMLElement>("[data-at]")).map((el) => {
    const flip = el.querySelector<HTMLElement>("[data-flip]");
    return {
      el,
      place: el.querySelector<HTMLElement>("[data-kind]"),
      shield: !!el.querySelector('[data-kind="shield"]'),
      depot: el.dataset.at === "depot" || el.dataset.at === "fergana",
      half: -1, // half its width, measured the first time it shows
      at: points[el.dataset.at!] ?? new Vector3(),
      flip,
      extra: Number(flip?.dataset.flip ?? 0),
      shown: true,
      op: "",
      side: "",
    };
  });
  const pend = items.find((o) => o.el.dataset.at === "pend")!;
  const v = new Vector3();

  // fade: full up to `near` metres from the camera, gone at `far`; `map`:
  // how far the camera has gone towards the map view, 0–1
  return (camera: PerspectiveCamera, w: number, h: number, free: [number, number], f: Frame, fade: { near: number; far: number; map: number }) => {
    // the grey run's tag
    let run = 0;
    if (f.pend) {
      const a = sAtPos(f.pend[0]);
      const b = sAtPos(f.pend[1]);
      run = b - a;
      if (run > PEND_MIN) pend.at.copy(beside(b - Math.min(run / 2, PEND_REACH), 0));
    }
    const pendOn = run > PEND_MIN ? "1" : "0";
    if (pend.flip!.dataset.on !== pendOn) pend.flip!.dataset.on = pendOn;

    for (const o of items) {
      v.copy(o.at).project(camera);
      const x = ((v.x + 1) / 2) * w;
      const y = ((1 - v.y) / 2) * h;
      const d = camera.position.distanceTo(o.at);
      const off = o.shield || (o.depot && f.pins) ? fade.map : 0;
      const shown = off < 1 && v.z < 1 && x > -200 && x < free[1] && y > -100 && y < h + 100 && d < fade.far;
      if (shown !== o.shown) {
        o.shown = shown;
        o.el.style.display = shown ? "" : "none";
      }
      if (!shown) continue;
      let px = x;
      if (o.place) {
        if (o.half < 0) o.half = o.place.offsetWidth / 2;
        px = Math.max(8 + o.half, Math.min(free[1] - 8 - o.half, x));
      }
      o.el.style.transform = `translate3d(${px.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const far = (fade.far - d) / (fade.far - fade.near);
      const rail = free[1] < w ? (free[1] - x) / RAIL_FADE : 1;
      const op = Math.min(1, Math.max(0, Math.min(far, rail, 1 - off))).toFixed(2);
      if (op !== o.op) o.el.style.opacity = o.op = op;
      // A tag that hangs to one side: the right if it fits before the
      // column (or the screen edge), else the left if it fits there, else
      // the roomier one, and without its text if it still doesn't fit
      // (the "P" in the middle of a phone screen, the stop's times beside).
      if (o.flip) {
        const need = o.extra + (o.flip.textContent?.length ?? 0) * CHAR_W;
        const r = x + need <= free[1] - 8;
        const l = x - need >= free[0] + 8;
        const side = r ? "r" : l || x - free[0] > free[1] - x ? "l" : "r";
        if (side !== o.side) o.flip.dataset.side = o.side = side;
        const tight = r || l ? "0" : "1";
        if (o.el.dataset.tight !== tight) o.el.dataset.tight = tight;
      }
    }
  };
}
