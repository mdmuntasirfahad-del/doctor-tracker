"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

export function LatestPatients({ patients = [], loading = false, error = false }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <h2 className="text-[16px] font-semibold text-ink">Latest patient registrations</h2>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand transition hover:text-brand-dark"
        >
          View all patients
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="border-t border-line">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex h-[56px] items-center gap-4 border-b border-line px-5 last:border-0 sm:px-6"
            >
              <div className="size-7 animate-pulse rounded-full bg-base-200" />
              <div className="h-3 w-40 animate-pulse rounded bg-base-200" />
              <div className="ml-auto h-3 w-24 animate-pulse rounded bg-base-200" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="border-t border-line px-6 py-10 text-center text-[13px] text-body">
          Recent registrations could not be loaded.
        </p>
      ) : patients.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-center text-[13px] text-body">
          No patients have been registered yet.
        </p>
      ) : (
        <>
          <div className="hidden border-t border-line lg:block">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="table-heading h-11 text-left">
                  <th className="w-[28%] px-6 font-semibold">Patient</th>
                  <th className="w-[15%] px-4 font-semibold">Patient ID</th>
                  <th className="w-[20%] px-4 font-semibold">Condition</th>
                  <th className="w-[23%] px-4 font-semibold">Assigned doctor</th>
                  <th className="w-[14%] px-6 font-semibold">Date added</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="h-[56px] border-t border-line text-[13px]">
                    <td className="px-6">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={patient.name} size="xs" />
                        <span className="font-medium text-ink">{patient.name}</span>
                      </span>
                    </td>
                    <td className="px-4 text-[12.5px] text-body">{patient.reference}</td>
                    <td className="px-4">
                      <ConditionBadge>{patient.condition}</ConditionBadge>
                    </td>
                    <td className="px-4 text-ink">
                      {patient.doctor ? (
                        <Link
                          href={`/doctors/${patient.doctorId}`}
                          className="transition hover:text-brand"
                        >
                          {patient.doctor.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 text-[12.5px] text-body">
                      {formatDate(patient.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line border-t border-line lg:hidden">
            {patients.map((patient) => (
              <li key={patient.id} className="flex items-start gap-3 px-5 py-4">
                <Avatar name={patient.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-[13.5px] font-medium text-ink">{patient.name}</p>
                    <span className="shrink-0 text-[11.5px] text-muted">
                      {formatDate(patient.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted">{patient.reference}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ConditionBadge>{patient.condition}</ConditionBadge>
                    {patient.doctor ? (
                      <Link
                        href={`/doctors/${patient.doctorId}`}
                        className="text-[12px] text-body transition hover:text-brand"
                      >
                        {patient.doctor.name}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
