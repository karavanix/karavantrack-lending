"use client";

// The trip seen from above. The page is one tall map; the road snakes down it
// and the truck drives it as you scroll, held at CAMERA of the screen height.
// Truck, track and clock are scrubbed with the scroll ("trip time"). Each
// chapter, once the truck reaches its bend, plays a short timed scene between
// the participants (scenes.ts); scrolling back above it rolls the state back.
//
// Desktop: participants in a sticky column on the right, map and cards on
// the left two thirds. Phone: a sticky strip of two tiles at the bottom.
//
// ?map=3d swaps the flat map for the 3D world (components/world3d, being
// built in sessions, docs/3d/plan.md). The flat map stays in the page,
// hidden: it is the fallback, and its drawing code keeps working.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight } from "lucide-react";
import s from "./topdown.module.css";
import {
  ARRIVE_MIN,
  CAMERA,
  CHAPTERS,
  DEPOT_END,
  DROPOFF_AT,
  DUSK_MIN,
  FINALE,
  K,
  LEAD,
  OFFLINE_FROM,
  OFFLINE_TO,
  PICKUP_AT,
  QUEUED,
  RINGS,
  ROUTE_KM,
  SECTION_SCREENS,
  STOP,
  anchorOf,
  fmtClock,
} from "./chapters";
import { Road, cameraOf, dashRanges, departOf, makeLayout, minuteAt, posAtY, truckY, type Layout } from "./road";
import { MapArt } from "./MapArt";
import { Truck } from "./Truck";
import { Panel, Phone, RECEIVER_W, Receiver, Strip } from "./Participants";
import { createWorld, INITIAL, PARKED, STATE_AFTER, when } from "./world";
import { createPulses } from "./pulse";
import { COLORS, SCENES, heroIntro } from "./scenes";
import { SITE } from "@/lib/site";
// World3D itself is three-free: three.js only comes later, with its engine
import { World3D, type Link } from "../world3d/World3D";

const RING_TONES = ["pickup", "transit", "dropoff"];

