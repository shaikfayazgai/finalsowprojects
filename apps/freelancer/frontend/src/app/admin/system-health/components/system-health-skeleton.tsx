import { Skeleton } from "@/components/meridian";

export function SystemHealthSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>
    </div>
  );
}
