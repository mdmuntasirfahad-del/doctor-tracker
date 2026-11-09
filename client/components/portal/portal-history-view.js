"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, Phone, Stethoscope } from "lucide-react";
import { useUrlListState, buildListQuery } from "@/hooks/use-url-list-state";
import { useDoctorPortalHistory, usePatientPortalHistory } from "@/hooks/use-portal";
import { formatAgeSex, formatDate, formatNumber } from "@/lib/formatters";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge, SoftBadge, SpecializationBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageEntrance } from "@/components/ui/page-entrance";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { CardListSkeleton, TableSkeleton } from "@/components/ui/skeletons";

const HISTORY_LIMITS = [6, 12, 24];

function HistoryLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded bg-base-200" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-base-200" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <TableSkeleton rows={6} columns={5} />
      </div>
    </div>
  );
}

function SortControl({ values, setParams }) {
  return (
    <div className="relative">
      <label htmlFor="portal-history-sort" className="sr-only">
        Sort history
      </label>
      <select
        id="portal-history-sort"
        value={`${values.sort}-${values.order}`}
        onChange={(event) => {
          const [sort, order] = event.target.value.split("-");
          setParams({ sort, order });
        }}
        className="field-input appearance-none pr-9 text-[13px]"
      >
        <option value="createdAt-desc">Most recent</option>
        <option value="createdAt-asc">Oldest first</option>
        <option value="name-asc">Name A–Z</option>
        <option value="name-desc">Name Z–A</option>
      </select>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/portal" className="btn-secondary-quiet">
      <ArrowLeft size={15} aria-hidden="true" />
      Back to portal
    </Link>
  );
}

