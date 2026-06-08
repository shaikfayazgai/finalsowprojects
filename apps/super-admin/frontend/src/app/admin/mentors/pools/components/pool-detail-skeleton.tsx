import { Skeleton } from "@/components/meridian";

export function PoolDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-56" />
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="flex gap-4 px-5 pt-3 border-b border-stroke-subtle pb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="p-5 space-y-5">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
