"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SpecializationBadge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/formatters";

function SortIndicator({ active, order }) {
  if (!active) {
    return null;
  }
  return order === "asc" ? (
    <ArrowUp size={12} aria-hidden="true" />
  ) : (
    <ArrowDown size={12} aria-hidden="true" />
  );
}

export function DoctorTable({ doctors, sort, order, onSort, onEdit, onDelete }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1040px] table-fixed border-collapse" aria-label="Doctors">
        <thead>
          <tr className="table-heading h-11 text-left">
            <th className="w-[24%] px-6 font-semibold">
              <button
                type="button"
                onClick={() => onSort("name")}
                className="inline-flex items-center gap-1.5 uppercase transition hover:text-ink"
              >
                Doctor
                <SortIndicator active={sort === "name"} order={order} />
              </button>
            </th>
            <th className="w-[15%] px-4 font-semibold">Specialization</th>
            <th className="w-[19%] px-4 font-semibold">Hospital</th>
            <th className="w-[8%] px-4 font-semibold">Patients</th>
            <th className="w-[16%] px-4 font-semibold">
              <button
                type="button"
                onClick={() => onSort("createdAt")}
                className="inline-flex items-center gap-1.5 uppercase transition hover:text-ink"
              >
                Date added
                <SortIndicator active={sort === "createdAt"} order={order} />
              </button>
            </th>
            <th className="w-[18%] px-6 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor.id} className="h-[68px] border-t border-line text-[13px]">
              <td className="px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={doctor.name} src={doctor.profilePicture?.thumbUrl} size="sm" />
                  <div className="min-w-0">
                    <Link
                      href={`/doctors/${doctor.id}`}
                      className="block truncate font-medium text-ink transition hover:text-brand"
                    >
                      {doctor.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[12px] text-muted">{doctor.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4">
                <SpecializationBadge>{doctor.specialization}</SpecializationBadge>
              </td>
              <td className="truncate px-4 text-body">{doctor.hospital}</td>
              <td className="px-4 font-medium text-ink">{formatNumber(doctor.patientCount)}</td>
              <td className="px-4 text-[12.5px] text-body">{formatDate(doctor.createdAt)}</td>
              <td className="px-6">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand transition hover:text-brand-dark"
                  >
                    View patients
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onEdit(doctor)}
                    className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-base-200 hover:text-ink"
                    aria-label={`Edit ${doctor.name}`}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(doctor)}
                    className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-danger-soft hover:text-danger"
                    aria-label={`Delete ${doctor.name}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DoctorCardList({ doctors, onEdit, onDelete }) {
  return (
    <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
      {doctors.map((doctor) => (
        <li
          key={doctor.id}
          className="flex flex-col rounded-xl border border-line bg-surface p-4 transition hover:border-base-300"
        >
          <div className="flex items-start gap-3">
            <Avatar name={doctor.name} src={doctor.profilePicture?.thumbUrl} size="md" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/doctors/${doctor.id}`}
                className="block truncate text-[13.5px] font-semibold text-ink"
              >
                {doctor.name}
              </Link>
              <p className="mt-0.5 truncate text-[12px] text-brand">{doctor.specialization}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(doctor)}
                className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-base-200 hover:text-ink"
                aria-label={`Edit ${doctor.name}`}
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(doctor)}
                className="grid size-7 place-items-center rounded-md text-muted transition hover:bg-danger-soft hover:text-danger"
                aria-label={`Delete ${doctor.name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-2 text-[12px] text-body">
            <Building2 size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{doctor.hospital}</span>
          </p>

          <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
            <p className="text-body">
              <span className="font-semibold text-ink">{formatNumber(doctor.patientCount)}</span>{" "}
              patients
            </p>
            <p className="text-muted">Added {formatDate(doctor.createdAt)}</p>
          </div>

          <Link
            href={`/doctors/${doctor.id}`}
            className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12.5px] font-medium text-brand"
          >
            View patients
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
