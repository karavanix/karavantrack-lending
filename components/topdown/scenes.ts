// Chapter scenes: short, time-based (not scroll-scrubbed) plays of
// "someone acts → an impulse runs → something changes elsewhere". A scene
// starts from STATE_AFTER[i - 1] and must end exactly at STATE_AFTER[i].
// Chapters without a scene just switch state.

import gsap from "gsap";
import type { PulseApi } from "./pulse";
import { STATE_AFTER, type WorldApi } from "./world";

export type SceneCtx = {
  world: WorldApi;
  pulses: PulseApi;
  press: (name: string) => gsap.core.Timeline;
  labels: { telegram: string };
  wide: boolean; // desktop column (panel above the phone) or the phone strip
};

type Scene = (c: SceneCtx) => gsap.core.Timeline;

export const COLORS = {
  telegram: "#229ed9",
  accept: "#16a34a",
  point: "#2563eb",
};

// 2 · 08:06 · the driver comes by link.
// Dispatcher: "Generate invite link" → "Copy" → impulse via Telegram to the
// phone → "You have been offered a load" → "Accept load" → impulse back:
// status "Accepted", the carrier appears → GPS on → impulse to the map: the
// first blue point under the truck, "Last point · just now".
const invite: Scene = ({ world, pulses, press, labels, wide }) => {
  const end = STATE_AFTER[2];
  const set = (patch: Parameters<WorldApi["set"]>[0]) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "panel" }), [], 0.15)
    .add(press("generate"), 0.55)
    .call(set({ slot: "link" }), [], 0.9)
    .add(press("copy"), 1.55)
    .call(set({ slot: "copied" }), [], 1.85)
    .add(
      pulses.pulse("panel", "phone", {
        color: COLORS.telegram,
        label: labels.telegram,
        duration: 1.3,
        // desktop: out of the panel's left side, an arc over the map, into the phone;
        // phone: up out of one tile, an arc over the map, down into the other
        ...(wide ? { out: "left", in: "left", bend: 0.5 } : { out: "top", in: "top", bend: 0.55 }),
      }),
      2.15,
    )
    .call(set({ active: "phone", screen: "invite" }), [], 3.3)
    .add(press("accept"), 4.25)
    .call(set({ screen: "active", toast: "accepted", act: end.act, pstatus: end.pstatus }), [], 4.55)
    .add(pulses.pulse("phone", "panel-status", { color: COLORS.accept, duration: 1, ...(wide ? { out: "right", bend: 0.3 } : { out: "top", in: "top", bend: -0.55 }) }), 4.75)
    .call(set({ active: "panel", status: end.status, carrier: end.carrier, slot: end.slot }), [], 5.65)
    .call(set({ active: "phone", gps: end.gps }), [], 6.2)
    .add(pulses.pulse("phone", "truck", { color: COLORS.point, bend: 0.18, duration: 1.1, size: 4.5 }), 6.45)
    .call(set({ first: end.first, conn: end.conn }), [], 7.55)
    .call(set({ ...end }), [], 8.6);
  return tl;
};

export const SCENES: Partial<Record<number, Scene>> = { 2: invite };
