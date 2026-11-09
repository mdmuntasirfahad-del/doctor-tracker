"use client";

import { useId } from "react";
import { Sheet } from "@/components/ui/sheet";
import { DoctorForm } from "./doctor-form";

export function DoctorSheet({ doctor = null, onClose, specializations, hospitals }) {
  const formId = useId().replace(/:/g, "");
  const mode = doctor ? "edit" : "create";

  return (
    <Sheet
      open
      onClose={onClose}
      title={mode === "edit" ? "Edit doctor" : "Add doctor"}
      description={
        mode === "edit"
          ? "Update this doctor’s profile and contact details."
          : "Create a profile to start managing this doctor’s patients."
      }
    >
      <DoctorForm
        doctor={doctor}
        formId={formId}
        specializations={specializations}
        hospitals={hospitals}
        onSaved={onClose}
        onCancel={onClose}
      />
    </Sheet>
  );
}
