import { Skeleton } from "@/components/meridian";

export function UniversitiesSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>
    </div>
  );
}
