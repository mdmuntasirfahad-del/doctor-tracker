import { Building2, Mail, Phone, RefreshCw, Stethoscope } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SpecializationBadge } from "@/components/ui/badge";

export function AssignedDoctorCard({ doctor, onChangeDoctor }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          <Stethoscope size={14} aria-hidden="true" />
          Assigned doctor
        </p>
        {onChangeDoctor ? (
          <button type="button" onClick={onChangeDoctor} className="btn-secondary-quiet">
            <RefreshCw size={14} aria-hidden="true" />
            Change doctor
          </button>
        ) : null}
      </div>

      {doctor ? (
        <>
          <div className="mt-4 flex min-w-0 items-start gap-4">
            <Avatar name={doctor.name} src={doctor.profilePicture?.thumbUrl} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[20px] font-medium tracking-[-0.02em] text-ink">
                {doctor.name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <SpecializationBadge>{doctor.specialization}</SpecializationBadge>
              </div>
              <p className="mt-2 flex items-center gap-2 text-[12.5px] text-body">
                <Building2 size={15} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{doctor.hospital}</span>
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <Phone size={14} aria-hidden="true" />
                Phone
              </dt>
              <dd className="mt-2 text-[13px] text-ink">
                <a
                  href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`}
                  className="transition hover:text-brand"
                >
                  {doctor.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <Mail size={14} aria-hidden="true" />
                Email
              </dt>
              <dd className="mt-2 text-[13px] text-ink">
                {doctor.email ? (
                  <a
                    href={`mailto:${doctor.email}`}
                    className="break-all transition hover:text-brand"
                  >
                    {doctor.email}
                  </a>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-2 text-[13px] text-body">No doctor is currently assigned.</p>
      )}
    </section>
  );
}
