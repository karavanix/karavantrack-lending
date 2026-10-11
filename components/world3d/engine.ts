// The 3D world behind the chapter cards: renderer, scene, light, and one
// frame per change. It is loaded with a dynamic import, so three.js only
// comes down after the page has rendered.
//
// Nothing runs on its own. TopDown hands over a Frame whenever the scroll
// moves the trip on; the engine draws once on the next animation frame and
// stops again. At rest, or with the section off screen, it costs nothing.
//
// After drawing it places the invisible anchors (truck, pickup pin, step
// rings) where those things are on screen, so the impulses of pulse.ts land
// on them exactly as they did on the flat map.

import {
  Box3,
  DirectionalLight,
  Fog,
  Color,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { PICKUP_AT, RINGS } from "../topdown/chapters";
import { buildGround } from "./build/ground";
import { disposeMaterials, P } from "./build/materials";
import { FOV, roadShot } from "./camera";
import { roadAt, sAtPos } from "./route";
import { buildTrack } from "./track";
import { buildTruck } from "./truck";

export type Frame = {
  pos: number; // where the truck is, as a station position (see route.ts)
  track: [number, number][]; // stretches of blue track, in station positions
};

// Where the truck should stand on screen, px from the canvas' top left, and
// the quality tier.
export type View = { wide: boolean; aimX: number; aimY: number };

export type Anchors = { truck: HTMLElement; pin: HTMLElement; rings: HTMLElement[] };

// Rendering resolution: the bottleneck on phones is pixels to fill (measured
// on the Honor, docs/3d/plan.md). 1× there is 58–60 fps and looks the same.
const DPR = { wide: 1.5, narrow: 1 };

// 10:00 light from the probe's time-of-day table (session 5 makes it move).
// Lambert divides by π: sky + sun·sin(elevation) ≈ 3.1 keeps the land the
// colour of the page around it.
const SUN = { az: 135, el: 36, color: 0xfff2e0, i: 1.55 };
const HEMI = { sky: 0xf6f6f2, ground: 0xb9b09a, i: 2.2 };

export function createEngine(host: HTMLElement, anchors: Anchors, initial: View) {
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

  const hemi = new HemisphereLight(HEMI.sky, HEMI.ground, HEMI.i);
  const sun = new DirectionalLight(SUN.color, SUN.i);
  const az = (SUN.az * Math.PI) / 180;
  const el = (SUN.el * Math.PI) / 180;
  const sunDir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.castShadow = true;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.5;
  // Only what is around the truck needs shadows in this camera.
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -60;
  sc.right = sc.top = 60;
  sc.near = 1;
  sc.far = 700;
  scene.add(hemi, sun, sun.target);

  buildGround(scene);
  const truck = buildTruck();
  scene.add(truck);
  const setTrack = buildTrack(scene);

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
    { el: anchors.pin, at: spot(PICKUP_AT) },
    ...anchors.rings.map((el, i) => ({ el, at: spot(RINGS[i]) })),
  ];

  let view = initial;
  let frame: Frame | null = null;
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

    const d = roadShot(camera, here.x, here.z, view.wide);
    camera.aspect = w / h;
    // the truck at the aim point instead of the middle of the screen
    camera.setViewOffset(w, h, w / 2 - view.aimX, h / 2 - view.aimY, w, h);
    camera.updateProjectionMatrix();
    const fog = scene.fog as Fog;
    fog.near = d * 0.9 + 60;
    fog.far = d * 2 + 420;

    sun.target.position.set(here.x, 0, here.z);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 300);

    setTrack(frame.track);
    renderer.render(scene, camera);
    placeAnchors();
  };

  function invalidate() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  return {
    set(f: Frame) {
      // While the truck stands at a bend the scroll goes on: same picture.
      if (frame && same(frame, f)) return;
      frame = f;
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

export type Engine = ReturnType<typeof createEngine>;

const same = (a: Frame, b: Frame) =>
  a.pos === b.pos && a.track.length === b.track.length && a.track.every((r, k) => r[0] === b.track[k][0] && r[1] === b.track[k][1]);
