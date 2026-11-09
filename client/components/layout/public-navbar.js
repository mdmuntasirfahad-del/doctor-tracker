"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { homeForRole } from "@/lib/safe-return-to";
import { Brand } from "./brand";

export function PublicNavbar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const role = session?.user?.role;
  const destination = !session ? "/login" : homeForRole(role);
  const destinationLabel = !session
    ? "Login"
    : role === "admin"
      ? "Dashboard"
      : role === "doctor" || role === "patient"
        ? "My portal"
        : "Workspace access";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Brand href="/" label="Doctor Tracker home" />

        <nav aria-label="Public navigation" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`rounded-[7px] px-3 py-2 text-[13.5px] font-medium transition hover:bg-base-200 ${
              pathname === "/" ? "text-brand-dark" : "text-body hover:text-ink"
            }`}
          >
            Home
          </Link>
          <Link href={destination} className="btn-primary-brand h-10 px-4 sm:px-5">
            {destinationLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
