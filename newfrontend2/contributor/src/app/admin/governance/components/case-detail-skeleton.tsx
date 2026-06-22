import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function CaseDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-32" />
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-40" />
          <div className="flex flex-wrap gap-2 items-center">
            <Bar className="h-7 w-56" />
            <Bar className="h-6 w-16 rounded-full" />
            <Bar className="h-6 w-20 rounded-full" />
          </div>
          <Bar className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Bar key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      <Bar className="h-11 w-72 max-w-full rounded-xl" />

      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
            <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 space-y-2">
              <Bar className="h-4 w-32" />
              <Bar className="h-3 w-48" />
            </div>
            <div className="px-5 sm:px-6 py-5 space-y-3">
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-3/4" />
              <Bar className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
