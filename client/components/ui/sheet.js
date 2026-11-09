"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  labelledBy = "sheet-title",
}) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      previouslyFocused.current = document.activeElement;
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    const handleCancel = (event) => {
      event.preventDefault();
      onClose();
    };
    const handleClick = (event) => {
      if (event.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  useEffect(() => {
    if (!open && previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-[568px] overflow-hidden bg-transparent p-0 outline-none"
    >
      <div className="sheet-panel flex h-full flex-col bg-surface shadow-[-24px_0_60px_-40px_rgba(20,61,61,0.45)]">
        <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-6 sm:px-7">
          <div>
            <h2 id={labelledBy} className="text-[24px] font-medium tracking-[-0.02em] text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[13.5px] leading-6 text-body">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-md text-body transition hover:bg-base-200 hover:text-ink"
            aria-label="Close panel"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">{children}</div>

        {footer ? (
          <footer className="border-t border-line px-6 py-5 sm:px-7">{footer}</footer>
        ) : null}
      </div>
    </dialog>
  );
}
