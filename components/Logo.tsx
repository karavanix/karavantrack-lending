import Image from "next/image";

type Props = { className?: string; withWordmark?: boolean };

export function Logo({ className, withWordmark = true }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/logo.svg"
        alt="Yool"
        width={28}
        height={28}
        priority
        className="h-7 w-7"
      />
      {withWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight">Yool</span>
      )}
    </span>
  );
}
