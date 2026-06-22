import { Skeleton } from "@/components/meridian";
import { ContentGrid } from "@/components/meridian/layout";

export function ContributorDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12" aria-hidden="true" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <ContentGrid className="grid-cols-2 lg:grid-cols-4" gap="md">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[148px] rounded-2xl" />
        ))}
      </ContentGrid>

      <ContentGrid className="grid-cols-2 lg:grid-cols-4" gap="md">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`earn-${i}`} className="h-[148px] rounded-2xl" />
        ))}
      </ContentGrid>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
