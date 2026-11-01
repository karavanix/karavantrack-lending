// Counters and goals. Yandex Metrika and GA4 are loaded only when their ids are set at build time
// (NEXT_PUBLIC_YM_ID / NEXT_PUBLIC_GA4_ID — GitHub variables → build-args → Dockerfile ARG/ENV).
// Without the ids nothing is rendered and `track()` is a no-op.
//
// Goal names are the owner's list (docs/funnel/plan.md → session 5). In Metrika they are
// JavaScript-event goals with these identifiers; in GA4 they arrive as events with the same names.

export const YM_ID = process.env.NEXT_PUBLIC_YM_ID || "";
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "";

export const GOALS = [
  "hero_cta",
  "nav_cta",
  "start_cta",
  "final_cta",
  "driver_cta",
  "login",
  "store_google",
  "store_apple",
  "lead_submit",
  "lead_success",
  "tg_contact",
  "phone_click",
] as const;
export type Goal = (typeof GOALS)[number];

/**
 * `data-track="<goal>"` on a link or button; `Analytics` reports the click. Goal parameters ride
 * along as `data-track-<name>="<value>"`, e.g. `data-track-place="faq"` → `{ place: "faq" }`.
 */
export const TRACK_ATTR = "data-track";

/** The `data-track-*` parameters of a tracked element, or undefined when it has none. */
export function trackParams(el: HTMLElement): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (k.length > 5 && k.startsWith("track") && v) out[k[5].toLowerCase() + k.slice(6)] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

type YmFn = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };

declare global {
  interface Window {
    ym?: YmFn;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Defines the queueing stubs exactly as the official snippets do, so calls made before the
 * tags load are replayed by them. Idempotent; React strict mode calls effects twice.
 */
export function initCounters() {
  if (typeof window === "undefined") return;
  if (YM_ID && !window.ym) {
    const ym: YmFn = (...args) => {
      (ym.a = ym.a || []).push(args);
    };
    ym.l = Date.now();
    window.ym = ym;
    ym(Number(YM_ID), "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      accurateTrackBounce: true,
      trackLinks: true,
      referrer: document.referrer,
      url: location.href,
    });
  }
  if (GA4_ID && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // GA reads `arguments`, not a spread array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
  }
}

/** Reports a goal to both counters (whichever are configured). */
export function track(goal: Goal, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  initCounters();
  if (YM_ID) window.ym?.(Number(YM_ID), "reachGoal", goal, params);
  if (GA4_ID) window.gtag?.("event", goal, params);
}

// ---- UTM -------------------------------------------------------------------------------------

/** Marks carried from the landing into app.yool.live (registration, login). */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "gclid"] as const;
const UTM_STORAGE = "yl_utm";
const UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export function readUtm(search: string): Utm {
  const q = new URLSearchParams(search);
  const out: Utm = {};
  for (const k of UTM_KEYS) {
    const v = q.get(k);
    if (v) out[k] = v;
  }
  return out;
}

/**
 * The marks from the current URL; when there are none, the ones saved earlier (30 days) — a visitor
 * who came from an ad, left and returned by typing the address still counts for that ad.
 * New marks replace the saved ones.
 */
export function currentUtm(): Utm {
  const fresh = readUtm(location.search);
  try {
    if (Object.keys(fresh).length) {
      localStorage.setItem(UTM_STORAGE, JSON.stringify({ t: Date.now(), u: fresh }));
      return fresh;
    }
    const raw = localStorage.getItem(UTM_STORAGE);
    if (!raw) return {};
    const saved = JSON.parse(raw) as { t: number; u: Utm };
    if (Date.now() - saved.t > UTM_TTL_MS) {
      localStorage.removeItem(UTM_STORAGE);
      return {};
    }
    return saved.u ?? {};
  } catch {
    return fresh;
  }
}

/** `href` with the marks appended; marks already present in the link win. */
export function withUtm(href: string, utm: Utm): string {
  const keys = Object.keys(utm) as (keyof Utm)[];
  if (!keys.length) return href;
  const url = new URL(href, "https://yool.live");
  for (const k of keys) if (!url.searchParams.has(k)) url.searchParams.set(k, utm[k]!);
  return url.toString();
}
