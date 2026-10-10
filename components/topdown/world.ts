// What every participant shows, as one plain state object. The markup renders
// all variants up front and marks each with data-when="key=a|b; other=c";
// setting the state turns the matching ones on (CSS crossfades them). The
// root also gets the state as data attributes, for styling that depends on it.
//
// STATE_AFTER[i] is how things stand once chapter i has played. Scrolling
// into a chapter starts from STATE_AFTER[i - 1] and its scene walks to
// STATE_AFTER[i]; scrolling back jumps to the earlier state.

type Status = "none" | "created" | "accepted" | "picking" | "loaded" | "transit" | "delivered";

export type World = {
  ch: number; // current chapter
  intro: "0" | "1" | "2"; // hero: nothing yet, the dispatcher asks, the question is struck out
  active: "none" | "panel" | "phone"; // who acts right now
  status: Status; // as the cabinet shows it
  pstatus: Status; // as the driver's app shows it (it knows first)
  carrier: "0" | "1"; // a driver is on the load
  conn: "none" | "last" | "moving" | "stopped" | "nodata";
  slot: "hero" | "form" | "invite" | "link" | "copied" | "none" | "share"; // dispatcher's action area
  form: "empty" | "link" | "addr"; // "Create new load": pickup field before / after the pasted link
  plan: "0" | "1"; // pickup, dropoff and the planned route are on the map
  note: "none" | "loaded"; // notification in the cabinet
  screen: "idle" | "invite" | "active"; // driver's phone
  act: "beginPickup" | "confirmPickup" | "startTransit" | "beginDropoff" | "confirmDropoff" | "none"; // next button on the phone
  toast: "none" | "accepted";
  hand: "0" | "1"; // the driver is pressing buttons (the phone strip shows them)
  photo: "0" | "1"; // a photo is attached to the next step
  rings: "0" | "1" | "2"; // driver's step rings on the map
  gps: "0" | "1";
  net: "1" | "0"; // phone has mobile network
  sync: "0" | "1"; // the points queued on the pass have reached the server
  batch: "0" | "1"; // the cabinet just got them in one go: "+268 points"
  first: "0" | "1"; // the first track point is on the map
};

const base: World = {
  ch: 0,
  intro: "2",
  active: "none",
  status: "none",
  pstatus: "none",
  carrier: "0",
  conn: "none",
  slot: "hero",
  form: "empty",
  plan: "0",
  note: "none",
  screen: "idle",
  act: "none",
  toast: "none",
  hand: "0",
  photo: "0",
  rings: "0",
  gps: "0",
  net: "1",
  sync: "0",
  batch: "0",
  first: "0",
};

// Chapters 5, 8 and 9 are rough placeholders for now: their own session will
// give them scenes and refine what changes.
const steps: Partial<World>[] = [
  {},
  { status: "created", slot: "invite", form: "addr", plan: "1" },
  { status: "accepted", carrier: "1", slot: "none", screen: "active", act: "beginPickup", gps: "1", conn: "last", first: "1" },
  { status: "loaded", act: "startTransit", rings: "1" },
  { status: "transit", act: "beginDropoff", conn: "moving", rings: "2" },
  { conn: "stopped" },
  { conn: "nodata", net: "0" },
  { conn: "moving", net: "1", sync: "1" },
  { slot: "share" },
  { status: "delivered", act: "none", conn: "none", gps: "0" },
];

export const STATE_AFTER: World[] = steps.reduce<World[]>((acc, step, i) => {
  const prev = acc[i - 1] ?? base;
  const status = step.status ?? prev.status;
  acc.push({ ...prev, ...step, status, pstatus: status, ch: i, active: "none", toast: "none", batch: "0", note: "none", hand: "0", photo: "0" });
  return acc;
}, []);

type Cond = [keyof World, string[]][];

const parse = (when: string): Cond =>
  when.split(";").map((part) => {
    const [k, v] = part.split("=").map((x) => x.trim());
    return [k as keyof World, v.split("|")];
  });

const holds = (cond: Cond, state: World) => cond.every(([k, vs]) => vs.includes(String(state[k])));

// The page opens before the hero's little intro: the dispatcher hasn't asked
// yet. Without motion it goes straight to STATE_AFTER[0].
export const INITIAL: World = { ...STATE_AFTER[0], intro: "0" };

// Props for a conditional element, already right for the opening state so
// the server-rendered page shows it.
export const when = (cond: string) => ({
  "data-when": cond,
  "data-on": holds(parse(cond), INITIAL) ? "1" : "0",
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
