"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  History,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDoctorDashboard } from "@/hooks/use-portal";
import { formatDate, formatDateRange, formatNumber, formatPercent } from "@/lib/formatters";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge, SoftBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageEntrance } from "@/components/ui/page-entrance";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeletons";
import { RangeSelect } from "@/components/ui/range-select";
import { StatCard } from "@/components/ui/stat-card";

const RANGES = new Set(["7d", "30d", "90d", "12m"]);

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[12px] shadow-lg">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 text-body">Current: {formatNumber(payload[0]?.value)}</p>
      <p className="text-body">Previous: {formatNumber(payload[1]?.value)}</p>
    </div>
  );
}

function Change({ value }) {
  const formatted = formatPercent(value);
  return formatted ? (
    <span className="rounded-[5px] bg-brand-soft px-2 py-0.5 text-[11.5px] font-semibold text-brand-dark">
      {formatted} vs previous
    </span>
  ) : (
    <span className="text-[11.5px] text-muted">No previous data</span>
  );
}

function RecentPatients({ patients }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Recent assigned patients</h2>
          <p className="mt-1 text-[12.5px] text-body">Your latest active patient assignments.</p>
        </div>
        <Link href="/portal" className="btn-secondary-quiet">
          View all
        </Link>
      </div>
      {patients.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            icon={<Users size={20} />}
            title="No active patients"
            description="Patients assigned to you will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {patients.map((patient) => (
            <li key={patient.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
              <Avatar name={patient.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{patient.name}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {patient.reference} · Added {formatDate(patient.createdAt)}
                </p>
              </div>
              <ConditionBadge>{patient.condition}</ConditionBadge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DoctorDashboardView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const rangeParam = searchParams.get("range");
  const range = RANGES.has(rangeParam) ? rangeParam : "30d";
  const dashboard = useDoctorDashboard(range);
  const data = dashboard.data?.data;

  function changeRange(nextRange) {
    router.replace(`${pathname}?range=${nextRange}`, { scroll: false });
  }

  if (dashboard.isPending) return <PageSkeleton />;

  if (dashboard.isError) {
    return (
      <>
        <PageHeader title="Doctor dashboard" description="A private view of your patient care." />
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

  const chartData = data.patientsOverTime?.buckets ?? [];

  return (
    <PageEntrance>
      <PageHeader
        title="Doctor dashboard"
        description={`A private snapshot of ${data.doctor.name}'s patient care.`}
        actions={
          <>
            <Link href="/portal" className="btn-secondary-quiet">
              <ArrowLeft size={15} aria-hidden="true" />
              My patients
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
          label="Active patients"
          value={formatNumber(data.totals.activePatients)}
          icon={<Users size={17} strokeWidth={1.8} aria-hidden="true" />}
          footer={`${formatNumber(data.current.newPatients)} new in this period`}
        />
        <StatCard
          label="Treated patients"
          value={formatNumber(data.totals.treated)}
          icon={<CheckCircle2 size={17} strokeWidth={1.8} aria-hidden="true" />}
          footer={<Change value={data.changes.treatedPercent} />}
        />
        <StatCard
          label="Rejected patients"
          value={formatNumber(data.totals.rejected)}
          icon={<XCircle size={17} strokeWidth={1.8} aria-hidden="true" />}
          footer={<Change value={data.changes.rejectedPercent} />}
        />
        <StatCard
          label="New patients"
          value={formatNumber(data.current.newPatients)}
          icon={<UserRound size={17} strokeWidth={1.8} aria-hidden="true" />}
          footer={<Change value={data.changes.newPatientsPercent} />}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.36fr_1fr]">
        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Your patient growth</h2>
              <p className="mt-1 text-[12.5px] text-body">
                New active assignments · {formatDateRange(data.range.startDate, data.range.endDate)}
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
                icon={<ClipboardList size={19} />}
                title="No patient activity"
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
                  <Tooltip
                    cursor={{ fill: "var(--color-base-200)" }}
                    content={<DashboardTooltip />}
                  />
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
              Current · {formatNumber(data.current.newPatients)}
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-[2px] bg-chart-faint" />
              Previous · {formatNumber(data.previous.newPatients)}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Care outcomes</h2>
              <p className="mt-1 text-[12.5px] text-body">Completed care in the selected period.</p>
            </div>
            <History size={17} className="text-brand/80" aria-hidden="true" />
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2 text-body">
                  <CheckCircle2 size={15} className="text-success" />
                  Treated
                </span>
                <strong className="text-ink">{formatNumber(data.outcomes.treated)}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-base-200">
                <div
                  className="h-full rounded-full bg-success"
                  style={{
                    width: `${data.current.treated + data.current.rejected ? (data.outcomes.treated / (data.current.treated + data.current.rejected)) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2 text-body">
                  <XCircle size={15} className="text-danger" />
                  Rejected
                </span>
                <strong className="text-ink">{formatNumber(data.outcomes.rejected)}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-base-200">
                <div
                  className="h-full rounded-full bg-danger"
                  style={{
                    width: `${data.current.treated + data.current.rejected ? (data.outcomes.rejected / (data.current.treated + data.current.rejected)) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-4 text-[12.5px] text-body">
            {formatNumber(data.current.treated + data.current.rejected)} care decisions in this
            period
          </div>
        </section>
      </div>

      <div className="mt-4">
        <RecentPatients patients={data.recentPatients ?? []} />
      </div>
      <p className="mt-4 text-[11.5px] text-muted">
        Selected period · {formatDateRange(data.range.startDate, data.range.endDate)}
      </p>
    </PageEntrance>
  );
}
