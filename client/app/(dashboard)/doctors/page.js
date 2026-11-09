import { Suspense } from "react";
import { DoctorsView } from "@/components/doctors/doctors-view";
import { TableSkeleton } from "@/components/ui/skeletons";

export const metadata = {
  title: "Doctors",
};

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <TableSkeleton rows={8} columns={6} />
        </div>
      }
    >
      <DoctorsView />
    </Suspense>
  );
}
