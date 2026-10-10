// One trip, Tashkent → Fergana, seen from above. The page is a tall map; the
// road snakes down it and every chapter sits at one bend of the road. These
// constants are shared by CSS (card positions, section height) and by the
// road geometry, so both are written in viewport heights (svh / 100).

export type Side = "L" | "R"; // where the chapter card stands; the bend is on the other side

export type Chapter = {
  minute: number; // minutes since midnight
  side: Side;
  // Share of a screen the truck stands at its bend while the chapter's scene
  // plays. 0 = it rolls straight through (a "cruise" chapter).
  hold: number;
};

export const CHAPTERS: Chapter[] = [
  { minute: 7 * 60 + 40, side: "L", hold: 0.12 }, //  0 hero: depot yard
  { minute: 8 * 60, side: "R", hold: 0.16 }, //       1 load created
  { minute: 8 * 60 + 6, side: "L", hold: 0.2 }, //    2 driver by link
  { minute: 9 * 60 + 14, side: "R", hold: 0.16 }, //  3 loaded, photo
  { minute: 10 * 60 + 30, side: "L", hold: 0 }, //    4 highway
  { minute: 12 * 60 + 10, side: "R", hold: 0.16 }, // 5 chaikhana
  { minute: 13 * 60 + 5, side: "L", hold: 0 }, //     6 Kamchik pass, no network
  { minute: 13 * 60 + 50, side: "R", hold: 0 }, //    7 network back
  { minute: 15 * 60 + 10, side: "L", hold: 0 }, //    8 client watches
  { minute: 17 * 60 + 30, side: "R", hold: 0.16 }, // 9 delivered
];

export const K = CHAPTERS.length;

// The truck is kept at this height of the screen.
export const CAMERA = 0.45;
// Distance between two bends, in screens.
export const STEP = 1;
// Map left after the last bend (the Fergana depot and a little more).
export const TAIL = 0.55 + CHAPTERS[K - 1].hold;

// World y of chapter i's bend, in screens from the top of the section.
export const anchorOf = (i: number) => CAMERA + i * STEP;
export const SECTION_SCREENS = anchorOf(K - 1) + TAIL;

// A chapter starts this share of a screen before the truck reaches its bend.
export const LEAD = 0.04;

// Stretch of road without coverage on the pass, as positions between bends.
// It begins and ends exactly where chapters 6 and 7 start, so the phone, the
// panel and the map change at the same moment. Points pile up on the phone
// here, QUEUED of them by the time the network is back.
export const OFFLINE_FROM = 6 - LEAD;
export const OFFLINE_TO = 7 - LEAD;
export const QUEUED = 268;

// Depot compound in Tashkent ends a bit after the loading dock bend.
export const DEPOT_END = 3.45;

export function fmtClock(minute: number): string {
  const m = Math.round(minute);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
