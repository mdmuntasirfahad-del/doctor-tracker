"use client";

import { useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CONDITIONS,
  GENDERS,
  GENDER_LABELS,
  patientSelfUpdateSchema,
} from "@doctor-tracker/validation";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { FieldErrorSummary, FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast-provider";
import { useUpdatePatientPortal } from "@/hooks/use-portal";

export function PatientSelfProfileForm({ patient, formId, onSaved, onCancel }) {
  const idPrefix = useId().replace(/:/g, "");
  const toast = useToast();
  const updateProfile = useUpdatePatientPortal();
  const [formError, setFormError] = useState("");

  const conditionOptions = useMemo(
    () =>
      [...new Set([...CONDITIONS, patient.condition].filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [patient.condition],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientSelfUpdateSchema),
    defaultValues: {
      name: patient.name ?? "",
      age: patient.age ?? "",
      gender: patient.gender ?? "",
      condition: patient.condition ?? "",
      phone: patient.phone ?? "",
    },
  });

  const pending = isSubmitting || updateProfile.isPending;

  function handleMutationError(error) {
    const fieldErrors = error?.fieldErrors ?? {};
    let handled = false;
    for (const [field, messages] of Object.entries(fieldErrors)) {
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

    try {
      const response = await updateProfile.mutateAsync({
        ...values,
        age: Number(values.age),
      });
      toast.success("Profile updated", `${response.data.name}’s profile has been updated.`);
      onSaved();
    } catch (error) {
      handleMutationError(error);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
        Patient information
      </p>

      {formError ? <FieldErrorSummary message={formError} /> : null}

      <FormField
        label="Full name"
        htmlFor={`${idPrefix}-name`}
        required
        error={errors.name?.message}
      >
        <input
          id={`${idPrefix}-name`}
          type="text"
          autoComplete="name"
          placeholder="Amelia Wright"
          className="field-input"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
          {...register("name")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Age" htmlFor={`${idPrefix}-age`} required error={errors.age?.message}>
          <input
            id={`${idPrefix}-age`}
            type="number"
            min={0}
            max={130}
            inputMode="numeric"
            placeholder="45"
            className="field-input"
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? `${idPrefix}-age-error` : undefined}
            {...register("age")}
          />
        </FormField>

        <FormField
          label="Sex"
          htmlFor={`${idPrefix}-gender`}
          required
          error={errors.gender?.message}
        >
          <select
            id={`${idPrefix}-gender`}
            className="field-input appearance-none"
            aria-invalid={Boolean(errors.gender)}
            {...register("gender")}
          >
            <option value="">Select</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {GENDER_LABELS[gender]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="Condition"
        htmlFor={`${idPrefix}-condition`}
        required
        hint="Used by your clinic to organise and filter patient records."
        error={errors.condition?.message}
      >
        <input
          id={`${idPrefix}-condition`}
          type="text"
          list={`${idPrefix}-conditions`}
          placeholder="Select or enter a condition"
          className="field-input"
          aria-invalid={Boolean(errors.condition)}
          aria-describedby={
            errors.condition ? `${idPrefix}-condition-error` : `${idPrefix}-condition-hint`
          }
          {...register("condition")}
        />
        <datalist id={`${idPrefix}-conditions`}>
          {conditionOptions.map((condition) => (
            <option key={condition} value={condition} />
          ))}
        </datalist>
      </FormField>

      <p className="pt-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
        Contact information
      </p>

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
          value={patient.email ?? ""}
          readOnly
          disabled
          className="field-input disabled:cursor-not-allowed"
        />
      </FormField>

      <div className="flex items-start gap-2.5 rounded-xl bg-soft px-4 py-3 text-[12px] leading-5 text-body">
        <Info size={15} className="mt-0.5 shrink-0 text-body" aria-hidden="true" />
        <p>
          Your profile changes appear in the patient directory and in your assigned doctor’s patient
          list. Your sign-in email is managed by the workspace administrator.
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
