"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChartNoAxesCombined, Stethoscope, Users } from "lucide-react";
import {
  useDashboardSummary,
  usePatientsOverTime,
  usePatientsPerDoctor,
} from "@/hooks/use-dashboard";
import { usePatients } from "@/hooks/use-patients";
import { formatAverage, formatDateRange, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { PageEntrance } from "@/components/ui/page-entrance";
import { StatCard } from "@/components/ui/stat-card";
import { RangeSelect } from "@/components/ui/range-select";
import { ErrorState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeletons";
import { RegistrationsChart } from "./registrations-chart";
import { WorkloadChart } from "./workload-chart";
import { LatestPatients } from "./latest-patients";

const RANGES = new Set(["7d", "30d", "90d", "12m"]);

const RANGE_CAPTIONS = {
  "7d": "in the last 7 days",
  "30d": "in the last 30 days",
  "90d": "in the last 90 days",
  "12m": "in the last 12 months",
};

export function DashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rangeParam = searchParams.get("range");
  const range = RANGES.has(rangeParam) ? rangeParam : "30d";

  const summary = useDashboardSummary(range);
  const workload = usePatientsPerDoctor();
  const overTime = usePatientsOverTime(range);
  const recent = usePatients({ limit: 4, sort: "createdAt", order: "desc" });

  const data = summary.data?.data;
  const caption = RANGE_CAPTIONS[range];

  function changeRange(nextRange) {
    router.replace(`${pathname}?range=${nextRange}`, { scroll: false });
  }

  if (summary.isPending) {
    return (
      <>
        <PageHeader
          title="Workspace overview"
          description="A snapshot of your doctors and patients."
          actions={<RangeSelect value={range} onChange={changeRange} />}
        />
        <PageSkeleton />
      </>
    );
  }

  if (summary.isError) {
    return (
      <>
        <PageHeader
          title="Workspace overview"
          description="A snapshot of your doctors and patients."
          actions={
            <RangeSelect
              value={range}
              onChange={changeRange}
              startDate={data?.range?.startDate}
              endDate={data?.range?.endDate}
            />
          }
        />
        <div className="rounded-xl border border-line bg-surface">
          <ErrorState
            title="We could not load the workspace overview"
            description="The dashboard summary is temporarily unavailable."
            onRetry={() => summary.refetch()}
          />
        </div>
      </>
    );
  }

  return (
    <PageEntrance>
      <PageHeader
        title="Workspace overview"
        description="A snapshot of your doctors and patients."
        actions={
          <RangeSelect
            value={range}
            onChange={changeRange}
            startDate={data?.range?.startDate}
            endDate={data?.range?.endDate}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard
          label="Total doctors"
          value={formatNumber(data.totals.doctors)}
          icon={<Stethoscope size={17} strokeWidth={1.8} aria-hidden="true" />}
          footer={`${formatNumber(data.current.newDoctors)} added ${caption}`}
        />
        <StatCard
          label="Total patients"
          value={formatNumber(data.totals.patients)}
          icon={<Users size={17} strokeWidth={1.8} aria-hidden="true" />}
          footer={`${formatNumber(data.current.newPatients)} registered ${caption}`}
        />

        <article className="col-span-2 flex min-h-[88px] items-center justify-between gap-4 rounded-xl border border-brand-soft bg-brand-soft p-5 xl:col-span-1 xl:min-h-[148px] xl:flex-col xl:items-stretch xl:justify-between xl:border-line xl:bg-surface xl:p-6">
          <div className="xl:flex xl:items-start xl:justify-between">
            <div>
              <p className="text-[13.5px] font-medium text-brand-dark xl:text-body">
                Patients per doctor
              </p>
              <p className="mt-1 text-[12px] text-brand-dark/75 xl:hidden">
                Across all {formatNumber(data.totals.doctors)} doctors
              </p>
            </div>
            <ChartNoAxesCombined
              size={17}
              strokeWidth={1.8}
              className="hidden text-brand/80 xl:block"
              aria-hidden="true"
            />
          </div>
          <div className="text-right xl:text-left">
            <p className="text-[30px] font-semibold leading-none tracking-[-0.02em] text-brand-dark xl:text-[34px] xl:text-ink">
              {formatAverage(data.totals.averagePatientsPerDoctor)}
            </p>
            <p className="mt-2 hidden text-[12.5px] text-body xl:block">
              Average across {formatNumber(data.totals.doctors)} doctors
            </p>
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.36fr_1fr]">
        <RegistrationsChart
          data={overTime.data}
          loading={overTime.isPending}
          error={overTime.isError}
          onRetry={() => overTime.refetch()}
        />
        <WorkloadChart
          data={workload.data}
          loading={workload.isPending}
          error={workload.isError}
          onRetry={() => workload.refetch()}
        />
      </div>

      <div className="mt-4">
        <LatestPatients
          patients={recent.data?.data ?? []}
          loading={recent.isPending}
          error={recent.isError}
        />
      </div>

      <p className="mt-4 text-[11.5px] text-muted">
        {data.range.startDate && data.range.endDate
          ? `Selected period · ${formatDateRange(data.range.startDate, data.range.endDate)}`
          : null}
      </p>
    </PageEntrance>
  );
}
