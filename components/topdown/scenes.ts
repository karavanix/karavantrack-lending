// Chapter scenes: short, time-based (not scroll-scrubbed) plays of
// "someone acts → an impulse runs → something changes elsewhere". A scene
// starts from STATE_AFTER[i - 1] and must end exactly at STATE_AFTER[i]
// (except chapter 5, which ends PARKED: see world.ts). Chapters without a
// scene just switch state.

import gsap from "gsap";
import type { PulseApi } from "./pulse";
import { PARKED, STATE_AFTER, type WorldApi } from "./world";

export type SceneCtx = {
  world: WorldApi;
  pulses: PulseApi;
  press: (name: string) => gsap.core.Timeline;
  plan: (duration: number) => gsap.core.Timeline; // the planned route draws itself down the road
  flash: () => gsap.core.Timeline; // the phone's camera goes off
  restore: (duration: number) => gsap.core.Timeline; // queued points turn blue up to the truck
  labels: { telegram: string; batch: string };
  wide: boolean; // desktop column (panel above the phone) or the phone strip
};

type Scene = (c: SceneCtx) => gsap.core.Timeline;

export const COLORS = {
  telegram: "#229ed9",
  accept: "#16a34a",
  point: "#2563eb",
  // the cabinet's colours for the pickup point and the driver's step rings
  pickup: "#16a34a",
  transit: "#f59e0b",
  dropoff: "#dc2626",
};

type Patch = Parameters<WorldApi["set"]>[0];

// 0 · 07:40 · the hero, once, when the page opens at the top.
// The dispatcher's usual question pops up in the panel and is struck out:
// the answer will be on the map. Then the driver's label shows up too, so
// both participants are introduced before anything happens.
export const heroIntro = ({ world }: SceneCtx) => {
  const set = (patch: Patch) => () => world.set(patch);
  return gsap
    .timeline()
    .call(set({ intro: "1" }), [], 0.35)
    .call(set({ intro: "2" }), [], 1.7);
};

// 1 · 08:00 · the load is created.
// Dispatcher: "Create new load" → a 2GIS link pasted into the pickup field
// turns into the address, the route estimate appears → "Create load" → the
// panel shows the load, "Created" → impulse to the map: the green pickup
// point lands at the depot and the grey plan draws itself down the road.
const created: Scene = ({ world, pulses, press, plan, wide }) => {
  const end = STATE_AFTER[1];
  const set = (patch: Patch) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "panel", slot: "form", form: "empty" }), [], 0.15)
    .call(set({ form: "link" }), [], 0.95)
    .call(set({ form: "addr" }), [], 1.75)
    .add(press("create"), 2.55)
    .call(set({ status: end.status, slot: end.slot }), [], 2.9)
    .add(
      pulses.pulse("panel", "pin", {
        color: COLORS.pickup,
        duration: 1.1,
        ...(wide ? { out: "left", bend: -0.22 } : { out: "top", bend: 0.3 }),
      }),
      3.05,
    )
    .call(set({ active: "none", plan: end.plan }), [], 4.15)
    .add(plan(1.6), 4.2)
    .call(set({ ...end }), [], 6);
  return tl;
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

// 3 · 09:14 · loaded at the dock.
// Driver: "Begin pickup" → "Add photo" (the camera flashes, a thumbnail of
// the waybill) → "Cargo loaded". Two impulses: to the map, where a green
// ring stays where the truck stands; and to the cabinet: the notification
// "Cargo loaded" with the photo, status "Picked up".
const loaded: Scene = ({ world, pulses, press, flash, wide }) => {
  const end = STATE_AFTER[3];
  const set = (patch: Patch) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "phone", hand: "1" }), [], 0.15)
    .add(press("beginPickup"), 0.4)
    .call(set({ act: "confirmPickup", pstatus: "picking" }), [], 0.75)
    .add(press("photo"), 1.35)
    .add(flash(), 1.7)
    .call(set({ photo: "1" }), [], 1.95)
    .add(press("confirmPickup"), 2.75)
    .call(set({ act: end.act, pstatus: end.pstatus, photo: "0" }), [], 3.1)
    .add(pulses.pulse("phone", "ring-0", { color: COLORS.pickup, bend: 0.2, duration: 1.05, size: 4.5 }), 3.3)
    .add(
      pulses.pulse("phone", "panel-status", {
        color: COLORS.pickup,
        duration: 1,
        ...(wide ? { out: "right", bend: 0.3 } : { out: "top", in: "top", bend: -0.55 }),
      }),
      3.45,
    )
    .call(set({ rings: end.rings }), [], 4.35)
    .call(set({ active: "panel", hand: "0", note: "loaded", status: end.status }), [], 4.45)
    .call(set({ note: "none" }), [], 7.2)
    .call(set({ ...end }), [], 7.6);
  return tl;
};

