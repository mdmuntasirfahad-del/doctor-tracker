import Link from "next/link";
import { Brand } from "./brand";

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div>
          <Brand href="/" size="sm" label="Doctor Tracker home" />
          <p className="mt-3 max-w-sm text-[12.5px] leading-6 text-muted">
            A calm, secure workspace for doctor and patient records.
          </p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" className="text-[12.5px] text-body transition hover:text-brand">
            Home
          </Link>
          <Link href="/register" className="text-[12.5px] text-body transition hover:text-brand">
            Register
          </Link>
          <Link href="/login" className="text-[12.5px] text-body transition hover:text-brand">
            Login
          </Link>
          <span className="text-[12.5px] text-muted">
            © {new Date().getFullYear()} Doctor Tracker
          </span>
        </nav>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-1 px-5 py-4 text-[11.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>Example workspace · Fictional records</p>
          <p>Built for clinic teams.</p>
        </div>
      </div>
    </footer>
  );
}
