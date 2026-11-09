"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/empty-state";

function WorkloadTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }
  const item = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] shadow-[0_12px_30px_-18px_rgba(32,52,56,0.35)]">
      <p className="font-semibold text-ink">{item?.name}</p>
      <p className="mt-0.5 text-body">{formatNumber(item?.count ?? 0)} assigned patients</p>
    </div>
  );
}

function displayName(name = "") {
  return name.replace(/^Dr\.?\s+/i, "");
}

export function WorkloadChart({ data, loading, error, onRetry }) {
  if (error) {
    return (
      <section className="rounded-xl border border-line bg-surface">
        <EmptyState
          icon={<ChartNoAxesCombined size={20} />}
          title="Workload unavailable"
          description="The doctor workload summary could not be loaded."
          action={
            <button type="button" onClick={onRetry} className="btn-secondary-quiet">
              Try again
            </button>
          }
        />
      </section>
    );
  }

  const items = data?.data ?? [];
  const meta = data?.meta;
  const top = items.slice(0, 5);
  const chartData = top.map((item) => ({ ...item, displayName: displayName(item.name) }));
  const topPatients = top.reduce((sum, item) => sum + item.count, 0);
  const otherDoctors = Math.max(0, (meta?.totalDoctors ?? 0) - top.length);
  const otherPatients = Math.max(0, (meta?.totalPatients ?? 0) - topPatients);
  const average =
    meta?.totalDoctors > 0 ? (meta.totalPatients / meta.totalDoctors).toFixed(1) : "0.0";

  return (
    <section className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-[16px] font-semibold text-ink">Doctor workload</h2>
        <p className="mt-1 text-[12.5px] text-body">
          Assigned patients · top {Math.min(5, items.length || 5)} of{" "}
          {formatNumber(meta?.totalDoctors ?? 0)} doctors
        </p>
      </div>

      <div className="mt-5 h-[195px] min-h-[195px] w-full">
        {loading ? (
          <div className="space-y-3 pt-2">
            {[90, 76, 62, 50, 40].map((width, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-3 w-24 animate-pulse rounded bg-base-200" />
                <div
                  className="h-2.5 animate-pulse rounded-full bg-base-200"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <EmptyState
            compact
            title="No assigned patients yet"
            description="Workload appears once patients are registered."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 34, bottom: 0, left: 0 }}
              barCategoryGap={14}
              accessibilityLayer
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="displayName"
                width={102}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-body)", fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "var(--color-base-200)" }} content={<WorkloadTooltip />} />
              <Bar
                dataKey="count"
                barSize={10}
                radius={[5, 5, 5, 5]}
                background={{ fill: "var(--color-soft)" }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.doctorId}
                    fill={index === 0 ? "var(--color-brand)" : "var(--color-chart-secondary)"}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  fill="var(--color-ink)"
                  fontSize={12}
                  fontWeight={500}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-center justify-between border-t border-line pt-4 text-[12px]">
          <span className="text-body">Other {formatNumber(otherDoctors)} doctors</span>
          <span className="font-medium text-ink">{formatNumber(otherPatients)} patients</span>
        </div>
        <p className="mt-3 text-[11.5px] text-muted">
          {average} patients per doctor on average across the workspace.
        </p>
      </div>

      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.doctorId}>
            {item.name}, {item.specialization}: {item.count} assigned patients.
          </li>
        ))}
      </ul>
    </section>
  );
}
