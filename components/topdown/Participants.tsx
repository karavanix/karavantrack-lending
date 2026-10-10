"use client";

// The three permanent participants' faces: the dispatcher's cabinet panel and
// the driver's phone (desktop column), plus the same two as compact tiles
// (phone strip). Every variant is rendered once and switched by the world
// state through data-when (see world.ts). Buttons that a scene "presses" carry
// data-press; ends of impulses carry data-anchor.

import { useTranslations } from "next-intl";
import { Check, Copy, Link2, MonitorSmartphone, Smartphone, Truck as TruckIcon } from "lucide-react";
import s from "./topdown.module.css";
import { when } from "./world";
import { QUEUED } from "./chapters";

type Status = "created" | "accepted" | "loaded" | "transit" | "delivered";
const STATUSES: Status[] = ["created", "accepted", "loaded", "transit", "delivered"];
const ACTS = ["beginPickup", "confirmPickup", "startTransit", "beginDropoff", "confirmDropoff"] as const;

function Btn({ press, children, ghost }: { press?: string; children: React.ReactNode; ghost?: boolean }) {
  return (
    <span className={`${s.btn} ${ghost ? s.btnGhost : ""}`} data-press={press}>
      {children}
      <i className={s.ripple} data-ripple />
    </span>
  );
}

function Bars() {
  return (
    <span className={s.bars} aria-hidden>
      <i /> <i /> <i /> <i />
    </span>
  );
}

export function Who({ who }: { who: "dispatcher" | "driver" }) {
  const t = useTranslations("td.who");
  return (
    <span className={s.who} data-who={who}>
      {who === "dispatcher" ? <MonitorSmartphone size={14} /> : <Smartphone size={14} />}
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
          </div>

          <div className={s.pBody} {...when("slot=invite|link|copied|none|share")}>
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
                  <span className={s.conn} data-tone="wait" {...when("conn=stopped")}>
                    <i /> {t("cab.stopped")}
                  </span>
                  <span className={s.conn} data-tone="off" {...when("conn=nodata")}>
                    <i /> {t("cab.noData")}
                  </span>
                </span>
                <span className={s.stack}>
                  <span {...when("conn=none")}>—</span>
                  <span className={s.conn} data-tone="go" {...when("conn=last")}>
                    <i /> {t("cab.justNow")}
                  </span>
                  <span className={s.battery} {...when("conn=moving|stopped|nodata; batch=0")}>
                    92%
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
              <div className={s.pRoute} {...when("slot=none; conn=none|last|moving")}>
                <div className={s.pRow}>
                  <span>{t("cab.pickup")}</span>
                  <b>{t("load.from")}</b>
                </div>
                <div className={s.pRow}>
                  <span>{t("cab.dropoff")}</span>
                  <b>{t("load.to")}</b>
                </div>
              </div>
              {/* why there are no points: the cabinet's own hint under the status */}
              <div className={s.pHint} {...when("slot=none; conn=stopped|nodata")}>
                <span className={s.stack}>
                  <span {...when("conn=stopped")}>{t("cab.stoppedHint")}</span>
                  <span {...when("conn=nodata")}>{t("cab.noDataHint")}</span>
                </span>
              </div>
              <div className={s.pAction} {...when("slot=share")}>
                <Btn ghost>{t("cab.share")}</Btn>
              </div>
            </div>
          </div>
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
            <span className={s.sbBat}>92</span>
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
                {STATUSES.map((st) => (
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
                <span className={s.stack}>
                  <span className={s.pill} data-tone="go" {...when("gps=1")}>
                    <i />
                    {t("app.gpsActive")}
                  </span>
                  <span className={s.pill} data-tone="mute" {...when("gps=0")}>
                    <i />
                    {t("app.gpsWaiting")}
                  </span>
                </span>
                {/* points waiting on the phone: counted by TopDown as the truck drives */}
                <span className={s.pill} data-tone="warn" data-queued data-on="0">
                  <i />
                  <span data-bind="queued" />
                </span>
              </div>
              <span className={s.stack}>
                {ACTS.map((a) => (
                  <span key={a} {...when(`act=${a}`)}>
                    <Btn press={a}>{t(`app.act.${a}`)}</Btn>
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className={s.toast} {...when("toast=accepted")}>
            <Check size={14} /> {t("app.accepted")}
          </div>
        </div>
      </div>
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
          {/* one pill for room: the counter once points pile up, "Offline" before */}
          <span className={s.line} {...when("screen=active; toast=none; net=0")}>
            <span className={s.pill} data-tone="warn" data-queued data-on="0">
              <i />
              <span data-bind="queued" />
            </span>
            <span className={s.pill} data-tone="warn" data-offline>
              <i />
              {t("app.offline")}
            </span>
          </span>
          <span className={s.line} {...when("screen=active; toast=none; net=1")}>
            <span className={s.stack}>
              <span className={s.pill} data-tone="go" {...when("gps=1")}>
                <i />
                {t("app.gpsActive")}
              </span>
              <span className={s.pill} data-tone="mute" {...when("gps=0")}>
                <i />
                {t("app.gpsWaiting")}
              </span>
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
          <span className={s.line} {...when("slot=none|share")}>
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
              <span className={s.conn} data-tone="wait" {...when("conn=stopped")}>
                <i /> {t("cab.stopped")}
              </span>
              <span className={s.conn} data-tone="off" {...when("conn=nodata")}>
                <i /> {t("cab.noData")}
              </span>
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
