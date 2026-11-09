"use client";

import { createContext, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const AuthContext = createContext({
  session: null,
  user: null,
  isPending: true,
});

export function AuthProvider({ children }) {
  const sessionState = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute =
    pathname === "/" || pathname?.startsWith("/register") || pathname?.startsWith("/login");
  const isPortalRoute = !isPublicRoute;

  useEffect(() => {
    if (!sessionState.isPending && !sessionState.data && isPortalRoute) {
      router.replace("/login");
    }
  }, [sessionState.isPending, sessionState.data, isPortalRoute, router]);

  if (sessionState.isPending && isPortalRoute) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-body">
          <span className="grid size-9 place-items-center rounded-[10px] bg-brand text-white">
            <Activity size={18} aria-hidden="true" />
          </span>
          <span className="text-sm">Loading workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session: sessionState.data ?? null,
        user: sessionState.data?.user ?? null,
        isPending: sessionState.isPending,
        refetch: sessionState.refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async function signOut() {
    await authClient.signOut();
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  };
}
