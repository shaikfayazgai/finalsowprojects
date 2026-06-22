import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function NewSkillSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-28" />
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-32" />
          <Bar className="h-7 w-32" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-10 w-28 rounded-xl" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={cn(GLASS_CARD, "flex-1 p-6 space-y-5")} style={GLASS_SHADOW}>
          <Bar className="h-5 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Bar className="h-10 rounded-lg" />
            <Bar className="h-10 rounded-lg" />
          </div>
          <Bar className="h-10 rounded-lg" />
        </div>
        <div className={cn(GLASS_CARD, "w-full lg:w-[340px] h-64")} style={GLASS_SHADOW} />
      </div>
    </div>
  );
}
