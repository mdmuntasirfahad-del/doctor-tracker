"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { UserMenu } from "./user-menu";

function currentSection(pathname) {
  if (pathname.startsWith("/registration_request")) {
    return { label: "Registration requests", href: "/registration_request" };
  }
  if (pathname.startsWith("/doctors")) {
    return { label: "Doctors", href: "/doctors" };
  }
  if (pathname.startsWith("/patients")) {
    return { label: "Patients", href: "/patients" };
  }
  return { label: "Dashboard", href: "/dashboard" };
}

export function TopBar({ user }) {
  const pathname = usePathname();
  const section = currentSection(pathname);

  return (
    <header className="sticky top-0 z-30 hidden h-[76px] items-center justify-between border-b border-line bg-surface px-8 lg:flex">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px]">
        <span className="text-body">Workspace</span>
        <ChevronRight size={14} className="text-muted" aria-hidden="true" />
        <Link
          href={section.href}
          className="font-medium text-ink transition hover:text-brand"
          aria-current="page"
        >
          {section.label}
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <span className="rounded-[5px] bg-soft px-2.5 py-1 text-[11.5px] font-medium text-body">
          Administrator
        </span>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
