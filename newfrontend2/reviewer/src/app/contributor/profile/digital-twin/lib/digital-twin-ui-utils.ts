import type { MockDigitalTwin, MockTwinMonth } from "@/mocks/contributor/digital-twin";
import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";
import {
  reliabilityBand,
  reliabilityChip,
  reliabilityLabel,
  type ReliabilityBand,
} from "../../lib/profile-ui-utils";

export type { ReliabilityBand };
export { reliabilityBand, reliabilityChip, reliabilityLabel };

export type TwinHistoryPeriod = "3m" | "6m" | "1y";

export const TWIN_PERIOD_TABS: Array<{ id: TwinHistoryPeriod; label: string }> = [
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
];

export function fmtTwinUpdated(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function trendLabel(trend: MockDigitalTwin["performanceTrend"]): string {
  switch (trend) {
    case "improving":
      return "Improving";
    case "cooling":
      return "Cooling off";
    default:
      return "Steady";
  }
}

export function trendChipStatus(
  trend: MockDigitalTwin["performanceTrend"],
): NonNullable<StatusChipProps["status"]> {
  switch (trend) {
    case "improving":
      return "success";
    case "cooling":
      return "warning";
    default:
      return "info";
  }
}

export function filterActivityByPeriod(
  rows: MockTwinMonth[],
  period: TwinHistoryPeriod,
): MockTwinMonth[] {
  const count = period === "3m" ? 3 : period === "6m" ? 6 : rows.length;
  return rows.slice(-count);
}

export function maxTasksInPeriod(rows: MockTwinMonth[]): number {
  if (rows.length === 0) return 1;
  return Math.max(1, ...rows.map((r) => r.tasksCompleted));
}
