// node trip.mjs <w> <h> <out-prefix> <S>...   (S in screens)
import { chromium } from "playwright-core";
const [w, h, out, ...ss] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errs.push(m.text()));
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(`http://localhost:3123/lab/trip.html`, { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
for (const s of ss) {
  await p.evaluate((s) => scrollTo(0, s * innerHeight), +s);
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${out}-${s}.png` });
}
console.log(await p.locator("#fps").textContent(), errs.join("\n"));
await b.close();
