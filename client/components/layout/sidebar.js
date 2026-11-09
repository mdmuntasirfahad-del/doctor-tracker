"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Info, LayoutDashboard, LogOut, Stethoscope, Users } from "lucide-react";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { useRegistrationRequests } from "@/hooks/use-registration-requests";
import { useSignOut } from "@/providers/auth-provider";
import { formatNumber } from "@/lib/formatters";
import { Brand } from "./brand";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, countKey: null },
  { href: "/doctors", label: "Doctors", icon: Stethoscope, countKey: "doctors" },
  { href: "/patients", label: "Patients", icon: Users, countKey: "patients" },
  {
    href: "/registration_request",
    label: "Registration requests",
    icon: ClipboardList,
    countKey: "requests",
  },
];

export function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const signOut = useSignOut();
  const summary = useDashboardSummary("30d");
  const requests = useRegistrationRequests({ limit: 1 });
  const totals = summary.data?.data?.totals;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-[76px] shrink-0 items-center border-b border-line px-5">
        <Brand />
      </div>

      <div className="px-5 pb-3 pt-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
          Workspace
        </p>
        <p className="mt-1 text-[13px] font-semibold text-ink">Administration</p>
      </div>

      <nav className="flex-1 px-3" aria-label="Main navigation">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const count =
              item.countKey === "requests"
                ? requests.data?.meta?.total
                : item.countKey
                  ? totals?.[item.countKey]
                  : null;
            const countPending =
              item.countKey === "requests" ? requests.isPending : summary.isPending;
            const countError = item.countKey === "requests" ? requests.isError : summary.isError;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] transition ${
                    active
                      ? "bg-brand-soft font-semibold text-brand-dark"
                      : "font-medium text-body hover:bg-base-200 hover:text-ink"
                  }`}
                >
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.countKey ? (
                    <span
                      className={`ml-auto text-[12.5px] font-medium ${
                        active ? "text-brand-dark/80" : "text-muted"
                      }`}
                    >
                      {countPending || countError ? "—" : formatNumber(count ?? 0)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-3 mt-6 rounded-xl bg-soft p-3.5">
        <div className="flex items-center gap-2 text-body">
          <Info size={15} aria-hidden="true" />
          <p className="text-[12.5px] font-semibold text-ink">Example workspace</p>
        </div>
        <p className="mt-1.5 text-[12px] leading-[1.55] text-body">
          Fictional records for demonstration.
        </p>
      </div>

      <div className="px-3 py-5">
        <button
          type="button"
          onClick={signOut}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-body transition hover:bg-base-200 hover:text-ink"
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}
