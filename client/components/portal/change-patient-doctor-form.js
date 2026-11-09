"use client";

import { useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientDoctorUpdateSchema } from "@doctor-tracker/validation";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { FieldErrorSummary, FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast-provider";
import { useChangePatientDoctor } from "@/hooks/use-portal";
import { usePublicDoctorOptions } from "@/hooks/use-registration";

export function ChangePatientDoctorForm({ patient, formId, onChanged, onCancel }) {
  const idPrefix = useId().replace(/:/g, "");
  const toast = useToast();
  const doctorOptions = usePublicDoctorOptions();
  const changeDoctor = useChangePatientDoctor();
  const [formError, setFormError] = useState("");

  const options = useMemo(
    () => (doctorOptions.data?.data ?? []).filter((doctor) => doctor.id !== patient.doctorId),
    [doctorOptions.data, patient.doctorId],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientDoctorUpdateSchema),
    defaultValues: { doctorId: "" },
  });

  const pending = isSubmitting || changeDoctor.isPending;
  const unavailable = doctorOptions.isError;
  const noOptions = doctorOptions.isSuccess && options.length === 0;

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
      setFormError(error?.message ?? "Your doctor could not be changed. Please try again.");
    }
  }

  async function onSubmit(values) {
    setFormError("");

    try {
      const response = await changeDoctor.mutateAsync(values);
      toast.success(
        "Doctor changed",
        `${response.data.name} is now assigned to ${response.data.doctor?.name ?? "the selected doctor"}.`,
      );
      onChanged(response.data);
    } catch (error) {
      handleMutationError(error);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError ? <FieldErrorSummary message={formError} /> : null}

      <FormField
        label="New doctor"
        htmlFor={`${idPrefix}-doctor`}
        required
        hint="Only doctors other than your current one are listed."
        error={errors.doctorId?.message}
      >
        <select
          id={`${idPrefix}-doctor`}
          className="field-input appearance-none"
          aria-invalid={Boolean(errors.doctorId)}
          aria-describedby={
            errors.doctorId ? `${idPrefix}-doctor-error` : `${idPrefix}-doctor-hint`
          }
          disabled={pending || unavailable || noOptions}
          {...register("doctorId")}
        >
          <option value="">
            {doctorOptions.isPending ? "Loading doctors…" : "Select a doctor"}
          </option>
          {options.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} — {doctor.specialization} · {doctor.hospital}
            </option>
          ))}
        </select>
      </FormField>

      {unavailable ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3 text-[12px] text-body">
          <p>We could not load the doctor list.</p>
          <button
            type="button"
            onClick={() => doctorOptions.refetch()}
            className="btn-secondary-quiet shrink-0"
          >
            Retry
          </button>
        </div>
      ) : null}

      {noOptions ? (
        <p className="rounded-xl bg-soft px-4 py-3 text-[12px] leading-5 text-body">
          There are no other doctors available to choose from right now.
        </p>
      ) : null}

      <div className="flex items-start gap-2.5 rounded-xl bg-soft px-4 py-3 text-[12px] leading-5 text-body">
        <Info size={15} className="mt-0.5 shrink-0 text-body" aria-hidden="true" />
        <p>
          Changing your doctor moves your record to the new doctor’s patient list. Your previous
          doctor will no longer see your record.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
        <button type="button" onClick={onCancel} className="btn-secondary-quiet">
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || unavailable || noOptions}
          className="btn-primary-brand"
        >
          {pending ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Changing…
            </>
          ) : (
            "Change doctor"
          )}
        </button>
      </div>
    </form>
  );
}
