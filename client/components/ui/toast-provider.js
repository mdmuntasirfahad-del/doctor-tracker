"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const toneStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-success",
    bar: "bg-success",
  },
  error: {
    icon: CircleAlert,
    iconClass: "text-error",
    bar: "bg-error",
  },
  info: {
    icon: Info,
    iconClass: "text-brand",
    bar: "bg-brand",
  },
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, description, tone = "success" }) => {
      toastId += 1;
      const id = toastId;
      setToasts((current) => [...current.slice(-3), { id, title, description, tone }]);
      const timer = setTimeout(() => dismiss(id), 4200);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (title, description) => push({ title, description, tone: "success" }),
      error: (title, description) => push({ title, description, tone: "error" }),
      info: (title, description) => push({ title, description, tone: "info" }),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = toneStyles[toast.tone] ?? toneStyles.info;
            const Icon = style.icon;
            return (
              <motion.div
                key={toast.id}
                initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface pr-10 shadow-[0_18px_40px_-24px_rgba(32,52,56,0.35)]"
                role={toast.tone === "error" ? "alert" : "status"}
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
                <div className="flex gap-3 p-4 pl-5">
                  <Icon
                    size={18}
                    className={`mt-0.5 shrink-0 ${style.iconClass}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-0.5 text-[13px] leading-5 text-body">{toast.description}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-md text-muted transition hover:bg-base-200 hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
