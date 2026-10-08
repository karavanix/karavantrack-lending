"use client";

// The whole landing story: one trip from Tashkent to Fergana. A sticky stage
// holds the scene; chapter cards scroll over it. Scroll position is trip
// time: between two cards the truck drives to the next stop, while a card is
// in view it stands there and the chapter's product moment plays.

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight } from "lucide-react";
import s from "./trip.module.css";
import { Truck, TRUCK_H } from "./Truck";
import { Overlays } from "./Overlays";
import {
  CloudsLayer,
  FarLayer,
  FrontLayer,
  LAYER_F,
  LANE_Y,
  MidLayer,
  NearLayer,
  PAD,
  SCENE_H,
  layerRange,
  type LayerKey,
} from "./Scenery";
import {
  CATCH_UP,
  DOCK_X,
  OFFLINE_FROM,
  OFFLINE_TO,
  PASS_X,
  ROUTE_END,
  ROUTE_KM,
  STATIONS,
  fmtClock,
} from "./stations";
import { SITE } from "@/lib/site";

const K = STATIONS.length;
const DRIVE_FROM = 0.3; // share of a chapter's scroll before the truck moves
const DRIVE_TO = 0.85; // …and when it has arrived at the next stop
const TRUCK_CENTER = 200; // truck body centre inside its own drawing
const TRUCK_VIEW_X = -30; // left edge of the truck's viewBox
const TRUCK_VIEW_W = 660;
const PENDING_TOTAL = 268; // ~one point every 10 s over the 45 min without signal

