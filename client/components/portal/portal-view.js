"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChartNoAxesCombined,
  History,
  Info,
  Pencil,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { useUrlListState, buildListQuery } from "@/hooks/use-url-list-state";
import {
  useDoctorPortal,
  useDoctorPortalPatients,
  usePatientPortal,
  useRecordPatientOutcome,
} from "@/hooks/use-portal";
import { formatNumber } from "@/lib/formatters";
import { SoftBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageEntrance } from "@/components/ui/page-entrance";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { CardListSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { DoctorProfileCard } from "@/components/doctors/doctor-profile-card";
import { PatientCardList, PatientTable } from "@/components/patients/patient-table";
import { AssignedDoctorCard } from "./assigned-doctor-card";
import { ChangePatientDoctorSheet } from "./change-patient-doctor-sheet";
import { DoctorProfileSheet } from "./doctor-profile-sheet";
import { PatientProfileCard } from "./patient-profile-card";
import { PatientProfileSheet } from "./patient-profile-sheet";
import { PatientSelfProfileSheet } from "./patient-self-profile-sheet";
import { RejectPatientDialog } from "./reject-patient-dialog";

function PortalNote({ children }) {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-[12.5px] leading-5 text-body">
      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function PortalLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded bg-base-200" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-base-200" />
      <div className="h-[176px] animate-pulse rounded-xl border border-line bg-surface" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <TableSkeleton rows={6} columns={5} />
      </div>
    </div>
  );
}

function MissingProfile({ role, message, onRetry }) {
  const isMissing = message?.status === 404;
  const label = role === "doctor" ? "doctor" : "patient";

  return (
    <div className="rounded-xl border border-line bg-surface">
      {isMissing ? (
        <EmptyState
          icon={role === "doctor" ? <Stethoscope size={20} /> : <Users size={20} />}
          title={`No ${label} record linked`}
          description={`Your account is active, but it is not linked to a ${label} record yet. Contact the workspace administrator.`}
          action={
            <Link href="/" className="btn-secondary-quiet">
              Return home
            </Link>
          }
        />
      ) : (
        <ErrorState
          title="We could not load your portal"
          description="Check your connection and try again."
          onRetry={onRetry}
        />
      )}
    </div>
  );
}

