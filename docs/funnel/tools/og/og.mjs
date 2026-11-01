// Renders the static share image and the raster icons from the repo's SVG logo.
//   public/og.ru.png            1200×630, from og.html (fonts from Google Fonts, needs network)
//   public/logo-512.png         512×512, transparent (JSON-LD Organization.logo, PNG favicon)
//   public/apple-touch-icon.png 180×180, navy background (Apple wants it opaque)
// usage: copy this file into the scratch dir that has playwright-core (ESM resolves packages from
// the script's own folder) and run `node og.mjs <repo root>`; needs /usr/bin/google-chrome.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { copyFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const here = path.join(root, 'docs/funnel/tools/og');
const pub = path.join(root, 'public');

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });

// 1. OG image. The template references logo.svg next to it; copy the real one in for the render.
const logoCopy = path.join(here, 'logo.svg');
copyFileSync(path.join(pub, 'logo.svg'), logoCopy);
try {
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(path.join(here, 'og.html')).href, { waitUntil: 'load', timeout: 180000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(pub, 'og.ru.png'), type: 'png' });
  console.log('og.ru.png');
} finally {
  unlinkSync(logoCopy);
}

// 2. Icons from the logo (rendered through a temp file next to it: about:blank cannot load file://).
const icon = async (size, bg, file, pad = 0) => {
  const tmp = path.join(pub, `.icon-${size}.html`);
  writeFileSync(tmp, `<body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px">
    <img src="logo.svg" style="width:${size - 2 * pad}px;height:${size - 2 * pad}px;object-fit:contain"></body>`);
  try {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    await p.screenshot({ path: path.join(pub, file), omitBackground: bg === 'transparent' });
    console.log(file);
  } finally {
    unlinkSync(tmp);
  }
};
await icon(512, 'transparent', 'logo-512.png', 24);
await icon(180, '#0f141b', 'apple-touch-icon.png', 26);

await b.close();
