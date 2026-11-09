import { Activity } from "lucide-react";
import Link from "next/link";

export function BrandMark({ size = "md" }) {
  const tile = size === "sm" ? "size-[30px]" : "size-[38px]";
  const icon = size === "sm" ? 17 : 21;

  return (
    <span className={`grid ${tile} place-items-center rounded-[9px] bg-brand text-white`}>
      <Activity size={icon} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

export function Brand({
  size = "md",
  href = "/",
  tone = "default",
  label = "Doctor Tracker home",
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={label}>
      <BrandMark size={size} />
      <span
        className={`font-semibold tracking-[-0.02em] ${
          tone === "light" ? "text-white" : "text-ink"
        } ${size === "sm" ? "text-[16.5px]" : "text-[18px]"}`}
      >
        Doctor Tracker
      </span>
    </Link>
  );
}
