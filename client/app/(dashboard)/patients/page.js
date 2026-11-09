import { Suspense } from "react";
import { PatientsView } from "@/components/patients/patients-view";
import { TableSkeleton } from "@/components/ui/skeletons";

export const metadata = {
  title: "Patients",
};

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <TableSkeleton rows={8} columns={6} />
        </div>
      }
    >
      <PatientsView />
    </Suspense>
  );
}
