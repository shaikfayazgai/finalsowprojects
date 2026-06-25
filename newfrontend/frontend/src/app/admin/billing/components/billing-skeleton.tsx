import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function BillingSkeleton() {
  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-8 w-40" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-5 w-28 rounded-md" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn(DASH_CARD, "p-4 space-y-4")}>
            <div className="flex items-start justify-between">
              <Bar className="h-3 w-20" />
              <Bar className="h-9 w-9 rounded-lg" />
            </div>
            <Bar className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* table */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 py-4 border-b border-stroke-subtle flex items-center justify-between gap-3">
          <Bar className="h-5 w-40" />
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bar key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-stroke-subtle flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Bar className="h-3.5 w-1/2" />
              <Bar className="h-3 w-2/3" />
            </div>
            <Bar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
