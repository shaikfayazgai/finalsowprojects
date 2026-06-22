import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function WWDetailSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <Bar className="h-4 w-40" />

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-36" />
          <Bar className="h-7 w-64" />
          <Bar className="h-4 w-80" />
        </div>
        <Bar className="h-10 w-28 rounded-xl" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-36 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <Bar className="h-11 w-80 rounded-xl" />

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 space-y-2">
          <Bar className="h-4 w-44" />
          <Bar className="h-3 w-60" />
        </div>
        <div className="px-5 sm:px-6 py-5 space-y-3">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-5/6" />
          <Bar className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
