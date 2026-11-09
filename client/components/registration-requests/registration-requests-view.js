"use client";

import { useState } from "react";
import { Check, ClipboardList, Mail, Phone, Stethoscope, Trash2, UserRound } from "lucide-react";
import {
  useApproveRegistrationRequest,
  useDeleteRegistrationRequest,
  useRegistrationRequests,
} from "@/hooks/use-registration-requests";
import { useToast } from "@/components/ui/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageEntrance } from "@/components/ui/page-entrance";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeletons";
import { formatAgeSex, formatDate, formatNumber } from "@/lib/formatters";

function RequestType({ type }) {
  const Icon = type === "doctor" ? Stethoscope : UserRound;
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-[5px] bg-brand-soft px-2 text-[12px] font-medium capitalize text-brand-dark">
      <Icon size={13} aria-hidden="true" />
      {type}
    </span>
  );
}

function RequestCard({ request, busy, onApprove, onDelete }) {
  return (
    <article className="border-b border-line px-5 py-5 last:border-0 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {request.type === "doctor" ? (
              <Avatar name={request.name} src={request.profilePicture?.thumbUrl} size="sm" />
            ) : null}
            <h2 className="text-[15px] font-semibold text-ink">{request.name}</h2>
            <RequestType type={request.type} />
            <span className="text-[12px] text-muted">Received {formatDate(request.createdAt)}</span>
          </div>
          <div className="mt-3 grid gap-x-6 gap-y-2 text-[13px] text-body sm:grid-cols-2 xl:grid-cols-3">
            <p className="flex min-w-0 items-center gap-2">
              <Mail size={14} className="shrink-0 text-muted" aria-hidden="true" />
              {request.email ? (
                <a className="truncate hover:text-brand" href={`mailto:${request.email}`}>
                  {request.email}
                </a>
              ) : (
                <span>Email not provided</span>
              )}
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <Phone size={14} className="shrink-0 text-muted" aria-hidden="true" />
              <a className="truncate hover:text-brand" href={`tel:${request.phone}`}>
                {request.phone}
              </a>
            </p>
            {request.type === "doctor" ? (
              <>
                <p>{request.specialization}</p>
                <p className="sm:col-span-2">{request.hospital}</p>
              </>
            ) : (
              <>
                <p>{formatAgeSex(request.age, request.gender)}</p>
                <p>{request.condition}</p>
                <p className="sm:col-span-2">
                  {request.doctor?.name
                    ? `Requested doctor: ${request.doctor.name}`
                    : "Requested doctor is unavailable"}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:pl-3">
          <button
            type="button"
            onClick={() => onApprove(request)}
            disabled={busy}
            className="btn-primary-brand h-9 px-3 text-[12.5px]"
          >
            <Check size={15} aria-hidden="true" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onDelete(request)}
            disabled={busy}
            className="btn-secondary-quiet h-9 px-3 text-[12.5px] text-danger hover:bg-danger-soft"
            aria-label={`Delete ${request.name}'s pending request`}
            title="Delete request"
          >
            <Trash2 size={15} aria-hidden="true" />
            <span className="sm:hidden">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function RegistrationRequestsView() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const requests = useRegistrationRequests({ page, limit: 20 });
  const approve = useApproveRegistrationRequest();
  const remove = useDeleteRegistrationRequest();
  const toast = useToast();
  const rows = requests.data?.data ?? [];
  const total = requests.data?.meta?.total ?? 0;
  const busy = approve.isPending || remove.isPending;

  async function handleApprove(request) {
    try {
      const result = await approve.mutateAsync(request.id);
      const collection = result.data.recordType === "doctor" ? "Doctors" : "Patients";
      toast.success(
        "Request approved",
        `${request.name} was added to ${collection}, and the pending request was removed.`,
      );
    } catch (error) {
      const errorCode = error.code
        ? ` (${error.code}${error.status ? `, HTTP ${error.status}` : ""})`
        : "";
      toast.error("Request could not be approved", `${error.message}${errorCode}`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success("Request deleted", `${deleteTarget.name}'s pending request was removed.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Request could not be deleted", error.message);
    }
  }

  return (
    <PageEntrance>
      <PageHeader
        title="Registration requests"
        description="Review doctor and patient submissions before adding them to the workspace."
        actions={
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-body">
            <ClipboardList size={16} className="text-brand" aria-hidden="true" />
            <span>{requests.isPending ? "…" : formatNumber(total)} pending</span>
          </span>
        }
      />

      <section
        className="overflow-hidden rounded-xl border border-line bg-surface"
        aria-label="Pending registration requests"
      >
        {requests.isPending ? (
          <TableSkeleton rows={5} columns={4} />
        ) : requests.isError ? (
          <ErrorState
            title="Registration requests could not be loaded"
            onRetry={() => requests.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={20} aria-hidden="true" />}
            title="No pending requests"
            description="New doctor and patient registrations will appear here for review."
          />
        ) : (
          <>
            {rows.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                busy={busy}
                onApprove={handleApprove}
                onDelete={setDeleteTarget}
              />
            ))}
            <Pagination meta={requests.data.meta} label="requests" onPageChange={setPage} />
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        pending={remove.isPending}
        title="Delete this pending request?"
        confirmLabel="Delete request"
        description={
          deleteTarget
            ? `This permanently removes ${deleteTarget.name}'s request. No directory record will be created.`
            : ""
        }
      />
    </PageEntrance>
  );
}
