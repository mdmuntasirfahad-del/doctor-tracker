"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Eye, Pencil, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge } from "@/components/ui/badge";
import { formatAgeSex, formatDate } from "@/lib/formatters";

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

function SortButton({ label, field, sort, order, onSort }) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 uppercase transition hover:text-ink"
    >
      {label}
      <SortIndicator active={sort === field} order={order} />
    </button>
  );
}

export function PatientTable({
  patients,
  variant = "directory",
  sort,
  order,
  onSort,
  onEdit,
  onDelete,
  onView,
  onTreat,
  onReject,
  actionsDisabled = false,
  readOnly = false,
}) {
  const isDoctorScope = variant === "doctor";

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table
        className="w-full min-w-[920px] table-fixed border-collapse"
        aria-label={isDoctorScope ? "Assigned patients" : "Patients"}
      >
        <thead>
          <tr className="table-heading h-11 text-left">
            <th
              className={
                isDoctorScope ? "w-[24%] px-6 font-semibold" : "w-[25%] px-6 font-semibold"
              }
            >
              <SortButton label="Patient" field="name" sort={sort} order={order} onSort={onSort} />
            </th>
            <th
              className={isDoctorScope ? "w-[8%] px-4 font-semibold" : "w-[9%] px-4 font-semibold"}
            >
              Age / sex
            </th>
            <th
              className={
                isDoctorScope ? "w-[14%] px-4 font-semibold" : "w-[15%] px-4 font-semibold"
              }
            >
              Condition
            </th>
            {isDoctorScope ? (
              <th className="w-[13%] px-4 font-semibold">Phone</th>
            ) : (
              <th className="w-[19%] px-4 font-semibold">Assigned doctor</th>
            )}
            <th
              className={
                isDoctorScope ? "w-[13%] px-4 font-semibold" : "w-[14%] px-4 font-semibold"
              }
            >
              <SortButton
                label="Date added"
                field="createdAt"
                sort={sort}
                order={order}
                onSort={onSort}
              />
            </th>
            {readOnly ? (
              onView || onTreat || onReject ? (
                <th
                  className={
                    isDoctorScope ? "w-[28%] px-6 font-semibold" : "w-[18%] px-6 font-semibold"
                  }
                >
                  Actions
                </th>
              ) : null
            ) : (
              <th
                className={
                  isDoctorScope ? "w-[28%] px-6 font-semibold" : "w-[18%] px-6 font-semibold"
                }
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="h-[68px] border-t border-line text-[13px]">
              <td className="px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={patient.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{patient.name}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">{patient.reference}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 text-body">{formatAgeSex(patient.age, patient.gender)}</td>
              <td className="px-4">
                <ConditionBadge>{patient.condition}</ConditionBadge>
              </td>
              {isDoctorScope ? (
                <td className="px-4 text-body">{patient.phone}</td>
              ) : (
                <td className="truncate px-4">
                  {patient.doctor ? (
                    <Link
                      href={`/doctors/${patient.doctorId}`}
                      className="text-ink transition hover:text-brand"
                    >
                      {patient.doctor.name}
                    </Link>
                  ) : (
                    <span className="text-muted">Unassigned</span>
                  )}
                </td>
              )}
              <td className="px-4 text-[12.5px] text-body">{formatDate(patient.createdAt)}</td>
              {readOnly ? (
                onView || onTreat || onReject ? (
                  <td className="px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      {onView ? (
                        <button
                          type="button"
                          onClick={() => onView(patient)}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-medium text-brand transition hover:text-brand-dark"
                        >
                          <Eye size={13} aria-hidden="true" />
                          View profile
                        </button>
                      ) : null}
                      {onTreat ? (
                        <button
                          type="button"
                          onClick={() => onTreat(patient)}
                          disabled={actionsDisabled}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-medium text-success transition hover:text-[#246248] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check size={13} aria-hidden="true" />
                          Treated
                        </button>
                      ) : null}
                      {onReject ? (
                        <button
                          type="button"
                          onClick={() => onReject(patient)}
                          disabled={actionsDisabled}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-medium text-danger transition hover:text-[#a53e3b] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X size={13} aria-hidden="true" />
                          Reject
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null
              ) : (
                <td className="px-6">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onEdit(patient)}
                      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand transition hover:text-brand-dark"
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </button>
                    {isDoctorScope ? (
                      <button
                        type="button"
                        onClick={() => onDelete(patient)}
                        className="text-[12.5px] font-medium text-danger transition hover:text-[#a53e3b]"
                      >
                        Remove patient
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDelete(patient)}
                        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-danger transition hover:text-[#a53e3b]"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatientCardList({
  patients,
  variant = "directory",
  onEdit,
  onDelete,
  onView,
  onTreat,
  onReject,
  actionsDisabled = false,
  readOnly = false,
}) {
  const isDoctorScope = variant === "doctor";

  return (
    <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
      {patients.map((patient) => (
        <li key={patient.id} className="flex flex-col rounded-xl border border-line bg-surface p-4">
          <div className="flex items-start gap-3">
            <Avatar name={patient.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-ink">{patient.name}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-muted">
                {patient.reference} · {formatAgeSex(patient.age, patient.gender)}
              </p>
            </div>
            <span className="shrink-0 text-[11.5px] text-muted">
              {formatDate(patient.createdAt)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ConditionBadge>{patient.condition}</ConditionBadge>
            {isDoctorScope ? (
              <span className="text-[11.5px] text-body">{patient.phone}</span>
            ) : patient.doctor ? (
              <Link
                href={`/doctors/${patient.doctorId}`}
                className="text-[12px] text-body transition hover:text-brand"
              >
                {patient.doctor.name}
              </Link>
            ) : (
              <span className="text-[12px] text-muted">Unassigned</span>
            )}
          </div>

          {readOnly ? (
            onView || onTreat || onReject ? (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3">
                {onView ? (
                  <button
                    type="button"
                    onClick={() => onView(patient)}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand"
                  >
                    <Eye size={13} aria-hidden="true" />
                    View profile
                  </button>
                ) : null}
                {onTreat ? (
                  <button
                    type="button"
                    onClick={() => onTreat(patient)}
                    disabled={actionsDisabled}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-success transition hover:text-[#246248] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={13} aria-hidden="true" />
                    Treated
                  </button>
                ) : null}
                {onReject ? (
                  <button
                    type="button"
                    onClick={() => onReject(patient)}
                    disabled={actionsDisabled}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-danger transition hover:text-[#a53e3b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={13} aria-hidden="true" />
                    Reject
                  </button>
                ) : null}
              </div>
            ) : null
          ) : (
            <div className="mt-4 flex items-center gap-4 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => onEdit(patient)}
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand"
              >
                <Pencil size={13} aria-hidden="true" />
                Edit
              </button>
              {isDoctorScope ? (
                <button
                  type="button"
                  onClick={() => onDelete(patient)}
                  className="text-[12.5px] font-medium text-danger transition hover:text-[#a53e3b]"
                >
                  Remove patient
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(patient)}
                  className="inline-flex items-center gap-1 text-[12.5px] font-medium text-danger"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Delete
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
