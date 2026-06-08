import { Skeleton } from "@/components/meridian";

export function EarningsOverviewSkeleton() {
  return (
    <div className="space-y-4 pb-12">
      <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
        <Skeleton className="h-4 w-36 rounded mb-1" />
        <Skeleton className="h-3 w-64 rounded mb-6" />
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 mb-6 border-b border-stroke-subtle">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-10 w-44 rounded" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle flex flex-wrap justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
          <Skeleton className="h-8 w-52 rounded-md" />
        </div>
        <div className="p-5 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </section>
    </div>
  );
}
