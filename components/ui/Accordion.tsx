import { Plus } from "lucide-react";

type Item = { q: string; a: string };

export function Accordion({ items }: { items: Item[] }) {
  return (
    <div className="divide-y divide-[var(--color-line-soft)] border-y border-[var(--color-line-soft)]">
      {items.map((it, i) => (
        <details key={i} className="group" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="text-lg font-semibold text-[var(--color-ink)]">{it.q}</span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-line-soft)] transition-transform group-open:rotate-45">
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <p className="pb-6 pr-12 text-[var(--color-ink-muted)] leading-relaxed">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
