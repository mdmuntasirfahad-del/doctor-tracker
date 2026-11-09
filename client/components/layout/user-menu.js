"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useSignOut } from "@/providers/auth-provider";
import { Avatar } from "@/components/ui/avatar";

export function UserMenu({ user, compact = false, roleLabel = "Workspace admin" }) {
  const signOut = useSignOut();
  const name = user?.name ?? "Workspace user";

  return (
    <details className="dropdown dropdown-end relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2.5 rounded-lg p-1 transition hover:bg-base-200 [&::-webkit-details-marker]:hidden ${
          compact ? "" : "pr-1.5"
        }`}
        aria-label="Open account menu"
      >
        <Avatar name={name} size={compact ? "xs" : "sm"} />
        {compact ? null : (
          <>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[13px] font-semibold text-ink">{name}</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">{roleLabel}</span>
            </span>
            <ChevronDown size={15} className="ml-1 hidden text-muted sm:block" aria-hidden="true" />
          </>
        )}
      </summary>

      <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[250px] rounded-xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_-30px_rgba(32,52,56,0.45)]">
        <div className="px-3 py-2.5">
          <p className="text-[13px] font-semibold text-ink">{name}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted">{user?.email}</p>
        </div>
        <div className="my-1 h-px bg-line" />
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-body transition hover:bg-base-200 hover:text-ink"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </details>
  );
}
