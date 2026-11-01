// next-intl: typed message keys. Russian is the source of truth; uz/en mirror its shape.
// Arrays (steps, cards, FAQ items…) are read with `t.raw()` and typed in lib/content.ts; for the
// key inference they count as leaves, otherwise next-intl's key recursion walks into Array.prototype.
type RawMessages = typeof import("./messages/ru.json");

type Leafy<T> = {
  [K in keyof T]: T[K] extends readonly unknown[] ? string : T[K] extends object ? Leafy<T[K]> : T[K];
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface IntlMessages extends Leafy<RawMessages> {}
