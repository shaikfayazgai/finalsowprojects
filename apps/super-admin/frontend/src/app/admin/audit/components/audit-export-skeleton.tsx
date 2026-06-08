import { Skeleton } from "@/components/meridian";

export function AuditExportSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface p-5 max-w-xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-md mt-4" />
      </div>
    </div>
  );
}
