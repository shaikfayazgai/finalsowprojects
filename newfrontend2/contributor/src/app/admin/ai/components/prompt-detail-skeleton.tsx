import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function PromptDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-24" />
      <div className="space-y-2.5">
        <Bar className="h-7 w-72 max-w-full" />
        <Bar className="h-4 w-48" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <Bar className="h-11 w-72 rounded-xl" />

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
        <div className={cn(GLASS_CARD, "flex-1 min-w-0 overflow-hidden")} style={GLASS_SHADOW}>
          <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 space-y-1.5">
            <Bar className="h-4 w-32" />
            <Bar className="h-3 w-52" />
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            <Bar className="h-72 w-full rounded-lg" />
            <Bar className="h-16 w-full" />
          </div>
        </div>
        <div className={cn(GLASS_CARD, "w-full lg:w-[320px] shrink-0 p-5 space-y-3")} style={GLASS_SHADOW}>
          <Bar className="h-3 w-32" />
          <Bar className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
