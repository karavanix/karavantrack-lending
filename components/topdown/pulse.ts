// Impulses: a dot that runs along a wire from one participant to another, like
// a message down a line. They are drawn in a fixed full-screen layer and the
// ends are looked up every frame, so a pulse still lands on the truck while
// the page scrolls under it.

import gsap from "gsap";

type Pt = { x: number; y: number };
export type Target = string | (() => DOMRect | null);

export type PulseOpts = {
  color?: string;
  label?: string; // rides along with the dot, e.g. "via Telegram"
  bend?: number; // sideways bulge of the wire, share of its length (sign = side)
  duration?: number;
  size?: number; // dot radius
  // Leave / arrive through the middle of this side instead of the side
  // facing the other end.
  out?: Side;
  in?: Side;
  // Never arrives: stops at this share of the way, greys out and fades
  // (a point sent into no network).
  fail?: number;
  // Small dots trailing the main one: many points travelling as one batch.
  pack?: number;
};

type Side = "left" | "right" | "top" | "bottom";

function sidePoint(r: DOMRect, side: Side, pad = 4): Pt {
  if (side === "left") return { x: r.left - pad, y: r.top + r.height / 2 };
  if (side === "right") return { x: r.right + pad, y: r.top + r.height / 2 };
  if (side === "top") return { x: r.left + r.width / 2, y: r.top - pad };
  return { x: r.left + r.width / 2, y: r.bottom + pad };
}

const SVG = "http://www.w3.org/2000/svg";

// Point on the border of r in the direction of p.
function edge(r: DOMRect, p: Pt, pad = 4): Pt {
  const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  if (!dx && !dy) return c;
  const t = Math.min(
    dx ? (r.width / 2 + pad) / Math.abs(dx) : Infinity,
    dy ? (r.height / 2 + pad) / Math.abs(dy) : Infinity,
  );
  return t >= 1 ? c : { x: c.x + dx * t, y: c.y + dy * t };
}

const mid = (r: DOMRect): Pt => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

