"use client";

import { useEffect, useRef } from "react";
import { Sidebar } from "./sidebar";

export function TabletDrawer({ open, onClose }) {
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
      aria-label="Navigation menu"
      className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[280px] max-w-[85vw] overflow-hidden bg-transparent p-0 outline-none"
    >
      <div className="sheet-panel h-full shadow-[24px_0_60px_-40px_rgba(20,61,61,0.45)]">
        <Sidebar onNavigate={onClose} />
      </div>
    </dialog>
  );
}
