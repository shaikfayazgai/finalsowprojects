import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function MentorDetailSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-28" />
      <div className="space-y-2">
        <Bar className="h-8 w-52" />
        <Bar className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className={cn(DASH_CARD, "h-28")} />
      <div className={cn(DASH_CARD, "h-24")} />
      <div className={cn(DASH_CARD, "h-36")} />
    </div>
  );
}
