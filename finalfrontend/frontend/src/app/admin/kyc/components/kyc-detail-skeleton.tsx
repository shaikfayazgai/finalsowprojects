import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function KycDetailSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-36" />

      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Bar className="h-6 w-20 rounded-full" />
          <Bar className="h-6 w-24 rounded-full" />
        </div>
        <Bar className="h-7 w-48" />
        <Bar className="h-4 w-80" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle space-y-2">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-56" />
          </div>
          <div className="px-4 sm:px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Bar className="h-3 w-24" />
                <Bar className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
