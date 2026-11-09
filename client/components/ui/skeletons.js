export function TableSkeleton({ rows = 8, columns = 5 }) {
  return (
    <div className="overflow-hidden">
      <div className="h-11 border-b border-line bg-[#f4f7f7]" />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex h-[68px] items-center gap-6 border-b border-line px-6 last:border-0"
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className={`h-3 animate-pulse rounded bg-base-200 ${
                columnIndex === 0 ? "w-44" : "w-20"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ rows = 6 }) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 animate-pulse rounded-full bg-base-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-base-200" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-base-200" />
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full animate-pulse rounded bg-base-200" />
          <div className="mt-2 h-2.5 w-2/3 animate-pulse rounded bg-base-200" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-[148px] animate-pulse rounded-xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <div className="h-4 w-40 animate-pulse rounded bg-base-200" />
      <div className="mt-2 h-3 w-52 animate-pulse rounded bg-base-200" />
      <div className="mt-8 flex h-[200px] items-end gap-5">
        {[42, 66, 55, 78, 48, 70, 60, 82].map((height, index) => (
          <div
            key={index}
            className="flex-1 animate-pulse rounded-t bg-base-200"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-base-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-base-200" />
      </div>
      <StatsSkeleton />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
