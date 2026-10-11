// Light of the hour: the sun, the sky and the haze by the minute of the
// trip, from a cool low morning sun over the Tashkent depot to a sunset at
// Fergana and dusk over the whole route in the finale.
//
// The table is the probe's (the owner saw that light) with the sky raised
// by a third: Lambert divides by π, and sky + sun·sin(elevation) ≈ 3.1
// keeps the land the colour of the page by day (engine.ts). The dusk at
// the end stays light enough for the blue track to stand out on the land:
// the finale is "the whole route in blue at dusk", not a night map.

import { Color, Vector3, type DirectionalLight, type HemisphereLight } from "three";

// [minute, sun azimuth° (0 = −z, clockwise), elevation°, sun colour, sun
//  intensity, sky, ground, sky intensity, background and haze]
type Key = [number, number, number, number, number, number, number, number, number];
const SKY: Key[] = [
  [460, 100, 13, 0xffd6a3, 1.35, 0xe6ecf5, 0xb9b09a, 2.4, 0xeae6dc], //  07:40 low morning sun
  [600, 135, 36, 0xfff2e0, 1.55, 0xf6f6f2, 0xb9b09a, 2.2, 0xe9e7df], //  10:00 (sessions 1–4)
  [740, 185, 52, 0xfff6ea, 1.6, 0xfbf9f4, 0xb9b09a, 1.85, 0xe9e7df], //  12:20 noon at the chaikhana
  [900, 232, 33, 0xffe9cc, 1.5, 0xf7f2ea, 0xb9b09a, 2.3, 0xe8e3d8], //  15:00
  [1015, 256, 13, 0xffc58e, 1.4, 0xf4e2d2, 0xb8aa94, 2.6, 0xeedfcd], // 16:55 the light turns gold
  [1055, 263, 5, 0xffa874, 1.15, 0xefdbd0, 0xa89a8c, 2.5, 0xe9d1c4], // 17:35 sunset
  [1110, 268, 2, 0xff9a66, 0.15, 0x9fb0e0, 0x6a7598, 2.45, 0x8590bd], //  18:30 dusk
];

// Below this the shadows would stretch across the whole screen.
const MIN_EL = 6;

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// Windows and street lamps light up from 16:50 and are full by 17:50; the
// truck's headlights are on from 16:55 (DUSK_MIN of the flat map).
export const lampsAt = (minute: number) => smooth((minute - 1010) / 60);
export const beamsAt = (minute: number) => smooth((minute - 1015) / 25);

const cB = new Color();

export function skyAt(minute: number, sun: DirectionalLight, hemi: HemisphereLight, background: Color, dir: Vector3) {
  let j = 1;
  while (j < SKY.length - 1 && SKY[j][0] < minute) j++;
  const a = SKY[j - 1];
  const b = SKY[j];
  const t = Math.min(1, Math.max(0, (minute - a[0]) / (b[0] - a[0])));
  const L = (k: number) => a[k] + (b[k] - a[k]) * t;
  const C = (k: number, out: Color) => out.setHex(a[k]).lerp(cB.setHex(b[k]), t);
  const az = (L(1) * Math.PI) / 180;
  const el = (Math.max(MIN_EL, L(2)) * Math.PI) / 180;
  dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  C(3, sun.color);
  sun.intensity = L(4);
  C(5, hemi.color);
  C(6, hemi.groundColor);
  hemi.intensity = L(7);
  C(8, background);
}
