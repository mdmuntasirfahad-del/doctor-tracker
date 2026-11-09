import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PageSkeleton } from "@/components/ui/skeletons";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
