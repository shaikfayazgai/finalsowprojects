import type { MockDigitalTwin, MockSkill } from "@/mocks/contributor";
import type { MockTask } from "@/mocks/contributor/tasks";
import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

export function fmtJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function fmtShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function primaryRole(cat: MockSkill["category"]): string {
  switch (cat) {
    case "engineering":
      return "Engineer";
    case "design":
      return "Designer";
    case "data":
      return "Data analyst";
    case "ops":
      return "Ops";
    case "writing":
      return "Writer";
    default:
      return "Contributor";
  }
}

export function skillCategoryLabel(cat: MockSkill["category"]): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export type ReliabilityBand = "high" | "steady" | "developing";

export function reliabilityBand(twin: MockDigitalTwin): ReliabilityBand {
  if (twin.onTimePct >= 85 && twin.firstTryAcceptPct >= 70) return "high";
  if (twin.onTimePct >= 70) return "steady";
  return "developing";
}

export function reliabilityLabel(band: ReliabilityBand): string {
  switch (band) {
    case "high":
      return "High";
    case "steady":
      return "Steady";
    case "developing":
      return "Developing";
    default:
      return String(band);
  }
}

export function reliabilityChip(band: ReliabilityBand): StatusChipVariant {
  switch (band) {
    case "high":
      return "success";
    case "steady":
      return "info";
    case "developing":
      return "pending";
    default:
      return "neutral";
  }
}

export function levelTone(level: MockSkill["level"]): string {
  switch (level) {
    case "L4":
      return "text-brand-subtle-text bg-brand-subtle border-brand/20";
    case "L3":
      return "text-foreground bg-bg-subtle border-stroke-subtle";
    case "L2":
      return "text-text-secondary bg-bg-subtle/80 border-stroke-subtle";
    default:
      return "text-text-tertiary bg-surface border-stroke-subtle";
  }
}

export interface ProfileIndexData {
  skills: MockSkill[];
  skillTotal: number;
  /** Derived delivery record — null until wired to completed-work APIs. */
  twin: MockDigitalTwin | null;
  recentTasks: MockTask[];
  /** From onboarding ContributorProfile.availability + timezone. */
  availability: { hoursPerWeek: number; timezone: string };
  /** Student track — degree · branch from onboarding. */
  institution: string | null;
}
