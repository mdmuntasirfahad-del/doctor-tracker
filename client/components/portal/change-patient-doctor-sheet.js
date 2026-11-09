"use client";

import { useId } from "react";
import { Sheet } from "@/components/ui/sheet";
import { ChangePatientDoctorForm } from "./change-patient-doctor-form";

export function ChangePatientDoctorSheet({ patient, onClose, onChanged }) {
  const formId = useId().replace(/:/g, "");

  return (
    <Sheet
      open
      onClose={onClose}
      title="Change your doctor"
      description="Choose another doctor to take over your care."
    >
      <ChangePatientDoctorForm
        patient={patient}
        formId={formId}
        onChanged={() => {
          onChanged?.();
          onClose();
        }}
        onCancel={onClose}
      />
    </Sheet>
  );
}
