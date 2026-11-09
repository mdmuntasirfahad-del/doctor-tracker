"use client";

import { useState } from "react";
import { initials } from "@/lib/formatters";

const sizeClasses = {
  xs: "size-8 text-[11px]",
  sm: "size-9 text-[12px]",
  md: "size-10 text-[13px]",
  lg: "size-12 text-[14px]",
  xl: "size-[72px] text-lg",
};

export function Avatar({ name, src, size = "md", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const classes = `inline-grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand-dark ${sizeClasses[size] ?? sizeClasses.md} ${className}`;

  if (src && src !== failedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`${classes} object-cover`}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span className={classes} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
