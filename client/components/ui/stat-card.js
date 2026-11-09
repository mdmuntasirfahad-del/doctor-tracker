export function StatCard({ label, value, icon, footer, loading = false, className = "" }) {
  return (
    <article
      className={`flex min-h-[148px] flex-col justify-between rounded-xl border border-line bg-surface p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-medium text-body">{label}</p>
        {icon ? <span className="text-brand/80">{icon}</span> : null}
      </div>
      <div>
        {loading ? (
          <span className="mt-2 block h-[42px] w-24 animate-pulse rounded-md bg-base-200" />
        ) : (
          <p className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {value}
          </p>
        )}
        {footer ? <div className="mt-4 text-[12.5px] text-body">{footer}</div> : null}
      </div>
    </article>
  );
}
