"use client";

import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CONDITIONS,
  GENDERS,
  patientCreateSchema,
  patientUpdateSchema,
} from "@doctor-tracker/validation";
import { Info, Lock, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { FormField, FieldErrorSummary } from "@/components/ui/form-field";
import { useCreatePatient, useUpdatePatient } from "@/hooks/use-patients";
import { useToast } from "@/components/ui/toast-provider";
import { formatDate } from "@/lib/formatters";

export function PatientForm({ patient, doctor, conditions, formId, onSaved, onCancel }) {
  const mode = patient ? "edit" : "create";
  const idPrefix = useId().replace(/:/g, "");
  const toast = useToast();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const [formError, setFormError] = useState("");
  const assignedDoctor = doctor ?? patient?.doctor ?? null;

  const conditionOptions = useMemo(
    () =>
      [...new Set([...CONDITIONS, ...(conditions ?? []), patient?.condition].filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [conditions, patient?.condition],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(mode === "edit" ? patientUpdateSchema : patientCreateSchema),
    defaultValues: {
      name: patient?.name ?? "",
      age: patient?.age ?? "",
      gender: patient?.gender ?? "",
      condition: patient?.condition ?? "",
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
      // Leave an unassigned patient's hidden doctor field undefined. An empty
      // string would fail the optional ObjectId check before submit, hiding the
      // error because the field is not rendered.
      doctorId: doctor?.id ?? patient?.doctorId ?? undefined,
    },
  });

  const pending = isSubmitting || createPatient.isPending || updatePatient.isPending;

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
      setFormError(error?.message ?? "The patient could not be saved. Please try again.");
    }
  }

  async function onSubmit(values) {
    setFormError("");
    const normalized = {
      ...values,
      age: Number(values.age),
      email: values.email?.trim() || "",
    };

    if (!normalized.doctorId) {
      delete normalized.doctorId;
    }

    try {
      if (mode === "edit") {
        await updatePatient.mutateAsync({ id: patient.id, body: normalized });
        toast.success("Patient updated", `${normalized.name}’s record has been updated.`);
      } else {
        await createPatient.mutateAsync({
          ...normalized,
          doctorId: doctor?.id ?? values.doctorId,
        });
        toast.success(
          "Patient added",
          `${normalized.name} is now assigned to ${doctor?.name ?? "the doctor"}.`,
        );
      }
      onSaved();
    } catch (error) {
      handleMutationError(error);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {mode === "edit" ? (
        <div className="flex items-center justify-between gap-3">
          <span className="soft-badge">{patient.reference}</span>
          <span className="text-[11.5px] text-muted">Added {formatDate(patient.createdAt)}</span>
        </div>
      ) : null}

      {assignedDoctor ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-soft bg-brand-soft px-4 py-3.5">
          <Avatar
            name={assignedDoctor.name}
            src={assignedDoctor.profilePicture?.thumbUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-brand-dark/75">
              Assigned doctor
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-brand-dark">
              {assignedDoctor.name}
            </p>
            <p className="mt-0.5 truncate text-[11.5px] text-brand-dark/75">
              {[assignedDoctor.specialization, assignedDoctor.hospital].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Lock size={15} className="shrink-0 text-brand-dark/70" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-soft px-4 py-3.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-base-200 text-muted">
            <UserRound size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
              Assigned doctor
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">Unassigned</p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              The patient can choose a doctor from their portal.
            </p>
          </div>
        </div>
      )}

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
          placeholder="e.g. Amelia Wright"
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
                {gender === "male" ? "Male" : gender === "female" ? "Female" : "Other"}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="Condition"
        htmlFor={`${idPrefix}-condition`}
        required
        hint="Used to organise and filter patient records."
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
        hint="A parent or guardian’s number may be used for a child."
        error={errors.phone?.message}
      >
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          autoComplete="tel"
          placeholder="(415) 555-0000"
          className="field-input"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${idPrefix}-phone-error` : `${idPrefix}-phone-hint`}
          {...register("phone")}
        />
      </FormField>

      <FormField
        label="Email"
        htmlFor={`${idPrefix}-email`}
        hint="Optional. Used only for administrative contact."
        error={errors.email?.message}
      >
        <input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          className="field-input"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${idPrefix}-email-error` : `${idPrefix}-email-hint`}
          {...register("email")}
        />
      </FormField>

      <div className="flex items-start gap-2.5 rounded-xl bg-soft px-4 py-3 text-[12px] leading-5 text-body">
        <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          {mode === "edit"
            ? "Changes update both the patient directory and the assigned doctor’s patient list."
            : "A patient ID and date added will be created when the record is saved."}
        </p>
      </div>

      <div className="sticky bottom-0 -mx-6 mt-6 flex items-center justify-between gap-3 border-t border-line bg-surface px-6 py-5 sm:-mx-7 sm:px-7">
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
              "Add patient"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
