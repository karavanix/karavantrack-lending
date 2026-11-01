import { type Locale, defaultLocale } from "@/i18n/routing";

/**
 * Product recordings (docs/funnel/recordings.md), served as
 * `public/media/<id>.<locale>.mp4` + a `.webp` poster that is the clip's first frame.
 * Sections ask for clips by name and pass them down; the names stay stable when the files
 * are re-rendered or translated.
 */
export type Clip = {
  src: string;
  poster: string;
  /** Encoded size; the frames reserve this ratio before anything loads. */
  width: number;
  height: number;
};

/** Locales that have their own recordings. Others show the `defaultLocale` ones. */
export const MEDIA_LOCALES: readonly Locale[] = ["ru"];

const registry = {
  heroCabinet: ["01-hero-cabinet", 1920, 1080],
  heroPhone: ["02-hero-phone", 720, 1528],
  offline: ["06-offline", 1920, 1200],
  recipientLink: ["07-recipient-link", 720, 1558],
  idle: ["08-idle", 1920, 1200],
  /** Top of the driver's screen only (header + load card); shown cut off at the bottom. */
  driverStart: ["09-driver-start", 720, 660],
  createLoad: ["10-create-load", 1920, 1200],
  sendLink: ["11-send-link", 720, 1528],
  inviteLink: ["12-invite-link", 1920, 1200],
  inTransit: ["13-in-transit", 1920, 1200],
} as const satisfies Record<string, readonly [id: string, width: number, height: number]>;

export type ClipName = keyof typeof registry;

export function mediaLocale(locale: string): Locale {
  return (MEDIA_LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
}

export function clip(name: ClipName, locale: string): Clip {
  const [id, width, height] = registry[name];
  const base = `/media/${id}.${mediaLocale(locale)}`;
  return { src: `${base}.mp4`, poster: `${base}.webp`, width, height };
}
