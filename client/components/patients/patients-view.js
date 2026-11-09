"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Info, Plus, Users } from "lucide-react";
import { useUrlListState, buildListQuery } from "@/hooks/use-url-list-state";
import { usePatients } from "@/hooks/use-patients";
import { useDoctorOptions } from "@/hooks/use-doctors";
import { formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { PageEntrance } from "@/components/ui/page-entrance";
import { SearchInput } from "@/components/ui/search-input";
import { FilterSelect } from "@/components/ui/filter-select";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { CardListSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { SoftBadge } from "@/components/ui/badge";
import { PatientCardList, PatientTable } from "./patient-table";
import { PatientSheet } from "./patient-sheet";
import { DeletePatientDialog } from "./delete-patient-dialog";

const FILTER_KEYS = ["condition", "doctorId"];

export function PatientsView() {
  const { values, setParams } = useUrlListState({ filterKeys: FILTER_KEYS });
  const query = useMemo(() => buildListQuery(values, FILTER_KEYS), [values]);
  const patients = usePatients(query);
  const doctorOptions = useDoctorOptions();
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const meta = patients.data?.meta;
  const rows = patients.data?.data ?? [];
  const conditions = meta?.conditions ?? [];
  const doctorFilterOptions = (doctorOptions.data?.data ?? []).map((doctor) => ({
    value: doctor.id,
    label: doctor.name,
  }));
  const hasFilters = Boolean(
    values.search || values.from || values.to || values.condition || values.doctorId,
  );

  const onSearch = useCallback((search) => setParams({ search }), [setParams]);

  function onSort(field) {
    if (values.sort === field) {
      setParams({ sort: field, order: values.order === "asc" ? "desc" : "asc" });
      return;
    }
    setParams({ sort: field, order: field === "name" ? "asc" : "desc" });
  }

  function clearFilters() {
    setParams({
      search: "",
      from: "",
      to: "",
      condition: "",
      doctorId: "",
    });
  }

  const sortedLabel =
    values.sort === "name"
      ? `Sorted by name ${values.order === "asc" ? "A–Z" : "Z–A"}`
      : `Sorted by ${values.order === "asc" ? "oldest" : "newest"} added`;

  return (
    <PageEntrance>
      <PageHeader
        title="Patients"
        description="Find, update and manage patient records across your workspace."
      />

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15.5px] font-semibold text-ink">All patients</h2>
            <SoftBadge className="bg-soft">
              {patients.isPending ? "…" : `${formatNumber(meta?.total ?? 0)} patients`}
            </SoftBadge>
          </div>
          <p className="text-[12px] text-body">{sortedLabel}</p>
        </div>

        <div className="border-t border-line p-4 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="lg:max-w-[340px] lg:flex-1">
              <SearchInput
                value={values.search}
                onSearch={onSearch}
                placeholder="Search patient name or ID"
                label="Search patients"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <DateRangeFilter
                from={values.from}
                to={values.to}
                onChange={({ from, to }) => setParams({ from, to })}
              />
              <FilterSelect
                id="condition-filter"
                label="Filter by condition"
                value={values.condition}
                onChange={(condition) => setParams({ condition })}
                options={conditions}
                allLabel="All conditions"
                className="sm:min-w-[160px]"
              />
              <FilterSelect
                id="doctor-filter"
                label="Filter by assigned doctor"
                value={values.doctorId}
                onChange={(doctorId) => setParams({ doctorId })}
                options={doctorFilterOptions}
                allLabel="All doctors"
                className="col-span-2 sm:min-w-[160px]"
              />
              <div className="relative col-span-2 lg:hidden">
                <label htmlFor="patient-sort" className="sr-only">
                  Sort patients
                </label>
                <select
                  id="patient-sort"
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
              title="We could not load the patient directory"
              description="Check your connection and try again."
              onRetry={() => patients.refetch()}
            />
          </div>
        ) : patients.isPending ? (
          <div className="border-t border-line">
            <div className="hidden lg:block">
              <TableSkeleton rows={8} columns={6} />
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
                  : "Patients are registered from a doctor's profile. Open a doctor to add the first patient."
              }
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className="btn-secondary-quiet">
                    Clear filters
                  </button>
                ) : (
                  <Link href="/doctors" className="btn-primary-brand">
                    <Plus size={16} aria-hidden="true" />
                    Browse doctors
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <PatientTable
              patients={rows}
              sort={values.sort}
              order={values.order}
              onSort={onSort}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
            <PatientCardList patients={rows} onEdit={setEditTarget} onDelete={setDeleteTarget} />
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
          To register a patient, open their doctor&apos;s profile and select &ldquo;Add
          patient&rdquo;.
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
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={24}>24</option>
          </select>
        </label>
      </div>

      {editTarget ? (
        <PatientSheet
          patient={editTarget}
          conditions={conditions}
          onClose={() => setEditTarget(null)}
        />
      ) : null}

      <DeletePatientDialog
        patient={deleteTarget}
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => setDeleteTarget(null)}
      />
    </PageEntrance>
  );
}
