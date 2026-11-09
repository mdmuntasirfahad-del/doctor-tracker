import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  Clock3,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge } from "@/components/ui/badge";

export const metadata = {
  description:
    "Manage doctors, patients and registration insights in one secure workspace for clinic teams.",
};

const features = [
  {
    icon: Stethoscope,
    title: "Doctor directory",
    description:
      "Keep profiles, contact details and patient lists together in one searchable place.",
    points: ["Specialization and hospital filters", "Patient counts at a glance"],
  },
  {
    icon: Users,
    title: "Patient records",
    description:
      "Register patients under the right doctor and keep every record easy to find and update.",
    points: ["Assigned-doctor visibility", "Condition and date filters"],
  },
  {
    icon: ChartNoAxesCombined,
    title: "Workspace insights",
    description:
      "See registration trends and doctor workload without exporting a single spreadsheet.",
    points: ["Range-based summaries", "Workload across the practice"],
  },
];

const steps = [
  {
    title: "Submit a registration",
    description:
      "Doctors and patients share the details the workspace needs. Patients choose their doctor.",
  },
  {
    title: "Administrator review",
    description:
      "Every request is checked before it becomes part of the directory. No account is created automatically.",
  },
  {
    title: "Work from one record",
    description:
      "Once approved, the practice manages doctors, patients and insights from a single workspace.",
  },
];

const workload = [
  { name: "Maya Patel", value: 100, count: 28 },
  { name: "James Wilson", value: 86, count: 24 },
  { name: "Olivia Chen", value: 72, count: 22 },
];

const previewBars = [42, 58, 50, 74, 66, 88, 80, 100];

