import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function AuditSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-7 w-32" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-9 w-28 rounded-lg" />
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bar key={i} className="h-8 w-16 rounded-lg" />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bar key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
          <Bar className="h-9 w-full sm:w-60 rounded-lg sm:ml-auto" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 sm:px-5 py-3.5 border-b border-stroke-subtle flex items-center justify-between gap-4">
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
