"use client";

import { UserX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { useRecordPatientOutcome } from "@/hooks/use-portal";
import { formatAgeSex } from "@/lib/formatters";

export function RejectPatientDialog({ patient, onClose, onRejected }) {
  const recordOutcome = useRecordPatientOutcome();
  const toast = useToast();

  if (!patient) {
    return null;
  }

  async function handleReject() {
    try {
      await recordOutcome.mutateAsync({ patientId: patient.id, outcome: "rejected" });
      toast.success(
        "Patient rejected",
        `${patient.name} has been removed from your patient list and can choose a new doctor.`,
      );
      onRejected?.();
      onClose();
    } catch (error) {
      toast.error(
        "Patient could not be rejected",
        error?.message ?? "Please try again in a moment.",
      );
    }
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={handleReject}
      pending={recordOutcome.isPending}
      title={`Reject ${patient.name}?`}
      confirmLabel="Reject patient"
      pendingLabel="Rejecting…"
      description={`This removes ${patient.name} from your patient list and releases them to choose a new doctor. Their workspace record and treatment history stay available to the administrator.`}
      icon={<UserX size={19} aria-hidden="true" />}
      confirmIcon={<UserX size={15} aria-hidden="true" />}
    >
      <div className="rounded-xl border border-line bg-base-200/60 p-4">
        <div className="flex items-start gap-3">
          <Avatar name={patient.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-ink">{patient.name}</p>
            <p className="mt-0.5 text-[12px] text-body">
              {patient.reference} · {formatAgeSex(patient.age, patient.gender)}
            </p>
            <p className="mt-1 text-[12px] text-muted">{patient.condition}</p>
          </div>
        </div>
      </div>
    </ConfirmDialog>
  );
}
