import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function SkillTaxonomySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-32" />
          <Bar className="h-7 w-40" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex gap-2">
          <Bar className="h-10 w-24 rounded-xl" />
          <Bar className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 py-4 border-b border-white/55 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Bar className="h-9 w-48 rounded-lg" />
            <Bar className="h-9 w-44 rounded-lg" />
            <Bar className="h-9 w-60 rounded-lg ml-auto" />
          </div>
          <div className="flex justify-end">
            <Bar className="h-3 w-20" />
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-6 py-3.5 border-b border-white/30 flex items-center gap-3">
            <Bar className="h-8 w-8 rounded-lg" />
            <Bar className="h-9 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
