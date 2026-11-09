"use client";

import { Sheet } from "@/components/ui/sheet";
import { PatientProfileCard } from "./patient-profile-card";

export function PatientProfileSheet({ patient, onClose }) {
  if (!patient) {
    return null;
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Patient profile"
      description={`Read-only record for ${patient.name}.`}
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary-quiet">
            Close
          </button>
        </div>
      }
    >
      <PatientProfileCard patient={patient} />
    </Sheet>
  );
}
