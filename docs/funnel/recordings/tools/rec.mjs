// Records the cabinet as the demo dispatcher (RU, light, 1440x900 @2x) via CDP screencast.
// usage: node rec.mjs OUT_DIR PATH [--zoom N]
// Frames go to OUT_DIR/f_<ms>.jpg; recording runs until OUT_DIR/STOP exists.
// Touch OUT_DIR/SHOT to save a full-quality PNG screenshot (OUT_DIR/shot_<ms>.png).
// Frames are kept only while OUT_DIR/REC exists. OUT_DIR/CLICK holds a text to click on the page.
// OUT_DIR/CMD holds an async JS body run as (p, ctx) => {...}; its result goes to OUT_DIR/CMD.out.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [outDir, path] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=gl', '--enable-gpu', '--force-device-scale-factor=2', '--window-size=1440,900', '--lang=ru-RU'], env: { ...process.env, LANG: 'ru_RU.UTF-8', LANGUAGE: 'ru' } });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'ru-RU', timezoneId: 'Asia/Tashkent' });
await ctx.addInitScript(() => {
  localStorage.setItem('yoollive-locale', JSON.stringify({ state: { locale: 'ru' }, version: 0 }));
  localStorage.setItem('yoollive-theme', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
});
const p = await ctx.newPage();
await p.goto('https://app.yool.live/login', { waitUntil: 'commit' });
await p.waitForSelector('input[type=email]', { timeout: 150000 });
await p.fill('input[type=email]', 'dilnoza@demo.yool.live');
await p.fill('input[type=password]', process.env.DEMO_PW);
await p.click('button[type=submit]');
await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 });
await p.goto('https://app.yool.live' + path, { waitUntil: 'commit' });
await p.waitForTimeout(12000);
log('page ready', path);

const cdp = await ctx.newCDPSession(p);
let n = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  if (fs.existsSync(`${outDir}/REC`)) {
    fs.writeFileSync(`${outDir}/f_${Math.round(metadata.timestamp * 1000)}.jpg`, Buffer.from(data, 'base64'));
    n++;
  }
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 2880, maxHeight: 1800, everyNthFrame: 2 });
log('recording');
let last = 0;
while (!fs.existsSync(`${outDir}/STOP`)) {
  if (fs.existsSync(`${outDir}/SHOT`)) {
    fs.unlinkSync(`${outDir}/SHOT`);
    const f = `${outDir}/shot_${Date.now()}.png`;
    await p.screenshot({ path: f });
    log('shot', f);
  }
  if (fs.existsSync(`${outDir}/CMD`)) {
    const body = fs.readFileSync(`${outDir}/CMD`, 'utf8');
    fs.unlinkSync(`${outDir}/CMD`);
    let out;
    try { out = await (new Function('p', 'ctx', `return (async () => { ${body} })()`))(p, ctx); }
    catch (e) { out = 'ERROR ' + e.message; }
    fs.writeFileSync(`${outDir}/CMD.out`, String(out ?? 'ok'));
    log('cmd done');
  }
  if (fs.existsSync(`${outDir}/CLICK`)) {
    const text = fs.readFileSync(`${outDir}/CLICK`, 'utf8').trim();
    fs.unlinkSync(`${outDir}/CLICK`);
    await p.getByText(text).first().click({ timeout: 5000 }).then(() => log('clicked', text), e => log('click failed', text, e.message.slice(0, 80)));
  }
  await p.waitForTimeout(500);
  if (Date.now() - last > 60000) { log('frames', n); last = Date.now(); }
}
await cdp.send('Page.stopScreencast');
log('stopped, frames', n);
await b.close();
