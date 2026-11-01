// Full-page screenshots of the landing at phone and desktop widths.
// usage: node shot.mjs URL OUT_PREFIX [widths=360,390,1440]
// Needs playwright-core (npm i playwright-core@1.48.2 in a scratch dir) and /usr/bin/google-chrome.
// Writes OUT_PREFIX-<w>.png (full page) and OUT_PREFIX-<w>-fold.png (first screen), prints page heights.
import { chromium } from 'playwright-core';
const [url, out, widths = '360,390,1440'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--lang=ru-RU'] });
for (const w of widths.split(',').map(Number)) {
  const h = w < 800 ? (w === 360 ? 640 : 844) : 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1,
    isMobile: w < 800, hasTouch: w < 800, locale: 'ru-RU', reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}-${w}-fold.png` });
  // scroll through so lazy blocks and reveal-on-view settle before the full shot
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h / 2) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}-${w}.png`, fullPage: true });
  console.log(w, 'height', H);
  await ctx.close();
}
await b.close();