// Sky colours through the day: [minute, top, horizon].
const SKY: [number, string, string][] = [
  [460, "#9FBEE2", "#F6D6B8"],
  [560, "#73ABE5", "#D9EAF6"],
  [760, "#4F98E2", "#D0E6F6"],
  [900, "#5C98DA", "#DFECF2"],
  [990, "#6C88C2", "#EFD0A9"],
  [1050, "#4D5B99", "#F2A676"],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function skyAt(minute: number): [string, string] {
  if (minute <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
  for (let i = 1; i < SKY.length; i++) {
    const [m1, t1, h1] = SKY[i];
    const [m0, t0, h0] = SKY[i - 1];
    if (minute <= m1) {
      const k = (minute - m0) / (m1 - m0);
      return [mixHex(t0, t1, k), mixHex(h0, h1, k)];
    }
  }
  const last = SKY[SKY.length - 1];
  return [last[1], last[2]];
}

const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) ** 2;

// Where the trip is at timeline position t (0 … K-1). The truck stands at a
// stop while its card is read and drives between cards; at a cruising stop it
// rolls straight through, so the drive spans the whole gap on that side.
function tripAt(t: number, reduce: boolean) {
  const i = Math.min(K - 2, Math.max(0, Math.floor(t)));
  const local = t - i;
  const a = STATIONS[i];
  const b = STATIONS[i + 1];
  const from = a.cruise ? 0 : DRIVE_FROM;
  const to = b.cruise ? 1 : DRIVE_TO;
  let d = clamp01((local - from) / (to - from));
  if (reduce) d = d < 0.5 ? 0 : 1;
  const k = a.cruise && b.cruise ? d : a.cruise ? easeOut(d) : b.cruise ? easeIn(d) : easeInOut(d);
  const x = a.x + (b.x - a.x) * k;
  const minute = a.minute + (b.minute - a.minute) * d;
  const moving =
    b.x > a.x && ((d > 0.02 && d < 0.98) || (d <= 0.02 && !!a.cruise) || (d >= 0.98 && !!b.cruise));
  const arrived = d >= 0.98 ? i + 1 : i;
  return { x, minute, moving, arrived };
}

export function Trip() {
  const t = useTranslations("trip");
  const rootRef = useRef<HTMLElement>(null);

  const chapters = t.raw("chapters") as { title: string; text: string }[];
  const strings = useRef({
    status: t.raw("status") as Record<string, string>,
    conn: t.raw("conn") as Record<string, string>,
    units: t.raw("units") as Record<string, string>,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const str = strings.current;

    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const scene = q(`.${s.scene}`);
    const truck = q(`.${s.truck}`);
    const dashes = q(`.${s.dashes}`);
    const sun = q(`.${s.sun}`);
    const layers = (Object.keys(LAYER_F) as LayerKey[]).map((key) => ({
      el: q(`[data-layer="${key}"]`),
      f: LAYER_F[key],
      umin: layerRange(LAYER_F[key]).umin,
    }));
    const wheels = qa<SVGGElement>(".truck-wheel");
    const sentRect = q<SVGRectElement>(".trail-sent-rect");
    const pendingRect = q<SVGRectElement>(".trail-pending-rect");
    const binds = new Map<string, HTMLElement[]>();
    for (const el of qa("[data-bind]")) {
      const key = el.dataset.bind!;
      binds.set(key, [...(binds.get(key) ?? []), el]);
    }
    const progressFills = qa("[data-bind-style='progress']");
    const connPill = q(`.${s.hudConn}`);

    // Layout: everything is in scene units (900 tall); px = units * scale.
    let scale = 1;
    let truckU = 0;
    const measure = () => {
      const r = scene.getBoundingClientRect();
      scale = r.height / SCENE_H;
      const widthU = r.width / scale;
      const narrow = window.innerWidth < 860;
      truckU = widthU * (narrow ? 0.42 : 0.56);
      dashes.style.backgroundSize = `${108 * scale}px 100%`;
      truck.style.width = `${TRUCK_VIEW_W * scale}px`;
      truck.style.height = `${TRUCK_H * scale}px`;
      truck.style.left = `${(truckU - TRUCK_CENTER + TRUCK_VIEW_X) * scale}px`;
      truck.style.top = `${(LANE_Y - 200) * scale}px`;
    };

    const last = new Map<string, string>();
    const setText = (key: string, value: string) => {
      if (last.get(key) === value) return;
      last.set(key, value);
      for (const el of binds.get(key) ?? []) el.textContent = value;
    };
    const setVar = (key: string, value: string) => {
      if (last.get(key) === value) return;
      last.set(key, value);
      scene.style.setProperty(key, value);
    };
    const X = (xw: number) => xw + PAD; // near-layer units

    const state = { t: 0 };
    // While a cruising chapter is read and the page is still, the truck keeps
    // rolling in place: wheels, bounce and road dashes run on a clock.
    let drift = 0;
    let cruising = false;
    let curX = 0;
    const roll = () => {
      const rx = curX + drift;
      const bounce = cruising && !reduce ? Math.sin(rx * 0.08) * 1.4 : 0;
      truck.style.transform = `translate3d(0,${(bounce * scale).toFixed(2)}px,0)`;
      const angle = (rx / (2 * Math.PI * 27)) * 360;
      for (const w of wheels) w.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      dashes.style.backgroundPositionX = `${(-(rx + PAD) * scale).toFixed(1)}px`;
    };
    const tick = (_time: number, dt: number) => {
      if (!cruising || reduce) return;
      drift += dt * 0.35;
      roll();
    };
    gsap.ticker.add(tick);

    const apply = () => {
      const { x, minute, moving, arrived } = tripAt(state.t, reduce);
      curX = x;
      cruising = moving;

      for (const L of layers) {
        const u = truckU - L.f * (x + PAD) + L.umin;
        L.el.style.transform = `translate3d(${(u * scale).toFixed(1)}px,0,0)`;
      }
      roll();

      // Day: sky, sun, dusk, lamps, headlights.
      const [top, hor] = skyAt(minute);
      setVar("--sky-top", top);
      setVar("--sky-hor", hor);
      const day = clamp01((minute - 400) / 700);
      const elev = Math.sin(Math.PI * day);
      sun.style.transform = `translate3d(${(day * 80 + 8).toFixed(2)}cqw, ${(60 - elev * 46).toFixed(2)}cqh, 0)`;
      setVar("--sun", mixHex("#FFF6D5", "#FFB06A", smooth(930, 1050, minute)));
      setVar("--dusk", smooth(980, 1050, minute).toFixed(3));
      setVar("--lamps", smooth(1000, 1045, minute).toFixed(3));
      setVar("--beam", smooth(1005, 1045, minute).toFixed(3));
      setVar("--fog", (Math.exp(-((x - PASS_X) ** 2) / (2 * 700 ** 2)) * 0.9).toFixed(3));

      // GPS trail: blue = the server has it, grey = waiting on the phone.
      const offline = x > OFFLINE_FROM && x < OFFLINE_TO;
      let sentEnd = x;
      if (offline) sentEnd = OFFLINE_FROM;
      else if (x >= OFFLINE_TO && x < OFFLINE_TO + CATCH_UP)
        sentEnd = OFFLINE_FROM + (x - OFFLINE_FROM) * smooth(OFFLINE_TO, OFFLINE_TO + CATCH_UP, x);
      if (x < DOCK_X + 1) sentEnd = DOCK_X;
      sentRect.setAttribute("width", String(Math.max(0, X(sentEnd) - layers[3].umin)));
      pendingRect.setAttribute("x", String(X(sentEnd)));
      pendingRect.setAttribute("width", String(Math.max(0, X(x) - X(sentEnd))));
      setVar("--signal", x >= OFFLINE_TO ? "1" : "0");

      // Numbers the overlays and HUD show.
      const pending = offline ? Math.round(((x - OFFLINE_FROM) / (OFFLINE_TO - OFFLINE_FROM)) * PENDING_TOTAL) : 0;
      setText("pending", String(pending));
      setText("batch", String(x >= OFFLINE_TO ? PENDING_TOTAL : 0));
      const share = clamp01((x - DOCK_X) / (ROUTE_END - DOCK_X));
      const km = Math.round(share * ROUTE_KM);
      const left = ROUTE_KM - km;
      const etaMin = Math.round((left / 62) * 60);
      const speed = moving ? Math.round((Math.abs(x - PASS_X) < 1300 ? 46 : 84) + Math.sin(x * 0.01) * 4) : 0;
      setText("clock", fmtClock(minute));
      setText("speed", `${speed} ${str.units.kmh}`);
      setText("driven", `${km} ${str.units.km}`);
      setText(
        "eta",
        left <= 0 ? "—" : `${Math.floor(etaMin / 60)} ${str.units.h} ${String(etaMin % 60).padStart(2, "0")} ${str.units.min}`,
      );
      setText("battery", `${Math.round(92 - share * 27)}%`);
      const pct = `${(share * 100).toFixed(2)}%`;
      if (last.get("progress") !== pct) {
        last.set("progress", pct);
        for (const el of progressFills) el.style.width = pct;
      }

      // Load status and the honest connection pill.
      const st = STATIONS[arrived];
      setText("status", st.status ? str.status[st.status] : "—");
      let conn: "waiting" | "moving" | "stopped" | "offline" | "none" = "stopped";
      if (arrived < 2) conn = "waiting";
      else if (offline) conn = "offline";
      else if (moving) conn = "moving";
      else if (st.status === "delivered") conn = "none";
      const connText =
        conn === "stopped"
          ? str.conn.stopped.replace("{time}", fmtClock(st.minute))
          : conn === "none"
            ? ""
            : str.conn[conn];
      setText("conn", connText);
      setText("connShort", moving ? str.conn.moving : connText);
      if (connPill.dataset.state !== conn) connPill.dataset.state = conn;
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: reduce ? true : 0.6,
          invalidateOnRefresh: true,
        },
      });
      tl.to(state, { t: K - 1, duration: K - 1, ease: "none", onUpdate: apply }, 0);

      const ov = (i: number) => q(`[data-ov="${i}"]`);
      const part = (i: number, name: string) => qa(`[data-ov="${i}"] [data-part="${name}"]`);

      // Each chapter's mock-up shows while its card is in view.
      tl.to(ov(0), { autoAlpha: 0, y: -16, duration: 0.12 }, 0.28);
      for (let i = 1; i < K; i++) {
        tl.fromTo(ov(i), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.14 }, i - 0.3);
        if (i < K - 1) tl.to(ov(i), { autoAlpha: 0, y: -16, duration: 0.12 }, i + 0.28);
      }

      // Small beats inside the chapters, all scrubbed with the scroll.
      tl.fromTo(part(1, "chip"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 }, 1 - 0.08);
      tl.fromTo(part(1, "addr"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 1 - 0.04);
      tl.fromTo(part(1, "route"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 1);

      tl.fromTo(part(2, "accept"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.06 }, 2 - 0.02);
      tl.fromTo(part(2, "accepted"), { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.08 }, 2);

      tl.fromTo(q(`.${s.flash}`), { opacity: 0 }, { opacity: 0.85, duration: 0.03 }, 3 - 0.14);
      tl.to(q(`.${s.flash}`), { opacity: 0, duration: 0.1 }, 3 - 0.11);
      tl.fromTo(part(3, "stamp"), { autoAlpha: 0, scale: 1.8, rotate: -24 }, { autoAlpha: 1, scale: 1, rotate: -12, duration: 0.08, ease: "back.out(2)" }, 3 - 0.04);
      tl.fromTo(part(3, "push"), { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 3 + 0.04);

      tl.fromTo(part(7, "dot"), { y: 160, autoAlpha: 0 }, { y: -40, autoAlpha: 1, duration: 0.16, stagger: 0.012, ease: "power1.in" }, 7 - 0.24);
      tl.to(part(7, "dot"), { autoAlpha: 0, duration: 0.05 }, 7 + 0.02);
      tl.fromTo(part(7, "gap"), { stroke: "#9AA6B4", strokeDasharray: "2 8" }, { stroke: "#2081F8", strokeDasharray: "200 0", duration: 0.1 }, 7 - 0.06);

      tl.fromTo(part(9, "confirm"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.05 }, 9 - 0.06);
      tl.fromTo(part(9, "confirmed"), { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.06 }, 9 - 0.03);
    }, root);

    // The hero's own little scene plays once on load: the question, crossed out,
    // and the answer the cabinet already has.
    const intro = gsap.timeline({ delay: 0.4 });
    if (!reduce) {
      intro
        .from(q(`[data-ov="0"] [data-part="bubble"]`), { autoAlpha: 0, y: 14, scale: 0.96, duration: 0.45 })
        .fromTo(q(`[data-ov="0"] [data-part="strike"]`), { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, "+=0.7")
        .from(q(`[data-ov="0"] [data-part="answer"]`), { autoAlpha: 0, y: 12, duration: 0.45 }, "+=0.15");
    } else {
      gsap.set(q(`[data-ov="0"] [data-part="strike"]`), { scaleX: 1 });
    }

    measure();
    apply();
    const onResize = () => {
      measure();
      apply();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      intro.kill();
      ctx.revert();
    };
  }, []);

  const tt = (n: number) => t("chapterOf", { n, total: K - 1 });

  return (
    <section ref={rootRef} id="trip" className={s.trip} style={{ height: `${K * 100}svh` }}>
      <div className={s.stage}>
        <div className={s.scene}>
          <div className={s.sky} />
          <div className={s.sun} />
          <div className={s.layer} data-layer="clouds">
            <CloudsLayer />
          </div>
          <div className={s.layer} data-layer="far">
            <FarLayer />
          </div>
          <div className={s.layer} data-layer="mid">
            <MidLayer />
          </div>
          <div className={s.layer} data-layer="near">
            <NearLayer />
          </div>
          <div className={s.dashes} />
          <div className={s.fog} />
          <div className={s.truck}>
            <Truck />
          </div>
          <div className={s.layer} data-layer="front">
            <FrontLayer />
          </div>
          <div className={s.dusk} />
          <div className={s.flash} />
          <Overlays />
        </div>

        <div className={s.hud} aria-hidden>
          <div className={s.hudTop}>
            <span className={s.hudClock} data-bind="clock">
              {fmtClock(STATIONS[0].minute)}
            </span>
            <span className={s.hudRoute}>{t("route")}</span>
          </div>
          <div className={s.hudBar}>
            <i data-bind-style="progress" />
          </div>
          <div className={s.hudRow}>
            <span className={s.hudStatus} data-bind="status">
              —
            </span>
            <span className={s.hudConn} data-state="waiting">
              <i />
              <span data-bind="conn">{t("conn.waiting")}</span>
            </span>
            <span className={s.hudBattery}>
              <svg viewBox="0 0 24 12" aria-hidden>
                <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" fill="none" stroke="currentColor" />
                <rect x="21.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" />
                <rect x="2.5" y="2.5" width="14" height="7" rx="1" fill="currentColor" />
              </svg>
              <span data-bind="battery">92%</span>
            </span>
          </div>
        </div>
      </div>

      <div className={s.chapters}>
        <article className={`${s.chapter} ${s.chapterHero}`}>
          <div className={`${s.card2} ${s.heroCard}`}>
            <h1 className={s.heroTitle}>{t("hero.title")}</h1>
            <p className={s.heroSub}>{t("hero.subtitle")}</p>
            <div className={s.heroCtas}>
              <a className={s.ctaPrimary} href={SITE.register}>
                {t("hero.cta")} <ArrowRight size={18} />
              </a>
              <a className={s.ctaGhost} href="#drivers">
                {t("hero.driver")}
              </a>
            </div>
            <span className={s.scrollHint}>
              <ArrowDown size={16} /> {t("scroll")}
            </span>
          </div>
        </article>
        {chapters.map((c, i) => {
          const st = STATIONS[i + 1];
          return (
            <article key={i} className={s.chapter}>
              <div className={s.card2}>
                <div className={s.cardMeta}>
                  <span className={s.cardTime}>{fmtClock(st.minute)}</span>
                  <span>{tt(i + 1)}</span>
                </div>
                <h2 className={s.chapterTitle}>{c.title}</h2>
                <p className={s.chapterText}>{c.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
