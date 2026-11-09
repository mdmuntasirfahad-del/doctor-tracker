"use client";

import { Menu } from "lucide-react";
import { Brand } from "./brand";
import { UserMenu } from "./user-menu";

export function MobileHeader({ user, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-line bg-surface px-5 lg:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="hidden size-9 place-items-center rounded-lg text-body transition hover:bg-base-200 hover:text-ink md:grid"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <Brand size="sm" />
      </div>
      <UserMenu user={user} compact />
    </header>
  );
}
