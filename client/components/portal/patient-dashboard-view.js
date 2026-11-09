"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, History, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePatientDashboard } from "@/hooks/use-portal";
import { formatDate, formatDateRange, formatNumber, formatPercent } from "@/lib/formatters";
import { Avatar } from "@/components/ui/avatar";
import { SoftBadge, SpecializationBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageEntrance } from "@/components/ui/page-entrance";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeletons";
import { RangeSelect } from "@/components/ui/range-select";
import { StatCard } from "@/components/ui/stat-card";

const RANGES = new Set(["7d", "30d", "90d", "12m"]);

function CareTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[12px] shadow-lg">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 text-body">Current: {formatNumber(payload[0]?.value)}</p>
      <p className="text-body">Previous: {formatNumber(payload[1]?.value)}</p>
    </div>
  );
}

function DoctorSummary({ doctor }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar name={doctor?.name} src={doctor?.profilePicture?.thumbUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            Current doctor
          </p>
          {doctor ? (
            <>
              <h2 className="mt-1 truncate text-[17px] font-semibold text-ink">{doctor.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <SpecializationBadge>{doctor.specialization}</SpecializationBadge>
                {doctor.hospital ? (
                  <SoftBadge className="bg-base-200">{doctor.hospital}</SoftBadge>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-body">
              You do not currently have a doctor assigned.
            </p>
          )}
        </div>
      </div>
      {doctor ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {doctor.phone ? (
            <a href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`} className="btn-secondary-quiet">
              Call doctor
            </a>
          ) : null}
          {doctor.email ? (
            <a href={`mailto:${doctor.email}`} className="btn-secondary-quiet">
              Email doctor
            </a>
          ) : null}
        </div>
      ) : (
        <Link href="/portal" className="btn-secondary-quiet mt-5">
          Choose a doctor
        </Link>
      )}
    </section>
  );
}

function RecentHistory({ entries }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Recent care history</h2>
          <p className="mt-1 text-[12.5px] text-body">Your latest completed care relationships.</p>
        </div>
        <Link href="/portal/history" className="btn-secondary-quiet">
          View history
        </Link>
      </div>
      {entries.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            icon={<History size={20} />}
            title="No care history yet"
            description="Completed care will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
              <Avatar name={entry.doctor.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{entry.doctor.name}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {entry.doctor.specialization} · {formatDate(entry.endedAt)}
                </p>
              </div>
              <SoftBadge
                className={
                  entry.outcome === "treated"
                    ? "bg-success/10 text-success"
                    : "bg-danger-soft text-danger"
                }
              >
                {entry.outcome === "treated" ? "Treated" : "Rejected"}
              </SoftBadge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PatientDashboardView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const rangeParam = searchParams.get("range");
  const range = RANGES.has(rangeParam) ? rangeParam : "30d";
  const dashboard = usePatientDashboard(range);
  const data = dashboard.data?.data;

  function changeRange(nextRange) {
    router.replace(`${pathname}?range=${nextRange}`, { scroll: false });
  }

  if (dashboard.isPending) return <PageSkeleton />;

  if (dashboard.isError) {
    return (
      <>
        <PageHeader title="Patient dashboard" description="A private view of your care history." />
        <div className="rounded-xl border border-line bg-surface">
          <ErrorState
            title="We could not load your dashboard"
            description="Check your connection and try again."
            onRetry={() => dashboard.refetch()}
          />
        </div>
      </>
    );
  }

  const chartData = data.careOverTime?.buckets ?? [];
  const activeDoctor = data.careStatus?.doctor;

  return (
    <PageEntrance>
      <PageHeader
        title="Patient dashboard"
        description={`A private overview of ${data.patient.name}'s care.`}
        actions={
          <>
            <Link href="/portal" className="btn-secondary-quiet">
              <ArrowLeft size={15} aria-hidden="true" />
              My profile
            </Link>
            <RangeSelect
              value={range}
              onChange={changeRange}
              startDate={data.range.startDate}
              endDate={data.range.endDate}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Care episodes"
          value={formatNumber(data.totals.careEpisodes)}
          icon={<History size={17} strokeWidth={1.8} />}
          footer={`${formatNumber(data.current.careEpisodes)} in this period`}
        />
        <StatCard
          label="Treated"
          value={formatNumber(data.totals.treated)}
          icon={<CheckCircle2 size={17} strokeWidth={1.8} />}
          footer={`${formatNumber(data.current.treated)} in this period`}
        />
        <StatCard
          label="Rejected"
          value={formatNumber(data.totals.rejected)}
          icon={<XCircle size={17} strokeWidth={1.8} />}
          footer={`${formatNumber(data.current.rejected)} in this period`}
        />
        <StatCard
          label="Care status"
          value={data.careStatus.active ? "Active" : "Open"}
          icon={<Clock3 size={17} strokeWidth={1.8} />}
          footer={activeDoctor ? `With ${activeDoctor.name}` : "Select a doctor to continue care"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.36fr_1fr]">
        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Care activity</h2>
              <p className="mt-1 text-[12.5px] text-body">
                Completed care episodes ·{" "}
                {formatDateRange(data.range.startDate, data.range.endDate)}
              </p>
            </div>
            <SoftBadge className="bg-base-200">
              {data.range.granularity === "day"
                ? "Daily"
                : data.range.granularity === "month"
                  ? "Monthly"
                  : "Weekly"}
            </SoftBadge>
          </div>
          <div className="mt-5 h-[230px] w-full">
            {chartData.length === 0 ? (
              <EmptyState
                compact
                icon={<CalendarDays size={19} />}
                title="No care activity"
                description="Try a wider date range."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
                  barGap={4}
                  barCategoryGap="28%"
                >
                  <CartesianGrid vertical={false} stroke="var(--color-base-300)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-muted)", fontSize: 10.5 }}
                    dy={8}
                    minTickGap={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-muted)", fontSize: 10.5 }}
                    width={36}
                  />
                  <Tooltip cursor={{ fill: "var(--color-base-200)" }} content={<CareTooltip />} />
                  <Bar
                    dataKey="previous"
                    fill="var(--color-chart-faint)"
                    radius={[2, 2, 0, 0]}
                    barSize={11}
                  />
                  <Bar
                    dataKey="current"
                    fill="var(--color-brand)"
                    radius={[2, 2, 0, 0]}
                    barSize={11}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-[11.5px] text-body">
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-[2px] bg-brand" />
              Current · {formatNumber(data.current.careEpisodes)}
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-[2px] bg-chart-faint" />
              Previous · {formatNumber(data.previous.careEpisodes)}
            </span>
            <span className="ml-auto">
              <span className="text-brand-dark">
                {formatPercent(data.changes.careEpisodesPercent) ?? "—"}
              </span>{" "}
              vs previous
            </span>
          </div>
        </section>
        <DoctorSummary doctor={activeDoctor} />
      </div>

      <div className="mt-4">
        <RecentHistory entries={data.recentHistory ?? []} />
      </div>
      <p className="mt-4 text-[11.5px] text-muted">
        Selected period · {formatDateRange(data.range.startDate, data.range.endDate)}
      </p>
    </PageEntrance>
  );
}
