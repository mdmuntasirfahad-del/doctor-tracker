import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@doctor-tracker/auth";
import { AppShell } from "@/components/layout/app-shell";
import { safeReturnTo } from "@/lib/safe-return-to";

export default async function DashboardLayout({ children }) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    const returnTo = safeReturnTo(requestHeaders.get("x-doctor-tracker-return-to"));
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (session.user.role !== "admin") {
    const destination =
      session.user.role === "doctor" || session.user.role === "patient"
        ? "/portal"
        : "/access-denied";
    redirect(destination);
  }

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    >
      {children}
    </AppShell>
  );
}
