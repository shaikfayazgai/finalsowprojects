import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-7 w-2/3" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* KPI row — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-parchment flex items-center gap-4 px-4 py-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Team section */}
      <div className="card-parchment p-5 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card-parchment p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      {/* Tasks */}
      <div className="card-parchment p-5 space-y-3">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          </div>
        ))}
      </div>

      {/* Deliverables */}
      <div className="card-parchment p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? "1px solid var(--border-hair)" : undefined }}>
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
