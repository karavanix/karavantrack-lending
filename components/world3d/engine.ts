// The 3D world behind the chapter cards: renderer, scene, light, and one
// frame per change. It is loaded with a dynamic import, so three.js only
// comes down after the page has rendered.
//
// Nothing runs on its own. TopDown hands over a Frame whenever the scroll
// moves the trip on; the engine draws once on the next animation frame and
// stops again. At rest, or with the section off screen, it costs nothing.
//
// Getting ready is spread out so the page never freezes: the world is built
// a piece at a time with the main thread handed back in between, and the
// shaders are compiled in the background (compileAsync) before the first
// frame, which would otherwise compile them all at once.
//
// After drawing it places the invisible anchors (truck, pickup flag, step
// rings) where those things are on screen, so the impulses of pulse.ts land
// on them exactly as they did on the flat map, and moves the map's words
// (overlays.ts) to their places.

import {
  Box3,
  DirectionalLight,
  Fog,
  Color,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { RINGS } from "../topdown/chapters";
import { buildGround } from "./build/ground";
import { disposeMaterials, P } from "./build/materials";
import { buildWorld } from "./build/world";
import { FOV, apply, cutAt, cutKey, newShot, pxPerMetre, shotAt } from "./camera";
import { buildMarks } from "./marks";
import { createOverlays, overlayPoints } from "./overlays";
import { roadAt, sAtPos } from "./route";
import { buildTrack } from "./track";
import { buildTruck } from "./truck";

// Positions are station positions (see route.ts).
export type Frame = {
  at: number; // where the scroll is (the camera follows it, camera.ts)
  pos: number; // where the truck is
  track: [number, number][]; // stretches of blue track
  plan: [number, number] | null; // the planned route's grey dots drawn so far
  pend: [number, number] | null; // grey points still on the driver's phone
  front: number | null; // the wave delivering them has got this far
  pins: boolean; // the load is created: pickup and dropoff flags are up
  first: boolean; // the first track point is down
  rings: number; // the driver's step rings on the ground so far
  waves: boolean; // the network is back: the tower below the pass sends its waves
};

// Where the truck should stand on screen, px from the canvas' top left, the
// quality tier, and the strip of the screen where the map shows between the
// cards and the participants' column (the map's words keep to it).
export type View = { wide: boolean; aimX: number; aimY: number; free: [number, number] };

export type Anchors = { truck: HTMLElement; pin: HTMLElement; rings: HTMLElement[] };

// Rendering resolution: the bottleneck on phones is pixels to fill (measured
// on the Honor, docs/3d/plan.md). 1× there is 58–60 fps and looks the same.
const DPR = { wide: 1.5, narrow: 1 };

// 10:00 light from the probe's time-of-day table (session 5 makes it move).
// Lambert divides by π: sky + sun·sin(elevation) ≈ 3.1 keeps the land the
// colour of the page around it.
const SUN = { az: 135, el: 36, color: 0xfff2e0, i: 1.55 };
const HEMI = { sky: 0xf6f6f2, ground: 0xb9b09a, i: 2.2 };

// The map's words fade out between these distances past the point the
// camera looks at. From high above the whole route is that close: MAP is
// how much further they reach there.
const WORDS = { near: 130, far: 230, map: 1600 };
// From this far the world reads as a map (Top, and on the way there).
const MAP_FROM = 300;
const MAP_TO = 900;
// The track is 1.1 m wide, and never thinner on screen than this, px.
const TRACK_W = 1.1;
const TRACK_PX = 3.5;

const turn = () => new Promise((r) => setTimeout(r, 0));

const UP = new Vector3(0, 1, 0);
// Corners and edge midpoints of the screen, normalised device coordinates.
const SCREEN = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

export async function createEngine(host: HTMLElement, anchors: Anchors, initial: View) {
  // Throws without WebGL; the caller falls back to the flat map.
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.prepend(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(P.sky);
  scene.fog = new Fog(P.sky, 200, 600);
  const camera = new PerspectiveCamera(FOV, 1, 2, 2500);
  const shot = newShot();

  const hemi = new HemisphereLight(HEMI.sky, HEMI.ground, HEMI.i);
  const sun = new DirectionalLight(SUN.color, SUN.i);
  const az = (SUN.az * Math.PI) / 180;
  const el = (SUN.el * Math.PI) / 180;
  const sunDir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.castShadow = true;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.5;
  // The shadow camera covers the ground in view (fitShadow), from 300 m
  // up the sun's ray.
  const sc = sun.shadow.camera;
  sc.near = 1;
  sc.far = 700;
  scene.add(hemi, sun, sun.target);

  buildGround(scene);
  const truck = buildTruck();
  scene.add(truck);
  const setTrack = buildTrack(scene);
  const build = buildWorld();
  let step = build.next();
  while (!step.done) {
    await turn();
    step = build.next();
  }
  scene.add(step.value.world);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const marks = buildMarks(scene, reduce, step.value.towers[1]);
  const placeWords = createOverlays(host, overlayPoints(marks.flagTops));

  // Corners of the truck in its own frame, for its anchor on screen.
  const box = new Box3().setFromObject(truck);
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
    (k) => new Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z),
  );
  const spot = (pos: number) => {
    const r = roadAt(sAtPos(pos));
    return new Vector3(r.x, 0.2, r.z);
  };
  const points = [
    { el: anchors.pin, at: marks.flagHeads[0] },
    ...anchors.rings.map((el, i) => ({ el, at: spot(RINGS[i]) })),
  ];

  let view = initial;
  let frame: Frame | null = null;
  let cut = cutAt(0, reduce);
  // From high above nothing that casts a shadow moves: while the camera
  // holds there, the shadow map drawn on the way in is kept (the plan
  // drawing itself in chapter 1 then costs half the draw calls).
  let shadowsFor = "";
  let w = 0;
  let h = 0;
  let raf = 0;
  const here = { x: 0, z: 0, tx: 0, tz: -1 };
  const v = new Vector3();

  const resize = () => {
    w = host.clientWidth;
    h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, view.wide ? DPR.wide : DPR.narrow));
    renderer.setSize(w, h, false);
    sun.shadow.mapSize.setScalar(view.wide ? 2048 : 1024);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    shadowsFor = "";
    invalidate();
  };

  // Screen position of a world point, px in the canvas; null when it is
  // behind the camera or well off screen.
  const project = (p: Vector3) => {
    v.copy(p).project(camera);
    if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) return null;
    return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
  };
  const place = (el: HTMLElement, x: number, y: number, bw: number, bh: number) => {
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.width = `${bw.toFixed(1)}px`;
    el.style.height = `${bh.toFixed(1)}px`;
    el.style.visibility = "visible";
  };
  // Shadows over exactly the ground in view. In the light's own frame a
  // caster and its shadow fall on the same spot, so covering the visible
  // ground in that frame covers every shadow on it, wherever its caster
  // stands. The screen's corner rays meet the ground, or are cut at `reach`
  // (the fog's end: nothing shows beyond it). The box is rounded up to whole
  // metres and its centre snapped to the shadow map's texels, so it holds
  // still while the truck drives and the shadow edges don't crawl.
  const lx = new Vector3();
  const ly = new Vector3();
  const ray = new Vector3();
  const area = { x0: 0, x1: 0, y0: 0, y1: 0 };
  const fitShadow = (reach: number) => {
    // the shadow camera's own axes: it looks down the sun's ray, up is +y
    lx.crossVectors(UP, sunDir).normalize();
    ly.crossVectors(sunDir, lx);
    camera.updateMatrixWorld();
    area.x0 = area.y0 = Infinity;
    area.x1 = area.y1 = -Infinity;
    for (const [nx, ny] of SCREEN) {
      ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      const t = ray.y < 0 ? Math.min(-camera.position.y / ray.y, reach) : reach;
      v.copy(camera.position).addScaledVector(ray, t).setY(0);
      const a = v.dot(lx);
      const b = v.dot(ly);
      area.x0 = Math.min(area.x0, a);
      area.x1 = Math.max(area.x1, a);
      area.y0 = Math.min(area.y0, b);
      area.y1 = Math.max(area.y1, b);
    }
    const hx = Math.ceil((area.x1 - area.x0) / 2) + 2;
    const hy = Math.ceil((area.y1 - area.y0) / 2) + 2;
    if (hx !== sc.right || hy !== sc.top) {
      sc.left = -hx;
      sc.right = hx;
      sc.bottom = -hy;
      sc.top = hy;
      sc.updateProjectionMatrix();
    }
    const tx = (2 * hx) / sun.shadow.mapSize.x;
    const ty = (2 * hy) / sun.shadow.mapSize.y;
    const cx = Math.round((area.x0 + area.x1) / 2 / tx) * tx;
    const cy = Math.round((area.y0 + area.y1) / 2 / ty) * ty;
    // that centre on the ground (lx is level, so only ly lifts it)
    sun.target.position.copy(lx).multiplyScalar(cx).addScaledVector(ly, cy);
    sun.target.position.addScaledVector(sunDir, -sun.target.position.y / sunDir.y);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 300);
  };

  const placeAnchors = () => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const c of corners) {
      const p = project(v.copy(c).applyMatrix4(truck.matrixWorld));
      if (!p) continue;
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
    if (x1 > x0) place(anchors.truck, x0, y0, x1 - x0, y1 - y0);
    else anchors.truck.style.visibility = "hidden";
    for (const { el, at } of points) {
      const p = project(at);
      if (p) place(el, p.x - 12, p.y - 12, 24, 24);
      else el.style.visibility = "hidden";
    }
  };

  const draw = () => {
    raf = 0;
    if (!frame || !w || !h) return;
    roadAt(sAtPos(frame.pos), here);
    truck.position.set(here.x, 0, here.z);
    truck.rotation.y = Math.atan2(-here.tx, -here.tz);

    shotAt(cut, here.x, here.z, view, w, h, shot);
    apply(camera, shot, w, h);
    const d = shot.dist;
    const fog = scene.fog as Fog;
    fog.near = d * 0.9 + 60;
    fog.far = d * 2 + 420;

    fitShadow(fog.far);
    const key = cutKey(cut);
    renderer.shadowMap.autoUpdate = !(key === "top" && shadowsFor === key);
    shadowsFor = key;

    const pxm = pxPerMetre(shot, h);
    setTrack(frame.track, Math.max(TRACK_W, TRACK_PX / pxm));
    const busy = marks.update(frame, performance.now(), pxm);
    renderer.render(scene, camera);
    placeAnchors();
    const map = Math.min(1, Math.max(0, (d - MAP_FROM) / (MAP_TO - MAP_FROM)));
    placeWords(camera, w, h, view.free, frame, { near: d + WORDS.near + map * WORDS.map, far: d + WORDS.far + map * WORDS.map, map });
    if (busy) invalidate(); // a flag or a ring is still landing
  };

  function invalidate() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  // Compiled in the background where the browser can; the first frame then
  // only draws.
  await renderer.compileAsync(scene, camera);

  return {
    set(f: Frame) {
      // While the truck stands at a bend the scroll goes on: same picture,
      // unless the camera is on the move.
      const c = cutAt(f.at, reduce);
      if (frame && cutKey(c) === cutKey(cut) && same(frame, f)) return;
      frame = f;
      cut = c;
      invalidate();
    },
    setView(next: View) {
      const tier = next.wide !== view.wide;
      view = next;
      if (tier) resize();
      else invalidate();
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        if (o instanceof InstancedMesh) o.dispose();
        o.geometry.dispose();
        for (const m of [o.material].flat()) m.dispose();
      });
      disposeMaterials();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export type Engine = Awaited<ReturnType<typeof createEngine>>;

const sameRange = (a: [number, number] | null, b: [number, number] | null) => a === b || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);
const same = (a: Frame, b: Frame) =>
  a.pos === b.pos &&
  a.front === b.front &&
  a.pins === b.pins &&
  a.first === b.first &&
  a.rings === b.rings &&
  a.waves === b.waves &&
  sameRange(a.plan, b.plan) &&
  sameRange(a.pend, b.pend) &&
  a.track.length === b.track.length &&
  a.track.every((r, k) => sameRange(r, b.track[k]));
