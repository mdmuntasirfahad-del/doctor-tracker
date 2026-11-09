"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function SearchInput({ value, onSearch, placeholder = "Search", label = "Search" }) {
  const [draft, setDraft] = useState(value ?? "");
  const debounced = useDebouncedValue(draft, 350);
  const lastEmitted = useRef(value ?? "");

  useEffect(() => {
    if (debounced !== lastEmitted.current) {
      lastEmitted.current = debounced;
      onSearch(debounced);
    }
  }, [debounced, onSearch]);

  useEffect(() => {
    if ((value ?? "") !== lastEmitted.current) {
      lastEmitted.current = value ?? "";
      setDraft(value ?? "");
    }
  }, [value]);

  return (
    <div className="relative w-full">
      <label htmlFor="list-search" className="sr-only">
        {label}
      </label>
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id="list-search"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="field-input h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            lastEmitted.current = "";
            onSearch("");
          }}
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted transition hover:bg-base-200 hover:text-ink"
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
