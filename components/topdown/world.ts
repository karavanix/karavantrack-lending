// What every participant shows, as one plain state object. The markup renders
// all variants up front and marks each with data-when="key=a|b; other=c";
// setting the state turns the matching ones on (CSS crossfades them). The
// root also gets the state as data attributes, for styling that depends on it.
//
// STATE_AFTER[i] is how things stand once chapter i has played. Scrolling
// into a chapter starts from STATE_AFTER[i - 1] and its scene walks to
// STATE_AFTER[i]; scrolling back jumps to the earlier state.

type Status = "none" | "created" | "accepted" | "loaded" | "transit" | "delivered";

export type World = {
  ch: number; // current chapter
  active: "none" | "panel" | "phone"; // who acts right now
  status: Status; // as the cabinet shows it
  pstatus: Status; // as the driver's app shows it (it knows first)
  carrier: "0" | "1"; // a driver is on the load
  conn: "none" | "last" | "moving" | "stopped" | "nodata";
  slot: "hero" | "invite" | "link" | "copied" | "none" | "share"; // dispatcher's action area
  screen: "idle" | "invite" | "active"; // driver's phone
  act: "beginPickup" | "confirmPickup" | "startTransit" | "beginDropoff" | "confirmDropoff" | "none"; // next button on the phone
  toast: "none" | "accepted";
  gps: "0" | "1";
  net: "1" | "0"; // phone has mobile network
  sync: "0" | "1"; // the points queued on the pass have reached the server
  batch: "0" | "1"; // the cabinet just got them in one go: "+268 points"
  first: "0" | "1"; // the first track point is on the map
};

const base: World = {
  ch: 0,
  active: "none",
  status: "none",
  pstatus: "none",
  carrier: "0",
  conn: "none",
  slot: "hero",
  screen: "idle",
  act: "none",
  toast: "none",
  gps: "0",
  net: "1",
  sync: "0",
  batch: "0",
  first: "0",
};

// Chapters past 2 are rough placeholders for now: their own sessions will
// give them scenes and refine what changes.
const steps: Partial<World>[] = [
  {},
  { status: "created", slot: "invite" },
  { status: "accepted", carrier: "1", slot: "none", screen: "active", act: "beginPickup", gps: "1", conn: "last", first: "1" },
  { status: "loaded", act: "startTransit" },
  { status: "transit", act: "beginDropoff", conn: "moving" },
  { conn: "stopped" },
  { conn: "nodata", net: "0" },
  { conn: "moving", net: "1", sync: "1" },
  { slot: "share" },
  { status: "delivered", act: "none", conn: "none", gps: "0" },
];

export const STATE_AFTER: World[] = steps.reduce<World[]>((acc, step, i) => {
  const prev = acc[i - 1] ?? base;
  const status = step.status ?? prev.status;
  acc.push({ ...prev, ...step, status, pstatus: status, ch: i, active: "none", toast: "none", batch: "0" });
  return acc;
}, []);

type Cond = [keyof World, string[]][];

const parse = (when: string): Cond =>
  when.split(";").map((part) => {
    const [k, v] = part.split("=").map((x) => x.trim());
    return [k as keyof World, v.split("|")];
  });

const holds = (cond: Cond, state: World) => cond.every(([k, vs]) => vs.includes(String(state[k])));

// Props for a conditional element, already right for the first chapter so the
// server-rendered page shows the opening state.
export const when = (cond: string) => ({
  "data-when": cond,
  "data-on": holds(parse(cond), STATE_AFTER[0]) ? "1" : "0",
});

export function createWorld(root: HTMLElement) {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-when]")).map((el) => ({
    el,
    cond: parse(el.dataset.when!),
  }));
  let state: World = { ...base };

  const set = (patch: Partial<World>) => {
    state = { ...state, ...patch };
    for (const [k, v] of Object.entries(state)) {
      const val = String(v);
      if (root.dataset[k] !== val) root.dataset[k] = val;
    }
    for (const { el, cond } of nodes) {
      const on = holds(cond, state) ? "1" : "0";
      if (el.dataset.on !== on) el.dataset.on = on;
    }
  };

  return { set, get: () => state };
}

export type WorldApi = ReturnType<typeof createWorld>;
