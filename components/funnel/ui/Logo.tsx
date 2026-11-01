// The mark (Y with a road and a pin) is multicolour and made for the navy bands.
// Beside it the wordmark in `display` 800, 20px, −0.025em (design system → Иконки).
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7" />
      <span className="font-display text-xl font-extrabold tracking-[-0.025em]">YoolLive</span>
    </span>
  );
}
