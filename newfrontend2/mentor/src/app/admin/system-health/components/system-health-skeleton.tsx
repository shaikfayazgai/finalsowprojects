import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function SystemHealthSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-40" />
          <Bar className="h-7 w-48" />
          <Bar className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex gap-3">
          <Bar className="h-4 w-24" />
          <Bar className="h-4 w-20" />
        </div>
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-56 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Bar className="h-4 w-24" />
            <Bar className="h-3 w-28" />
          </div>
          <Bar className="h-11 w-72 rounded-xl" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 sm:px-6 py-4 border-b border-white/30 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Bar className="h-5 w-48" />
              <Bar className="h-1.5 w-64" />
            </div>
            <Bar className="h-4 w-16" />
          </div>
        ))}
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 space-y-2">
          <Bar className="h-4 w-28" />
          <Bar className="h-3 w-44" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 sm:px-6 py-4 border-b border-white/30 flex items-center gap-3">
            <Bar className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-3/4" />
              <Bar className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
