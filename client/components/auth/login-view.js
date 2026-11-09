"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  CircleAlert,
  Eye,
  EyeOff,
  LogIn,
  Stethoscope,
  Users,
} from "lucide-react";
import { signInSchema } from "@doctor-tracker/validation";
import { authClient } from "@/lib/auth-client";
import { safeReturnTo } from "@/lib/safe-return-to";
import { Brand } from "@/components/layout/brand";
import { FormField } from "@/components/ui/form-field";

const REMEMBERED_EMAIL_KEY = "doctor-tracker:remembered-email";

function subscribeToRememberedEmail() {
  return () => {};
}

function getRememberedEmail() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
}

function getRememberedEmailServerSnapshot() {
  return "";
}

const features = [
  {
    icon: Stethoscope,
    title: "Doctor directory",
    description: "Profiles, contacts and patient lists",
  },
  {
    icon: Users,
    title: "Patient records",
    description: "Registration and record management",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Workspace insights",
    description: "Registration trends and doctor workload",
  },
];

export function LoginView({ returnTo = "/dashboard" }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const rememberedEmail = useSyncExternalStore(
    subscribeToRememberedEmail,
    getRememberedEmail,
    getRememberedEmailServerSnapshot,
  );
  const [rememberEmail, setRememberEmail] = useState(null);
  const rememberEmailChecked = rememberEmail ?? Boolean(rememberedEmail);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (rememberedEmail) {
      setValue("email", rememberedEmail);
    }
  }, [rememberedEmail, setValue]);

  async function onSubmit(values) {
    setFormError("");

    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: rememberEmailChecked,
    });

    if (error) {
      setFormError(
        error.status === 401
          ? "Email or password doesn’t match. Check your details and try again."
          : error.message || "Sign in could not be completed. Please try again.",
      );
      return;
    }

    if (rememberEmailChecked) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    router.replace(safeReturnTo(returnTo, data?.user?.role));
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="relative hidden w-[496px] shrink-0 flex-col bg-panel px-12 py-12 lg:flex">
        <Brand tone="light" />

        <div className="my-auto max-w-[342px] py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-panel-muted">
            Secure workspace
          </p>
          <h1 className="mt-5 text-[38px] font-normal leading-[1.28] tracking-[-0.025em] text-white">
            Your care
            <br />
            workspace.
          </h1>
          <p className="mt-5 max-w-[330px] text-[14.5px] leading-7 text-[#c2d5d2]">
            Sign in to manage the directory, or to view your own doctor or patient record.
          </p>

          <div className="mt-12 space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3.5 border-b border-white/10 pb-5 last:border-0 last:pb-0"
                >
                  <Icon
                    size={21}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-panel-muted"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-white">{feature.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-5 text-panel-muted">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11.5px] text-[#7fa39f]">Doctor Tracker · Secure access</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[76px] shrink-0 items-center justify-between px-5 lg:hidden">
          <Brand size="sm" href="/login" />
          <span className="rounded-[5px] bg-soft px-2.5 py-1 text-[11.5px] font-medium text-body">
            Example workspace
          </span>
        </div>

        <div className="hidden justify-end px-10 pt-8 lg:flex">
          <span className="rounded-[5px] bg-soft px-2.5 py-1 text-[11.5px] font-medium text-body">
            Example workspace
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
            className="w-full max-w-[420px]"
          >
            <span className="grid size-11 place-items-center rounded-[10px] bg-brand-soft text-brand-dark">
              <LogIn size={21} strokeWidth={1.8} aria-hidden="true" />
            </span>

            <h1 className="mt-6 text-[34px] font-normal leading-tight tracking-[-0.03em] text-ink">
              Welcome back
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-body">
              Sign in with the account created when your registration was approved.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8" noValidate>
              <div className="space-y-5">
                <FormField
                  label="Email address"
                  htmlFor="email"
                  required
                  error={errors.email?.message}
                >
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="field-input h-11"
                    placeholder="you@example.com"
                    {...register("email", {
                      onChange: () => formError && setFormError(""),
                    })}
                  />
                </FormField>

                <FormField
                  label="Password"
                  htmlFor="password"
                  required
                  error={errors.password?.message}
                >
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      className="field-input h-11 pr-11"
                      placeholder="Enter your password"
                      {...register("password", {
                        onChange: () => formError && setFormError(""),
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-base-200 hover:text-ink"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <Eye size={17} aria-hidden="true" />
                      ) : (
                        <EyeOff size={17} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormField>
              </div>

              {formError ? (
                <div
                  className="mt-5 flex items-start gap-2.5 rounded-[7px] border border-danger/15 bg-danger-soft px-3.5 py-3 text-[12.5px] leading-5 text-danger"
                  role="alert"
                >
                  <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              ) : null}

              <label className="mt-5 flex w-fit cursor-pointer items-center gap-2.5 text-[12.5px] text-body">
                <input
                  type="checkbox"
                  checked={rememberEmailChecked}
                  onChange={(event) => setRememberEmail(event.target.checked)}
                  className="size-4 rounded border-line accent-brand"
                />
                Remember my email
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[7px] bg-brand text-[13.5px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[12.5px] leading-6 text-muted">
              <p>
                Don’t have an account?{" "}
                <a
                  href="/register"
                  className="font-medium text-brand transition hover:text-brand-dark"
                >
                  Register
                </a>
              </p>
            </div>

            <div className="mt-8 text-center text-[12.5px] leading-6 text-muted">
              <p>Having trouble signing in?</p>
              <p className="text-brand">Contact your workspace administrator</p>
            </div>
          </motion.div>
        </div>

        <p className="hidden pb-8 text-center text-[11.5px] text-muted lg:block">
          Example sign-in state · No real patient information
        </p>
      </div>
    </div>
  );
}
