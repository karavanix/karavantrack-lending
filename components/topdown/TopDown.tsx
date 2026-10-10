"use client";

// The trip seen from above. The page is one tall map; the road snakes down it
// and the truck drives it as you scroll, held at CAMERA of the screen height.
// Truck, track and clock are scrubbed with the scroll ("trip time"). Each
// chapter, once the truck reaches its bend, plays a short timed scene between
// the participants (scenes.ts); scrolling back above it rolls the state back.
//
// Desktop: participants in a sticky column on the right, map and cards on
// the left two thirds. Phone: a sticky strip of two tiles at the bottom.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight } from "lucide-react";
import s from "./topdown.module.css";
import { CAMERA, CHAPTERS, K, OFFLINE_FROM, OFFLINE_TO, SECTION_SCREENS, anchorOf, fmtClock } from "./chapters";
import { Road, cameraOf, dashRanges, makeLayout, minuteAt, truckY, type Layout } from "./road";
import { MapArt } from "./MapArt";
import { Truck } from "./Truck";
import { Panel, Phone, Strip } from "./Participants";
import { createWorld, STATE_AFTER, when } from "./world";
import { createPulses } from "./pulse";
import { SCENES } from "./scenes";
import { SITE } from "@/lib/site";

export function TopDown() {
  const t = useTranslations("trip");
  const td = useTranslations("td");
  const rootRef = useRef<HTMLElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<Layout | null>(null);
  const road = useMemo(() => (L ? new Road(L) : null), [L]);
  const labels = useRef({ telegram: td("pulse.telegram") });

  // Measure one screen (100svh, steady while mobile browser bars come and go).
  useEffect(() => {
    let last = "";
    const measure = () => {
      const vh = probeRef.current!.getBoundingClientRect().height;
      const vw = document.documentElement.clientWidth;
      const key = `${vw}:${Math.round(vh)}`;
      if (key === last) return;
      last = key;
      setL(makeLayout(vw, vh));
    };
    measure();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !L || !road) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

    const world = createWorld(root);
    const pulses = createPulses(root, pulseRef.current!);
    const truck = q("[data-truck]");
    const casing = q<SVGPathElement>('[data-track="casing"]');
    const line = q<SVGPathElement>('[data-track="line"]');
    const dots = qa<SVGCircleElement>('[data-track="dots"] circle').map((el) => ({ el, l: Number(el.dataset.l) }));
    const clocks = qa("[data-bind='clock']");

    // The phone in the desktop column shrinks to fit what is left under the panel.
    if (L.wide) {
      root.style.setProperty("--pz", "1");
      const rail = q(`.${s.railIn}`).getBoundingClientRect();
      const phone = q("[data-part='phone-body']").getBoundingClientRect();
      const room = rail.bottom - 16 - phone.top;
      root.style.setProperty("--pz", String(Math.min(1, Math.max(0.5, room / phone.height))));
    }

    const lStart = road.lenAt(L.anchors[2]); // tracking starts once the load is accepted
    const lOff = road.lenAt(anchorOf(OFFLINE_FROM) * L.vh);
    const lOn = road.lenAt(anchorOf(OFFLINE_TO) * L.vh);
    let lastDash = "";
    let lastClock = "";
    let shown = 0;

    const draw = (cam: number) => {
      const y = truckY(cam, L);
      const x = road.xAt(y);
      const angle = (-Math.atan(road.slopeAt(y)) * 180) / Math.PI;
      truck.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${angle.toFixed(2)}deg) scale(${L.k})`;

      // Track: blue = the server has it; grey dots = still on the phone.
      const l = road.lenAt(y);
      let ranges: [number, number][] = [];
      let pending = 0;
      if (l > lStart) {
        if (l > lOff && l < lOn) {
          ranges = [[lStart, lOff]];
          pending = l;
        } else ranges = [[lStart, l]];
      }
      const dash = dashRanges(ranges, road.total);
      if (dash !== lastDash) {
        lastDash = dash;
        casing.setAttribute("stroke-dasharray", dash);
        line.setAttribute("stroke-dasharray", dash);
      }
      let n = 0;
      if (pending) while (n < dots.length && dots[n].l <= pending) n++;
      if (n !== shown) {
        for (let i = Math.min(n, shown); i < Math.max(n, shown); i++) dots[i].el.style.display = i < n ? "" : "none";
        shown = n;
      }

      const clock = fmtClock(minuteAt(cam, L));
      if (clock !== lastClock) {
        lastClock = clock;
        for (const el of clocks) el.textContent = clock;
      }
    };

    // Buttons a scene presses: a ring around it, a dip and a ripple.
    const press = (name: string) => {
      const btns = qa(`[data-press="${name}"]`);
      const ripples = btns.map((b) => b.querySelector("[data-ripple]"));
      return gsap
        .timeline()
        .set(btns, { attr: { "data-hot": "1" } })
        .to(btns, { scale: 0.94, duration: 0.14, ease: "power2.out" }, 0.25)
        .fromTo(ripples, { scale: 0, opacity: 0.55 }, { scale: 2.4, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.3)
        .to(btns, { scale: 1, duration: 0.3, ease: "back.out(3)" }, 0.4)
        .set(btns, { attr: { "data-hot": "0" } }, 0.75);
    };
    const resetPresses = () => {
      gsap.set(qa("[data-press]"), { scale: 1, attr: { "data-hot": "0" } });
      gsap.set(qa("[data-ripple]"), { opacity: 0 });
    };

    const ctx = { world, pulses, press, labels: labels.current, wide: L.wide };
    let scene: gsap.core.Timeline | null = null;
    const stop = () => {
      scene?.kill();
      scene = null;
      pulses.clear();
      resetPresses();
    };
    // Into chapter i: play its scene from the previous chapter's state, or just
    // show where things stand (scrolling back, or reduced motion).
    const enter = (i: number, play: boolean) => {
      stop();
      const sceneOf = SCENES[i];
      if (play && sceneOf && !reduce) {
        world.set({ ...STATE_AFTER[i - 1], ch: i });
        scene = sceneOf(ctx);
      } else world.set(STATE_AFTER[i]);
    };
    world.set(STATE_AFTER[0]);

    const sc = gsap.context(() => {
      const cam = { s: L.anchors[0] };
      const span = L.height - L.vh;
      gsap.to(cam, {
        s: cameraOf(span, L),
        ease: "none",
        onUpdate: () => draw(cam.s),
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${span}`,
          scrub: reduce ? true : 0.35,
        },
      });
      for (let i = 1; i < K; i++) {
        // A beat before the truck pulls into the bend.
        const at = L.anchors[i] - 0.04 * L.vh - CAMERA * L.vh;
        ScrollTrigger.create({
          trigger: root,
          start: `top+=${at.toFixed(0)} top`,
          end: "bottom top",
          onEnter: () => enter(i, true),
          onEnterBack: () => enter(i, false),
          onLeaveBack: () => enter(i - 1, false),
        });
      }
    }, root);
    draw(L.anchors[0]);
    ScrollTrigger.refresh();

    return () => {
      stop();
      sc.revert();
    };
  }, [L, road]);

  const chapters = t.raw("chapters") as { title: string; text: string }[];
  const first = L && road ? road.at(road.lenAt(L.anchors[2])) : null;

  return (
    <section
      ref={rootRef}
      id="trip"
      className={s.td}
      data-ch="0"
      data-active="none"
      style={{ height: `${SECTION_SCREENS * 100}svh` }}
    >
      <div ref={probeRef} className={s.probe} aria-hidden />

      <div className={s.map} aria-hidden>
        {L && road && <MapArt L={L} road={road} />}
        <div className={s.truck} data-truck data-anchor="truck" style={L ? undefined : { visibility: "hidden" }}>
          <Truck />
        </div>
        {first && (
          <span className={s.first} {...when("first=1")} style={{ left: first.x, top: first.y }}>
            <i />
          </span>
        )}
      </div>

      <div className={s.cards}>
        <article className={`${s.card} ${s.hero}`} data-side="L" style={{ "--a": anchorOf(0) } as React.CSSProperties}>
          <h1 className={s.heroTitle}>{t("hero.title")}</h1>
          <p className={s.heroSub}>{t("hero.subtitle")}</p>
          <div className={s.ctas}>
            <a className={s.ctaPrimary} href={SITE.register}>
              {t("hero.cta")} <ArrowRight size={18} />
            </a>
            <a className={s.ctaGhost} href="#drivers">
              {t("hero.driver")}
            </a>
          </div>
          <span className={s.hint}>
            <ArrowDown size={16} /> {t("scroll")}
          </span>
        </article>
        {chapters.map((c, j) => {
          const i = j + 1;
          return (
            <article
              key={i}
              className={s.card}
              data-side={CHAPTERS[i].side}
              data-hold={CHAPTERS[i].hold ? "1" : "0"}
              style={{ "--a": anchorOf(i) } as React.CSSProperties}
            >
              <div className={s.meta}>
                <span className={s.time}>{fmtClock(CHAPTERS[i].minute)}</span>
                <span>{t("chapterOf", { n: i, total: K - 1 })}</span>
              </div>
              <h2 className={s.title}>{c.title}</h2>
              <p className={s.text}>{c.text}</p>
            </article>
          );
        })}
      </div>

      <div className={s.rail}>
        <div className={s.railIn}>
          <div className={s.railHead}>
            <span className={s.clock} data-bind="clock">
              {fmtClock(CHAPTERS[0].minute)}
            </span>
            <span>{t("route")}</span>
          </div>
          <Panel />
          <Phone />
        </div>
      </div>

      <div className={s.stripRail}>
        <Strip />
      </div>

      <div ref={pulseRef} className={s.pulses} aria-hidden>
        <svg width="100%" height="100%" />
      </div>
    </section>
  );
}
