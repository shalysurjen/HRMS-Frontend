// Pulse animation helper
const Pulse = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

// ─── Stat Card Skeleton ───────────────────────────────────────────
const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between pb-2">
      <Pulse className="h-3 w-28" />
      <Pulse className="h-8 w-8 rounded-lg" />
    </div>
    <Pulse className="h-8 w-20 mt-3" />
    <Pulse className="h-3 w-32 mt-2" />
  </div>
);

// ─── Chart Card Skeleton ──────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
    <div className="flex items-center gap-2 mb-4">
      <Pulse className="h-4 w-4 rounded" />
      <Pulse className="h-4 w-36" />
    </div>
    <Pulse className="h-62.5 w-full rounded-xl" />
  </div>
);

// ─── Table Skeleton ───────────────────────────────────────────────
const TableSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
    <div className="flex items-center gap-2 mb-4">
      <Pulse className="h-4 w-4 rounded" />
      <Pulse className="h-4 w-40" />
    </div>
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-slate-100">
        {[40, 80, 60, 60, 60].map((w, i) => (
          <Pulse key={i} className={`h-3 w-${w === 40 ? '10' : w === 80 ? '20' : '16'}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-1">
          <Pulse className="h-3 w-10" />
          <Pulse className="h-3 w-28" />
          <Pulse className="h-6 w-14 rounded-full" />
          <Pulse className="h-6 w-14 rounded-full" />
          <Pulse className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Monitoring Card Skeleton ─────────────────────────────────────
const MonitoringCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
    <div className="flex items-center gap-2 mb-4">
      <Pulse className="h-4 w-4 rounded" />
      <Pulse className="h-4 w-36" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
          <div className="space-y-2">
            <Pulse className="h-3 w-32" />
            <Pulse className="h-2 w-40" />
            <Pulse className="h-2 w-24" />
          </div>
          <div className="space-y-2">
            <Pulse className="h-6 w-24 rounded-full" />
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Skeleton ────────────────────────────────────────────────
export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8 space-y-6">

      {/* Header Skeleton */}
      <div className="space-y-2 mb-2">
        <Pulse className="h-7 w-56" />
        <Pulse className="h-4 w-72" />
        <Pulse className="h-3 w-48" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Pulse className="h-9 w-24" />
          <Pulse className="h-9 w-36" />
          <Pulse className="h-9 w-28" />
          <Pulse className="h-9 w-40" />
          <Pulse className="h-9 w-36" />
          <Pulse className="h-9 w-40" />
        </div>
      </div>

      {/* Summary Cards Skeleton — 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Low Balance Table Skeleton */}
      <TableSkeleton rows={5} />

      {/* Manager Tracking Skeleton */}
      <TableSkeleton rows={4} />

      {/* Monitoring Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonitoringCardSkeleton />
        <MonitoringCardSkeleton />
      </div>

    </div>
  );
}