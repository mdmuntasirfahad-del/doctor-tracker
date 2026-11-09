"use client";

import { useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { HOSPITALS, SPECIALIZATIONS, doctorSelfUpdateSchema } from "@doctor-tracker/validation";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { FieldErrorSummary, FormField } from "@/components/ui/form-field";
import { ProfilePicturePicker } from "@/components/ui/profile-picture-picker";
import { useToast } from "@/components/ui/toast-provider";
import { useUpdateDoctorPortal } from "@/hooks/use-portal";

function mergeOptions(base, current) {
  return [...new Set([...base, current].filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function DoctorProfileForm({ doctor, formId, onSaved, onCancel }) {
  const idPrefix = useId().replace(/:/g, "");
  const toast = useToast();
  const updateProfile = useUpdateDoctorPortal();
  const [formError, setFormError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");

  const specializationOptions = useMemo(
    () => mergeOptions(SPECIALIZATIONS, doctor.specialization),
    [doctor.specialization],
  );
  const hospitalOptions = useMemo(
    () => mergeOptions(HOSPITALS, doctor.hospital),
    [doctor.hospital],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(doctorSelfUpdateSchema),
    defaultValues: {
      name: doctor.name ?? "",
      specialization: doctor.specialization ?? "",
      hospital: doctor.hospital ?? "",
      phone: doctor.phone ?? "",
    },
  });

  const pending = isSubmitting || updateProfile.isPending;

  function handleMutationError(error) {
    const fieldErrors = error?.fieldErrors ?? {};
    let handled = false;
    if (fieldErrors.profilePicture?.[0]) {
      setPhotoError(fieldErrors.profilePicture[0]);
      handled = true;
    }
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (field === "profilePicture") {
        continue;
      }
      if (Array.isArray(messages) && messages.length) {
        setError(field, { message: messages[0] });
        handled = true;
      }
    }
    if (!handled) {
      setFormError(error?.message ?? "Your profile could not be saved. Please try again.");
    }
  }

  async function onSubmit(values) {
    setFormError("");
    setPhotoError("");

    const payload = { ...values };
    if (photoPreview) {
      payload.profilePicture = photoPreview;
    }

    try {
      const response = await updateProfile.mutateAsync(payload);
      toast.success("Profile updated", `${response.data.name}’s profile has been updated.`);
      onSaved();
    } catch (error) {
      handleMutationError(error);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
          Profile information
        </p>
      </div>

      {formError ? <FieldErrorSummary message={formError} /> : null}

      <ProfilePicturePicker
        idPrefix={idPrefix}
        name={doctor.name || "Doctor"}
        value={photoPreview ?? doctor.profilePicture?.mediumUrl ?? ""}
        onChange={(dataUrl) => {
          setPhotoError("");
          setPhotoPreview(dataUrl);
        }}
        error={photoError}
        disabled={pending}
        hint="JPEG, PNG, or WebP up to 8 MB. Cropped to a square and shown in the doctor directory."
      />

      <FormField label="Name" htmlFor={`${idPrefix}-name`} required error={errors.name?.message}>
        <input
          id={`${idPrefix}-name`}
          type="text"
          autoComplete="name"
          placeholder="Dr. Sarah Kim"
          className="field-input"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Specialization"
        htmlFor={`${idPrefix}-specialization`}
        required
        error={errors.specialization?.message}
      >
        <select
          id={`${idPrefix}-specialization`}
          className="field-input appearance-none"
          aria-invalid={Boolean(errors.specialization)}
          {...register("specialization")}
        >
          <option value="">Select a specialization</option>
          {specializationOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Hospital"
        htmlFor={`${idPrefix}-hospital`}
        required
        error={errors.hospital?.message}
      >
        <select
          id={`${idPrefix}-hospital`}
          className="field-input appearance-none"
          aria-invalid={Boolean(errors.hospital)}
          {...register("hospital")}
        >
          <option value="">Select a hospital</option>
          {hospitalOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Phone"
        htmlFor={`${idPrefix}-phone`}
        required
        hint="Include the area code."
        error={errors.phone?.message}
      >
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          autoComplete="tel"
          placeholder="(415) 555-0142"
          className="field-input"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${idPrefix}-phone-error` : `${idPrefix}-phone-hint`}
          {...register("phone")}
        />
      </FormField>

      <FormField
        label="Sign-in email"
        htmlFor={`${idPrefix}-email`}
        hint="Contact an administrator to change the email you use to sign in."
      >
        <input
          id={`${idPrefix}-email`}
          type="email"
          value={doctor.email}
          readOnly
          disabled
          className="field-input disabled:cursor-not-allowed"
        />
      </FormField>

      <div className="flex items-start gap-2.5 rounded-xl bg-soft px-4 py-3 text-[12px] leading-5 text-body">
        <Info size={15} className="mt-0.5 shrink-0 text-body" aria-hidden="true" />
        <p>
          Your profile changes appear in the doctor directory. Your patient assignments are managed
          by the workspace administrator.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-[11.5px] text-muted">* Required fields</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary-quiet">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary-brand">
            {pending ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
