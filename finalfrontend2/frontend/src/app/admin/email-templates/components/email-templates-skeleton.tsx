import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function EmailTemplatesSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-32" />
          <Bar className="h-7 w-52" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-10 w-40 rounded-xl" />
      </div>

      {/* Tabs */}
      <Bar className="h-11 w-56 rounded-xl" />

      {/* Stat strip */}
      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-28 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Library list + editor / preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] gap-5 items-start">
        <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
          <div className="px-4 py-3.5 border-b border-white/55 space-y-2">
            <Bar className="h-3.5 w-28" />
            <Bar className="h-3 w-20" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 border-b border-white/30 space-y-2">
              <Bar className="h-3.5 w-40" />
              <Bar className="h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className={cn(GLASS_CARD, "p-5 sm:p-6 space-y-5")} style={GLASS_SHADOW}>
            <div className="space-y-2">
              <Bar className="h-4 w-44" />
              <Bar className="h-3.5 w-full max-w-xs" />
            </div>
            <Bar className="h-10 w-full rounded-lg" />
            <Bar className="h-10 w-full rounded-lg" />
            <Bar className="h-40 w-full rounded-lg" />
            <Bar className="h-16 w-full rounded-xl" />
          </div>
          <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
            <div className="px-5 py-3.5 border-b border-white/55">
              <Bar className="h-3.5 w-32" />
            </div>
            <div className="p-5">
              <Bar className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
