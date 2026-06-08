import { Skeleton } from "@/components/meridian";

export function TenantProvisioningSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-56" />
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="p-5 space-y-3">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
