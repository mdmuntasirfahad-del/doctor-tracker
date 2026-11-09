"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Stethoscope, Users } from "lucide-react";
import { useRegistrationRequests } from "@/hooks/use-registration-requests";
import { formatNumber } from "@/lib/formatters";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/registration_request", label: "Requests", icon: ClipboardList },
];

export function BottomNav() {
  const pathname = usePathname();
  const requests = useRegistrationRequests({ limit: 1 });
  const pendingRequests = requests.data?.meta?.total ?? 0;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid h-[78px] grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1.5 text-[11.5px] font-medium transition ${
                active ? "text-brand" : "text-body"
              }`}
            >
              <span className="relative grid size-6 place-items-center">
                <Icon size={21} strokeWidth={active ? 2 : 1.7} aria-hidden="true" />
                {item.href === "/registration_request" && pendingRequests > 0 ? (
                  <span className="absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-semibold leading-4 text-white">
                    {pendingRequests > 99 ? "99+" : formatNumber(pendingRequests)}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
