import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function SkillDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-32" />
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-28" />
          <Bar className="h-7 w-48" />
          <Bar className="h-4 w-80" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bar key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className={cn(GLASS_CARD, "p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>
      <Bar className="h-11 w-72 rounded-xl" />
      <div className={cn(GLASS_CARD, "h-48")} style={GLASS_SHADOW} />
    </div>
  );
}
