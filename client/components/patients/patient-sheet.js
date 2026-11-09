"use client";

import { useId } from "react";
import { Sheet } from "@/components/ui/sheet";
import { PatientForm } from "./patient-form";

export function PatientSheet({ patient = null, doctor = null, conditions, onClose }) {
  const formId = useId().replace(/:/g, "");
  const mode = patient ? "edit" : "create";
  const assigned = doctor ?? patient?.doctor ?? null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={mode === "edit" ? "Edit patient" : "Add patient"}
      description={
        mode === "edit"
          ? `Update ${patient.name}'s patient information.`
          : assigned
            ? `Register a patient for ${assigned.name}.`
            : "Register a new patient record."
      }
    >
      <PatientForm
        patient={patient}
        doctor={doctor}
        conditions={conditions}
        formId={formId}
        onSaved={onClose}
        onCancel={onClose}
      />
    </Sheet>
  );
}
