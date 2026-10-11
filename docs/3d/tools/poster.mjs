// node poster.mjs <out-dir> [quality] — the posters of the 3D map's first
// frame (World3D.tsx shows them until the engine has drawn): the page at the
// top on this machine's real GPU, everything but the canvas hidden, saved as
// WebP (ImageMagick's `convert`). Run again whenever the first screen of
// the world changes (the Tashkent depot, the truck, the 07:40 light, the
// Close shot). Needs playwright-core (npm i playwright-core@1.48.2) and the
// dev server on :3123. Example:
//   node poster.mjs ../../../public/3d
//
// The camera's vertical field of view spans the canvas' height, so a
// picture drawn at the canvas' height has the scene's scale on any screen;
// world3d.module.css then shifts it so the point the camera aims at lands
// where viewOf (World3D.tsx) puts it. That point's place across the
// picture, in picture heights, is printed: it is --fx in the CSS.
//
// Sizes: wide enough that the picture covers the screen around that point
// from a 1024×600 laptop to a 3440×1440 monitor (desktop) and on any phone
// held upright (phone); at 1× like the live canvas on a phone.
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";

const [out = ".", quality = "78"] = process.argv.slice(2);
const SHOTS = [
  // desktop: aim at 216 + w/3 across, 45 % down
  { name: "hero-wide", w: 2250, h: 900, fx: (w, h) => (216 + w / 3) / h },
  // phone: aim at the middle, 40 % down
  { name: "hero-narrow", w: 720, h: 900, fx: (w, h) => w / 2 / h },
];

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--hide-scrollbars", "--use-angle=gl", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const s of SHOTS) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  // the top tier, held (no meter)
  await page.goto("http://localhost:3123/ru?q=0", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-ready='1']", { timeout: 20000 });
  await page.addStyleTag({ content: "body * { visibility: hidden !important; transition: none !important } canvas { visibility: visible !important }" });
  await page.waitForTimeout(1500);
  const png = `${out}/${s.name}.png`;
  await page.screenshot({ path: png });
  execFileSync("convert", [png, "-quality", quality, "-define", "webp:method=6", `${out}/${s.name}.webp`]);
  execFileSync("rm", [png]);
  const kb = Number(execFileSync("stat", ["-c", "%s", `${out}/${s.name}.webp`])) / 1024;
  console.log(`${s.name}.webp ${s.w}×${s.h} ${kb.toFixed(0)} KB  --fx: ${s.fx(s.w, s.h).toFixed(4)}`);
  await page.close();
}
await browser.close();