// 4 · 10:30 · out on the highway (a cruise chapter: the truck doesn't stop).
// Driver, once: "Start transit" → an amber ring on the map, "In transit" in
// the cabinet with live speed, ETA and distance. From here on the phone
// sends points by itself: the stream of small impulses (TopDown) starts as
// soon as the connection reads "Moving".
const transit: Scene = ({ world, pulses, press, wide }) => {
  const end = STATE_AFTER[4];
  const set = (patch: Patch) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "phone", hand: "1" }), [], 0.1)
    .add(press("startTransit"), 0.3)
    .call(set({ act: end.act, pstatus: end.pstatus }), [], 0.65)
    .add(pulses.pulse("phone", "ring-1", { color: COLORS.transit, bend: 0.2, duration: 0.95, size: 4.5 }), 0.8)
    .add(
      pulses.pulse("phone", "panel-status", {
        color: COLORS.transit,
        duration: 0.95,
        ...(wide ? { out: "right", bend: 0.3 } : { out: "top", in: "top", bend: -0.55 }),
      }),
      0.9,
    )
    .call(set({ rings: end.rings }), [], 1.75)
    .call(set({ active: "panel", hand: "0", status: end.status, conn: end.conn }), [], 1.85)
    .call(set({ ...end }), [], 3.2);
  return tl;
};

// 5 · 12:10 · lunch at the chaikhana.
// Nobody acts: the truck pulls up. The phone notices it stands still and lets
// GPS rest (the screen dims), sends one last point and goes quiet, so the
// stream stops. The cabinet reads it as a stop: "Stopped since 12:10" with its
// hint, and a "P" lands on the map. The minutes on the "P" run with the
// clock (TopDown.draw). This scene ends PARKED; the truck drives off on the
// scroll (TopDown, departOf), which is STATE_AFTER[5].
const parked: Scene = ({ world, pulses, wide }) => {
  const set = (patch: Patch) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "phone", gps: PARKED.gps }), [], 0.35)
    .add(
      pulses.pulse("phone", "panel-conn", {
        color: COLORS.point,
        size: 3.5,
        duration: 0.9,
        ...(wide ? { bend: 0.28 } : { out: "top", in: "top", bend: -0.5 }),
      }),
      0.55,
    )
    .call(set({ active: "panel", conn: PARKED.conn, park: PARKED.park }), [], 1.45)
    .call(set({ ...PARKED }), [], 2.8);
  return tl;
};

// 6 · 13:05 · the Kamchik pass, no network.
// Nobody acts: the truck drives out of the tower's circle. The phone loses its
// bars and says "Offline"; the next point leaves and dies halfway, so the
// stream to the cabinet stops; a beat later the cabinet says "No data since
// 13:05" with its own hint. The grey dots and the phone's counter grow with
// the scroll (TopDown.draw), not here.
const noNetwork: Scene = ({ world, pulses, wide }) => {
  const end = STATE_AFTER[6];
  const set = (patch: Parameters<WorldApi["set"]>[0]) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "phone", net: end.net }), [], 0.3)
    .add(
      pulses.pulse("phone", "panel-conn", {
        color: COLORS.point,
        size: 3.5,
        duration: 1,
        fail: 0.5,
        ...(wide ? { bend: 0.28 } : { out: "top", in: "top", bend: -0.5 }),
      }),
      0.55,
    )
    .call(set({ active: "panel", conn: end.conn }), [], 2)
    .call(set({ ...end }), [], 3.6);
  return tl;
};

// 7 · 13:50 · down from the pass, the tower: network back.
// Bars come back, the tower sends out its waves; one big impulse carries all
// the queued points at once; as it lands, the grey dots turn blue in a wave
// from where the network dropped up to the truck, the phone's counter runs to
// zero, and the cabinet is back to "Moving" with "+268 points".
const networkBack: Scene = ({ world, pulses, restore, labels, wide }) => {
  const end = STATE_AFTER[7];
  const set = (patch: Parameters<WorldApi["set"]>[0]) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "phone", net: end.net }), [], 0.1)
    .add(
      pulses.pulse("phone", "panel-conn", {
        color: COLORS.point,
        size: 7,
        pack: 6,
        label: labels.batch,
        duration: 1.2,
        ...(wide ? { bend: 0.3 } : { out: "top", in: "top", bend: -0.55 }),
      }),
      0.55,
    )
    .add(restore(1.6), 1.45)
    .call(set({ active: "panel", conn: end.conn, sync: end.sync, batch: "1" }), [], 1.5)
    .call(set({ active: "none" }), [], 3.3)
    .call(set({ ...end }), [], 4.6);
  return tl;
};

