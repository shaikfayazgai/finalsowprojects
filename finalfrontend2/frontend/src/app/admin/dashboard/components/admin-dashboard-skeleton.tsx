import { cn } from "@/lib/utils/cn";
import { GLASS_PANEL, GLASS_PANEL_SHADOW, GLASS_HEAD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-foreground/[0.07] animate-pulse", className)} />;
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      <header className="space-y-2">
        <Bar className="h-8 w-56" />
        <Bar className="h-4 w-full max-w-md" />
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(GLASS_PANEL, "h-[112px] p-4")} style={GLASS_PANEL_SHADOW}>
            <div className="flex items-center justify-between">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-7 rounded-lg" />
            </div>
            <Bar className="h-7 w-14 mt-3" />
            <Bar className="h-3 w-20 mt-2" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className={cn(GLASS_PANEL, "overflow-hidden lg:col-span-2")} style={GLASS_PANEL_SHADOW}>
          <div className={cn("px-5 py-4 space-y-2", GLASS_HEAD)}>
            <Bar className="h-4 w-32" />
            <Bar className="h-3 w-40" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-white/45 last:border-b-0">
              <Bar className="h-4 w-full" />
            </div>
          ))}
        </div>

        <div className={cn(GLASS_PANEL, "overflow-hidden")} style={GLASS_PANEL_SHADOW}>
          <div className={cn("px-4 py-3.5", GLASS_HEAD)}>
            <Bar className="h-4 w-28" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-white/45 last:border-b-0 space-y-1.5">
              <Bar className="h-3.5 w-full" />
              <Bar className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
