import { Skeleton } from "@/components/meridian";

export function TenantsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-full max-w-xs ml-auto" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>
    </div>
  );
}
