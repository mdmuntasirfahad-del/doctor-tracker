"use client";

import { CircleAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SpecializationBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteDoctor } from "@/hooks/use-doctors";
import { useToast } from "@/components/ui/toast-provider";
import { formatNumber } from "@/lib/formatters";

export function DeleteDoctorDialog({ doctor, open, onClose, onDeleted }) {
  const deleteDoctor = useDeleteDoctor();
  const toast = useToast();

  if (!doctor) {
    return null;
  }

  const patientCount = doctor.patientCount ?? 0;
  const blocked = patientCount > 0;

  async function handleDelete() {
    try {
      await deleteDoctor.mutateAsync(doctor.id);
      toast.success("Doctor deleted", `${doctor.name}'s profile was removed.`);
      onDeleted?.();
      onClose();
    } catch (error) {
      toast.error("Doctor could not be deleted", error?.message ?? "Please try again in a moment.");
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      pending={deleteDoctor.isPending}
      confirmDisabled={blocked}
      title="Delete this doctor?"
      confirmLabel="Delete doctor"
      description={`This permanently removes ${doctor.name}'s doctor profile, linked sign-in account, and approved registration request. This cannot be undone.`}
    >
      <div className="rounded-xl border border-line bg-base-200/60 p-4">
        <div className="flex items-start gap-3">
          <Avatar name={doctor.name} src={doctor.profilePicture?.thumbUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-ink">{doctor.name}</p>
            <div className="mt-1">
              <SpecializationBadge>{doctor.specialization}</SpecializationBadge>
            </div>
            <p className="mt-1 truncate text-[12px] text-body">{doctor.hospital}</p>
            <p className="mt-1 text-[12px] text-body">
              {formatNumber(patientCount)} {patientCount === 1 ? "patient" : "patients"}
            </p>
          </div>
        </div>
      </div>

      {blocked ? (
        <p className="mt-4 flex items-start gap-2 text-[12.5px] font-medium text-danger">
          <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          This doctor still has {formatNumber(patientCount)}{" "}
          {patientCount === 1 ? "assigned patient" : "assigned patients"}. Reassign or delete them
          before deleting the doctor.
        </p>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-[12.5px] font-medium text-danger">
          <CircleAlert size={15} aria-hidden="true" />
          This action cannot be undone.
        </p>
      )}
    </ConfirmDialog>
  );
}
