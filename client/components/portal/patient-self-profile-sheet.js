"use client";

import { useId } from "react";
import { Sheet } from "@/components/ui/sheet";
import { PatientSelfProfileForm } from "./patient-self-profile-form";

export function PatientSelfProfileSheet({ patient, onClose, onSaved }) {
  const formId = useId().replace(/:/g, "");

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit your profile"
      description="Update the details your clinic and assigned doctor see."
    >
      <PatientSelfProfileForm
        patient={patient}
        formId={formId}
        onSaved={() => {
          onSaved?.();
          onClose();
        }}
        onCancel={onClose}
      />
    </Sheet>
  );
}
