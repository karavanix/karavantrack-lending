"use client";

// The three permanent participants' faces: the dispatcher's cabinet panel and
// the driver's phone (desktop column), plus the same two as compact tiles
// (phone strip). Every variant is rendered once and switched by the world
// state through data-when (see world.ts). Buttons that a scene "presses" carry
// data-press; ends of impulses carry data-anchor.

import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Hourglass,
  Link2,
  LoaderCircle,
  Lock,
  MonitorSmartphone,
  Moon,
  Route,
  Share2,
  Smartphone,
  Truck as TruckIcon,
  UserRound,
  X,
} from "lucide-react";
import s from "./topdown.module.css";
import { when } from "./world";
import { CHAPTERS, K, QUEUED, ROUTE_KM, STOP, fmtClock } from "./chapters";

type Status = "created" | "accepted" | "picking" | "loaded" | "transit" | "dropping" | "delivered" | "confirmed";
const STATUSES: Status[] = ["created", "accepted", "picking", "loaded", "transit", "dropping", "delivered", "confirmed"];
const STEPS: Status[] = ["created", "accepted", "loaded", "transit", "delivered"]; // the app's stepper
const ACTS = ["beginPickup", "confirmPickup", "startTransit", "beginDropoff", "confirmDropoff"] as const;

// The app shows "Awaiting shipper confirmation" while the load is delivered
// but not confirmed yet; GPS pills the rest of the time.
const TRACKED = "accepted|picking|loaded|transit|dropping|confirmed";

// Where the truck stood, for "Stopped since …".
const STOPPED_AT = { [STOP]: fmtClock(CHAPTERS[STOP].minute), [K - 1]: fmtClock(CHAPTERS[K - 1].minute) };

function Btn({ press, children, ghost, ok }: { press?: string; children: React.ReactNode; ghost?: boolean; ok?: boolean }) {
  return (
    <span className={`${s.btn} ${ghost ? s.btnGhost : ""} ${ok ? s.btnOk : ""}`} data-press={press}>
      {children}
      <i className={s.ripple} data-ripple />
    </span>
  );
}

// A photo of the waybill, as the driver attaches it to a step.
export function Snap({ size = 40 }: { size?: number }) {
  return (
    <svg className={s.snap} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" fill="#8a7f6c" />
      <rect x="-4" y="27" width="48" height="16" fill="#6f6556" />
      <g transform="rotate(-8 20 20)">
        <rect x="9" y="5" width="23" height="30" rx="1" fill="#f6f3ea" />
        <rect x="12" y="9" width="11" height="2" fill="#9aa3ad" />
        {[14, 18, 22, 26].map((y) => (
          <rect key={y} x="12" y={y} width={y === 22 ? 12 : 17} height="1.4" fill="#c7ccd2" />
        ))}
        <circle cx="25" cy="29" r="3.6" fill="none" stroke="#3b6fd6" strokeWidth="1.2" opacity="0.8" />
      </g>
    </svg>
  );
}

function Bars() {
  return (
    <span className={s.bars} aria-hidden>
      <i /> <i /> <i /> <i />
    </span>
  );
}

function GpsPill() {
  const t = useTranslations("td.app");
  return (
    <span className={s.stack}>
      <span className={s.pill} data-tone="go" {...when("gps=1")}>
        <i />
        {t("gpsActive")}
      </span>
      <span className={s.pill} data-tone="mute" {...when("gps=rest")}>
        <Moon size={11} />
        {t("gpsRest")}
      </span>
      <span className={s.pill} data-tone="mute" {...when("gps=0")}>
        <i />
        {t("gpsWaiting")}
      </span>
    </span>
  );
}

// The driver's step marks in the cabinet's history, coloured like the rings.
const HISTORY = [
  { step: "pickedUp", ch: 3, tone: "pickup", snap: true },
  { step: "inTransit", ch: 4, tone: "transit", snap: false },
  { step: "droppedOff", ch: K - 1, tone: "dropoff", snap: true },
] as const;

