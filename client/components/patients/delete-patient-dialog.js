"use client";

import { CircleAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeletePatient } from "@/hooks/use-patients";
import { useToast } from "@/components/ui/toast-provider";
import { formatAgeSex } from "@/lib/formatters";

export function DeletePatientDialog({ patient, open, onClose, onDeleted }) {
  const deletePatient = useDeletePatient();
  const toast = useToast();

  if (!patient) {
    return null;
  }

  async function handleDelete() {
    try {
      await deletePatient.mutateAsync(patient.id);
      toast.success(
        "Patient deleted",
        `${patient.name}'s record has been removed from the workspace.`,
      );
      onDeleted?.();
      onClose();
    } catch (error) {
      toast.error(
        "Patient could not be deleted",
        error?.message ?? "Please try again in a moment.",
      );
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      pending={deletePatient.isPending}
      title="Delete this patient?"
      confirmLabel="Delete patient"
      description={`This will permanently delete ${patient.name}'s record from the Patients directory and their doctor's patient list.`}
    >
      <div className="rounded-xl border border-line bg-base-200/60 p-4">
        <div className="flex items-start gap-3">
          <Avatar name={patient.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-ink">{patient.name}</p>
            <p className="mt-0.5 text-[12px] text-body">
              {patient.reference} · {formatAgeSex(patient.age, patient.gender)} ·{" "}
              {patient.condition}
            </p>
            <p className="mt-1 text-[12px] text-body">
              {patient.doctor ? `Assigned to ${patient.doctor.name}` : "Unassigned"}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[12.5px] font-medium text-danger">
        <CircleAlert size={15} aria-hidden="true" />
        This action cannot be undone.
      </p>
    </ConfirmDialog>
  );
}
