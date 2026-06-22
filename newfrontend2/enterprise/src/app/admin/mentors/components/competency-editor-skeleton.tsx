import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function CompetencyEditorSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-32" />
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-8 w-56" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-10 w-28 rounded-lg" />
      </div>
      <div className={cn(DASH_CARD, "h-28")} />
      <div className={cn(DASH_CARD, "h-64")} />
    </div>
  );
}
