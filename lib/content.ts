// Shapes of the array entries in messages/<locale>.json. Scalars are typed through
// `IntlMessages` (global.d.ts); arrays come out of `t.raw()` untyped, so sections cast to these.

export type Step = { title: string; text: string; image: string };

export type Benefit = { title: string; text: string };

export type Feature = {
  num: string;
  title: string;
  titleAccent: string;
  text: string;
  caption: string;
  video: string;
};

export type FaqItem = { q: string; a: string };

export type LeadLabels = {
  title: string;
  text: string;
  name: string;
  company: string;
  phone: string;
  fleet: string;
  fleetOptions: string[];
  submit: string;
  sending: string;
  success: string;
  error: string;
  required: string;
  or: string;
  telegram: string;
};
