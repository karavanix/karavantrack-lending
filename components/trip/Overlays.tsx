"use client";

// Product moments that pop up over the scene, one per chapter. They are
// small mock-ups of the real cabinet and driver app (dark, like the product),
// so the illustration stays a story and these stay recognisable as YoolLive.
// Live numbers (speed, battery, pending points) are filled in by Trip via
// data-bind attributes.

import { useTranslations } from "next-intl";
import s from "./trip.module.css";

function Pill({ tone, children, bind }: { tone: "go" | "wait" | "off"; children?: React.ReactNode; bind?: string }) {
  return (
    <span className={`${s.pill} ${s[`pill_${tone}`]}`}>
      <i />
      <span data-bind={bind}>{children}</span>
    </span>
  );
}

function Bars({ off }: { off?: boolean }) {
  return (
    <span className={`${s.bars} ${off ? s.barsOff : ""}`} aria-hidden>
      <i /> <i /> <i /> <i />
    </span>
  );
}

export function Overlays() {
  const t = useTranslations("trip.ov");
  const h = useTranslations("trip.hero");
  const route = useTranslations("trip")("route");
  const min = useTranslations("trip.units")("min");

  return (
    <div className={s.overlays}>
      {/* 0 · hero: the question nobody needs to ask anymore */}
      <div className={`${s.ov} ${s.ovHero}`} data-ov="0">
        <div className={s.bubble} data-part="bubble">
          <span className={s.bubbleFrom}>{h("bubbleFrom")} · 07:40</span>
          <span className={s.bubbleText}>
            {h("bubble")}
            <span className={s.strike} data-part="strike" />
          </span>
        </div>
        <div className={s.answer} data-part="answer">
          <Pill tone="wait">{h("answer")}</Pill>
          <span className={s.answerBat}>92%</span>
        </div>
      </div>

      {/* 1 · load created from a pasted map link */}
      <div className={s.ov} data-ov="1">
        <div className={s.card}>
          <div className={s.cardTitle}>{t("load.title")}</div>
          <div className={s.field}>
            <span className={s.fieldLabel}>{t("load.from")}</span>
            <span className={s.fieldSwap}>
              <span className={s.linkChip} data-part="chip">{t("load.link")}</span>
              <span className={s.fieldValue} data-part="addr">
                {t("load.fromAddr")}
              </span>
            </span>
          </div>
          <div className={s.field}>
            <span className={s.fieldLabel}>{t("load.to")}</span>
            <span className={s.fieldValue}>{t("load.toAddr")}</span>
          </div>
          <div className={s.routeRow} data-part="route">
            <svg viewBox="0 0 120 24" aria-hidden>
              <circle cx="6" cy="16" r="5" fill="#21C45D" />
              <path d="M10 16 C 35 2, 55 22, 80 10 S 105 6, 112 8" stroke="#2081F8" strokeWidth="3" fill="none" />
              <circle cx="114" cy="8" r="5" fill="#DC2828" />
            </svg>
            <span>{t("load.route")}</span>
          </div>
        </div>
      </div>

      {/* 2 · driver accepts from a Telegram link */}
      <div className={s.ov} data-ov="2">
        <div className={s.tg}>
          <span className={s.bubbleFrom}>{t("invite.chat")}</span>
          <span>{t("invite.msg")}</span>
          <span className={s.tgLink}>{t("invite.link")}</span>
        </div>
        <div className={s.phone}>
          <div className={s.phoneTitle}>{t("invite.app")}</div>
          <div className={s.phoneRoute}>{route}</div>
          <div className={s.btnSwap}>
            <span className={s.btn} data-part="accept">
              {t("invite.accept")}
            </span>
            <span className={`${s.btn} ${s.btnDone}`} data-part="accepted">
              ✓ {t("invite.accepted")}
            </span>
          </div>
        </div>
      </div>

      {/* 3 · loaded: photo, stamp, push */}
      <div className={s.ov} data-ov="3">
        <div className={s.push} data-part="push">
          <span className={s.pushApp}>YoolLive</span>
          <b>{t("loaded.push")}</b>
          <span>{t("loaded.pushText")}</span>
        </div>
        <div className={s.polaroid}>
          <svg viewBox="0 0 200 130" aria-hidden>
            <rect width="200" height="130" fill="#5C6670" />
            <rect x="0" y="96" width="200" height="34" fill="#7D858E" />
            {[0, 1, 2].map((c) =>
              [0, 1].map((r) => (
                <g key={`${c}${r}`}>
                  <rect x={34 + c * 46} y={36 + r * 32} width="42" height="30" fill="#C99A62" />
                  <rect x={34 + c * 46} y={48 + r * 32} width="42" height="5" fill="#E3C79C" />
                </g>
              )),
            )}
            <rect x="30" y="100" width="142" height="8" fill="#8C6E4C" />
          </svg>
          <span className={s.polaroidCap}>{t("loaded.caption")}</span>
          <span className={s.stamp} data-part="stamp">
            {t("loaded.stamp")} 09:14
          </span>
        </div>
      </div>

      {/* 4 · live telemetry in the cabinet */}
      <div className={s.ov} data-ov="4">
        <div className={s.card}>
          <div className={s.cardHead}>
            <span className={s.cardTitle}>{t("drive.title")}</span>
            <Pill tone="go" bind="connShort" />
          </div>
          <div className={s.metrics}>
            <div>
              <span>{t("drive.speed")}</span>
              <b data-bind="speed">84</b>
            </div>
            <div>
              <span>{t("drive.driven")}</span>
              <b data-bind="driven">0</b>
            </div>
            <div>
              <span>{t("drive.eta")}</span>
              <b data-bind="eta">—</b>
            </div>
            <div>
              <span>{t("drive.battery")}</span>
              <b data-bind="battery">92%</b>
            </div>
          </div>
          <div className={s.miniRoute}>
            <i data-bind-style="progress" />
          </div>
        </div>
      </div>

      {/* 5 · stopped at the chaikhana */}
      <div className={s.ov} data-ov="5">
        <div className={s.card}>
          <div className={s.cardHead}>
            <span className={s.cardTitle}>{t("drive.title")}</span>
            <Pill tone="wait">{t("stop.since")}</Pill>
          </div>
          <div className={s.stopRow}>
            <span className={s.pBadge}>P</span>
            <span>
              {t("stop.parking")} · 40 {min}
            </span>
          </div>
        </div>
        <div className={`${s.phone} ${s.phoneSmall}`}>
          <span className={s.zzz} aria-hidden>
            z<sup>z</sup>
            <sup>z</sup>
          </span>
          <span>{t("stop.phone")}</span>
        </div>
      </div>

      {/* 6 · the pass: no network, points pile up on the phone */}
      <div className={s.ov} data-ov="6">
        <div className={s.phone}>
          <div className={s.phoneStatus}>
            <Bars off /> {t("offline.noNet")}
          </div>
          <div className={s.counter}>
            <b data-bind="pending">0</b>
            <span>{t("offline.saved")}</span>
          </div>
        </div>
        <div className={s.cardSlim}>
          <Pill tone="off">{t("offline.cabinet")}</Pill>
        </div>
      </div>

      {/* 7 · network back: the batch goes out, the track closes */}
      <div className={s.ov} data-ov="7">
        <div className={s.card}>
          <div className={s.cardHead}>
            <span className={s.cardTitle}>{t("back.restored")}</span>
            <Bars />
          </div>
          <div className={s.counter}>
            <b>
              +<span data-bind="batch">0</span>
            </b>
            <span>{t("back.sent")}</span>
          </div>
          <svg className={s.trackMini} viewBox="0 0 240 40" aria-hidden>
            <path d="M6 30 C 40 30, 60 8, 100 14" stroke="#2081F8" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path data-part="gap" d="M100 14 C 130 18, 150 34, 180 22" stroke="#2081F8" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M180 22 C 200 14, 220 12, 234 16" stroke="#2081F8" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className={s.particles} aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} data-part="dot" style={{ left: `${8 + ((i * 37) % 80)}%` }} />
          ))}
        </div>
      </div>

      {/* 8 · the receiver follows a public link */}
      <div className={s.ov} data-ov="8">
        <div className={`${s.phone} ${s.phoneLight}`}>
          <div className={s.urlBar}>{t("client.url")}</div>
          <svg className={s.clientMap} viewBox="0 0 220 110" aria-hidden>
            <rect width="220" height="110" fill="#E8EEF2" />
            <path d="M0 80 L60 70 L120 82 L220 40" stroke="#FFFFFF" strokeWidth="10" fill="none" />
            <path d="M10 78 L60 70 L120 82 L168 60" stroke="#2081F8" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="210" cy="44" r="6" fill="#DC2828" />
            <circle className={s.mapDot} cx="168" cy="60" r="7" fill="#2081F8" stroke="#FFFFFF" strokeWidth="3" />
          </svg>
          <b>{t("client.title")}</b>
          <span className={s.clientStatus}>{t("client.status")}</span>
          <span className={s.captionChip}>{t("client.caption")}</span>
        </div>
      </div>

      {/* 9 · delivered: waybill photo, shipper confirms */}
      <div className={s.ov} data-ov="9">
        <div className={s.polaroid}>
          <svg viewBox="0 0 200 130" aria-hidden>
            <rect width="200" height="130" fill="#8B7B6A" />
            <g transform="rotate(-4 100 65)">
              <rect x="44" y="12" width="112" height="106" fill="#FBFAF6" />
              <rect x="56" y="24" width="60" height="7" fill="#3A4652" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x="56" y={42 + i * 10} width={i % 2 ? 70 : 88} height="4" fill="#B7C0C9" />
              ))}
              <circle cx="128" cy="100" r="11" fill="none" stroke="#2F6FB5" strokeWidth="3" />
            </g>
          </svg>
          <span className={s.polaroidCap}>{t("done.photo")} · 17:22</span>
        </div>
        <div className={s.btnSwap}>
          <span className={`${s.btn} ${s.btnWide}`} data-part="confirm">
            {t("done.confirm")}
          </span>
          <span className={`${s.btn} ${s.btnDone} ${s.btnWide}`} data-part="confirmed">
            ✓ {t("done.done")} 17:30
          </span>
        </div>
      </div>
    </div>
  );
}
