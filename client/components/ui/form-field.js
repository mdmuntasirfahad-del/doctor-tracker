export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-[12px] leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FieldErrorSummary({ message }) {
  if (!message) {
    return null;
  }
  return (
    <div
      className="rounded-[7px] border border-danger/25 bg-danger-soft px-3.5 py-3 text-[12.5px] leading-5 text-danger"
      role="alert"
    >
      {message}
    </div>
  );
}
