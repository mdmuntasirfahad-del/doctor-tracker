"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

function pageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current]);
  if (current > 2) {
    pages.add(current - 1);
  }
  if (current < total - 1) {
    pages.add(current + 1);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const output = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      output.push(`ellipsis-${page}`);
    }
    output.push(page);
    previous = page;
  }
  return output;
}

export function Pagination({ meta, onPageChange, label = "records" }) {
  if (!meta) {
    return null;
  }

  const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = meta;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-[12.5px] text-body">
        Showing <span className="font-medium text-ink">{formatNumber(start)}</span>–
        <span className="font-medium text-ink">{formatNumber(end)}</span> of{" "}
        <span className="font-medium text-ink">{formatNumber(total)}</span> {label}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={15} aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                className={`grid size-8 place-items-center rounded-[6px] text-[12.5px] font-medium transition ${
                  item === page
                    ? "bg-brand-soft text-brand-dark"
                    : "border border-transparent text-body hover:border-line hover:bg-base-200 hover:text-ink"
                }`}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-1 text-[12px] text-muted">
                …
              </span>
            ),
          )}
        </div>

        <span className="px-1 text-[12px] text-body sm:hidden">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span>Next</span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
