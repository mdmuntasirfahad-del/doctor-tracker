"use client";

import { useRef } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { formatDateRange } from "@/lib/formatters";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

export function RangeSelect({ value, onChange, startDate, endDate }) {
  const detailsRef = useRef(null);
  const label = formatDateRange(startDate, endDate) || "Select range";

  return (
    <details ref={detailsRef} className="dropdown dropdown-end relative">
      <summary className="field-input flex h-11 w-full cursor-pointer list-none items-center gap-2 whitespace-nowrap px-3.5 text-[13px] sm:w-auto [&::-webkit-details-marker]:hidden">
        <CalendarDays size={16} className="text-body" aria-hidden="true" />
        <span className="font-medium text-ink">{label}</span>
        <ChevronDown size={14} className="ml-1 text-muted" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-[0_20px_50px_-30px_rgba(32,52,56,0.4)]">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              detailsRef.current?.removeAttribute("open");
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium text-ink transition hover:bg-base-200"
          >
            {option.label}
            {value === option.value ? (
              <Check size={15} className="text-brand" aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </div>
    </details>
  );
}
