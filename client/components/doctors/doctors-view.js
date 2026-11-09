"use client";

import { useCallback, useMemo, useState } from "react";
import { HOSPITALS, SPECIALIZATIONS } from "@doctor-tracker/validation";
import { Plus, Stethoscope } from "lucide-react";
import { useUrlListState, buildListQuery } from "@/hooks/use-url-list-state";
import { useDoctors } from "@/hooks/use-doctors";
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
import { DoctorTable, DoctorCardList } from "./doctor-table";
import { DoctorSheet } from "./doctor-sheet";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";

const FILTER_KEYS = ["specialization", "hospital"];

export function DoctorsView() {
  const { values, setParams } = useUrlListState({ filterKeys: FILTER_KEYS });
  const query = useMemo(() => buildListQuery(values, FILTER_KEYS), [values]);
  const doctors = useDoctors(query);
  const [sheetState, setSheetState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const meta = doctors.data?.meta;
  const rows = doctors.data?.data ?? [];
  const specializations = meta?.specializations ?? SPECIALIZATIONS;
  const hospitals = meta?.hospitals ?? HOSPITALS;
  const hasFilters = Boolean(
    values.search || values.from || values.to || values.specialization || values.hospital,
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
      specialization: "",
      hospital: "",
    });
  }

  const sortedLabel =
    values.sort === "name"
      ? `Sorted by name ${values.order === "asc" ? "A–Z" : "Z–A"}`
      : `Sorted by ${values.order === "asc" ? "oldest" : "newest"} added`;

  return (
    <PageEntrance>
      <PageHeader
        title="Doctors"
        description="Manage your doctor directory and their corresponding patients."
        actions={
          <button
            type="button"
            onClick={() => setSheetState({ doctor: null })}
            className="btn-primary-brand"
          >
            <Plus size={16} aria-hidden="true" />
            Add doctor
          </button>
        }
      />

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15.5px] font-semibold text-ink">All doctors</h2>
            <SoftBadge className="bg-soft">
              {doctors.isPending ? "…" : `${formatNumber(meta?.total ?? 0)} doctors`}
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
                placeholder="Search doctor name or email"
                label="Search doctors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <DateRangeFilter
                from={values.from}
                to={values.to}
                onChange={({ from, to }) => setParams({ from, to })}
              />
              <FilterSelect
                id="hospital-filter"
                label="Filter by hospital"
                value={values.hospital}
                onChange={(hospital) => setParams({ hospital })}
                options={hospitals}
                allLabel="All hospitals"
                className="sm:min-w-[160px]"
              />
              <FilterSelect
                id="specialization-filter"
                label="Filter by specialization"
                value={values.specialization}
                onChange={(specialization) => setParams({ specialization })}
                options={specializations}
                allLabel="All specializations"
                className="col-span-2 sm:col-span-1 sm:min-w-[168px]"
              />
              <div className="relative col-span-2 lg:hidden">
                <label htmlFor="doctor-sort" className="sr-only">
                  Sort doctors
                </label>
                <select
                  id="doctor-sort"
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

        {doctors.isError ? (
          <div className="border-t border-line">
            <ErrorState
              title="We could not load the doctor directory"
              description="Check your connection and try again."
              onRetry={() => doctors.refetch()}
            />
          </div>
        ) : doctors.isPending ? (
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
              icon={<Stethoscope size={20} aria-hidden="true" />}
              title={hasFilters ? "No doctors match these filters" : "No doctors yet"}
              description={
                hasFilters
                  ? "Adjust the search or clear the filters to see more doctors."
                  : "Add your first doctor to start registering patients."
              }
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className="btn-secondary-quiet">
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSheetState({ doctor: null })}
                    className="btn-primary-brand"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add doctor
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            <DoctorTable
              doctors={rows}
              sort={values.sort}
              order={values.order}
              onSort={onSort}
              onEdit={(doctor) => setSheetState({ doctor })}
              onDelete={setDeleteTarget}
            />
            <DoctorCardList
              doctors={rows}
              onEdit={(doctor) => setSheetState({ doctor })}
              onDelete={setDeleteTarget}
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
        <p className="text-[11.5px] text-muted">
          Select “View patients” to manage a doctor’s patient list.
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

      {deleteTarget ? (
        <DeleteDoctorDialog
          doctor={deleteTarget}
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}

      {sheetState ? (
        <DoctorSheet
          doctor={sheetState.doctor}
          specializations={specializations}
          hospitals={hospitals}
          onClose={() => setSheetState(null)}
        />
      ) : null}
    </PageEntrance>
  );
}
