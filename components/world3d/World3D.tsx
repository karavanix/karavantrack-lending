"use client";

// The 3D map in place of the flat one (TopDown). A canvas pinned to the
// screen for the whole section, with the map's words over it (Overlays.tsx)
// and the invisible anchors the impulses aim at. three.js comes in with the
// engine, after the page is up; until its first frame a picture of that
// frame stands in (the poster, public/3d/, docs/3d/tools/poster.mjs), so the
// first screen is never empty.
//
// TopDown talks to the engine through `link`: it always leaves its latest
// frame there, so an engine that loads late starts from where the trip is.
//
// Back to the flat map (onFail) when there is no WebGL or only a CPU-drawn
// one, when the engine fails to load, when the device is too slow for the
// lowest tier (quality.ts), or when the WebGL context is lost a second time
// (the first time the world is built again).
//
// For tests: ?q=0…3 holds a tier (no meter), ?gl=soft lets CPU-drawn WebGL
// through.

import { useEffect, useRef, useState } from "react";
import { CAMERA, RINGS } from "../topdown/chapters";
import type { Layout } from "../topdown/road";
import type { Engine, Frame, View } from "./engine";
import { Overlays } from "./Overlays";
import { START, TIERS, canGL } from "./quality";
import s from "./world3d.module.css";

export type Link = { frame: Frame | null; engine: Engine | null };
export type Why = "nogl" | "error" | "slow" | "lost";

// The truck's place on a phone screen: in the upper part, above the card and
// the participants' strip docked at the bottom.
const PHONE_AIM = 0.4;
// Card width on desktop, as in topdown.module.css (.card --cw).
const cardW = (L: Layout) => Math.min(400, L.roadW - 120);
// Opened further down than this (screens into the section), the poster of
// the first screen would show the wrong place: none at all then.
const POSTER_UNTIL = 0.3;

// Desktop: cards always on the left, the truck between them and the
// participants' column. Phone: in the middle, above the card. The poster's
// placing in world3d.module.css follows these numbers.
export function viewOf(L: Layout): View {
  if (L.wide) {
    const free: [number, number] = [32 + cardW(L), L.roadW];
    return { wide: true, aimX: (free[0] + free[1]) / 2, aimY: CAMERA * L.vh, free };
  }
  return { wide: false, aimX: L.vw / 2, aimY: PHONE_AIM * L.vh, free: [0, L.vw] };
}

export function World3D({ L, link, onFail }: { L: Layout | null; link: Link; onFail: (why: Why) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLSpanElement>(null);
  const pinRef = useRef<HTMLSpanElement>(null);
  const ringRefs = useRef<HTMLSpanElement[]>([]);
  const view = useRef<View | null>(null);
  view.current = L ? viewOf(L) : null;
  const fail = useRef(onFail);
  fail.current = onFail;
  // builds so far: a lost context gets one more
  const [build, setBuild] = useState(0);
  const laidOut = !!L;

  useEffect(() => {
    if (!laidOut) return;
    const host = hostRef.current!;
    const q = new URLSearchParams(window.location.search);
    if (build === 0) {
      const top = host.parentElement!.getBoundingClientRect().top;
      if (-top > POSTER_UNTIL * window.innerHeight) host.dataset.poster = "0";
    }
    if (!canGL(q.get("gl") === "soft")) {
      fail.current("nogl");
      return;
    }
    const held = Number(q.get("q") ?? NaN);
    const tier = TIERS[held] ? held : view.current!.wide ? START.wide : START.narrow;
    let dead = false;
    let engine: Engine | null = null;
    import("./engine")
      .then(({ createEngine }) => {
        if (dead) return null;
        return createEngine(
          host,
          { truck: truckRef.current!, pin: pinRef.current!, rings: ringRefs.current },
          view.current!,
          {
            tier,
            auto: !TIERS[held],
            onSlow: () => !dead && fail.current("slow"),
            onLost: () => {
              if (dead) return;
              if (build === 0) setBuild(1);
              else fail.current("lost");
            },
          },
        );
      })
      .then((e) => {
        if (!e) return;
        // gone while the world was being built
        if (dead) return e.dispose();
        engine = e;
        link.engine = e;
        e.setView(view.current!); // the layout may have changed meanwhile
        if (link.frame) e.set(link.frame);
      })
      .catch(() => !dead && fail.current("error"));
    return () => {
      dead = true;
      link.engine = null;
      engine?.dispose();
    };
  }, [link, laidOut, build]);

  useEffect(() => {
    if (L) link.engine?.setView(viewOf(L));
  }, [L, link]);

  return (
    <div className={s.stage}>
      <div ref={hostRef} className={s.view} aria-hidden>
        {/* the first frame, until the engine draws it */}
        <picture className={s.poster}>
          <source media="(min-width: 1024px)" srcSet="/3d/hero-wide.webp" />
          <img src="/3d/hero-narrow.webp" alt="" decoding="async" />
        </picture>
        <Overlays />
        <span ref={truckRef} className={`${s.anchor} ${s.truck}`} data-anchor="truck" />
        <span ref={pinRef} className={s.anchor} data-anchor="pin" />
        {RINGS.map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) ringRefs.current[i] = el;
            }}
            className={s.anchor}
            data-anchor={`ring-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
