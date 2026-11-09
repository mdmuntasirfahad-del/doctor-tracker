export function SoftBadge({ children, className = "" }) {
  return <span className={`soft-badge ${className}`}>{children}</span>;
}

export function SpecializationBadge({ children }) {
  return (
    <span className="inline-flex h-6 items-center rounded-[5px] bg-brand-soft px-2 text-[12.5px] font-medium text-brand-dark">
      {children}
    </span>
  );
}

export function ConditionBadge({ children }) {
  return <span className="soft-badge">{children}</span>;
}