function DoctorHistory() {
  const { values, setParams } = useUrlListState({
    allowedLimits: HISTORY_LIMITS,
    defaultLimit: 6,
  });
  const query = useMemo(() => buildListQuery(values), [values]);
  const history = useDoctorPortalHistory(query);
  const onSearch = useCallback((search) => setParams({ search }), [setParams]);

  const meta = history.data?.meta;
  const rows = history.data?.data ?? [];
  const hasSearch = Boolean(values.search);

  return (
    <PageEntrance>
      <PageHeader
        title="Treatment history"
        description="Patients you have marked as treated. Each record keeps the contact details captured when care was completed."
        actions={<BackLink />}
      />

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-semibold text-ink">Treated patients</h2>
              <SoftBadge className="bg-soft">
                {history.isPending ? "…" : formatNumber(meta?.total ?? 0)}
              </SoftBadge>
            </div>
            <p className="mt-1 text-[12.5px] text-body">
              Rejected patients are removed from your lists and do not appear here.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="sm:w-[260px]">
              <SearchInput
                value={values.search}
                onSearch={onSearch}
                placeholder="Search treated patients"
                label="Search treated patients"
              />
            </div>
            <SortControl values={values} setParams={setParams} />
          </div>
        </div>

        {history.isError ? (
          <div className="border-t border-line">
            <ErrorState
              title="We could not load your treatment history"
              description="Check your connection and try again."
              onRetry={() => history.refetch()}
            />
          </div>
        ) : history.isPending ? (
          <div className="border-t border-line">
            <div className="hidden lg:block">
              <TableSkeleton rows={6} columns={5} />
            </div>
            <div className="lg:hidden">
              <CardListSkeleton rows={4} />
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              icon={<Stethoscope size={20} aria-hidden="true" />}
              title={
                hasSearch ? "No treated patients match this search" : "No treated patients yet"
              }
              description={
                hasSearch
                  ? "Try a different name or patient reference."
                  : "Patients you mark as treated will appear here with their care details."
              }
              action={
                hasSearch ? (
                  <button
                    type="button"
                    onClick={() => setParams({ search: "" })}
                    className="btn-secondary-quiet"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link href="/portal" className="btn-secondary-quiet">
                    Back to your patients
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto border-t border-line lg:block">
              <table className="w-full min-w-[760px] table-fixed border-collapse">
                <thead>
                  <tr className="table-heading h-11 text-left">
                    <th className="w-[30%] px-6 font-semibold">Patient</th>
                    <th className="w-[10%] px-4 font-semibold">Age / sex</th>
                    <th className="w-[18%] px-4 font-semibold">Condition</th>
                    <th className="w-[18%] px-4 font-semibold">Phone</th>
                    <th className="w-[24%] px-6 font-semibold">Treated on</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr key={entry.id} className="h-[68px] border-t border-line text-[13px]">
                      <td className="px-6">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={entry.patient.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{entry.patient.name}</p>
                            <p className="mt-0.5 truncate text-[11.5px] text-muted">
                              {entry.patient.reference}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-body">
                        {formatAgeSex(entry.patient.age, entry.patient.gender)}
                      </td>
                      <td className="px-4">
                        <ConditionBadge>{entry.patient.condition}</ConditionBadge>
                      </td>
                      <td className="px-4 text-body">{entry.patient.phone}</td>
                      <td className="px-6 text-[12.5px] text-body">{formatDate(entry.endedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:hidden">
              {rows.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={entry.patient.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">
                        {entry.patient.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted">
                        {entry.patient.reference} ·{" "}
                        {formatAgeSex(entry.patient.age, entry.patient.gender)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-muted">
                      {formatDate(entry.endedAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ConditionBadge>{entry.patient.condition}</ConditionBadge>
                    <span className="text-[11.5px] text-body">{entry.patient.phone}</span>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination
              meta={meta}
              label="treated patients"
              onPageChange={(page) => setParams({ page }, { resetPage: false })}
            />
          </>
        )}
      </section>
    </PageEntrance>
  );
}

function outcomeLabel(outcome) {
  return outcome === "treated" ? "Treatment completed" : "Care ended";
}

function PatientHistory() {
  const { values, setParams } = useUrlListState({
    allowedLimits: HISTORY_LIMITS,
    defaultLimit: 6,
  });
  const query = useMemo(() => buildListQuery(values), [values]);
  const history = usePatientPortalHistory(query);
  const onSearch = useCallback((search) => setParams({ search }), [setParams]);

  const meta = history.data?.meta;
  const rows = history.data?.data ?? [];
  const hasSearch = Boolean(values.search);

  if (history.isPending) {
    return <HistoryLoading />;
  }

  if (history.isError) {
    return (
      <ErrorState
        title="We could not load your doctor history"
        description="Check your connection and try again."
        onRetry={() => history.refetch()}
      />
    );
  }

  return (
    <PageEntrance>
      <PageHeader
        title="Doctor history"
        description="Doctors you were assigned to in the past. Contact details are kept as they were when each assignment ended."
        actions={<BackLink />}
      />

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-semibold text-ink">Past doctors</h2>
              <SoftBadge className="bg-soft">
                {history.isPending ? "…" : formatNumber(meta?.total ?? 0)}
              </SoftBadge>
            </div>
            <p className="mt-1 text-[12.5px] text-body">
              Completed and ended care relationships, most recent first.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="sm:w-[260px]">
              <SearchInput
                value={values.search}
                onSearch={onSearch}
                placeholder="Search past doctors"
                label="Search past doctors"
              />
            </div>
            <SortControl values={values} setParams={setParams} />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              icon={<Stethoscope size={20} aria-hidden="true" />}
              title={hasSearch ? "No past doctors match this search" : "No past doctors yet"}
              description={
                hasSearch
                  ? "Try a different doctor name or specialization."
                  : "When a care relationship ends, the doctor’s details will appear here."
              }
              action={
                hasSearch ? (
                  <button
                    type="button"
                    onClick={() => setParams({ search: "" })}
                    className="btn-secondary-quiet"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link href="/portal" className="btn-secondary-quiet">
                    Back to your portal
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <ul className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 sm:p-5">
              {rows.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col rounded-xl border border-line bg-surface p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={entry.doctor.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">
                        {entry.doctor.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <SpecializationBadge>{entry.doctor.specialization}</SpecializationBadge>
                        <SoftBadge
                          className={
                            entry.outcome === "treated"
                              ? "bg-success/10 text-success"
                              : "bg-danger-soft text-danger"
                          }
                        >
                          {outcomeLabel(entry.outcome)}
                        </SoftBadge>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-muted">
                      {formatDate(entry.endedAt)}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-2.5 border-t border-line pt-3 text-[12.5px] text-body">
                    <div className="flex min-w-0 items-center gap-2">
                      <Building2 size={14} className="shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Hospital</dt>
                      <dd className="truncate">{entry.doctor.hospital}</dd>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Phone size={14} className="shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Phone</dt>
                      <dd>
                        <a
                          href={`tel:${entry.doctor.phone.replace(/[^\d+]/g, "")}`}
                          className="transition hover:text-brand"
                        >
                          {entry.doctor.phone}
                        </a>
                      </dd>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail size={14} className="shrink-0 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Email</dt>
                      <dd className="truncate">
                        {entry.doctor.email ? (
                          <a
                            href={`mailto:${entry.doctor.email}`}
                            className="transition hover:text-brand"
                          >
                            {entry.doctor.email}
                          </a>
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <Pagination
              meta={meta}
              label="past doctors"
              onPageChange={(page) => setParams({ page }, { resetPage: false })}
            />
          </>
        )}
      </section>
    </PageEntrance>
  );
}

export function PortalHistoryView({ role }) {
  return role === "doctor" ? <DoctorHistory /> : <PatientHistory />;
}
