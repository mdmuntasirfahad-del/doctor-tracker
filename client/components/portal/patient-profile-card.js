import { CalendarDays, Mail, Phone, Stethoscope } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge } from "@/components/ui/badge";
import { formatAgeSex, formatDate } from "@/lib/formatters";

function PatientDetail({ icon: Icon, label, children }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        <Icon size={14} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 text-[13px] text-ink">{children}</dd>
    </div>
  );
}

export function PatientProfileCard({ patient, showDoctor = true, className = "" }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <div className="flex min-w-0 items-start gap-4 sm:gap-5">
        <Avatar name={patient.name} size="xl" />
        <div className="min-w-0">
          <h2 className="text-[26px] font-medium leading-tight tracking-[-0.025em] text-ink sm:text-[30px]">
            {patient.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConditionBadge>{patient.condition}</ConditionBadge>
            <span className="text-[11.5px] font-medium text-muted">{patient.reference}</span>
          </div>
          <p className="mt-2 text-[12.5px] text-body">
            {formatAgeSex(patient.age, patient.gender)}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-3">
        <PatientDetail icon={Phone} label="Phone">
          <a
            href={`tel:${patient.phone.replace(/[^\d+]/g, "")}`}
            className="transition hover:text-brand"
          >
            {patient.phone}
          </a>
        </PatientDetail>
        <PatientDetail icon={Mail} label="Email">
          {patient.email ? (
            <a href={`mailto:${patient.email}`} className="break-all transition hover:text-brand">
              {patient.email}
            </a>
          ) : (
            <span className="text-muted">Not provided</span>
          )}
        </PatientDetail>
        <PatientDetail icon={CalendarDays} label="Added">
          {formatDate(patient.createdAt)}
        </PatientDetail>
      </dl>

      {showDoctor ? (
        <div className="mt-6 border-t border-line pt-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <Stethoscope size={14} aria-hidden="true" />
            Assigned doctor
          </p>
          {patient.doctor ? (
            <div className="mt-3 flex min-w-0 items-center gap-3">
              <Avatar
                name={patient.doctor.name}
                src={patient.doctor.profilePicture?.thumbUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-ink">
                  {patient.doctor.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  {patient.doctor.specialization}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-body">No doctor is currently assigned.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
