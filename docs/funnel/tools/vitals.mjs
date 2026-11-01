// Lab check of the budgets: LCP, JS on first load, layout shift, what the first screen shows.
// usage: node vitals.mjs URL   (run against a production build: `pnpm build && pnpm start -p 3124`)
// Phone profile: 360x640 @2x, CPU slowed 4x, network ~"fast 3G" (1.6 Mbit/s, 150 ms RTT).
// Budgets (docs/funnel/plan.md): LCP < 2.5 s, first-load JS <= 100 KB gzip, CLS < 0.05,
// headline + subhead + main button visible on 360x640 without scrolling.
import { chromium } from 'playwright-core';
const [url] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ru-RU' });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const types = new Map(); const bytes = {};
cdp.on('Network.responseReceived', e => types.set(e.requestId, e.type));
cdp.on('Network.loadingFinished', e => { const t = types.get(e.requestId) || 'Other'; bytes[t] = (bytes[t] || 0) + e.encodedDataLength; });
await p.addInitScript(() => {
  window.__lcp = 0; window.__cls = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
});
await p.goto(url, { waitUntil: 'load', timeout: 180000 });
await p.waitForTimeout(4000);
const r = await p.evaluate(() => {
  const vis = sel => { const el = document.querySelector(sel); if (!el) return 'missing'; const b = el.getBoundingClientRect(); return b.bottom <= innerHeight && b.top >= 0 ? 'yes' : `no (bottom ${Math.round(b.bottom)}px)`; };
  return { lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3), h1: vis('h1'), lead: vis('[data-hero-lead]'), cta: vis('[data-hero-cta]') };
});
const kb = t => Math.round((bytes[t] || 0) / 1024);
console.log(JSON.stringify({ ...r, jsKB: kb('Script'), cssKB: kb('Stylesheet'), fontKB: kb('Font'), imgKB: kb('Image'), mediaKB: kb('Media') }, null, 1));
console.log(r.lcp < 2500 && kb('Script') <= 100 && r.cls < 0.05 && r.h1 === 'yes' && r.lead === 'yes' && r.cta === 'yes' ? 'BUDGETS OK' : 'BUDGETS FAILED');
await b.close();
