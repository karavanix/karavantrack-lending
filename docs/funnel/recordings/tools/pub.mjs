// Records the public tracking page as a recipient's phone sees it (390x844 @3x, RU, light).
// usage: node pub.mjs OUT_DIR URL SECONDS
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [outDir, url, secs] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome',
  args: ['--force-device-scale-factor=3', '--window-size=390,844', '--lang=ru-RU'],
  env: { ...process.env, LANG: 'ru_RU.UTF-8', LANGUAGE: 'ru' } });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  locale: 'ru-RU', timezoneId: 'Asia/Tashkent',
  userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
await ctx.addInitScript(() => {
  localStorage.setItem('yoollive-locale', JSON.stringify({ state: { locale: 'ru' }, version: 0 }));
  localStorage.setItem('yoollive-theme', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
});
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'commit' });
await p.waitForSelector('canvas', { timeout: 150000 });
await p.waitForTimeout(12000);
await p.screenshot({ path: `${outDir}/start.png` });
log('page ready');
const cdp = await ctx.newCDPSession(p);
let n = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  fs.writeFileSync(`${outDir}/f_${Math.round(metadata.timestamp * 1000)}.jpg`, Buffer.from(data, 'base64'));
  n++;
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1170, maxHeight: 2532, everyNthFrame: 2 });
await p.waitForTimeout(+secs * 1000);
await cdp.send('Page.stopScreencast');
await p.screenshot({ path: `${outDir}/end.png` });
log('frames', n);
await b.close();
