import { Skeleton } from "@/components/meridian";

export function PromptsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-7 w-44" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>
    </div>
  );
}
