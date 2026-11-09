"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  CONDITIONS,
  GENDERS,
  GENDER_LABELS,
  HOSPITALS,
  SPECIALIZATIONS,
  publicDoctorRegistrationFormSchema,
  publicPatientRegistrationFormSchema,
} from "@doctor-tracker/validation";
import { FieldErrorSummary, FormField } from "@/components/ui/form-field";
import { ProfilePicturePicker } from "@/components/ui/profile-picture-picker";
import {
  usePublicDoctorOptions,
  useRegisterDoctor,
  useRegisterPatient,
} from "@/hooks/use-registration";

const TABS = [
  { value: "doctor", label: "Register as doctor", icon: Stethoscope },
  { value: "patient", label: "Register as patient", icon: Users },
];

const nextSteps = [
  {
    title: "Submit your details",
    description: "Choose doctor or patient, complete the form and choose a password.",
  },
  {
    title: "Administrator review",
    description: "The workspace administrator checks the request before creating your account.",
  },
  {
    title: "Sign in to your portal",
    description: "After approval, use your email and password to view your own record.",
  },
];

function applyServerErrors(error, setError) {
  const fieldErrors = error?.fieldErrors ?? {};
  let applied = false;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) {
      setError(field, { type: "server", message: messages[0] });
      applied = true;
    }
  }

  return applied;
}

function SelectInput({ id, hasError, children, ...props }) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className="field-input h-11 appearance-none pr-9"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  );
}

function PasswordInput({ id, hasError, visible, onToggle, ...props }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className="field-input h-11 pr-11"
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-base-200 hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}

function SubmitButton({ isSubmitting, label }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="btn-primary-brand mt-6 h-12 w-full text-[13.5px]"
    >
      {isSubmitting ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          Submitting…
        </>
      ) : (
        <>
          {label}
          <ArrowRight size={16} aria-hidden="true" />
        </>
      )}
    </button>
  );
}

