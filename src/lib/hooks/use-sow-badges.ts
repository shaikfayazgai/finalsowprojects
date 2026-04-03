import { useSowStore } from "@/lib/stores/sow-store";

export function useSowBadges(): Record<string, string | undefined> {
  const sows = useSowStore((s) => s.sows);

  const approvalCount = sows.filter(
    (s) => s.status === "approval" || s.status === "changes_requested"
  ).length;

  return {
    "/enterprise/sow/approval": approvalCount > 0 ? String(approvalCount) : undefined,
  };
}
