async () => {
  // The landing's trip section: bend i is reached at i screens (svh) of
  // scroll into the section. Each segment drives from one bend to the next,
  // 1.5 s per screen, and reports fps, the 95th percentile frame and jank
  // (frames over 25 ms). Run with cdp.mjs.
  //
  // With the 3D map the quality meter (components/world3d/quality.ts) works
  // during the first segments: `q` is the tier it ended on, `qlog` what it
  // saw ("tier:p75 ms" per window), `flat` why the flat map took over, if it
  // did. For a tier's own numbers, hold it: ?q=1 (no meter).
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const sec = document.getElementById("trip");
  const vh = sec.querySelector("[class*=probe]").getBoundingClientRect().height;
  const top = sec.getBoundingClientRect().top + scrollY;
  const names = ["0 герой", "1 груз", "2 ссылка", "3 погрузка", "4 едет", "5 чайхана", "6 перевал", "7 волна", "8 клиент", "9 доставка", "финал"];
  const idle = await new Promise((res) => { const t = []; let l = 0; const f = (now) => { if (l) t.push(now - l); l = now; t.length < 90 ? requestAnimationFrame(f) : res(t); }; requestAnimationFrame(f); });
  scrollTo(0, top); await sleep(2500);
  const out = { map: sec.dataset.map, dpr: devicePixelRatio, screen: `${innerWidth}x${innerHeight}`, idleMs: +(idle.reduce((a, b) => a + b) / idle.length).toFixed(1), seg: [] };
  // the finale is 1.1 screens past bend 9 (FINALE), 3D only
  const ends = names.map((_, s) => (s < 10 ? s + 1 : 11.1));
  for (let s = 0; s < names.length; s++) {
    if (s === 10 && sec.dataset.map !== "3d") break;
    const [a, b] = [s, ends[s]];
    const dur = (b - a) * 1500;
    const times = [];
    await new Promise((res) => {
      let last = 0, t0 = 0;
      const f = (now) => {
        if (!t0) t0 = now; else times.push(now - last);
        last = now;
        const k = Math.min(1, (now - t0) / dur);
        scrollTo(0, top + (a + (b - a) * k) * vh);
        k < 1 ? requestAnimationFrame(f) : res();
      };
      requestAnimationFrame(f);
    });
    await sleep(600);
    const sorted = [...times].sort((x, y) => x - y);
    const avg = times.reduce((x, y) => x + y, 0) / times.length;
    out.seg.push({ ch: names[s], fps: Math.round(1000 / avg), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1), jank: Math.round((100 * times.filter((x) => x > 25).length) / times.length) + "%" });
  }
  const host = sec.querySelector("[data-q]");
  Object.assign(out, { map: sec.dataset.map, flat: sec.dataset.flat ?? "", q: host?.dataset.q ?? "", qlog: host?.dataset.qlog ?? "" });
  return out;
}
