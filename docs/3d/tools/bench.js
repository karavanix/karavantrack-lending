async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const H = innerHeight;
  const names = ["герой", "план сверху", "водитель", "погрузка", "едет", "чайхана", "перевал", "волна", "клиент", "доставлено", "финал"];
  const segs = [[0, 1], [1, 2.2], [2.2, 3.3], [3.3, 4.2], [4.2, 5.8], [5.8, 7.5], [7.5, 8.8], [8.8, 10.2], [10.2, 11.6], [11.6, 13], [13, 14]];
  // idle refresh rate
  const idle = await new Promise((res) => { const t = []; let l = 0; const f = (now) => { if (l) t.push(now - l); l = now; t.length < 90 ? requestAnimationFrame(f) : res(t); }; requestAnimationFrame(f); });
  scrollTo(0, 0); await sleep(2500);
  const out = { dpr: devicePixelRatio, screen: `${innerWidth}x${innerHeight}`, idleMs: +(idle.reduce((a, b) => a + b) / idle.length).toFixed(1), seg: [] };
  for (let s = 0; s < segs.length; s++) {
    const [a, b] = segs[s];
    const dur = (b - a) * 1500;
    const times = [];
    await new Promise((res) => {
      let last = 0, t0 = 0;
      const f = (now) => {
        if (!t0) t0 = now; else times.push(now - last);
        last = now;
        const k = Math.min(1, (now - t0) / dur);
        scrollTo(0, (a + (b - a) * k) * H);
        k < 1 ? requestAnimationFrame(f) : res();
      };
      requestAnimationFrame(f);
    });
    await sleep(600);
    const sorted = [...times].sort((x, y) => x - y);
    const avg = times.reduce((x, y) => x + y, 0) / times.length;
    out.seg.push({ ch: names[s], fps: Math.round(1000 / avg), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1), jank: Math.round((100 * times.filter((x) => x > 25).length) / times.length) + "%" });
  }
  return out;
}