function PreviewCard() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-4 rounded-[24px] bg-brand-soft/70 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-[16px] border border-line bg-surface p-4 shadow-[0_30px_80px_-50px_rgba(20,61,61,0.45)] sm:p-5">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              Workspace overview
            </p>
            <p className="mt-1 text-[15px] font-semibold text-ink">Good morning, Alex</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-soft px-2 py-1 text-[10.5px] font-medium text-body">
            <CalendarDays size={12} aria-hidden="true" />
            Last 30 days
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[10px] border border-line bg-canvas p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11.5px] text-body">Total doctors</p>
              <Stethoscope size={15} className="text-brand/80" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">
              24
            </p>
            <p className="mt-2 text-[10.5px] text-muted">10 added this month</p>
          </div>

          <div className="rounded-[10px] border border-line bg-canvas p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11.5px] text-body">Total patients</p>
              <Users size={15} className="text-brand/80" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">
              384
            </p>
            <p className="mt-2 text-[10.5px] text-muted">111 registered this month</p>
          </div>
        </div>

        <div className="mt-3 rounded-[10px] border border-line bg-canvas p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-body">Patients per doctor</p>
            <span className="text-[10.5px] font-medium text-success">+4.2%</span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
              16.0
            </p>
            <div className="flex h-10 items-end gap-1.5" aria-hidden="true">
              {previewBars.map((height, index) => (
                <span
                  key={index}
                  className="w-2 rounded-t-[2px] bg-brand/25 last:bg-brand"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[10px] border border-line bg-canvas p-3.5">
          <p className="text-[11.5px] font-medium text-ink">Doctor workload</p>
          <div className="mt-3 space-y-3">
            {workload.map((doctor) => (
              <div key={doctor.name} className="grid grid-cols-[74px_1fr_20px] items-center gap-2">
                <p className="truncate text-[10.5px] text-body">{doctor.name}</p>
                <span className="h-1.5 overflow-hidden rounded-full bg-chart-faint">
                  <span
                    className="block h-full rounded-full bg-brand/80"
                    style={{ width: `${doctor.value}%` }}
                  />
                </span>
                <p className="text-right text-[10.5px] font-medium text-ink">{doctor.count}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-muted">
          Example workspace · Fictional records
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-brand-soft/80 via-brand-soft/25 to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-14 px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-12 lg:pb-24 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-surface/85 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
              Practice management, simplified
            </p>

            <h1 className="mt-6 max-w-[640px] text-[40px] font-normal leading-[1.12] tracking-[-0.035em] text-ink sm:text-[52px] lg:text-[58px]">
              A calmer way to manage <span className="text-brand">doctors and patients.</span>
            </h1>

            <p className="mt-6 max-w-[520px] text-[15px] leading-7 text-body">
              One secure workspace for your doctor directory, patient records and the insights that
              keep your practice moving.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary-brand h-12 px-6 text-[14px]">
                Register your practice
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/login" className="btn-secondary-quiet h-12 px-6 text-[14px]">
                Sign in
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12.5px] text-body">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand" aria-hidden="true" />
                Administrator-reviewed access
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={16} className="text-brand" aria-hidden="true" />
                Set up in minutes
              </span>
            </div>
          </div>

          <PreviewCard />
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-[620px]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
              Everything in one place
            </p>
            <h2 className="mt-3 text-[30px] font-normal leading-tight tracking-[-0.03em] text-ink sm:text-[36px]">
              Less admin. More time for care.
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-body">
              The workspace keeps the everyday details close, so the practice can move from a
              registration to the right doctor without chasing spreadsheets.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="flex flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-brand/30 sm:p-6"
                >
                  <span className="grid size-11 place-items-center rounded-[10px] bg-brand-soft text-brand-dark">
                    <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[16px] font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-body">{feature.description}</p>
                  <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[12.5px] text-body">
                        <Check
                          size={14}
                          strokeWidth={2.4}
                          className="mt-0.5 shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16 lg:px-12">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
              Built around your workflow
            </p>
            <h2 className="mt-3 max-w-[460px] text-[30px] font-normal leading-tight tracking-[-0.03em] text-ink sm:text-[36px]">
              From registration to the right doctor.
            </h2>
            <p className="mt-3 max-w-[480px] text-[14px] leading-7 text-body">
              New registrations arrive as requests. The administrator reviews them before they
              become part of the workspace, so the directory stays intentional.
            </p>

            <ol className="mt-8 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-line bg-surface text-[12px] font-semibold text-brand-dark">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 max-w-[420px] text-[12.5px] leading-6 text-body">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[16px] border border-line bg-surface p-5 shadow-[0_24px_70px_-54px_rgba(20,61,61,0.5)] sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <p className="text-[13px] font-semibold text-ink">Patient record</p>
              <span className="rounded-[5px] bg-brand-soft px-2 py-1 text-[10.5px] font-medium text-brand-dark">
                Assigned
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3.5">
              <Avatar name="Amelia Wright" size="lg" />
              <div>
                <p className="text-[15.5px] font-semibold text-ink">Amelia Wright</p>
                <p className="mt-0.5 text-[12px] text-muted">PT-38C7 · 34 years</p>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[10px] bg-canvas p-3.5">
                <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
                  Condition
                </dt>
                <dd className="mt-2">
                  <ConditionBadge>Hypertension</ConditionBadge>
                </dd>
              </div>
              <div className="rounded-[10px] bg-canvas p-3.5">
                <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
                  Sex
                </dt>
                <dd className="mt-2 text-[12.5px] font-medium text-ink">Female</dd>
              </div>
              <div className="rounded-[10px] bg-canvas p-3.5">
                <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
                  Registered
                </dt>
                <dd className="mt-2 text-[12.5px] font-medium text-ink">2 November 2026</dd>
              </div>
              <div className="rounded-[10px] bg-canvas p-3.5">
                <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
                  Contact
                </dt>
                <dd className="mt-2 text-[12.5px] font-medium text-ink">+1 (555) 014-2280</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-[10px] border border-line bg-canvas p-3.5">
              <div className="flex items-center gap-2 text-[11.5px] font-medium text-ink">
                <Stethoscope size={15} className="text-brand" aria-hidden="true" />
                Assigned doctor
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name="Maya Patel" size="xs" />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-ink">Maya Patel</p>
                    <p className="truncate text-[11px] text-muted">
                      Cardiology · Riverside Hospital
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={15} className="shrink-0 text-muted" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-[9px] bg-brand-soft/70 px-3 py-2.5 text-[11.5px] text-brand-dark">
              <Building2 size={14} className="shrink-0" aria-hidden="true" />
              One record, shared by the practice team.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="relative overflow-hidden rounded-[18px] bg-panel px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div
            className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-brand/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-panel-muted">
                Join the workspace
              </p>
              <h2 className="mt-4 max-w-[640px] text-[30px] font-normal leading-tight tracking-[-0.03em] text-white sm:text-[38px]">
                Register as a doctor or patient.
              </h2>
              <p className="mt-3 max-w-[560px] text-[13.5px] leading-7 text-[#c2d5d2]">
                Every registration is reviewed by the workspace administrator before it appears in
                the directory. Start with the form that fits you.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/register?type=doctor"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-white px-5 text-[13px] font-semibold text-brand-dark transition hover:bg-brand-soft"
              >
                <Stethoscope size={16} aria-hidden="true" />
                Register as doctor
              </Link>
              <Link
                href="/register?type=patient"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] border border-white/25 px-5 text-[13px] font-semibold text-white transition hover:bg-white/10"
              >
                <Users size={16} aria-hidden="true" />
                Register as patient
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
