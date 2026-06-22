import type { MockSkill } from "@/mocks/contributor";
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

export function reliabilityBand(twin: {
  onTimePct: number;
  firstTryAcceptPct: number;
}): ReliabilityBand {
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

/**
 * Real delivery record — computed by the backend from the contributor's own
 * tasks + the mentor reviews they received. Null until they have any history.
 */
export interface ProfileTwin {
  /** Completed tasks (all-time). */
  tasksReinforcing: number;
  /** Completed in the last 30 days. */
  tasksCompleted30d: number;
  /** Currently assigned / in-progress / submitted. */
  tasksInFlight: number;
  tasksDeclined30d: number;
  /** % of completed-with-deadline tasks delivered on/before the deadline. */
  onTimePct: number;
  firstTryAcceptPct: number;
  withdrawals: number;
  acceptanceRatePct: number;
  /** Total tasks ever taken on (assigned + in-progress + submitted + completed). */
  tasksTaken: number;
  /** Completed before the deadline (numerator/denominator for "Before deadline"). */
  onTimeCount: number;
  onTimeTotal: number;
  /** Average mentor rubric score (0–5) across reviews received. */
  averageReviewScore: number;
  ratingCount: number;
}

/** A recent completed contribution, for the profile "Recent contributions" list. */
export interface ProfileRecentTask {
  id: string;
  title: string;
  tenantName: string;
  decidedAt: string | null;
  assignedAt: string | null;
}

export interface ProfileIndexData {
  skills: MockSkill[];
  skillTotal: number;
  /** Derived delivery record — null until the contributor has any history. */
  twin: ProfileTwin | null;
  recentTasks: ProfileRecentTask[];
  /** From onboarding ContributorProfile.availability + timezone. */
  availability: { hoursPerWeek: number; timezone: string };
  /** Student track — degree · branch from onboarding. */
  institution: string | null;
}
