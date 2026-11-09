"use client";

import { useId } from "react";
import { Sheet } from "@/components/ui/sheet";
import { DoctorProfileForm } from "./doctor-profile-form";

export function DoctorProfileSheet({ doctor, onClose, onSaved }) {
  const formId = useId().replace(/:/g, "");

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit your profile"
      description="Update the details shown in the doctor directory."
    >
      <DoctorProfileForm
        doctor={doctor}
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