function DoctorPortal() {
  const router = useRouter();
  const toast = useToast();
  const doctor = useDoctorPortal();
  const recordOutcome = useRecordPatientOutcome();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const { values, setParams } = useUrlListState({ allowedLimits: [6, 12, 24], defaultLimit: 6 });
  const query = useMemo(() => buildListQuery(values), [values]);
  const patients = useDoctorPortalPatients(query, doctor.isSuccess);

  const onSearch = useCallback((search) => setParams({ search }), [setParams]);

  async function handleTreat(patient) {
    try {
      await recordOutcome.mutateAsync({ patientId: patient.id, outcome: "treated" });
      toast.success(
        "Patient treated",
        `${patient.name} has been moved to your treatment history and released to choose a new doctor.`,
      );
    } catch (error) {
      toast.error(
        "Patient could not be marked as treated",
        error?.message ?? "Please try again in a moment.",
      );
    }
  }

  function onSort(field) {
    if (values.sort === field) {
      setParams({ sort: field, order: values.order === "asc" ? "desc" : "asc" });
      return;
    }
    setParams({ sort: field, order: field === "name" ? "asc" : "desc" });
  }

  if (doctor.isPending) {
    return <PortalLoading />;
  }

  if (doctor.isError) {
    return <MissingProfile role="doctor" message={doctor.error} onRetry={() => doctor.refetch()} />;
  }

  const profile = doctor.data.data;
  const meta = patients.data?.meta;
  const rows = patients.data?.data ?? [];
  const hasSearch = Boolean(values.search);

  return (
    <PageEntrance>
      <PageHeader
        title="Doctor portal"
        description={`Signed in as ${profile.name}. Edit your profile, manage your patient list, and review completed care.`}
        actions={
          <>
            <SoftBadge className="hidden bg-brand-soft text-brand-dark sm:inline-flex">
              Profile editable
            </SoftBadge>
            <Link href="/portal/dashboard" className="btn-secondary-quiet">
              <ChartNoAxesCombined size={15} aria-hidden="true" />
              Dashboard
            </Link>
            <Link href="/portal/history" className="btn-secondary-quiet">
              <History size={15} aria-hidden="true" />
              Treatment history
            </Link>
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="btn-primary-brand"
            >
              <Pencil size={15} aria-hidden="true" />
              Edit profile
            </button>
          </>
        }
      />

      <PortalNote>
        You can edit your own profile and close care for assigned patients. Marking a patient as
        treated moves them to your history, while rejecting removes them from your list; both
        actions release the patient to choose a new doctor. Your sign-in email is managed by the
        workspace administrator.
      </PortalNote>

      {!profile.profilePicture ? (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 text-[12.5px] leading-5 text-brand-dark">
            <Camera size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Add a profile photo so administrators and patients can recognize you in the doctor
            directory.
          </p>
          <button
            type="button"
            onClick={() => setEditProfileOpen(true)}
            className="btn-secondary-quiet h-9 shrink-0 px-3 text-[12.5px]"
          >
            Add photo
          </button>
        </div>
      ) : null}

      <DoctorProfileCard doctor={profile} />

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-semibold text-ink">Your patients</h2>
              <SoftBadge className="bg-soft">
                {patients.isPending ? "…" : formatNumber(meta?.total ?? 0)}
              </SoftBadge>
            </div>
            <p className="mt-1 text-[12.5px] text-body">
              Patients currently assigned to you. Treated patients move to your history.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="sm:w-[260px]">
              <SearchInput
                value={values.search}
                onSearch={onSearch}
                placeholder="Search your patients"
                label="Search your patients"
              />
            </div>
            <div className="relative">
              <label htmlFor="portal-patient-sort" className="sr-only">
                Sort your patients
              </label>
              <select
                id="portal-patient-sort"
                value={`${values.sort}-${values.order}`}
                onChange={(event) => {
                  const [sort, order] = event.target.value.split("-");
                  setParams({ sort, order });
                }}
                className="field-input appearance-none pr-9 text-[13px]"
              >
                <option value="createdAt-desc">Newest added</option>
                <option value="createdAt-asc">Oldest added</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </div>
          </div>
        </div>

        {patients.isError ? (
          <div className="border-t border-line">
            <ErrorState
              title="We could not load your patients"
              description="Check your connection and try again."
              onRetry={() => patients.refetch()}
            />
          </div>
        ) : patients.isPending ? (
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
              icon={<Users size={20} aria-hidden="true" />}
              title={hasSearch ? "No patients match this search" : "No patients assigned yet"}
              description={
                hasSearch
                  ? "Try a different name or patient reference."
                  : "Patients assigned to you will appear here."
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
                ) : null
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
              onView={setSelectedPatient}
              onTreat={handleTreat}
              onReject={setRejectTarget}
              actionsDisabled={recordOutcome.isPending}
              readOnly
            />
            <PatientCardList
              patients={rows}
              variant="doctor"
              onView={setSelectedPatient}
              onTreat={handleTreat}
              onReject={setRejectTarget}
              actionsDisabled={recordOutcome.isPending}
              readOnly
            />
            <Pagination
              meta={meta}
              label="patients"
              onPageChange={(page) => setParams({ page }, { resetPage: false })}
            />
          </>
        )}
      </section>

      {editProfileOpen ? (
        <DoctorProfileSheet
          doctor={profile}
          onClose={() => setEditProfileOpen(false)}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {selectedPatient ? (
        <PatientProfileSheet patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      ) : null}

      {rejectTarget ? (
        <RejectPatientDialog
          patient={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={() => setRejectTarget(null)}
        />
      ) : null}
    </PageEntrance>
  );
}

function PatientPortal() {
  const router = useRouter();
  const patient = usePatientPortal();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changeDoctorOpen, setChangeDoctorOpen] = useState(false);

  if (patient.isPending) {
    return <PortalLoading />;
  }

  if (patient.isError) {
    return (
      <MissingProfile role="patient" message={patient.error} onRetry={() => patient.refetch()} />
    );
  }

  const record = patient.data.data;

  return (
    <PageEntrance>
      <PageHeader
        title="Patient portal"
        description="Your personal record, the doctor assigned to you, and your past care."
        actions={
          <>
            <SoftBadge className="hidden bg-brand-soft text-brand-dark sm:inline-flex">
              Profile editable
            </SoftBadge>
            <Link href="/portal/dashboard" className="btn-secondary-quiet">
              <ChartNoAxesCombined size={15} aria-hidden="true" />
              Dashboard
            </Link>
            <Link href="/portal/history" className="btn-secondary-quiet">
              <History size={15} aria-hidden="true" />
              Doctor history
            </Link>
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="btn-primary-brand"
            >
              <Pencil size={15} aria-hidden="true" />
              Edit profile
            </button>
          </>
        }
      />

      <PortalNote>
        You can update your own profile, change the doctor assigned to your care, and review past
        doctors. Your sign-in email is managed by the workspace administrator.
      </PortalNote>

      <PatientProfileCard patient={record} showDoctor={false} />

      <div className="mt-4">
        <AssignedDoctorCard
          doctor={record.doctor}
          onChangeDoctor={() => setChangeDoctorOpen(true)}
        />
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11.5px] text-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        Changes are saved immediately and appear in the patient directory and your doctor’s patient
        list.
      </p>

      {editProfileOpen ? (
        <PatientSelfProfileSheet
          patient={record}
          onClose={() => setEditProfileOpen(false)}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {changeDoctorOpen ? (
        <ChangePatientDoctorSheet
          patient={record}
          onClose={() => setChangeDoctorOpen(false)}
          onChanged={() => router.refresh()}
        />
      ) : null}
    </PageEntrance>
  );
}

export function PortalView({ role }) {
  return role === "doctor" ? <DoctorPortal /> : <PatientPortal />;
}