// The route on the client's small map: Tashkent → over the pass → Fergana.
const MINI_ROUTE = "M16 30C40 24 52 40 70 46S96 50 104 64S118 92 140 90S170 84 186 98";

// The public tracking page's map. TopDown moves the truck and the track along
// [data-mini] as the big truck drives, so both move together.
export function MiniMap({ className }: { className?: string }) {
  return (
    <svg className={`${s.mini} ${className ?? ""}`} viewBox="0 0 200 120" aria-hidden data-mini>
      <rect width="200" height="120" fill="#eef0e8" />
      <path d="M58 70c10-22 40-30 62-18s22 40 2 48-56 6-64-30z" fill="#e4dccb" />
      <path d="M72 70c8-14 30-18 42-10s12 26-2 30-36 2-40-20z" fill="#d9cdb3" />
      <path d="M0 108C40 96 80 112 120 104S180 110 200 100" fill="none" stroke="#c7dcef" strokeWidth="5" />
      <path d={MINI_ROUTE} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <path d={MINI_ROUTE} fill="none" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0 5" />
      <path data-mini-track d={MINI_ROUTE} fill="none" stroke="#2563eb" strokeWidth="3.6" strokeLinecap="round" pathLength="1" strokeDasharray="0 1" />
      <circle cx="16" cy="30" r="4.5" fill="#16a34a" stroke="#fff" strokeWidth="1.8" />
      <circle cx="186" cy="98" r="4.5" fill="#dc2626" stroke="#fff" strokeWidth="1.8" />
      <g data-mini-truck>
        <circle r="9" fill="#2563eb" opacity="0.18" />
        <circle r="5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function Who({ who }: { who: "dispatcher" | "driver" | "receiver" }) {
  const t = useTranslations("td.who");
  return (
    <span className={s.who} data-who={who}>
      {who === "dispatcher" ? <MonitorSmartphone size={14} /> : who === "driver" ? <Smartphone size={14} /> : <UserRound size={14} />}
      {t(who)}
    </span>
  );
}

export function Panel() {
  const t = useTranslations("td");
  return (
    <div className={s.panelWrap} data-part="panel">
      <Who who="dispatcher" />
      <div className={s.panel} data-anchor="panel">
        <div className={s.chrome}>
          <i />
          <i />
          <i />
          <span>app.yool.live</span>
        </div>

        <div className={s.stack}>
          {/* before the load exists: the question the page answers */}
          <div className={s.heroAsk} {...when("slot=hero")}>
            <span className={s.bubble}>{t("cab.hero")}</span>
            <span className={s.askNote}>
              <ArrowLeft size={14} /> {t("cab.askNote")}
            </span>
          </div>

          {/* "Create new load": a 2GIS link pasted into the pickup field */}
          <div className={s.form} {...when("slot=form")}>
            <b className={s.formTitle}>{t("cab.formTitle")}</b>
            <div className={s.field}>
              <span>{t("cab.pickup")}</span>
              <span className={`${s.input} ${s.stack}`}>
                <span className={s.placeholder} {...when("form=empty")}>
                  {t("cab.formSearch")}
                </span>
                <span className={s.pasted} {...when("form=link")}>
                  <mark>{t("cab.formLink")}</mark>
                </span>
                <span {...when("form=addr")}>{t("load.from")}</span>
              </span>
              <span className={s.detected} {...when("form=addr")}>
                {t("cab.formDetected")}
              </span>
            </div>
            <div className={s.field}>
              <span>{t("cab.dropoff")}</span>
              <span className={s.input}>{t("load.to")}</span>
            </div>
            <div className={s.formFoot}>
              <span className={s.estimate} {...when("form=addr")}>
                <Route size={13} /> {t("cab.formEstimate")}
              </span>
              <Btn press="create">{t("cab.formSubmit")}</Btn>
            </div>
          </div>

          <div className={s.pBody} {...when("slot=invite|link|copied|none|share|trackGen|trackLink|trackCopied|confirm|history")}>
            <div className={s.pHead}>
              <div>
                <b>{t("load.title")}</b>
                <span>{t("load.route")}</span>
              </div>
              <span className={s.stack} data-anchor="panel-status">
                {STATUSES.map((st) => (
                  <span key={st} className={s.badge} data-tone={st} {...when(`status=${st}`)}>
                    {t(`status.${st}`)}
                  </span>
                ))}
              </span>
            </div>

            <div className={s.pRows}>
              <div className={s.pRow}>
                <span>{t("cab.carrier")}</span>
                <span className={s.stack}>
                  <span {...when("carrier=0")}>—</span>
                  <span {...when("carrier=1")} className={s.carrier}>
                    <TruckIcon size={13} /> {t("load.driver")}
                  </span>
                </span>
              </div>
              <div className={s.pRow}>
                <span className={s.stack} data-anchor="panel-conn">
                  <span {...when("conn=none|last")}>{t("cab.lastPoint")}</span>
                  <span className={s.conn} data-tone="go" {...when("conn=moving")}>
                    <i /> {t("cab.moving")}
                  </span>
                  {Object.entries(STOPPED_AT).map(([ch, time]) => (
                    <span key={ch} className={s.conn} data-tone="wait" {...when(`conn=stopped; ch=${ch}`)}>
                      <i /> {t("cab.stopped", { time })}
                    </span>
                  ))}
                  <span className={s.conn} data-tone="off" {...when("conn=nodata")}>
                    <i /> {t("cab.noData")}
                  </span>
                  <span {...when("conn=done")}>{t("cab.driven")}</span>
                </span>
                <span className={s.stack}>
                  <span {...when("conn=none")}>—</span>
                  <b className={s.total} {...when("conn=done")}>
                    {t("cab.km", { v: ROUTE_KM })}
                  </b>
                  <span className={s.conn} data-tone="go" {...when("conn=last")}>
                    <i /> {t("cab.justNow")}
                  </span>
                  <span className={s.battery} {...when("conn=moving|stopped|nodata; batch=0")}>
                    <span data-bind="battery">92</span>%
                  </span>
                  <span className={s.batch} {...when("batch=1")}>
                    {t("cab.batch", { count: QUEUED })}
                  </span>
                </span>
              </div>
            </div>

            <div className={s.stack}>
              <div className={s.pAction} {...when("slot=invite")}>
                <span className={s.tab}>
                  <Link2 size={13} /> {t("cab.inviteTab")}
                </span>
                <Btn press="generate">{t("cab.generate")}</Btn>
              </div>
              <div className={s.pAction} {...when("slot=link|copied")}>
                <span className={s.tab}>
                  <Link2 size={13} /> {t("cab.inviteTab")}
                </span>
                <div className={s.linkRow}>
                  <span className={s.linkChip}>{t("cab.link")}</span>
                  <Btn press="copy" ghost>
                    <Copy size={13} /> {t("cab.copy")}
                  </Btn>
                </div>
                <span className={s.copied} {...when("slot=copied")}>
                  <Check size={13} /> {t("cab.copied")}
                </span>
              </div>
              <div className={s.pRoute} {...when("slot=none; conn=none|last")}>
                <div className={s.pRow}>
                  <span>{t("cab.pickup")}</span>
                  <b>
                    <span className={s.rowSnap} {...when("status=loaded|transit|dropping|delivered|confirmed")}>
                      <Snap size={18} />
                    </span>
                    {t("load.from")}
                  </b>
                </div>
                <div className={s.pRow}>
                  <span>{t("cab.dropoff")}</span>
                  <b>{t("load.to")}</b>
                </div>
              </div>
              {/* on the road: the carrier card's telemetry, live from the scroll */}
              <div className={s.pTele} {...when("slot=none; conn=moving")}>
                <div>
                  <span className={s.tLabel}>{t("cab.speed")}</span>
                  <b>
                    <span data-bind="speed">—</span> <small>{t("cab.kmh")}</small>
                  </b>
                </div>
                <div>
                  <span className={s.tLabel}>{t("cab.eta")}</span>
                  <b data-bind="eta">—</b>
                </div>
                <div>
                  <span className={s.tLabel}>{t("cab.driven")}</span>
                  <b data-bind="km">—</b>
                </div>
              </div>
              {/* why there are no points: the cabinet's own hint under the status */}
              <div className={s.pHint} {...when("slot=none; conn=stopped|nodata")}>
                <span className={s.stack}>
                  <span {...when("conn=stopped")}>{t("cab.stoppedHint")}</span>
                  <span {...when("conn=nodata")}>{t("cab.noDataHint")}</span>
                </span>
              </div>
              {/* sharing the load with the client: the cabinet's "Share tracking" dialog */}
              <div className={s.pAction} {...when("slot=share")}>
                <Btn press="share" ghost>
                  <Share2 size={13} /> {t("cab.share")}
                </Btn>
              </div>
              <div className={s.pAction} {...when("slot=trackGen")}>
                <span className={s.tab}>
                  <Share2 size={13} /> {t("cab.share")}
                </span>
                <Btn press="generateTrack">{t("cab.generateTrack")}</Btn>
              </div>
              <div className={s.pAction} {...when("slot=trackLink|trackCopied")}>
                <span className={s.tab}>
                  <Share2 size={13} /> {t("cab.share")}
                </span>
                <div className={s.linkRow}>
                  <span className={s.linkChip}>{t("cab.trackLink")}</span>
                  <Btn press="copyTrack" ghost>
                    <Copy size={13} /> {t("cab.copy")}
                  </Btn>
                </div>
                <span className={s.copied} {...when("slot=trackCopied")}>
                  <Check size={13} /> {t("cab.copied")}
                </span>
              </div>
              {/* delivered: the shipper's turn */}
              <div className={s.pAction} {...when("slot=confirm")}>
                <Btn press="confirmDelivery" ok>
                  <CheckCircle2 size={14} /> {t("cab.confirm")}
                </Btn>
                <span className={s.tab}>{t("cab.confirmHint")}</span>
              </div>
              {/* the trip in history: the driver's steps, as on the map */}
              <div className={s.pHist} {...when("slot=history")}>
                {HISTORY.map((h) => (
                  <div key={h.step}>
                    <span className={s.tLabel}>
                      <i data-tone={h.tone} /> {t(`cab.step.${h.step}`)}
                    </span>
                    <b>
                      {fmtClock(CHAPTERS[h.ch].minute)}
                      {h.snap && <Snap size={16} />}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={s.pNote} {...when("note=loaded|delivered")}>
          <Bell size={15} />
          <span className={s.stack}>
            <span {...when("note=loaded")}>
              <b>{t("cab.noteTitle")}</b>
              {t("cab.noteBody", { title: t("load.title") })}
            </span>
            <span {...when("note=delivered")}>
              <b>{t("cab.noteDropTitle")}</b>
              {t("cab.noteDropBody", { title: t("load.title") })}
            </span>
          </span>
          <Snap size={34} />
        </div>
      </div>
    </div>
  );
}

export function Phone() {
  const t = useTranslations("td");
  return (
    <div className={s.phoneWrap} data-part="phone">
      <Who who="driver" />
      <div className={s.phone} data-anchor="phone" data-part="phone-body">
        <div className={s.statusBar}>
          <span data-bind="clock">07:40</span>
          <span className={s.sbRight}>
            <span className={s.stack}>
              <span {...when("net=1")}>
                <Bars />
              </span>
              <span {...when("net=0")} className={s.barsOff}>
                <Bars />
              </span>
            </span>
            <span className={s.sbBat} data-bind="battery">
              92
            </span>
          </span>
        </div>
        <div className={s.appBar}>
          <span className={s.stack}>
            <span {...when("screen=idle|active")}>{t("app.loads")}</span>
            <span {...when("screen=invite")}>{t("app.invite")}</span>
          </span>
        </div>

        <div className={s.screens}>
          <div className={s.screen} {...when("screen=idle")}>
            <div className={s.empty}>
              <TruckIcon size={30} />
              <b>{t("app.noActive")}</b>
              <span>{t("app.noActiveSub")}</span>
            </div>
          </div>

          <div className={s.screen} {...when("screen=invite")}>
            <div className={s.aCard}>
              <div className={s.offer}>
                <TruckIcon size={15} />
                <b>{t("app.offer")}</b>
              </div>
              <span className={s.aTitle}>{t("load.route")}</span>
              <span className={s.aMuted}>{t("load.ref")}</span>
            </div>
            <div className={s.aCard}>
              <span className={s.aSub}>{t("app.details")}</span>
              <div className={s.info}>
                <span>{t("app.company")}</span>
                <b>{t("load.company")}</b>
              </div>
              <div className={s.info}>
                <span>{t("app.pickup")}</span>
                <b>{t("load.from")}</b>
              </div>
              <div className={s.info}>
                <span>{t("app.dropoff")}</span>
                <b>{t("load.to")}</b>
              </div>
            </div>
            <Btn press="accept">{t("app.accept")}</Btn>
          </div>

          <div className={s.screen} {...when("screen=active")}>
            <span className={s.aSub}>{t("app.activeLoad")}</span>
            <div className={s.aCard}>
              <div className={s.aHead}>
                <div>
                  <span className={s.aTitle}>{t("load.route")}</span>
                  <span className={s.aMuted}>{t("load.ref")}</span>
                </div>
                <span className={s.stack}>
                  {STATUSES.map((st) => (
                    <span key={st} className={s.chip} data-tone={st} {...when(`pstatus=${st}`)}>
                      {t(`status.${st}`)}
                    </span>
                  ))}
                </span>
              </div>
              <div className={s.stepper} aria-hidden>
                {STEPS.map((st) => (
                  <i key={st} data-step={st} />
                ))}
              </div>
              <div className={s.pills}>
                <span className={s.stack}>
                  <span className={s.pill} data-tone="go" {...when("net=1")}>
                    <i />
                    {t("app.online")}
                  </span>
                  <span className={s.pill} data-tone="warn" {...when("net=0")}>
                    <i />
                    {t("app.offline")}
                  </span>
                </span>
                <GpsPill />
                {/* points waiting on the phone: counted by TopDown as the truck drives */}
                <span className={s.pill} data-tone="warn" data-queued data-on="0">
                  <i />
                  <span data-bind="queued" />
                </span>
              </div>
              {/* photo for the next step: "Add photo", then its thumbnail */}
              <span className={s.stack} {...when(`act=${ACTS.join("|")}`)}>
                <span {...when("photo=0")}>
                  <Btn press="photo" ghost>
                    <Camera size={14} /> {t("app.addPhoto")}
                  </Btn>
                </span>
                <span className={s.shot} {...when("photo=1")}>
                  <Snap size={38} />
                  <X size={14} />
                </span>
              </span>
              <span className={s.stack}>
                {ACTS.map((a) => (
                  <span key={a} {...when(`act=${a}`)}>
                    <Btn press={a}>{t(`app.act.${a}`)}</Btn>
                  </span>
                ))}
                <span className={`${s.pill} ${s.awaiting}`} data-tone="warn" {...when("pstatus=delivered")}>
                  <Hourglass size={12} />
                  {t("app.awaiting")}
                </span>
              </span>
            </div>
          </div>
          {/* standing still: the library lets GPS rest (an illustration, the app has no such screen) */}
          <div className={s.rest} {...when(`gps=rest; hand=0; ch=${STOP}`)}>
            <Moon size={22} />
            <b>{t("app.gpsRest")}</b>
            <span>{t("app.gpsRestSub")}</span>
          </div>
          <i className={s.flash} data-flash />

          <div className={s.toast} {...when("toast=accepted")}>
            <Check size={14} /> {t("app.accepted")}
          </div>
          <div className={s.toast} {...when("toast=confirmed")}>
            <CheckCircle2 size={14} /> {t("app.confirmed")}
          </div>
        </div>
      </div>
    </div>
  );
}

// Chapter 8's client: the public tracking page on their phone, light like the
// web cabinet. They only appear in that chapter.
export const RECEIVER_W = 196; // px before zoom, as in the CSS

export function Receiver() {
  const t = useTranslations("td");
  return (
    <div className={s.recvWrap} data-part="receiver" {...when("receiver=1|2; ch=8")}>
      <Who who="receiver" />
      <div className={s.recv} data-anchor="receiver">
        <div className={s.statusBar}>
          <span data-bind="clock">15:10</span>
          <span className={s.sbRight}>
            <Bars />
          </span>
        </div>
        <div className={s.urlBar}>
          <Lock size={10} />
          <span>{t("rcv.url")}</span>
        </div>
        <div className={`${s.stack} ${s.rBody}`}>
          <div className={s.rLoading} {...when("receiver=1")}>
            <LoaderCircle size={20} />
            <span>{t("rcv.loading")}</span>
          </div>
          <div className={s.rPage} {...when("receiver=2")}>
            <div className={s.rHead}>
              <span className={s.rBrand}>Yool</span>
              <b>{t("load.title")}</b>
              <span className={s.rBadge}>{t("status.transit")}</span>
            </div>
            <MiniMap />
            <div className={s.rRows}>
              <div>
                <span>{t("cab.pickup")}</span>
                <b>{t("load.from")}</b>
              </div>
              <div>
                <span>{t("cab.dropoff")}</span>
                <b>{t("load.to")}</b>
              </div>
              <div>
                <span>{t("rcv.updated")}</span>
                <b data-bind="clock">15:10</b>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className={s.noSignup}>
        <Check size={13} /> {t("rcv.noSignup")}
      </span>
    </div>
  );
}

// Phone layout: one line per participant. The one acting right now widens.
export function Strip() {
  const t = useTranslations("td");
  return (
    <div className={s.strip}>
      <div className={s.tile} data-tile="phone" data-anchor="phone">
        <Who who="driver" />
        <span className={s.stack}>
          <span className={s.line} {...when("screen=idle")}>
            {t("app.noActive")}
          </span>
          <span className={s.line} {...when("screen=invite")}>
            <Btn press="accept">{t("app.accept")}</Btn>
          </span>
          <span className={s.line} {...when("screen=active;toast=accepted")}>
            <Check size={13} /> {t("app.accepted")}
          </span>
          <span className={s.line} {...when("toast=confirmed")}>
            <CheckCircle2 size={13} /> {t("app.confirmed")}
          </span>
          {/* the driver at the buttons: the next one, with the photo once taken */}
          <span className={s.line} {...when("screen=active; toast=none; hand=1")}>
            <span className={s.stack}>
              <span {...when("photo=0")}>
                <Btn press="photo" ghost>
                  <Camera size={13} />
                </Btn>
              </span>
              <span className={s.shot} {...when("photo=1")}>
                <Snap size={28} />
              </span>
            </span>
            <span className={s.stack}>
              {ACTS.map((a) => (
                <span key={a} {...when(`act=${a}`)}>
                  <Btn press={a}>{t(`app.act.${a}`)}</Btn>
                </span>
              ))}
            </span>
          </span>
          {/* one pill for room: the counter once points pile up, "Offline" before */}
          <span className={s.line} {...when("screen=active; toast=none; hand=0; net=0")}>
            <span className={s.pill} data-tone="warn" data-queued data-on="0">
              <i />
              <span data-bind="queued" />
            </span>
            <span className={s.pill} data-tone="warn" data-offline>
              <i />
              {t("app.offline")}
            </span>
          </span>
          <span className={s.line} {...when(`screen=active; toast=none; hand=0; net=1; pstatus=${TRACKED}`)}>
            <GpsPill />
          </span>
          <span className={s.line} {...when("screen=active; toast=none; hand=0; pstatus=delivered")}>
            <span className={s.pill} data-tone="warn">
              <Hourglass size={11} />
              {t("app.awaiting")}
            </span>
          </span>
        </span>
      </div>
      <div className={s.tile} data-tile="panel" data-anchor="panel panel-status panel-conn">
        <Who who="dispatcher" />
        <span className={s.stack}>
          <span className={s.line} {...when("slot=hero")}>
            {t("cab.hero")}
          </span>
          <span className={s.line} {...when("slot=form; form=empty|link")}>
            <span className={s.linkChip}>{t("cab.formLink")}</span>
          </span>
          <span className={s.line} {...when("slot=form; form=addr")}>
            <Btn press="create">{t("cab.formSubmit")}</Btn>
          </span>
          <span className={s.line} {...when("slot=invite")}>
            <Btn press="generate">
              <Link2 size={13} /> {t("cab.generate")}
            </Btn>
          </span>
          <span className={s.line} {...when("slot=link")}>
            <Btn press="copy" ghost>
              <Copy size={13} /> {t("cab.copy")}
            </Btn>
          </span>
          <span className={s.line} {...when("slot=copied")}>
            <Check size={13} /> {t("cab.copied")}
          </span>
          <span className={s.line} {...when("slot=share")}>
            <Btn press="share" ghost>
              <Share2 size={13} /> {t("cab.share")}
            </Btn>
          </span>
          <span className={s.line} {...when("slot=trackGen")}>
            <Btn press="generateTrack">{t("cab.generateTrack")}</Btn>
          </span>
          <span className={s.line} {...when("slot=trackLink")}>
            <Btn press="copyTrack" ghost>
              <Copy size={13} /> {t("cab.copy")}
            </Btn>
          </span>
          <span className={s.line} {...when("slot=trackCopied")}>
            <Check size={13} /> {t("cab.copied")}
          </span>
          <span className={s.line} {...when("slot=confirm; note=none")}>
            <Btn press="confirmDelivery" ok>
              <CheckCircle2 size={13} /> {t("cab.confirm")}
            </Btn>
          </span>
          <span className={s.line} {...when("note=loaded")}>
            <Bell size={13} /> {t("cab.noteTitle")}
            <Snap size={24} />
          </span>
          <span className={s.line} {...when("note=delivered")}>
            <Bell size={13} /> {t("cab.noteDropTitle")}
            <Snap size={24} />
          </span>
          <span className={s.line} {...when("slot=none|history; note=none")}>
            <span className={s.stack}>
              {STATUSES.map((st) => (
                <span key={st} className={s.badge} data-tone={st} {...when(`status=${st}`)}>
                  {t(`status.${st}`)}
                </span>
              ))}
            </span>
            <span className={s.stack}>
              <span className={s.conn} data-tone="go" {...when("conn=last")}>
                <i /> {t("cab.justNow")}
              </span>
              <span className={s.conn} data-tone="go" {...when("conn=moving")}>
                <i /> {t("cab.moving")}
              </span>
              {Object.entries(STOPPED_AT).map(([ch, time]) => (
                <span key={ch} className={s.conn} data-tone="wait" {...when(`conn=stopped; ch=${ch}`)}>
                  <i /> {t("cab.stopped", { time })}
                </span>
              ))}
              <span className={s.conn} data-tone="off" {...when("conn=nodata")}>
                <i /> {t("cab.noData")}
              </span>
              <span className={s.conn} {...when("conn=done")}>
                <Route size={13} /> {t("cab.km", { v: ROUTE_KM })}
              </span>
            </span>
          </span>
        </span>
      </div>

      {/* chapter 8: the client, above the two tiles */}
      <div className={s.rTile} data-anchor="receiver" {...when("receiver=1|2; ch=8")}>
        <Who who="receiver" />
        <MiniMap className={s.miniSmall} />
        <span className={s.stack}>
          <span className={s.rLine} {...when("receiver=1")}>
            <LoaderCircle size={14} /> {t("rcv.url")}
          </span>
          <span className={s.rLine} {...when("receiver=2")}>
            <b>{t("load.title")}</b>
            <span>
              <Check size={12} /> {t("rcv.noSignup")}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
