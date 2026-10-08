export const SITE = {
  url: "https://yool.live",
  app: "https://app.yool.live",
  register: "https://app.yool.live/register",
  privacy: "https://app.yool.live/privacy",
  terms: "https://app.yool.live/terms",
  email: "support@yool.live",
  stores: {
    googlePlay: "https://play.google.com/store/apps/details?id=yool.live.app",
    // iOS build is in App Store review; fill in the listing URL once it's live.
    appStore: null as string | null,
  },
  socials: {
    instagram: "#",
    facebook: "#",
    telegram: "#",
  },
} as const;
