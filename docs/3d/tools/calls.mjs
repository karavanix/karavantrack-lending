// node calls.mjs <w> <h> <path?query> <pos>... — draw calls and triangles of
// one frame at each chapter position (shadow pass included), and the long
// main-thread tasks while the page loads. Counts by wrapping the WebGL draw
// calls, so the site needs no debug hooks.
//
// Runs on this machine's real GPU (headless Chrome through ANGLE/OpenGL):
// unlike swiftshader it has KHR_parallel_shader_compile, so load timings mean
// something. Needs playwright-core (npm i playwright-core@1.48.2) and the dev
// server on :3123. Example: node calls.mjs 360 713 "ru?map=3d" 3 4.5 5 6.5 8 9
import { chromium } from "playwright-core";
const [w, h, loc, ...poss] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--hide-scrollbars", "--use-angle=gl", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.addInitScript(() => {
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ type: "longtask", buffered: true });
  window.__frames = [];
  let calls = 0, tris = 0;
  for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
    const p = C.prototype;
    for (const [name, cnt, inst] of [["drawElements", 1, -1], ["drawArrays", 2, -1], ["drawElementsInstanced", 1, 4], ["drawArraysInstanced", 2, 3]]) {
      const f = p[name];
      if (!f) continue;
      p[name] = function (...a) { calls++; tris += (a[cnt] / 3) * (inst >= 0 ? a[inst] : 1); return f.apply(this, a); };
    }
  }
  const loop = () => { if (calls) window.__frames.push([calls, Math.round(tris)]); calls = 0; tris = 0; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
await page.goto(`http://localhost:3123/${loc}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
console.log("long tasks (ms):", (await page.evaluate(() => window.__long)).join(" "));
const scrollTo = (pos) => page.evaluate((pos) => { const sec = document.getElementById("trip"); const vh = sec.querySelector("[class*=probe]").getBoundingClientRect().height; window.scrollTo(0, sec.offsetTop + pos * vh); }, pos);
for (const p of poss) {
  await scrollTo(+p - 0.05); await page.waitForTimeout(300);
  await page.evaluate(() => (window.__frames = []));
  await scrollTo(+p); await page.waitForTimeout(500);
  const f = await page.evaluate(() => window.__frames);
  const last = f[f.length - 1] || [0, 0];
  console.log(`pos ${p}: frames ${f.length}, calls ${last[0]}, tris ${last[1]}`);
}
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
await browser.close();
