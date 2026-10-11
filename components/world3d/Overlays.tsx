"use client";

// The words on the 3D map: place names, the load's tags, the "P" of the
// lunch stop, "on the driver's phone". They are the flat map's own elements
// and classes (the map speaks the cabinet's language, and the cabinet's
// markers are HTML over its map too), each in a wrapper the engine moves to
// where its point of the world is on screen (overlays.ts).
// Whether one shows is still up to the world state: data-when, as before.
//
// No three.js here: this renders with the page, before the engine loads.

import { useTranslations } from "next-intl";
import { when } from "../topdown/world";
import td from "../topdown/topdown.module.css";
import s from "./world3d.module.css";

// Place names as a road map writes them (MapArt's kinds); `at` is the key of
// its point in overlays.ts. The road number shows twice, past the Tashkent
// gate and below the pass.
const PLACES = [
  { at: "depot", name: "depot", kind: "poi" },
  { at: "road-1", name: "road", kind: "shield" },
  { at: "chaikhana", name: "chaikhana", kind: "poi" },
  { at: "pass", name: "pass", kind: "area" },
  { at: "road-2", name: "road", kind: "shield" },
  { at: "valley", name: "valley", kind: "area" },
  { at: "fergana", name: "fergana", kind: "poi" },
] as const;

// gap: the tag keeps clear of its point (the road under it)
const At = ({ at, gap, children }: { at: string; gap?: boolean; children: React.ReactNode }) => (
  <span className={gap ? `${s.at} ${s.gap}` : s.at} data-at={at}>
    {children}
  </span>
);

export function Overlays() {
  const t = useTranslations("td");
  return (
    <>
      {PLACES.map((p) => (
        <At key={p.at} at={p.at}>
          <span className={td.place} data-kind={p.kind}>
            {p.kind === "poi" && <i />}
            {t(`map.places.${p.name}`)}
          </span>
        </At>
      ))}
      {/* tags over the flags; the route estimate beside pickup while the load is new.
          data-flip: px it takes to one side besides its text (overlays.ts) */}
      <At at="pickup">
        <span className={td.pin} data-tone="pickup" {...when("plan=1")}>
          <b>{t("cab.pickup")}</b>
        </span>
      </At>
      <At at="dropoff">
        <span className={td.pin} data-tone="dropoff" {...when("plan=1")}>
          <b>{t("cab.dropoff")}</b>
        </span>
      </At>
      <At at="estimate">
        <span className={td.estimate} data-side="r" data-flip="40" {...when("plan=1; ch=1|2")}>
          {t("cab.formEstimate")}
        </span>
      </At>
      {/* the lunch stop as the cabinet marks it; TopDown fills in the minutes */}
      <At at="park">
        <span className={td.park} data-side="r" data-flip="70" {...when("park=1")}>
          <i>P</i>
          <span data-bind="stop" />
        </span>
      </At>
      {/* beside the grey run on the pass; the engine shows it while there is one */}
      <At at="pend" gap>
        <span className={td.pend} data-side="r" data-flip="20" data-on="0">
          {t("map.onPhone")}
        </span>
      </At>
    </>
  );
}
