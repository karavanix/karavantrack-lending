// Records frame #10 «Создайте груз» in the cabinet, hands-free: opens «Новый груз», pastes a 2GIS
// link into the pickup field (the form resolves the address), then one into the drop-off field
// (the route and «≈ km · h min» appear), types the title and the ref. The load is NOT created.
// usage: node rec-create.mjs OUT_DIR DEMO_PW_FILE   — playwright-core + /usr/bin/google-chrome, as rec.mjs.
// Frames: OUT_DIR/f_<ms>.jpg (CDP screencast, 2880×1800); OUT_DIR/marks.txt has the moment of each
// action in seconds from the first frame, for zoom.py keyframes.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [outDir, pwFile] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const pw = fs.readFileSync(pwFile, 'utf8').trim();
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

// Load A of the shoot: Tashkent, Sergeli → Samarkand (same points as the hero, 2GIS puts lng first).
const LINK_PICKUP = 'https://2gis.uz/tashkent/geo/70000001030234571?m=69.221000%2C41.218500%2F17.2';
const LINK_DROPOFF = 'https://2gis.uz/samarkand/geo/70000001041155609?m=66.920000%2C39.670000%2F16.5';

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome',
  args: ['--use-angle=gl', '--enable-gpu', '--force-device-scale-factor=2', '--window-size=1440,900', '--lang=ru-RU'],
  env: { ...process.env, LANG: 'ru_RU.UTF-8', LANGUAGE: 'ru' } });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'ru-RU', timezoneId: 'Asia/Tashkent' });
await ctx.addInitScript(() => {
  localStorage.setItem('yoollive-locale', JSON.stringify({ state: { locale: 'ru' }, version: 0 }));
  localStorage.setItem('yoollive-theme', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
});
const p = await ctx.newPage();
await p.goto('https://app.yool.live/login', { waitUntil: 'commit' });
await p.waitForSelector('input[type=email]', { timeout: 150000 });
await p.fill('input[type=email]', 'dilnoza@demo.yool.live');
await p.fill('input[type=password]', pw);
await p.click('button[type=submit]');
await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 });
await p.waitForTimeout(6000);
await p.mouse.move(720, 450);
log('dashboard ready');

const cdp = await ctx.newCDPSession(p);
let n = 0, first = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  const ms = Math.round(metadata.timestamp * 1000);
  if (!first) first = ms;
  fs.writeFileSync(`${outDir}/f_${ms}.jpg`, Buffer.from(data, 'base64'));
  n++;
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 2880, maxHeight: 1800, everyNthFrame: 1 });
const t0 = Date.now();
const marks = [];
const mark = (name) => { const t = ((Date.now() - t0) / 1000).toFixed(2); marks.push(`${t} ${name}`); log(t, name); };
const wait = (ms) => p.waitForTimeout(ms);
// Dispatches a real-looking paste: the input shows the link for a moment, then the form's paste
// handler (parseMapLink → reverse geocode) replaces it with the address.
async function pasteLink(selector, link, name) {
  const el = p.locator(selector);
  await el.click(); mark(`${name} focus`);
  await wait(700);
  await el.fill(link); mark(`${name} link shown`);
  await wait(650);
  await el.evaluate((input, text) => {
    const dt = new DataTransfer(); dt.setData('text/plain', text);
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, link);
  mark(`${name} parsed`);
}

await wait(1200);
await p.getByRole('button', { name: /новый груз/i }).first().click(); mark('open form');
await wait(1800);
await pasteLink('#modal-pickup-search', LINK_PICKUP, 'pickup');
await wait(3200);
await pasteLink('#modal-dropoff-search', LINK_DROPOFF, 'dropoff');
await wait(4200); mark('route shown');
await p.locator('#modal-load-title').click();
await p.locator('#modal-load-title').pressSequentially('Цемент М500, 22 т', { delay: 55 }); mark('title typed');
await wait(400);
await p.locator('#modal-load-ref').click();
await p.locator('#modal-load-ref').pressSequentially('YL-1045', { delay: 70 }); mark('ref typed');
await wait(600);
await p.mouse.move(1000, 620); // off the fields, the whole form in view
await wait(2600); mark('end');

await cdp.send('Page.stopScreencast');
fs.writeFileSync(`${outDir}/marks.txt`, marks.join('\n') + '\n');
await p.screenshot({ path: `${outDir}/final.png` });
log('stopped, frames', n, 'first frame ms', first);
await b.close();