function DoctorForm({ onSuccess }) {
  const mutation = useRegisterDoctor();
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(publicDoctorRegistrationFormSchema),
    defaultValues: {
      name: "",
      specialization: "",
      hospital: "",
      phone: "",
      email: "",
      profilePicture: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const doctorName = useWatch({ control, name: "name" });

  async function onSubmit(values) {
    setFormError("");
    const payload = { ...values };
    delete payload.confirmPassword;
    try {
      await mutation.mutateAsync(payload);
      onSuccess(values);
    } catch (error) {
      if (!applyServerErrors(error, setError)) {
        setFormError(
          error?.message || "The registration could not be submitted. Please try again.",
        );
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <ProfilePicturePicker
            idPrefix="doctor"
            name={doctorName || "Doctor"}
            value={photoPreview}
            onChange={(dataUrl) => {
              setPhotoPreview(dataUrl);
              setValue("profilePicture", dataUrl, { shouldValidate: true, shouldDirty: true });
            }}
            required
            error={errors.profilePicture?.message}
            hint="A clear photo of you. JPEG, PNG, or WebP up to 8 MB; cropped to a square."
          />
          <input type="hidden" {...register("profilePicture")} />
        </div>

        <FormField
          label="Full name"
          htmlFor="doctor-name"
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <input
            id="doctor-name"
            autoComplete="name"
            className="field-input h-11"
            placeholder="Dr. Maya Patel"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "doctor-name-error" : undefined}
            {...register("name")}
          />
        </FormField>

        <FormField
          label="Specialization"
          htmlFor="doctor-specialization"
          required
          error={errors.specialization?.message}
        >
          <SelectInput
            id="doctor-specialization"
            hasError={Boolean(errors.specialization)}
            {...register("specialization")}
          >
            <option value="">Select a specialization</option>
            {SPECIALIZATIONS.map((specialization) => (
              <option key={specialization} value={specialization}>
                {specialization}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField
          label="Hospital"
          htmlFor="doctor-hospital"
          required
          error={errors.hospital?.message}
        >
          <SelectInput
            id="doctor-hospital"
            hasError={Boolean(errors.hospital)}
            {...register("hospital")}
          >
            <option value="">Select a hospital</option>
            {HOSPITALS.map((hospital) => (
              <option key={hospital} value={hospital}>
                {hospital}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Phone" htmlFor="doctor-phone" required error={errors.phone?.message}>
          <input
            id="doctor-phone"
            type="tel"
            autoComplete="tel"
            className="field-input h-11"
            placeholder="+1 (555) 000-0000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "doctor-phone-error" : undefined}
            {...register("phone")}
          />
        </FormField>

        <FormField label="Email" htmlFor="doctor-email" required error={errors.email?.message}>
          <input
            id="doctor-email"
            type="email"
            autoComplete="email"
            className="field-input h-11"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "doctor-email-error" : undefined}
            {...register("email", {
              onChange: () => formError && setFormError(""),
            })}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="doctor-password"
          required
          error={errors.password?.message}
          hint="At least 8 characters. You will use this after approval."
        >
          <PasswordInput
            id="doctor-password"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="doctor-confirm-password"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="doctor-confirm-password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            {...register("confirmPassword")}
          />
        </FormField>
      </div>

      {formError ? (
        <div className="mt-5">
          <FieldErrorSummary message={formError} />
        </div>
      ) : null}

      <SubmitButton isSubmitting={isSubmitting} label="Submit doctor registration" />
      <p className="mt-3 text-center text-[11.5px] leading-5 text-muted">
        This creates a pending request. Your sign-in account is created only after approval.
      </p>
    </form>
  );
}

function PatientForm({ onSuccess }) {
  const mutation = useRegisterPatient();
  const doctorOptions = usePublicDoctorOptions();
  const doctors = doctorOptions.data?.data ?? [];
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(publicPatientRegistrationFormSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "",
      condition: "",
      phone: "",
      email: "",
      doctorId: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values) {
    setFormError("");
    const payload = { ...values };
    delete payload.confirmPassword;
    try {
      await mutation.mutateAsync(payload);
      onSuccess(values);
    } catch (error) {
      if (!applyServerErrors(error, setError)) {
        setFormError(
          error?.message || "The registration could not be submitted. Please try again.",
        );
      }
    }
  }

  const doctorsUnavailable = doctorOptions.isError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Your doctor"
          htmlFor="patient-doctor"
          required
          error={errors.doctorId?.message}
          hint="Choose the doctor you are currently seeing."
          className="sm:col-span-2"
        >
          <SelectInput
            id="patient-doctor"
            hasError={Boolean(errors.doctorId)}
            disabled={doctorOptions.isPending || doctorsUnavailable}
            {...register("doctorId")}
          >
            <option value="">
              {doctorOptions.isPending
                ? "Loading doctors…"
                : doctorsUnavailable
                  ? "Doctors could not be loaded"
                  : "Select your doctor"}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization} · {doctor.hospital}
              </option>
            ))}
          </SelectInput>
          {doctorsUnavailable ? (
            <p className="error-text">Refresh the page to try loading the doctor list again.</p>
          ) : null}
        </FormField>

        <FormField label="Full name" htmlFor="patient-name" required error={errors.name?.message}>
          <input
            id="patient-name"
            autoComplete="name"
            className="field-input h-11"
            placeholder="Amelia Wright"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "patient-name-error" : undefined}
            {...register("name")}
          />
        </FormField>

        <FormField label="Age" htmlFor="patient-age" required error={errors.age?.message}>
          <input
            id="patient-age"
            type="number"
            inputMode="numeric"
            min={0}
            max={130}
            className="field-input h-11"
            placeholder="34"
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? "patient-age-error" : undefined}
            {...register("age")}
          />
        </FormField>

        <FormField label="Sex" htmlFor="patient-gender" required error={errors.gender?.message}>
          <SelectInput
            id="patient-gender"
            hasError={Boolean(errors.gender)}
            {...register("gender")}
          >
            <option value="">Select sex</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {GENDER_LABELS[gender]}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField
          label="Condition"
          htmlFor="patient-condition"
          required
          error={errors.condition?.message}
        >
          <SelectInput
            id="patient-condition"
            hasError={Boolean(errors.condition)}
            {...register("condition")}
          >
            <option value="">Select a condition</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Phone" htmlFor="patient-phone" required error={errors.phone?.message}>
          <input
            id="patient-phone"
            type="tel"
            autoComplete="tel"
            className="field-input h-11"
            placeholder="+1 (555) 000-0000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "patient-phone-error" : undefined}
            {...register("phone")}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="patient-email"
          required
          error={errors.email?.message}
          hint="Required. You will use this email to sign in after approval."
        >
          <input
            id="patient-email"
            type="email"
            autoComplete="email"
            className="field-input h-11"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "patient-email-error" : "patient-email-hint"}
            {...register("email", {
              onChange: () => formError && setFormError(""),
            })}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="patient-password"
          required
          error={errors.password?.message}
          hint="At least 8 characters. You will use this after approval."
        >
          <PasswordInput
            id="patient-password"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="patient-confirm-password"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="patient-confirm-password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            {...register("confirmPassword")}
          />
        </FormField>
      </div>

      {formError ? (
        <div className="mt-5">
          <FieldErrorSummary message={formError} />
        </div>
      ) : null}

      <SubmitButton isSubmitting={isSubmitting} label="Submit patient registration" />
      <p className="mt-3 text-center text-[11.5px] leading-5 text-muted">
        This creates a pending request. Your sign-in account is created only after approval.
      </p>
    </form>
  );
}

