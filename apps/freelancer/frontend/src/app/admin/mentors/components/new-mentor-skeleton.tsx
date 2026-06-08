import { Skeleton } from "@/components/meridian";

export function NewMentorSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-44" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
        <div className="px-5 py-4 border-t border-stroke-subtle flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