// 8 · 15:10 · the client watches on their own (a cruise chapter).
// Dispatcher: "Share tracking" → "Generate tracking link" → "Copy" → impulse
// to a new participant, the receiver: their phone opens app.yool.live/track/…,
// no sign-up, and the same truck moves on its small map (TopDown.draw).
const share: Scene = ({ world, pulses, press, labels, wide }) => {
  const end = STATE_AFTER[8];
  const set = (patch: Patch) => () => world.set(patch);
  const tl = gsap.timeline();
  tl.call(set({ active: "panel", slot: "share" }), [], 0.15)
    .add(press("share"), 0.45)
    .call(set({ slot: "trackGen" }), [], 0.8)
    .add(press("generateTrack"), 1.2)
    .call(set({ slot: "trackLink" }), [], 1.55)
    .add(press("copyTrack"), 2.05)
    .call(set({ slot: "trackCopied", receiver: "1" }), [], 2.35)
    .add(
      pulses.pulse("panel", "receiver", {
        color: COLORS.telegram,
        label: labels.telegram,
        duration: 1.15,
        ...(wide ? { out: "bottom", in: "top", bend: -0.25 } : { out: "top", in: "top", bend: 0.5 }),
      }),
      2.55,
    )
    .call(set({ active: "receiver", receiver: end.receiver }), [], 3.7)
    .call(set({ slot: end.slot }), [], 4.3)
    .call(set({ ...end }), [], 5.6);
  return tl;
};

// 9 · 17:30 · delivered at the Fergana depot. Closing the loop, so two acts.
// Driver: "Begin dropoff" → "Add photo" (the waybill) → "Confirm delivery" →
// a red ring on the map, the cabinet gets "Cargo delivered" with the photo
// and the "Confirm delivery" button; the phone waits for the shipper.
// Dispatcher: "Confirm delivery" → impulse to the phone, "Load confirmed".
// Tracking ends: the headlights go off, the cabinet keeps the history.
const delivered: Scene = ({ world, pulses, press, flash, wide }) => {
  const end = STATE_AFTER[9];
  const set = (patch: Patch) => () => world.set(patch);
  const toPanel = wide ? { out: "right" as const, bend: 0.3 } : { out: "top" as const, in: "top" as const, bend: -0.55 };
  const toPhone = wide ? { in: "right" as const, bend: -0.3 } : { out: "top" as const, in: "top" as const, bend: 0.55 };
  const tl = gsap.timeline();
  // it has pulled up at the dock: the cabinet reads a stop, GPS rests
  tl.call(set({ active: "phone", hand: "1", conn: "stopped", gps: "rest" }), [], 0.2)
    .add(press("beginDropoff"), 0.45)
    .call(set({ act: "confirmDropoff", pstatus: "dropping" }), [], 0.8)
    .add(press("photo"), 1.4)
    .add(flash(), 1.75)
    .call(set({ photo: "1" }), [], 2)
    .add(press("confirmDropoff"), 2.8)
    .call(set({ act: end.act, pstatus: "delivered", photo: "0" }), [], 3.15)
    .add(pulses.pulse("phone", "ring-2", { color: COLORS.dropoff, bend: 0.2, duration: 1.05, size: 4.5 }), 3.35)
    .add(pulses.pulse("phone", "panel-status", { color: COLORS.dropoff, duration: 1, ...toPanel }), 3.5)
    .call(set({ rings: end.rings }), [], 4.4)
    .call(set({ active: "panel", hand: "0", note: "delivered", status: "delivered", slot: "confirm" }), [], 4.5)
    .call(set({ note: "none" }), [], 6.6)
    .add(press("confirmDelivery"), 6.9)
    .call(set({ status: end.status }), [], 7.25)
    .add(pulses.pulse("panel-status", "phone", { color: COLORS.accept, duration: 1, ...toPhone }), 7.4)
    .call(set({ active: "phone", toast: "confirmed", pstatus: end.pstatus, gps: end.gps, conn: end.conn }), [], 8.4)
    .call(set({ toast: "none", screen: end.screen, slot: end.slot, active: "none" }), [], 10)
    .call(set({ ...end }), [], 10.4);
  return tl;
};

export const SCENES: Partial<Record<number, Scene>> = {
  1: created,
  2: invite,
  3: loaded,
  4: transit,
  5: parked,
  6: noNetwork,
  7: networkBack,
  8: share,
  9: delivered,
};
