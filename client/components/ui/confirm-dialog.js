"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  pending = false,
  confirmDisabled = false,
  children,
  icon,
  confirmIcon,
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
      if (!pending) {
        onClose();
      }
    };
    const handleClick = (event) => {
      if (event.target === dialog && !pending) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose, pending]);

  useEffect(() => {
    if (!open && previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] overflow-visible rounded-xl bg-transparent p-0 outline-none"
    >
      <div className="dialog-panel relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-surface p-6 shadow-[0_30px_80px_-30px_rgba(20,61,61,0.5)] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-md text-body transition hover:bg-base-200 hover:text-ink disabled:opacity-50"
          aria-label="Close confirmation"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <span className="grid size-11 place-items-center rounded-full bg-danger-soft text-danger">
          {icon ?? <Trash2 size={19} aria-hidden="true" />}
        </span>

        <h2
          id="confirm-title"
          className="mt-5 pr-8 text-[24px] font-medium tracking-[-0.02em] text-ink"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[13.5px] leading-6 text-body">{description}</p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="btn-secondary-quiet"
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] bg-danger px-4 text-[13.5px] font-semibold text-white transition hover:bg-[#a53e3b] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {confirmIcon ?? <Trash2 size={15} aria-hidden="true" />}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