function SuccessPanel({ submitted, onReset }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const contactMessage = (
    <>
      We&apos;ll email <span className="font-medium text-ink">{submitted.email}</span> once it has
      been reviewed. After approval, sign in with the email and password you chose.
    </>
  );

  return (
    <div className="py-4 text-center sm:py-6">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
        <CheckCircle2 size={24} aria-hidden="true" />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-[24px] font-normal tracking-[-0.02em] text-ink outline-none"
      >
        Registration received
      </h2>
      <p className="mx-auto mt-2 max-w-[470px] text-[13px] leading-6 text-body">
        Thanks, <span className="font-medium text-ink">{submitted.name}</span>. Your{" "}
        {submitted.type === "doctor" ? "doctor" : "patient"} registration is pending administrator
        review. {contactMessage}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={onReset} className="btn-primary-brand h-11 px-5">
          Submit another registration
        </button>
        <Link href="/" className="btn-secondary-quiet h-11 px-5">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export function RegisterView({ initialType = "doctor" }) {
  const reduceMotion = useReducedMotion();
  const [activeType, setActiveType] = useState(initialType === "patient" ? "patient" : "doctor");
  const [submitted, setSubmitted] = useState(null);
  const tabRefs = useRef([]);

  function selectType(nextType) {
    setActiveType(nextType);
    setSubmitted(null);
  }

  function onTabKeyDown(event, index) {
    let nextIndex = index;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    selectType(TABS[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-gradient-to-b from-brand-soft/70 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-8 px-5 pb-16 pt-10 sm:px-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:px-12 lg:pb-20 lg:pt-16">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] font-medium text-body transition hover:text-brand"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to home
          </Link>

          <div className="mt-6 flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-brand-dark">
              <UserRoundCheck size={21} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-[32px] font-normal leading-tight tracking-[-0.03em] text-ink sm:text-[38px]">
                Join Doctor Tracker
              </h1>
              <p className="mt-2 max-w-[580px] text-[13.5px] leading-6 text-body">
                Register as a doctor or a patient and choose your password. The workspace
                administrator reviews every request before your account is created.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Registration type"
            className="mt-7 grid grid-cols-2 gap-1 rounded-[10px] border border-line bg-soft p-1"
          >
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const selected = activeType === tab.value;
              return (
                <button
                  key={tab.value}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`register-tab-${tab.value}`}
                  aria-selected={selected}
                  aria-controls={`register-panel-${tab.value}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectType(tab.value)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-3 text-[12px] font-semibold transition sm:text-[13px] ${
                    selected
                      ? "bg-surface text-brand-dark shadow-[0_1px_2px_rgba(32,52,56,0.08)]"
                      : "text-body hover:text-ink"
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <motion.div
            key={submitted ? `submitted-${submitted.type}` : activeType}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            className="mt-5"
          >
            <div
              role="tabpanel"
              id={`register-panel-${activeType}`}
              aria-labelledby={`register-tab-${activeType}`}
              className="rounded-xl border border-line bg-surface p-5 sm:p-7"
            >
              {submitted ? (
                <SuccessPanel submitted={submitted} onReset={() => setSubmitted(null)} />
              ) : activeType === "doctor" ? (
                <DoctorForm
                  onSuccess={(values) =>
                    setSubmitted({ type: "doctor", name: values.name, email: values.email })
                  }
                />
              ) : (
                <PatientForm
                  onSuccess={(values) =>
                    setSubmitted({ type: "patient", name: values.name, email: values.email })
                  }
                />
              )}
            </div>
          </motion.div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
              What happens next
            </p>
            <ol className="mt-4 space-y-4">
              {nextSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-brand-soft text-[11px] font-semibold text-brand-dark">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-body">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl bg-panel p-5 text-white">
            <span className="grid size-9 place-items-center rounded-[9px] bg-white/10 text-panel-muted">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <p className="mt-4 text-[13px] font-semibold text-white">Your details stay private</p>
            <p className="mt-1.5 text-[11.5px] leading-6 text-[#c2d5d2]">
              Registrations are only visible to the workspace administrator. Your password is
              encrypted, and no login is created until your registration is approved.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3.5 py-3 text-[11.5px] text-body">
            <Clock3 size={15} className="shrink-0 text-brand" aria-hidden="true" />
            Most registrations are reviewed within one business day.
          </div>

          <p className="text-[11.5px] text-muted">
            Already have access?{" "}
            <Link href="/login" className="font-medium text-brand transition hover:text-brand-dark">
              Sign in
            </Link>
          </p>
        </aside>
      </div>
    </section>
  );
}
