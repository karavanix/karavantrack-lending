// Records telegram-anim.html (window.play(), 9 s) as frames for frames2mp4.py → clip #11, 720×1528.
// usage: node rec-telegram.mjs OUT_DIR [SECONDS=9.2]   — playwright-core + /usr/bin/google-chrome.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [outDir, secs = '9.2'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.env.TG_HTML || path.join(here, '..', 'telegram-anim.html');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--force-device-scale-factor=2', '--window-size=360,764', '--lang=ru-RU'] });
const ctx = await b.newContext({ viewport: { width: 360, height: 764 }, deviceScaleFactor: 2, locale: 'ru-RU' });
const p = await ctx.newPage();
await p.goto('file://' + src, { waitUntil: 'load' });
await p.waitForTimeout(500);
const cdp = await ctx.newCDPSession(p);
let n = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  fs.writeFileSync(`${outDir}/f_${Math.round(metadata.timestamp * 1000)}.jpg`, Buffer.from(data, 'base64'));
  n++;
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 720, maxHeight: 1528, everyNthFrame: 1 });
await p.waitForTimeout(300);
await p.evaluate(() => window.play());
await p.waitForTimeout(Number(secs) * 1000);
await cdp.send('Page.stopScreencast');
console.log('frames', n);
await b.close();
