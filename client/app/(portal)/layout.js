import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@doctor-tracker/auth";
import { PortalShell } from "@/components/layout/portal-shell";
import { safeReturnTo } from "@/lib/safe-return-to";

export default async function PortalLayout({ children }) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    const returnTo = safeReturnTo(requestHeaders.get("x-doctor-tracker-return-to"), "doctor");
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (session.user.role === "admin") {
    redirect("/dashboard");
  }

  if (session.user.role !== "doctor" && session.user.role !== "patient") {
    redirect("/access-denied");
  }

  return (
    <PortalShell
      role={session.user.role}
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    >
      {children}
    </PortalShell>
  );
}
