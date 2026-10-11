// How much the 3D map may cost, and whether it may run at all. three-free:
// World3D asks `canGL()` before three.js is even downloaded.
//
// Tiers, cheapest last. On the Honor the bottleneck was pixels to fill
// (docs/3d/plan.md, "Производительность"): rendering at 1× instead of 1.75×
// took the trip from 31–43 to 58–60 fps, while shadows, antialiasing and
// the log depth each gave little. So each step down first cuts pixels, and
// shadows go last, together with the last cut.
//
// The meter watches the frames while the trip moves, the first couple of
// seconds of scrolling: if three frames in four take longer than SLOW_MS,
// it steps down a tier and watches again; below the last tier the flat map
// takes over. A device capped at 30 fps (a power saver) is slow at every
// tier: if the first step down did not make frames faster, it was not the
// pixels, so the meter goes back up and stays there instead of falling all
// the way to the flat map. It only ever steps down, and stops once a tier
// holds up: no back and forth over the visit.
//
// Thresholds are set by measurements on the dev machine for now; the
// final Honor run checks them against a real phone.

export type Tier = { dpr: number; shadows: boolean; shadowMap: number };

export const TIERS: Tier[] = [
  { dpr: 1.5, shadows: true, shadowMap: 2048 }, // desktop starts here
  { dpr: 1, shadows: true, shadowMap: 2048 }, // phones start here (1024 on a phone)
  { dpr: 0.75, shadows: true, shadowMap: 1024 },
  { dpr: 0.75, shadows: false, shadowMap: 1024 },
];
export const START = { wide: 0, narrow: 1 };
// A phone's shadow map: its screen is small, 1024 covers it as finely.
export const PHONE_SHADOW_MAP = 1024;

// A frame slower than this is under 50 fps.
const SLOW_MS = 20;
// Judge a tier after this much of drawing, ms, and at least this many
// frames (a very slow device draws few in that time: still judged).
const WINDOW_MS = 2000;
const MIN_FRAMES = 12;
// After a tier change (and at the start) the first frames pay for the
// change itself: not counted.
const SETTLE_MS = 600;
// The first step down must make frames at least this much faster, or it
// was not the pixels.
const GAIN = 0.9;

// The pixel ratio a tier really renders at on this screen.
export const dprOf = (t: Tier) => Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, t.dpr);
const sameAs = (a: Tier, b: Tier) => dprOf(a) === dprOf(b) && a.shadows === b.shadows;

export type Verdict = { tier: number } | { flat: true } | null;

// Feed it the time of every frame drawn, and whether the frame before asked
// for it (back to back: the time between them is the frame's cost, however
// long; otherwise the trip was at rest in between and it is not counted).
// It answers with a new tier, the flat map, or null (carry on). `log`
// keeps what it saw: "tier:p75" per window.
export function createMeter(start: number) {
  let tier = start;
  let steps = 0; // steps down taken
  let before = 0; // p75 at the starting tier
  let done = false;
  let prev = 0;
  let quiet = 0; // until then frames are not counted
  const dts: number[] = [];
  let sum = 0;
  const log: string[] = [];

  const reset = (now: number) => {
    dts.length = 0;
    sum = 0;
    prev = 0;
    quiet = now + SETTLE_MS;
  };

  const judge = (p75: number): Verdict => {
    log.push(`${tier}:${p75.toFixed(1)}`);
    if (p75 <= SLOW_MS) {
      done = true;
      return null;
    }
    if (steps === 1 && p75 > before * GAIN) {
      // the first step down bought nothing: a frame cap, not the GPU
      done = true;
      tier = start;
      return { tier };
    }
    let next = tier + 1;
    while (next < TIERS.length && sameAs(TIERS[next], TIERS[tier])) next++;
    if (next >= TIERS.length) {
      done = true;
      return { flat: true };
    }
    if (steps === 0) before = p75;
    steps++;
    tier = next;
    return { tier };
  };

  return {
    get live() {
      return !done;
    },
    get tier() {
      return tier;
    },
    log,
    start: reset,
    frame(now: number, back: boolean): Verdict {
      if (done) return null;
      if (now < quiet) return null;
      const dt = prev && back ? now - prev : 0;
      prev = now;
      if (!dt) return null;
      dts.push(dt);
      sum += dt;
      if (sum < WINDOW_MS || dts.length < MIN_FRAMES) return null;
      const sorted = [...dts].sort((a, b) => a - b);
      const v = judge(sorted[Math.floor(sorted.length * 0.75)]);
      reset(now);
      return v;
    },
  };
}

export type Meter = ReturnType<typeof createMeter>;

// Is there a real GPU behind WebGL? No WebGL, or WebGL drawn by the CPU
// (SwiftShader, llvmpipe, Windows' basic driver: a blocklisted GPU) —
// the flat map, without downloading three.js. `soft` lets the CPU-drawn kind
// through (tests on this machine use it to drive the meter).
export function canGL(soft = false) {
  try {
    const c = document.createElement("canvas");
    const opts = { failIfMajorPerformanceCaveat: !soft };
    const gl = (c.getContext("webgl2", opts) ?? c.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return soft || !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}
