import { Skeleton } from "@/components/meridian";

export function CaseDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-48" />
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-36" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-32" />
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
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="p-5 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
