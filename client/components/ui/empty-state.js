import { Inbox, RefreshCw, TriangleAlert } from "lucide-react";

export function EmptyState({ icon, title, description, action, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        compact ? "py-12" : "py-16"
      }`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-base-200 text-muted">
        {icon ?? <Inbox size={20} aria-hidden="true" />}
      </span>
      <h2 className="mt-4 text-[15px] font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-body">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "We could not load this view",
  description = "Check your connection and try again.",
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        compact ? "py-12" : "py-16"
      }`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert size={20} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-[15px] font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-body">{description}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary-quiet mt-5">
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
