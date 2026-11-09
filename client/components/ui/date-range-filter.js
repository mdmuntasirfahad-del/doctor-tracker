"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { formatDateRange } from "@/lib/formatters";

export function DateRangeFilter({ from = "", to = "", onChange }) {
  const detailsRef = useRef(null);
  const signature = `${from}|${to}`;
  const [draft, setDraft] = useState({ signature, from, to });
  const [error, setError] = useState("");

  if (draft.signature !== signature) {
    setDraft({ signature, from, to });
  }

  const draftFrom = draft.from;
  const draftTo = draft.to;

  const label =
    from || to
      ? formatDateRange(from ? `${from}T00:00:00.000Z` : null, to ? `${to}T00:00:00.000Z` : null)
      : "Date added";

  function apply() {
    if (draftFrom && draftTo && draftFrom > draftTo) {
      setError("The start date must be before the end date.");
      return;
    }
    setError("");
    onChange({ from: draftFrom, to: draftTo });
    detailsRef.current?.removeAttribute("open");
  }

  function clear() {
    setDraft({ signature: "|", from: "", to: "" });
    setError("");
    onChange({ from: "", to: "" });
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details ref={detailsRef} className="dropdown relative">
      <summary className="field-input flex h-10 w-full cursor-pointer list-none items-center gap-2 px-3 text-[13.5px] sm:w-auto [&::-webkit-details-marker]:hidden">
        <CalendarDays size={16} className="shrink-0 text-body" aria-hidden="true" />
        <span className="min-w-0 truncate text-ink">{label}</span>
        <ChevronDown size={14} className="ml-auto shrink-0 text-muted" aria-hidden="true" />
      </summary>

      <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] max-w-[calc(100vw-40px)] rounded-xl border border-line bg-surface p-4 shadow-[0_20px_50px_-30px_rgba(32,52,56,0.4)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
          Date added
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[12px] font-medium text-body">
            From
            <input
              type="date"
              value={draftFrom}
              onChange={(event) =>
                setDraft((current) => ({ ...current, from: event.target.value }))
              }
              className="field-input mt-1 h-9 px-2 text-[12.5px]"
            />
          </label>
          <label className="text-[12px] font-medium text-body">
            To
            <input
              type="date"
              value={draftTo}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
              className="field-input mt-1 h-9 px-2 text-[12.5px]"
            />
          </label>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={clear}
            className="text-[12.5px] font-medium text-body transition hover:text-ink"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={apply}
            className="btn-primary-brand h-8 px-3 text-[12.5px]"
          >
            Apply dates
          </button>
        </div>
      </div>
    </details>
  );
}
