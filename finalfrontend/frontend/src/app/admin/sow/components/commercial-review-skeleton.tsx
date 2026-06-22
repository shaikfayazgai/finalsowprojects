import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function CommercialReviewSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-32" />
      <div className="space-y-2">
        <Bar className="h-8 w-96 max-w-full" />
        <Bar className="h-4 w-full max-w-xl" />
        <Bar className="h-4 w-64" />
      </div>
      <div className={cn(DASH_CARD, "h-44")} />
      <div className={cn(DASH_CARD, "h-36")} />
      <div className={cn(DASH_CARD, "h-48")} />
      <div className={cn(DASH_CARD, "h-32")} />
    </div>
  );
}
