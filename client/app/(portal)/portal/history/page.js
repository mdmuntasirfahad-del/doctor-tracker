import { headers } from "next/headers";
import { auth } from "@doctor-tracker/auth";
import { PortalHistoryView } from "@/components/portal/portal-history-view";

export const metadata = {
  title: "History",
};

export default async function PortalHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <PortalHistoryView role={session.user.role} />;
}
