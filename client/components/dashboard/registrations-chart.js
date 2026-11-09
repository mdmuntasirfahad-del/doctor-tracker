"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { formatNumber, formatPercent, formatDateRange, rangeSubtitle } from "@/lib/formatters";
import { SoftBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function RegistrationTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }
  const current = payload.find((entry) => entry.dataKey === "current");
  const previous = payload.find((entry) => entry.dataKey === "previous");

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[12px] shadow-[0_12px_30px_-18px_rgba(32,52,56,0.35)]">
      <p className="font-semibold text-ink">{label}</p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center justify-between gap-5 text-body">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" />
            Current
          </span>
          <span className="font-medium text-ink">{formatNumber(current?.value ?? 0)}</span>
        </p>
        <p className="flex items-center justify-between gap-5 text-body">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-faint" />
            Previous
          </span>
          <span className="font-medium text-ink">{formatNumber(previous?.value ?? 0)}</span>
        </p>
      </div>
    </div>
  );
}

export function RegistrationsChart({ data, loading, error, onRetry }) {
  if (error) {
    return (
      <section className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={<BarChart3 size={20} />}
          title="Registrations unavailable"
          description="The registration trend could not be loaded."
          action={
            <button type="button" onClick={onRetry} className="btn-secondary-quiet">
              Try again
            </button>
          }
        />
      </section>
    );
  }

  const buckets = data?.data?.buckets ?? [];
  const range = data?.data?.range;
  const currentTotal = data?.data?.currentTotal ?? 0;
  const previousTotal = data?.data?.previousTotal ?? 0;
  const change = formatPercent(data?.data?.changePercent);

  return (
    <section className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Patient registrations</h2>
          <p className="mt-1 text-[12.5px] text-body">
            {rangeSubtitle(range?.granularity ?? "week")}
            {range ? ` · ${formatDateRange(range.startDate, range.endDate)}` : ""}
          </p>
        </div>
        <SoftBadge className="shrink-0 bg-base-200">
          {range?.granularity === "day"
            ? "Daily"
            : range?.granularity === "month"
              ? "Monthly"
              : "Weekly"}
        </SoftBadge>
      </div>

      <div className="mt-5 flex items-end gap-3">
        {loading ? (
          <span className="h-9 w-16 animate-pulse rounded bg-base-200" />
        ) : (
          <p className="text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {formatNumber(currentTotal)}
          </p>
        )}
        {change ? (
          <span className="mb-0.5 rounded-[5px] bg-brand-soft px-2 py-0.5 text-[11.5px] font-semibold text-brand-dark">
            {change} vs previous
          </span>
        ) : (
          <span className="mb-0.5 text-[11.5px] text-muted">new patients</span>
        )}
      </div>

      <div className="mt-4 h-[190px] min-h-[190px] w-full">
        {loading ? (
          <div className="flex h-full items-end gap-4 px-2">
            {[44, 68, 52, 80, 58].map((height, index) => (
              <div
                key={index}
                className="flex-1 animate-pulse rounded-t bg-base-200"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        ) : buckets.length === 0 ? (
          <EmptyState
            compact
            icon={<BarChart3 size={19} />}
            title="No registrations in this period"
            description="Try a wider date range."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
              barGap={4}
              barCategoryGap="28%"
              accessibilityLayer
            >
              <CartesianGrid vertical={false} stroke="var(--color-base-300)" strokeDasharray="0" />
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
                width={44}
              />
              <Tooltip
                cursor={{ fill: "var(--color-base-200)" }}
                content={<RegistrationTooltip />}
              />
              <Bar
                dataKey="previous"
                name="Previous"
                fill="var(--color-chart-faint)"
                radius={[2, 2, 0, 0]}
                barSize={11}
              />
              <Bar
                dataKey="current"
                name="Current"
                fill="var(--color-brand)"
                radius={[2, 2, 0, 0]}
                barSize={11}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[11.5px] text-body">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-brand" aria-hidden="true" />
          Current period · {formatNumber(currentTotal)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-chart-faint" aria-hidden="true" />
          Previous period · {formatNumber(previousTotal)}
        </span>
      </div>

      <ul className="sr-only">
        {buckets.map((bucket) => (
          <li key={bucket.label}>
            {bucket.label}: {bucket.current} current registrations, {bucket.previous} previous.
          </li>
        ))}
      </ul>
    </section>
  );
}
