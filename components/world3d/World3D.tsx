"use client";

// The 3D map in place of the flat one (TopDown, ?map=3d). A canvas pinned to
// the screen for the whole section, with the map's words over it
// (Overlays.tsx) and the invisible anchors the impulses aim at. three.js
// comes in with the engine, after the page is up.
//
// TopDown talks to the engine through `link`: it always leaves its latest
// frame there, so an engine that loads late starts from where the trip is.

import { useEffect, useRef } from "react";
import { CAMERA, RINGS } from "../topdown/chapters";
import type { Layout } from "../topdown/road";
import type { Engine, Frame, View } from "./engine";
import { Overlays } from "./Overlays";
import s from "./world3d.module.css";

export type Link = { frame: Frame | null; engine: Engine | null };

// The truck's place on a phone screen: in the upper part, above the card and
// the participants' strip docked at the bottom.
const PHONE_AIM = 0.4;
// Card width on desktop, as in topdown.module.css (.card --cw).
const cardW = (L: Layout) => Math.min(400, L.roadW - 120);

// Desktop: cards always on the left, the truck between them and the
// participants' column. Phone: in the middle, above the card.
export function viewOf(L: Layout): View {
  if (L.wide) {
    const free: [number, number] = [32 + cardW(L), L.roadW];
    return { wide: true, aimX: (free[0] + free[1]) / 2, aimY: CAMERA * L.vh, free };
  }
  return { wide: false, aimX: L.vw / 2, aimY: PHONE_AIM * L.vh, free: [0, L.vw] };
}

export function World3D({ L, link, onFail }: { L: Layout; link: Link; onFail: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLSpanElement>(null);
  const pinRef = useRef<HTMLSpanElement>(null);
  const ringRefs = useRef<HTMLSpanElement[]>([]);
  const view = useRef(viewOf(L));
  view.current = viewOf(L);
  const fail = useRef(onFail);
  fail.current = onFail;

  useEffect(() => {
    let dead = false;
    let engine: Engine | null = null;
    import("./engine")
      .then(({ createEngine }) => {
        if (dead) return null;
        return createEngine(
          hostRef.current!,
          { truck: truckRef.current!, pin: pinRef.current!, rings: ringRefs.current },
          view.current,
        );
      })
      .then((e) => {
        if (!e) return;
        // gone while the world was being built
        if (dead) return e.dispose();
        engine = e;
        link.engine = e;
        e.setView(view.current); // the layout may have changed meanwhile
        if (link.frame) e.set(link.frame);
      })
      .catch(() => !dead && fail.current());
    return () => {
      dead = true;
      link.engine = null;
      engine?.dispose();
    };
  }, [link]);

  useEffect(() => {
    link.engine?.setView(viewOf(L));
  }, [L, link]);

  return (
    <div className={s.stage}>
      <div ref={hostRef} className={s.view} aria-hidden>
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
