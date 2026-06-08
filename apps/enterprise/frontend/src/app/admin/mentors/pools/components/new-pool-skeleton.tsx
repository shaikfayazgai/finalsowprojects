import { Skeleton } from "@/components/meridian";

export function NewPoolSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <div className="flex justify-between pt-3 border-t border-stroke-subtle">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
