import { headers } from "next/headers";
import { auth } from "@doctor-tracker/auth";
import { PortalView } from "@/components/portal/portal-view";

export const metadata = {
  title: "My portal",
};

export default async function PortalPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <PortalView role={session.user.role} />;
}
