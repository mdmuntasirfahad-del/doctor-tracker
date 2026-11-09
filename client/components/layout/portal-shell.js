import { ShieldCheck } from "lucide-react";
import { Brand } from "./brand";
import { PublicFooter } from "./public-footer";
import { UserMenu } from "./user-menu";

export function PortalShell({ user, role, children }) {
  const roleLabel = role === "doctor" ? "Doctor portal" : "Patient portal";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#portal-content"
        className="sr-only z-[100] rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-[76px] w-full max-w-[1152px] items-center justify-between gap-3 px-5 sm:px-8">
          <Brand href="/" size="sm" label="Doctor Tracker home" />

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-[5px] bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand-dark sm:inline-flex">
              <ShieldCheck size={13} aria-hidden="true" />
              {role === "doctor" ? "Profile self-service" : "Profile & doctor self-service"}
            </span>
            <UserMenu user={user} roleLabel={roleLabel} />
          </div>
        </div>
      </header>

      <main id="portal-content" className="flex-1 px-5 pb-16 pt-8 sm:px-8">
        <div className="mx-auto w-full max-w-[1152px]">{children}</div>
      </main>

      <PublicFooter />
    </div>
  );
}
