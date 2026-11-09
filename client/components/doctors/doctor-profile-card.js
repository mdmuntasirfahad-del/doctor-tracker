import { Building2, CalendarDays, Mail, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SpecializationBadge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/formatters";

export function DoctorProfileCard({ doctor }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-start gap-5 xl:flex-1">
          <Avatar name={doctor.name} src={doctor.profilePicture?.mediumUrl} size="xl" />
          <div className="min-w-0">
            <h1 className="text-[28px] font-medium leading-tight tracking-[-0.025em] text-ink sm:text-[30px]">
              {doctor.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SpecializationBadge>{doctor.specialization}</SpecializationBadge>
              <span className="text-[11.5px] font-medium text-muted">{doctor.reference}</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[12.5px] text-body">
              <Building2 size={15} className="shrink-0 text-body" aria-hidden="true" />
              <span className="truncate">{doctor.hospital}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-[12.5px] text-body xl:w-[280px] xl:shrink-0 xl:border-l xl:border-line xl:pl-8">
          <p className="flex items-center gap-2.5">
            <Mail size={15} className="shrink-0" aria-hidden="true" />
            <a href={`mailto:${doctor.email}`} className="truncate transition hover:text-brand">
              {doctor.email}
            </a>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone size={15} className="shrink-0" aria-hidden="true" />
            <a
              href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`}
              className="transition hover:text-brand"
            >
              {doctor.phone}
            </a>
          </p>
          <p className="flex items-center gap-2.5">
            <CalendarDays size={15} className="shrink-0" aria-hidden="true" />
            Added {formatDate(doctor.createdAt)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line pt-4 xl:w-[150px] xl:shrink-0 xl:block xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0 xl:text-right">
          <p className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {formatNumber(doctor.patientCount)}
          </p>
          <p className="text-[12.5px] text-body xl:mt-2">Assigned patients</p>
        </div>
      </div>
    </section>
  );
}
