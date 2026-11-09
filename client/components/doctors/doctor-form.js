"use client";

import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  HOSPITALS,
  SPECIALIZATIONS,
  doctorCreateSchema,
  doctorUpdateSchema,
} from "@doctor-tracker/validation";
import { Info } from "lucide-react";
import { FormField, FieldErrorSummary } from "@/components/ui/form-field";
import { useCreateDoctor, useUpdateDoctor } from "@/hooks/use-doctors";
import { useToast } from "@/components/ui/toast-provider";

function mergeOptions(base, extra, current) {
  return [...new Set([...base, ...(extra ?? []), current].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function DoctorForm({ doctor, formId, specializations, hospitals, onSaved, onCancel }) {
  const mode = doctor ? "edit" : "create";
  const idPrefix = useId().replace(/:/g, "");
  const toast = useToast();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const [formError, setFormError] = useState("");

  const specializationOptions = useMemo(
    () => mergeOptions(SPECIALIZATIONS, specializations, doctor?.specialization),
    [specializations, doctor?.specialization],
  );
  const hospitalOptions = useMemo(
    () => mergeOptions(HOSPITALS, hospitals, doctor?.hospital),
    [hospitals, doctor?.hospital],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(mode === "edit" ? doctorUpdateSchema : doctorCreateSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      specialization: doctor?.specialization ?? "",
      hospital: doctor?.hospital ?? "",
      phone: doctor?.phone ?? "",
      email: doctor?.email ?? "",
    },
  });

  const pending = isSubmitting || createDoctor.isPending || updateDoctor.isPending;

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
      setFormError(error?.message ?? "The doctor could not be saved. Please try again.");
    }
  }

  async function onSubmit(values) {
    setFormError("");
    const normalized = {
      ...values,
      email: values.email?.trim(),
    };

    try {
      if (mode === "edit") {
        await updateDoctor.mutateAsync({ id: doctor.id, body: normalized });
        toast.success("Doctor updated", `${normalized.name}’s profile has been updated.`);
      } else {
        await createDoctor.mutateAsync(normalized);
        toast.success(
          "Doctor added",
          `${normalized.name} is now available in the doctor directory.`,
        );
      }
      onSaved();
    } catch (error) {
      handleMutationError(error);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
          Doctor information
        </p>
      </div>

      {formError ? <FieldErrorSummary message={formError} /> : null}

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

      <FormField label="Email" htmlFor={`${idPrefix}-email`} required error={errors.email?.message}>
        <input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          className="field-input"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${idPrefix}-email-error` : undefined}
          {...register("email")}
        />
      </FormField>

      <div className="flex items-start gap-2.5 rounded-xl bg-soft px-4 py-3 text-[12px] leading-5 text-body">
        <Info size={15} className="mt-0.5 shrink-0 text-body" aria-hidden="true" />
        <p>
          {mode === "edit"
            ? "Profile changes update the doctor directory and every linked patient record."
            : "After adding this doctor, open their profile to register and manage patients."}
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
            ) : mode === "edit" ? (
              "Save changes"
            ) : (
              "Add doctor"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
