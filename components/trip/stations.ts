// One trip, Tashkent → Fergana, told in chapters. Each chapter is a stop on
// the road: where the truck stands (world units along the road), what the
// clock says, and which load status the cabinet would show.
//
// World units: the scene is 900 units tall; the road runs along x.

export type LoadStatus = "created" | "accepted" | "loaded" | "transit" | "delivered";

export type Station = {
  x: number;
  minute: number; // minutes since midnight
  status: LoadStatus | null;
  // A cruising chapter is read while the truck rolls on: it passes this
  // point without stopping.
  cruise?: boolean;
};

export const STATIONS: Station[] = [
  { x: 0, minute: 7 * 60 + 40, status: null }, //       0 hero: depot yard
  { x: 0, minute: 8 * 60, status: "created" }, //        1 load created
  { x: 330, minute: 8 * 60 + 6, status: "accepted" }, // 2 driver accepts, pulls up to the dock
  { x: 330, minute: 9 * 60 + 14, status: "loaded" }, //  3 loaded, photo
  { x: 2700, minute: 10 * 60 + 30, status: "transit", cruise: true }, // 4 highway
  { x: 4400, minute: 12 * 60 + 10, status: "transit" }, // 5 chaikhana stop
  { x: 6150, minute: 13 * 60 + 5, status: "transit", cruise: true }, //  6 Kamchik pass, no network
  { x: 7450, minute: 13 * 60 + 50, status: "transit", cruise: true }, // 7 network back
  { x: 9150, minute: 15 * 60 + 10, status: "transit", cruise: true }, // 8 client watches
  { x: 10600, minute: 17 * 60 + 30, status: "delivered" }, // 9 delivered
];

export const ROUTE_END = 10600;

// The stretch without coverage on the pass: points pile up on the phone
// between OFFLINE_FROM and OFFLINE_TO and go out in one batch after.
export const OFFLINE_FROM = 5450;
export const OFFLINE_TO = 7150;
export const CATCH_UP = 230; // the batch "arrives" over this stretch

// Landmarks the scenery and the HUD both need.
export const PASS_X = 6150;
export const CHAIKHANA_X = 4400;
export const GATE_X = 1450;
export const DOCK_X = 330;

// Landmarks a chapter is about stand just ahead of the truck, so on desktop
// they are not hidden behind the chapter card on the left.
export const AHEAD = 240;

export const ROUTE_KM = 318;

export function fmtClock(minute: number): string {
  const m = Math.round(minute);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
