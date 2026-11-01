// Renders ../telegram.html (frame #4, a Telegram chat replica) as a 720×1528 phone screen.
// usage: node shot-telegram.mjs OUT.png   — needs playwright-core next to it (same as shot.mjs) and /usr/bin/google-chrome.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.env.TG_HTML || path.join(here, '..', 'telegram.html');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--lang=ru-RU'] });
const ctx = await b.newContext({ viewport: { width: 360, height: 764 }, deviceScaleFactor: 2, locale: 'ru-RU' });
const p = await ctx.newPage();
await p.goto('file://' + src, { waitUntil: 'load' });
await p.waitForTimeout(300);
await p.screenshot({ path: process.argv[2] });
await b.close();
console.log(process.argv[2]);
