"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Info, Pencil, Plus, Stethoscope, Trash2, Users } from "lucide-react";
import { useDoctor, useDoctorPatients } from "@/hooks/use-doctors";
import { useUrlListState, buildListQuery } from "@/hooks/use-url-list-state";
import { formatNumber } from "@/lib/formatters";
import { PageEntrance } from "@/components/ui/page-entrance";
import { SearchInput } from "@/components/ui/search-input";
import { FilterSelect } from "@/components/ui/filter-select";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { CardListSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { SoftBadge } from "@/components/ui/badge";
import { PatientCardList, PatientTable } from "@/components/patients/patient-table";
import { PatientSheet } from "@/components/patients/patient-sheet";
import { DeletePatientDialog } from "@/components/patients/delete-patient-dialog";
import { DoctorSheet } from "./doctor-sheet";
import { DoctorProfileCard } from "./doctor-profile-card";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";

const FILTER_KEYS = ["condition"];

function BackLink() {
  return (
    <Link
      href="/doctors"
      className="inline-flex items-center gap-2 text-[12.5px] font-medium text-body transition hover:text-ink"
    >
      <ArrowLeft size={15} aria-hidden="true" />
      All doctors
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[176px] animate-pulse rounded-xl border border-line bg-surface" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="h-[132px] border-b border-line" />
        <TableSkeleton rows={6} columns={6} />
      </div>
    </div>
  );
}

export function DoctorDetailView() {
  const params = useParams();
  const router = useRouter();
  const doctorId = typeof params.id === "string" ? params.id : "";
  const doctor = useDoctor(doctorId);
  const { values, setParams } = useUrlListState({
    filterKeys: FILTER_KEYS,
    allowedLimits: [6, 12, 24],
    defaultLimit: 6,
  });
  const query = useMemo(() => buildListQuery(values, FILTER_KEYS), [values]);
  const patients = useDoctorPatients(doctorId, query);
  const [editDoctorOpen, setEditDoctorOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [editPatientTarget, setEditPatientTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [deleteDoctorOpen, setDeleteDoctorOpen] = useState(false);

  const onSearch = useCallback((search) => setParams({ search }), [setParams]);

  function onSort(field) {
    if (values.sort === field) {
      setParams({ sort: field, order: values.order === "asc" ? "desc" : "asc" });
      return;
    }
    setParams({ sort: field, order: field === "name" ? "asc" : "desc" });
  }

  if (doctor.isPending) {
    return (
      <>
        <BackLink />
        <div className="mt-5">
          <DetailSkeleton />
        </div>
      </>
    );
  }

  if (doctor.isError) {
    const notFound = doctor.error?.status === 404;

    return (
      <PageEntrance>
        <BackLink />
        <div className="mt-5 rounded-xl border border-line bg-surface">
          {notFound ? (
            <EmptyState
              icon={<Stethoscope size={20} aria-hidden="true" />}
              title="Doctor not found"
              description="This doctor may have been removed, or the link is no longer valid."
              action={
                <Link href="/doctors" className="btn-primary-brand">
                  Return to doctors
                </Link>
              }
            />
          ) : (
            <ErrorState
              title="We could not load this doctor"
              description="Check your connection and try again."
              onRetry={() => doctor.refetch()}
            />
          )}
        </div>
      </PageEntrance>
    );
  }

  const profile = doctor.data.data;
  const meta = patients.data?.meta;
  const rows = patients.data?.data ?? [];
  const conditions = meta?.conditions ?? [];
  const hasFilters = Boolean(values.search || values.from || values.to || values.condition);

  function clearFilters() {
    setParams({ search: "", from: "", to: "", condition: "" });
  }

  return (
    <PageEntrance>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditDoctorOpen(true)}
            className="btn-secondary-quiet h-9 px-3 text-[12.5px]"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit profile
          </button>
          <button
            type="button"
            onClick={() => setDeleteDoctorOpen(true)}
            disabled={profile.patientCount > 0}
            title={
              profile.patientCount > 0
                ? "Reassign or delete this doctor's patients first"
                : "Delete doctor"
            }
            className="btn-secondary-quiet h-9 px-3 text-[12.5px] text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4">
        <DoctorProfileCard doctor={profile} />
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-semibold text-ink">Patients</h2>
              <SoftBadge className="bg-soft">
                {patients.isPending ? "…" : formatNumber(meta?.total ?? 0)}
              </SoftBadge>
            </div>
            <p className="mt-1 text-[12.5px] text-body">
              Patient records assigned to {profile.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddPatientOpen(true)}
            className="btn-primary-brand"
          >
            <Plus size={16} aria-hidden="true" />
            Add patient
          </button>
        </div>

        <div className="border-t border-line p-4 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="lg:max-w-[340px] lg:flex-1">
              <SearchInput
                value={values.search}
                onSearch={onSearch}
                placeholder="Search patient name or ID"
                label="Search assigned patients"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <DateRangeFilter
                from={values.from}
                to={values.to}
                onChange={({ from, to }) => setParams({ from, to })}
              />
              <FilterSelect
                id="doctor-patient-condition-filter"
                label="Filter by condition"
                value={values.condition}
                onChange={(condition) => setParams({ condition })}
                options={conditions}
                allLabel="All conditions"
                className="sm:min-w-[160px]"
              />
              <div className="relative col-span-2 lg:hidden">
                <label htmlFor="doctor-patient-sort" className="sr-only">
                  Sort assigned patients
                </label>
                <select
                  id="doctor-patient-sort"
                  value={`${values.sort}-${values.order}`}
                  onChange={(event) => {
                    const [sort, order] = event.target.value.split("-");
                    setParams({ sort, order });
                  }}
                  className="field-input appearance-none pr-9 text-[13.5px]"
                >
                  <option value="createdAt-desc">Newest added</option>
                  <option value="createdAt-asc">Oldest added</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {patients.isError ? (
          <div className="border-t border-line">
            <ErrorState
              title="We could not load this doctor's patients"
              description="Check your connection and try again."
              onRetry={() => patients.refetch()}
            />
          </div>
        ) : patients.isPending ? (
          <div className="border-t border-line">
            <div className="hidden lg:block">
              <TableSkeleton rows={6} columns={6} />
            </div>
            <div className="lg:hidden">
              <CardListSkeleton rows={4} />
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              icon={<Users size={20} aria-hidden="true" />}
              title={hasFilters ? "No patients match these filters" : "No patients yet"}
              description={
                hasFilters
                  ? "Adjust the search or clear the filters to see more patients."
                  : `Add the first patient for ${profile.name}.`
              }
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className="btn-secondary-quiet">
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddPatientOpen(true)}
                    className="btn-primary-brand"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add patient
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            <PatientTable
              patients={rows}
              variant="doctor"
              sort={values.sort}
              order={values.order}
              onSort={onSort}
              onEdit={setEditPatientTarget}
              onDelete={setRemoveTarget}
            />
            <PatientCardList
              patients={rows}
              variant="doctor"
              onEdit={setEditPatientTarget}
              onDelete={setRemoveTarget}
            />
            <Pagination
              meta={meta}
              label="records"
              onPageChange={(page) => setParams({ page }, { resetPage: false })}
            />
          </>
        )}
      </section>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[11.5px] text-muted">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Removing a patient deletes their record from this list and the Patients directory.
        </p>
        <label className="flex items-center gap-2 text-[11.5px] text-body">
          <span>Records per page</span>
          <select
            value={values.limit}
            onChange={(event) =>
              setParams({ limit: Number(event.target.value) }, { resetPage: false })
            }
            className="h-8 rounded-[6px] border border-line bg-surface px-2 text-[12px] text-ink"
            aria-label="Records per page"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </label>
      </div>

      {editDoctorOpen ? (
        <DoctorSheet doctor={profile} onClose={() => setEditDoctorOpen(false)} />
      ) : null}

      <DeleteDoctorDialog
        doctor={profile}
        open={deleteDoctorOpen}
        onClose={() => setDeleteDoctorOpen(false)}
        onDeleted={() => {
          setDeleteDoctorOpen(false);
          router.replace("/doctors");
        }}
      />

      {addPatientOpen ? (
        <PatientSheet
          doctor={{
            id: profile.id,
            name: profile.name,
            specialization: profile.specialization,
            hospital: profile.hospital,
            profilePicture: profile.profilePicture,
          }}
          conditions={conditions}
          onClose={() => setAddPatientOpen(false)}
        />
      ) : null}

      {editPatientTarget ? (
        <PatientSheet
          patient={editPatientTarget}
          doctor={{
            id: profile.id,
            name: profile.name,
            specialization: profile.specialization,
            hospital: profile.hospital,
            profilePicture: profile.profilePicture,
          }}
          conditions={conditions}
          onClose={() => setEditPatientTarget(null)}
        />
      ) : null}

      <DeletePatientDialog
        patient={removeTarget}
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onDeleted={() => setRemoveTarget(null)}
      />
    </PageEntrance>
  );
}
