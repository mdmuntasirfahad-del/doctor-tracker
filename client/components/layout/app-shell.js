"use client";

import { useState } from "react";
import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";
import { Sidebar } from "./sidebar";
import { TabletDrawer } from "./tablet-drawer";
import { TopBar } from "./top-bar";
import { WorkspaceFooter } from "./workspace-footer";

export function AppShell({ user, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#workspace-content"
        className="sr-only z-[100] rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-line lg:block">
        <Sidebar />
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-56">
        <TopBar user={user} />
        <MobileHeader user={user} onOpenMenu={() => setMenuOpen(true)} />

        <main id="workspace-content" className="flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1152px]">
            {children}
            <WorkspaceFooter />
          </div>
        </main>
      </div>

      <BottomNav />
      <TabletDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