export function createPulses(root: HTMLElement, layer: HTMLElement) {
  const svg = layer.querySelector("svg")!;
  const live = new Set<Element>();

  // The first visible element marked data-anchor="name" (desktop column and
  // phone strip both carry the same names).
  const rectOf = (t: Target): DOMRect | null => {
    if (typeof t === "function") return t();
    for (const el of root.querySelectorAll<HTMLElement>(`[data-anchor~="${t}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && getComputedStyle(el).visibility !== "hidden") return r;
    }
    return null;
  };

  const add = <T extends Element>(el: T, parent: Element = svg): T => {
    parent.appendChild(el);
    live.add(el);
    return el;
  };
  const drop = (...els: Element[]) => {
    for (const el of els) {
      el.remove();
      live.delete(el);
    }
  };

  function pulse(from: Target, to: Target, opts: PulseOpts = {}) {
    const color = opts.color ?? "#2563eb";
    const size = opts.size ?? 5.5;
    const bend = opts.bend ?? 0.22;
    const wire = add(document.createElementNS(SVG, "path"));
    wire.setAttribute("fill", "none");
    wire.setAttribute("stroke", color);
    wire.setAttribute("stroke-width", "2");
    wire.setAttribute("stroke-linecap", "round");
    wire.setAttribute("pathLength", "1");
    wire.setAttribute("stroke-dasharray", "0 1");
    wire.style.opacity = "0";
    const halo = add(document.createElementNS(SVG, "circle"));
    halo.setAttribute("r", String(size * 2.4));
    halo.setAttribute("fill", color);
    halo.style.opacity = "0";
    const dot = add(document.createElementNS(SVG, "circle"));
    dot.setAttribute("r", String(size));
    dot.setAttribute("fill", color);
    dot.setAttribute("stroke", "#fff");
    dot.setAttribute("stroke-width", "2");
    dot.style.opacity = "0";
    const ring = add(document.createElementNS(SVG, "circle"));
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", color);
    ring.setAttribute("stroke-width", "2.5");
    ring.style.opacity = "0";
    const trail = Array.from({ length: opts.pack ?? 0 }, (_, j) => {
      const el = add(document.createElementNS(SVG, "circle"));
      el.setAttribute("r", String(Math.max(2.5, size * (0.55 - j * 0.06))));
      el.setAttribute("fill", color);
      el.setAttribute("stroke", "#fff");
      el.setAttribute("stroke-width", "1.5");
      el.style.opacity = "0";
      return el;
    });
    let tag: HTMLElement | null = null;
    if (opts.label) {
      tag = add(document.createElement("span"), layer);
      tag.className = "td-pulse-tag";
      tag.style.opacity = "0";
      tag.style.setProperty("--c", color);
      tag.textContent = opts.label;
    }

    const st = { p: 0, r: 0, ring: 0 };
    let end: Pt = { x: 0, y: 0 };
    const draw = () => {
      const ra = rectOf(from);
      const rb = rectOf(to);
      if (!ra || !rb) return;
      const a = opts.out ? sidePoint(ra, opts.out) : edge(ra, mid(rb));
      const b = opts.in ? sidePoint(rb, opts.in) : edge(rb, mid(ra));
      end = b;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const c = {
        x: (a.x + b.x) / 2 + ((a.y - b.y) / (len || 1)) * len * bend,
        y: (a.y + b.y) / 2 + ((b.x - a.x) / (len || 1)) * len * bend,
      };
      const p = st.p;
      const bez = (p: number) => {
        const q = 1 - p;
        return [q * q * a.x + 2 * q * p * c.x + p * p * b.x, q * q * a.y + 2 * q * p * c.y + p * p * b.y];
      };
      const [x, y] = bez(Math.min(1, p)); // a batch head waits at the end for its trail
      trail.forEach((el, j) => {
        const [tx, ty] = bez(Math.min(1, Math.max(0, p - (j + 1) * 0.055)));
        el.setAttribute("cx", String(tx));
        el.setAttribute("cy", String(ty));
      });
      wire.setAttribute("d", `M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`);
      wire.setAttribute("stroke-dasharray", `${p} 1`);
      for (const el of [dot, halo]) {
        el.setAttribute("cx", String(x));
        el.setAttribute("cy", String(y));
      }
      ring.setAttribute("cx", String(end.x));
      ring.setAttribute("cy", String(end.y));
      ring.setAttribute("r", String(size + st.r));
      ring.style.opacity = String(st.ring);
      if (tag) tag.style.transform = `translate(${x}px, ${y}px)`;
    };

    const tl = gsap.timeline({ onUpdate: draw });
    const duration = opts.duration ?? 1;
    tl.set(dot, { opacity: 1 }, 0);
    tl.set(halo, { opacity: 0.22 }, 0);
    tl.set(wire, { opacity: 0.55 }, 0);
    if (trail.length) tl.set(trail, { opacity: 0.9 }, 0.05);
    if (tag) tl.fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.2 }, duration * 0.2);
    if (opts.fail != null) {
      // runs out of road: slows down, turns grey and fades where it stopped
      tl.to(st, { p: opts.fail, duration: duration * opts.fail * 1.3, ease: "power2.out" }, 0);
      tl.set([dot, halo], { attr: { fill: "#94a3b8" } });
      tl.set(wire, { attr: { stroke: "#94a3b8" } }, "<");
      tl.to([dot, halo, ...trail], { opacity: 0, duration: 0.6, ease: "power1.in" }, "+=0.15");
      tl.to(wire, { opacity: 0, duration: 0.5 }, "<");
    } else {
      tl.to(st, { p: 1 + (trail.length ? (trail.length + 1) * 0.055 : 0), duration, ease: "power1.inOut" }, 0);
      // the ring goes off when the head arrives (p = 1), the trail drains in after it
      tl.set(st, { ring: 0.9 }, trail.length ? duration * 0.82 : duration);
      tl.to(st, { r: size * 4, ring: 0, duration: 0.55, ease: "power2.out" }, ">");
      tl.to([dot, halo], { opacity: 0, duration: 0.25 }, "<");
      if (trail.length) tl.to(trail, { opacity: 0, duration: 0.25 }, duration - 0.05);
      tl.to(wire, { opacity: 0, duration: 0.5 }, "<0.1");
    }
    if (tag) tl.to(tag, { opacity: 0, duration: 0.25 }, "<");
    tl.call(() => drop(wire, halo, dot, ring, ...trail, ...(tag ? [tag] : [])));
    draw();
    return tl;
  }

  const clear = () => drop(...live);

  return { pulse, clear, rectOf };
}

export type PulseApi = ReturnType<typeof createPulses>;
