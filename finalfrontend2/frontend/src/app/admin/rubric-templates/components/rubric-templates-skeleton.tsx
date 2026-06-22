import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function RubricTemplatesSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-8 w-44" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-10 w-32 rounded-lg" />
      </div>
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bar key={i} className="h-8 w-[4.5rem] rounded-lg" />
            ))}
          </div>
          <Bar className="h-9 w-full sm:w-56 rounded-lg" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-stroke-subtle flex items-center gap-4">
            <Bar className="h-9 flex-1 max-w-xs" />
            <Bar className="h-6 w-16 rounded-full" />
            <Bar className="h-4 w-8" />
            <Bar className="h-4 w-8" />
            <Bar className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
