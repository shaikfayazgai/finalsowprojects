import { Skeleton } from "@/components/meridian";

export function CommercialReviewSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden p-5">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