export function TopDown() {
  const t = useTranslations("trip");
  const td = useTranslations("td");
  const rootRef = useRef<HTMLElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<Layout | null>(null);
  const road = useMemo(() => (L ? new Road(L) : null), [L]);
  const [map3d, setMap3d] = useState(false);
  const link = useRef<Link>({ frame: null, engine: null }).current;
  const labels = useRef({ telegram: td("pulse.telegram"), batch: td("cab.batch", { count: QUEUED }) });
  const queuedText = useRef((n: number) => td("app.queued", { count: n }));
  queuedText.current = (n: number) => td("app.queued", { count: n });
  const fmt = useRef<{ eta: (min: number) => string; km: (v: number) => string; stop: (m: number) => string; stopDone: () => string }>(null!);
  const stopFrom = CHAPTERS[STOP].minute;
  const stopTo = stopFrom + (CHAPTERS[STOP].stand ?? 0);
  fmt.current = {
    eta: (min) => (min < 60 ? td("cab.etaMin", { m: min }) : td("cab.etaValue", { h: Math.floor(min / 60), m: min % 60 })),
    km: (v) => td("cab.km", { v }),
    stop: (m) => td("map.stop", { m }),
    stopDone: () => td("map.stopDone", { m: stopTo - stopFrom, from: fmtClock(stopFrom), to: fmtClock(stopTo) }),
  };

  useEffect(() => {
    setMap3d(new URLSearchParams(window.location.search).get("map") === "3d");
  }, []);

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

    // the 3D map draws flags and rings from the state, so it hears of every change
    const world = createWorld(root, () => draw(lastCam));
    const pulses = createPulses(root, pulseRef.current!);
    const truck = q("[data-truck]");
    const casing = q<SVGPathElement>('[data-track="casing"]');
    const line = q<SVGPathElement>('[data-track="line"]');
    const dots = qa<SVGCircleElement>('[data-track="dots"] circle').map((el) => ({ el, l: Number(el.dataset.l), on: false }));
    const front = q<SVGGElement>('[data-track="front"]');
    const pend = q("[data-pend]");
    const queuedPills = qa("[data-queued]");
    const queuedTexts = qa("[data-bind='queued']");
    const clocks = qa("[data-bind='clock']");
    const planClip = q<SVGRectElement>("[data-plan-clip]");
    const binds = {
      speed: qa("[data-bind='speed']"),
      eta: qa("[data-bind='eta']"),
      km: qa("[data-bind='km']"),
      battery: qa("[data-bind='battery']"),
      stop: qa("[data-bind='stop']"),
    };
    const flashes = qa("[data-flash]");
    const minis = qa<SVGSVGElement>("[data-mini]").map((svg) => {
      const track = svg.querySelector<SVGPathElement>("[data-mini-track]")!;
      return { track, truck: svg.querySelector<SVGGElement>("[data-mini-truck]")!, len: track.getTotalLength() };
    });

    // The phone in the desktop column shrinks to fit what is left under the
    // panel; chapter 8's receiver stands beside it in what is left of the row.
    if (L.wide) {
      root.style.setProperty("--pz", "1");
      const rail = q(`.${s.railIn}`).getBoundingClientRect();
      const phone = q("[data-part='phone-body']").getBoundingClientRect();
      const room = rail.bottom - 16 - phone.top;
      const pz = Math.min(1, Math.max(0.5, room / phone.height));
      root.style.setProperty("--pz", String(pz));
      const row = q(`.${s.phones}`).getBoundingClientRect().width;
      const side = row - phone.width * pz - 14;
      root.style.setProperty("--rz", String(Math.min(pz, side / RECEIVER_W)));
    }

    const lStart = road.lenAt(L.anchors[2]); // tracking starts once the load is accepted
    const lOff = road.lenAt(anchorOf(OFFLINE_FROM) * L.vh);
    const lOn = road.lenAt(anchorOf(OFFLINE_TO) * L.vh);
    const yPin = anchorOf(PICKUP_AT) * L.vh;
    const lPin = road.lenAt(yPin);
    const lDrop = road.lenAt(anchorOf(DROPOFF_AT) * L.vh);
    const lGate = road.lenAt(anchorOf(DEPOT_END) * L.vh); // kilometres count from the depot gate
    let lastDash = "";
    let lastPlan = "";
    let lastClock = "";
    let lastQueued = -1;
    let lastCam = L.anchors[0];
    let lastMini = -1;
    let lastDusk = "";
    // The truck leaves the chaikhana when chapter 5's hold is over: that
    // scroll offset splits the chapter into PARKED and STATE_AFTER[5].
    const departAt = Math.round(departOf(STOP, L) - CAMERA * L.vh);
    const departed = () => -root.getBoundingClientRect().top >= departAt;
    const lastBind: Record<string, string> = {};
    const bind = (name: keyof typeof binds, text: string) => {
      if (lastBind[name] === text) return;
      lastBind[name] = text;
      for (const el of binds[name]) el.textContent = text;
    };
    // Share of the queued points already delivered (0 → 1 in chapter 7's
    // wave) and of the planned route drawn so far (0 → 1 in chapter 1).
    const track = { wave: 0, plan: 0 };

    const draw = (cam: number) => {
      lastCam = cam;
      const y = truckY(cam, L);
      const x = road.xAt(y);
      const angle = (-Math.atan(road.slopeAt(y)) * 180) / Math.PI;
      truck.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${angle.toFixed(2)}deg) scale(${L.k})`;

      // Track: blue = the server has it; grey dots = still on the phone.
      // On the pass the points recorded so far, [lOff, held], wait on the
      // phone; the wave delivers them from the start, up to synced.
      const l = road.lenAt(y);
      let ranges: [number, number][] = [];
      let synced = 0;
      let held = 0;
      if (l > lStart) {
        if (l <= lOff) ranges = [[lStart, l]];
        else {
          held = Math.min(l, lOn);
          synced = lOff + (held - lOff) * track.wave;
          ranges = [[lStart, synced]];
          if (l > lOn) ranges.push([lOn, l]); // fresh points after the tower go straight
        }
      }
      // The plan runs from the pickup point down to where it has drawn so
      // far; once the truck is tracked, only the part still ahead of it.
      const plan = track.plan
        ? `${(l > lStart ? y : yPin).toFixed(1)} ${road.yAtLen(lPin + (lDrop - lPin) * track.plan).toFixed(1)}`
        : "0 0";
      if (plan !== lastPlan) {
        lastPlan = plan;
        const [top, bottom] = plan.split(" ").map(Number);
        planClip.setAttribute("y", String(top));
        planClip.setAttribute("height", String(Math.max(0, bottom - top)));
      }

      // The carrier card's telemetry. Only shown while moving, so it may
      // as well be worked out from where the truck is.
      const km = Math.round(ROUTE_KM * Math.min(1, Math.max(0, (l - lGate) / (lDrop - lGate))));
      const speed = Math.round(71 + 8 * Math.sin(l / 160) + 4 * Math.sin(l / 41));
      bind("speed", String(speed));
      bind("km", fmt.current.km(km));
      bind("eta", fmt.current.eta(Math.round(((ROUTE_KM - km) / speed) * 60)));

      // The 3D world gets the same truck, track, plan and grey run, as
      // station positions, and the flags and rings from the state.
      const posOf = (len: number) => posAtY(road.yAtLen(len), L);
      const st = world.get();
      link.frame = {
        at: posAtY(cam, L),
        pos: posAtY(y, L),
        track: ranges.map(([a, b]) => [posOf(a), posOf(b)]),
        plan: track.plan ? [l > lStart ? posAtY(y, L) : PICKUP_AT, posOf(lPin + (lDrop - lPin) * track.plan)] : null,
        pend: held > synced ? [posOf(synced), posOf(held)] : null,
        front: track.wave > 0 && track.wave < 1 && held > lOff ? posOf(synced) : null,
        pins: st.plan === "1",
        first: st.first === "1",
        rings: Number(st.rings),
        waves: st.ch === 7 && st.net === "1",
      };
      link.engine?.set(link.frame);

      const dash = dashRanges(ranges, road.total);
      if (dash !== lastDash) {
        lastDash = dash;
        casing.setAttribute("stroke-dasharray", dash);
        line.setAttribute("stroke-dasharray", dash);
      }
      for (const d of dots) {
        const on = d.l > synced && d.l <= held;
        if (on !== d.on) {
          d.on = on;
          d.el.style.display = on ? "" : "none";
        }
      }
      const waving = track.wave > 0 && track.wave < 1 && held > lOff;
      front.style.display = waving ? "" : "none";
      if (waving) {
        const p = road.at(synced);
        front.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      }

      // The phone counts the same points the map shows grey.
      const queued = held > lOff ? Math.round((QUEUED * (held - lOff) * (1 - track.wave)) / (lOn - lOff)) : 0;
      if (queued !== lastQueued) {
        lastQueued = queued;
        const on = queued > 0 ? "1" : "0";
        for (const el of queuedPills) if (el.dataset.on !== on) el.dataset.on = on;
        if (queued > 0) {
          const text = queuedText.current(queued);
          for (const el of queuedTexts) el.textContent = text;
        }
      }
      // "on the driver's phone" beside the grey run, close enough to the
      // truck to stay on screen
      const run = held - synced;
      if (run > 70 && track.wave < 1) {
        const p = road.at(held - Math.min(run / 2, 0.22 * L.vh));
        const side = p.x < L.roadW / 2 ? -1 : 1; // nx points left of the screen when heading down
        const off = 26 * L.k;
        pend.style.transform = `translate3d(${(p.x + p.nx * off * side).toFixed(1)}px, ${(p.y + p.ny * off * side).toFixed(1)}px, 0)`;
        pend.dataset.side = side > 0 ? "l" : "r";
        pend.dataset.on = "1";
      } else pend.dataset.on = "0";

      const minute = minuteAt(cam, L);
      const clock = fmtClock(minute);
      if (clock !== lastClock) {
        lastClock = clock;
        for (const el of clocks) el.textContent = clock;
        // the phone runs down a little over the day: 92% → about 66% by dusk
        bind("battery", String(Math.round(Math.min(92, 92 - ((minute - 8 * 60) * 26) / (ARRIVE_MIN - 8 * 60)))));
        // the "P" counts the stop with the clock, then shows it whole
        bind("stop", cam >= departAt + CAMERA * L.vh ? fmt.current.stopDone() : fmt.current.stop(Math.max(1, Math.round(Math.min(stopTo, minute) - stopFrom))));
        const dusk = minute >= DUSK_MIN ? "1" : "0";
        if (dusk !== lastDusk) root.dataset.dusk = lastDusk = dusk;
      }

      // The client's small map: the same truck, as far along the route.
      const share = Math.min(1, Math.max(0, (l - lGate) / (lDrop - lGate)));
      if (Math.abs(share - lastMini) > 0.0005) {
        lastMini = share;
        for (const m of minis) {
          m.track.setAttribute("stroke-dasharray", `${share.toFixed(4)} 1`);
          const p = m.track.getPointAtLength(share * m.len);
          m.truck.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
        }
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
      gsap.set(flashes, { opacity: 0 });
    };

    // Chapter 1: the planned route draws itself from the pickup point down.
    const plan = (duration: number) =>
      gsap.timeline().fromTo(track, { plan: 0 }, { plan: 1, duration, ease: "power1.inOut", onUpdate: () => draw(lastCam) });
    // Chapter 3: the driver photographs the waybill.
    const flash = () =>
      gsap
        .timeline()
        .fromTo(flashes, { opacity: 0 }, { opacity: 0.95, duration: 0.06 })
        .to(flashes, { opacity: 0, duration: 0.5, ease: "power2.out" });

    // Chapter 7: the queued points arrive and turn blue from where the
    // network dropped up to the truck.
    const restore = (duration: number) =>
      // fast where the drop point is off screen above, slow near the truck
      gsap.timeline().to(track, { wave: 1, duration, ease: "power2.out", onUpdate: () => draw(lastCam) });

    const ctx = { world, pulses, press, plan, flash, restore, labels: labels.current, wide: L.wide };
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
      // chapter 5 has no scene left to play once its truck has driven off
      const gone = i === STOP && departed();
      const playing = play && !!sceneOf && !reduce && !gone;
      const from = playing ? { ...STATE_AFTER[i - 1], ch: i } : i === STOP && !gone ? PARKED : STATE_AFTER[i];
      world.set(from);
      track.wave = from.sync === "1" ? 1 : 0;
      track.plan = from.plan === "1" ? 1 : 0;
      draw(lastCam);
      if (playing) scene = sceneOf!(ctx);
    };

    // While the truck moves with network, points leave the phone on their
    // own: a sparse stream of small impulses to the dispatcher's status line.
    let inView = false;
    const tick = () => {
      const st = world.get();
      if (inView && !reduce && st.conn === "moving" && st.net === "1" && st.gps === "1" && !document.hidden) {
        pulses.pulse("phone", "panel-conn", {
          color: COLORS.point,
          size: 3,
          duration: 0.85,
          ...(L.wide ? { bend: 0.28 } : { out: "top", in: "top", bend: -0.5 }),
        });
      }
    };
    const stream = window.setInterval(tick, 1300);

    // Opened at the top: the hero's intro plays once (the dispatcher asks,
    // the question is struck out). Anywhere else the triggers below decide.
    const top = root.getBoundingClientRect().top;
    const firstAt = L.anchors[1] - (LEAD + CAMERA) * L.vh;
    if (!reduce && -top < firstAt) {
      world.set(INITIAL);
      scene = heroIntro(ctx);
    } else world.set(STATE_AFTER[0]);
    track.plan = 0;

    const sc = gsap.context(() => {
      const cam = { s: L.anchors[0] };
      const span = L.height + (map3d ? FINALE * L.vh : 0) - L.vh;
      gsap.to(cam, {
        s: cameraOf(span, L),
        ease: "none",
        onUpdate: () => draw(cam.s),
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${span}`,
          scrub: reduce ? true : 0.35,
          onToggle: (self) => (inView = self.isActive),
        },
      });
      for (let i = 1; i < K; i++) {
        // A beat before the truck pulls into the bend.
        const at = L.anchors[i] - LEAD * L.vh - CAMERA * L.vh;
        ScrollTrigger.create({
          trigger: root,
          start: `top+=${at.toFixed(0)} top`,
          end: "bottom top",
          onEnter: () => enter(i, true),
          onEnterBack: () => enter(i, false),
          onLeaveBack: () => enter(i - 1, false),
        });
      }
      // The truck drives off the lunch stop (or, scrolling back, is parked again).
      const depart = () => world.get().ch === STOP && enter(STOP, false);
      ScrollTrigger.create({
        trigger: root,
        start: `top+=${departAt} top`,
        end: "bottom top",
        onEnter: depart,
        onLeaveBack: depart,
      });
    }, root);
    draw(L.anchors[0]);
    ScrollTrigger.refresh();

    return () => {
      window.clearInterval(stream);
      stop();
      sc.revert();
    };
  }, [L, road, link, map3d]);

  const chapters = t.raw("chapters") as { title: string; text: string }[];
  const at = (pos: number) => (L && road ? road.at(road.lenAt(anchorOf(pos) * L.vh)) : null);
  const first = at(2);
  const pin = at(PICKUP_AT);
  const drop = at(DROPOFF_AT);
  const rings = RINGS.map(at);
  const park = at(STOP);

  return (
    <section
      ref={rootRef}
      id="trip"
      className={s.td}
      data-ch="0"
      data-active="none"
      data-intro="0"
      data-dusk="0"
      data-map={map3d ? "3d" : "flat"}
      style={{ height: `${(SECTION_SCREENS + (map3d ? FINALE : 0)) * 100}svh` }}
    >
      <div ref={probeRef} className={s.probe} aria-hidden />

      {map3d && L && <World3D L={L} link={link} onFail={() => setMap3d(false)} />}

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
        <span className={s.pend} data-pend data-on="0">
          {td("map.onPhone")}
        </span>

        {/* the load's points as the cabinet marks them: a dot with a tag */}
        {pin && drop && L && (
          <>
            <span className={s.spot} data-anchor="pin" style={{ left: pin.x, top: pin.y }} />
            <span className={s.pin} data-tone="pickup" {...when("plan=1")} style={{ left: pin.x, top: pin.y }}>
              <b>{td("cab.pickup")}</b>
              <i />
            </span>
            <span className={s.pin} data-tone="dropoff" {...when("plan=1")} style={{ left: drop.x, top: drop.y }}>
              <b>{td("cab.dropoff")}</b>
              <i />
            </span>
            <span
              className={s.estimate}
              data-side={pin.x < L.roadW / 2 ? "r" : "l"}
              {...when("plan=1; ch=1|2")}
              style={{ left: pin.x, top: pin.y }}
            >
              {td("cab.formEstimate")}
            </span>
          </>
        )}
        {/* driver's step rings: where the phone was when the button was pressed */}
        {rings.map(
          (p, i) =>
            p && (
              <span key={i}>
                <span className={s.spot} data-anchor={`ring-${i}`} style={{ left: p.x, top: p.y }} />
                <span
                  className={s.ring}
                  data-tone={RING_TONES[i]}
                  {...when(`rings=${["1|2|3", "2|3", "3"][i]}`)}
                  style={{ left: p.x, top: p.y }}
                />
              </span>
            ),
        )}
        {/* the lunch stop, as the cabinet marks a stop: "P", minutes on its tooltip */}
        {park && L && (
          <span className={s.park} data-side={park.x < L.roadW / 2 ? "r" : "l"} {...when("park=1")} style={{ left: park.x, top: park.y }}>
            <i>P</i>
            <span data-bind="stop" />
          </span>
        )}
      </div>

      <div className={s.cards}>
        {/* phone: the cards dock at the bottom, one per chapter, so they
            never scroll across the truck */}
        <div className={s.deck}>
          <article className={`${s.card} ${s.hero}`} data-i={0} data-side="L" style={{ "--a": anchorOf(0) } as React.CSSProperties}>
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
                data-i={i}
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
          <div className={s.phones}>
            <Phone />
            <Receiver />
          </div>
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
