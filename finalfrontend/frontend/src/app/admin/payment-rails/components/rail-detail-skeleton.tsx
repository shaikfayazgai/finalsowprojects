import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function RailDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-40" />

      <div className="space-y-2.5">
        <Bar className="h-3 w-32" />
        <Bar className="h-7 w-56" />
        <Bar className="h-4 w-48" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-28 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-14" />
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-white/55 space-y-2">
          <Bar className="h-3 w-28" />
          <Bar className="h-2 w-full rounded-full" />
        </div>
      </div>

      <Bar className="h-11 w-72 rounded-xl" />

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 py-4 border-b border-white/55 space-y-2">
          <Bar className="h-4 w-36" />
          <Bar className="h-3 w-52" />
        </div>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-4 w-full max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
