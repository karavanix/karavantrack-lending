export const SITE = {
  url: "https://yool.live",
  app: "https://app.yool.live",
  appHost: "app.yool.live",
  register: "https://app.yool.live/register",
  login: "https://app.yool.live/login",
  privacy: "https://app.yool.live/privacy-policy",
  terms: "https://app.yool.live/terms-of-service",
  email: "support@yool.live",
  stores: {
    googlePlay: "https://play.google.com/store/apps/details?id=yool.live.app",
    appStore: "https://apps.apple.com/app/yoollive/id6762088132",
  },
} as const;

/** In-page anchors; the sections set these ids, the nav and footer link to them. */
export const ANCHORS = {
  how: "#how",
  drivers: "#drivers",
  faq: "#faq",
  start: "#start",
} as const;
