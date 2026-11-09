import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@doctor-tracker/auth";
import { DoctorDashboardView } from "@/components/portal/doctor-dashboard-view";
import { PatientDashboardView } from "@/components/portal/patient-dashboard-view";

export const metadata = {
  title: "Portal dashboard",
};

export default async function PortalDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session.user.role === "doctor") {
    return <DoctorDashboardView />;
  }

  if (session.user.role === "patient") {
    return <PatientDashboardView />;
  }

  redirect("/dashboard");
}
