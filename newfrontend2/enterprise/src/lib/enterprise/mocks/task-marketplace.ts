/**
 * Task marketplace overlay — publish-to-many → interested pool → enterprise
 * selects one.
 *
 * Flow:
 *   1. Enterprise publishes a task to the skilled contributor pool (status "open").
 *   2. Contributors see the task WITH PRICE and express interest.
 *   3. Enterprise reviews the interested pool and selects ONE contributor.
 *   4. Selected contributor is assigned (downstream delivery), others are
 *      marked not_selected and notified the task is closed.
 *
 * Persisted in localStorage until the real API ships. Backend handoff:
 *   POST /api/enterprise/tasks/:id/publish
 *   GET  /api/marketplace/tasks?contributor=          (open opportunities)
 *   POST /api/marketplace/tasks/:id/interest          (contributor)
 *   POST /api/marketplace/tasks/:id/withdraw          (contributor)
 *   GET  /api/marketplace/tasks/:id/interests         (enterprise)
 *   POST /api/marketplace/tasks/:id/select { contributorId }  (enterprise)
 */

import { buildTaskPricing, type TaskPricing } from "@/lib/pricing";
import { applyOverlay, createOverlayStore } from "./overlay";

export type InterestStatus = "interested" | "selected" | "not_selected" | "withdrawn";

export interface MarketplaceInterest {
  contributorId: string;
  contributorName: string;
  contributorEmail: string;
  interestedAt: string;
  status: InterestStatus;
}

export interface MarketplaceTask {
  id: string; // taskId
  projectId: string;
  projectName: string;
  title: string;
  requiredSkills: string[];
  estimatedHours: number;
  agreedRatePerHour: number;
  agreedCurrency: "INR";
  /**
   * Typed pricing (preferred). When present, drives the contributor view
   * via `contributorViewFromTaskLike(...)`. The flat `agreedRatePerHour`
   * stays in sync for legacy callers.
   */
  pricing?: TaskPricing;
  status: "open" | "assigned";
  publishedAt: string;
  selectedContributorEmail?: string;
  interests: MarketplaceInterest[];
}

const RATE = 1200;

/**
 * Seed open opportunities so the marketplace demos without a publish step.
 * Mix hourly + fixed payout modes to cover both branches of `TaskPricing`.
 */
const SEED: MarketplaceTask[] = [
  {
    id: "t-market-dashboard-filter",
    projectId: "prj-reporting-v2",
    projectName: "Reporting V2",
    title: "Dashboard filter API",
    requiredSkills: ["TypeScript", "React"],
    estimatedHours: 12,
    agreedRatePerHour: RATE,
    agreedCurrency: "INR",
    pricing: buildTaskPricing({
      payoutMode: "hourly",
      hourlyRate: RATE,
      estimatedHours: 12,
    }),
    status: "open",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    interests: [],
  },
  {
    id: "t-market-onboarding-microsite",
    projectId: "prj-onboarding-microsite",
    projectName: "Onboarding microsite",
    title: "Landing hero + signup flow",
    requiredSkills: ["Next.js", "Tailwind"],
    estimatedHours: 18,
    // Fixed-price task — payout decoupled from hours.
    agreedRatePerHour: 0,
    agreedCurrency: "INR",
    pricing: buildTaskPricing({ payoutMode: "fixed", fixedAmount: 24000 }),
    status: "open",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    interests: [],
  },
];

export const marketplaceOverlay = createOverlayStore<MarketplaceTask>(
  "glimmora.mock.task-marketplace.v1",
);

export function listMarketTasks(): MarketplaceTask[] {
  return applyOverlay<MarketplaceTask>(SEED, marketplaceOverlay.read());
}

export function getMarketTask(taskId: string): MarketplaceTask | undefined {
  return listMarketTasks().find((t) => t.id === taskId);
}

export function publishTaskToMarket(input: {
  taskId: string;
  projectId: string;
  projectName: string;
  title: string;
  requiredSkills: string[];
  estimatedHours: number;
  agreedRatePerHour?: number;
}): MarketplaceTask {
  const existing = getMarketTask(input.taskId);
  if (existing && existing.status === "open") return existing;
  const row: MarketplaceTask = {
    id: input.taskId,
    projectId: input.projectId,
    projectName: input.projectName,
    title: input.title,
    requiredSkills: input.requiredSkills.length ? input.requiredSkills : ["TypeScript"],
    estimatedHours: input.estimatedHours,
    agreedRatePerHour: input.agreedRatePerHour ?? RATE,
    agreedCurrency: "INR",
    status: "open",
    publishedAt: new Date().toISOString(),
    interests: existing?.interests ?? [],
  };
  marketplaceOverlay.insert(input.taskId, row);
  return row;
}

/** Open opportunities a contributor can act on (open + not closed for them). */
export function listOpenForContributor(email: string | null | undefined): MarketplaceTask[] {
  if (!email) return [];
  const needle = email.toLowerCase();
  return listMarketTasks().filter((t) => {
    if (t.status !== "open") return false;
    const mine = t.interests.find((i) => i.contributorEmail.toLowerCase() === needle);
    // Hidden once they withdraw or are explicitly not selected.
    return !mine || mine.status === "interested";
  });
}

export function contributorInterest(
  taskId: string,
  email: string | null | undefined,
): MarketplaceInterest | null {
  if (!email) return null;
  const t = getMarketTask(taskId);
  if (!t) return null;
  const needle = email.toLowerCase();
  return t.interests.find((i) => i.contributorEmail.toLowerCase() === needle) ?? null;
}

export function expressInterest(
  taskId: string,
  contributor: { id: string; name: string; email: string },
): MarketplaceTask | undefined {
  const t = getMarketTask(taskId);
  if (!t || t.status !== "open") return t;
  const needle = contributor.email.toLowerCase();
  const interests = t.interests.filter(
    (i) => i.contributorEmail.toLowerCase() !== needle,
  );
  interests.push({
    contributorId: contributor.id,
    contributorName: contributor.name,
    contributorEmail: contributor.email,
    interestedAt: new Date().toISOString(),
    status: "interested",
  });
  const next = { ...t, interests };
  marketplaceOverlay.insert(taskId, next);
  return next;
}

export function withdrawInterest(
  taskId: string,
  email: string,
): MarketplaceTask | undefined {
  const t = getMarketTask(taskId);
  if (!t) return t;
  const needle = email.toLowerCase();
  const interests = t.interests.map((i) =>
    i.contributorEmail.toLowerCase() === needle ? { ...i, status: "withdrawn" as const } : i,
  );
  const next = { ...t, interests };
  marketplaceOverlay.insert(taskId, next);
  return next;
}

/** Interested candidates the enterprise can choose from. */
export function listInterested(taskId: string): MarketplaceInterest[] {
  const t = getMarketTask(taskId);
  if (!t) return [];
  return t.interests.filter((i) => i.status === "interested" || i.status === "selected");
}

/**
 * Enterprise selects ONE contributor. Marks them selected, all other
 * interested contributors not_selected, and closes the task (status assigned).
 * Returns the selected interest so the caller can create the real assignment.
 */
export function selectContributor(
  taskId: string,
  contributorEmail: string,
): MarketplaceInterest | undefined {
  const t = getMarketTask(taskId);
  if (!t) return undefined;
  const needle = contributorEmail.toLowerCase();
  let selected: MarketplaceInterest | undefined;
  const interests = t.interests.map((i) => {
    if (i.contributorEmail.toLowerCase() === needle) {
      selected = { ...i, status: "selected" as const };
      return selected;
    }
    if (i.status === "interested") return { ...i, status: "not_selected" as const };
    return i;
  });
  // Phase 5: freeze contributor payout at selection.
  const lockedAt = new Date().toISOString();
  const lockedPricing = t.pricing && t.pricing.lockedAt == null
    ? { ...t.pricing, lockedAt }
    : t.pricing;
  const next: MarketplaceTask = {
    ...t,
    interests,
    status: "assigned",
    selectedContributorEmail: contributorEmail,
    pricing: lockedPricing,
  };
  marketplaceOverlay.insert(taskId, next);
  return selected;
}

/**
 * Contributor declines an assignment they were selected for. Reopens the task
 * to the pool (status → open), marks the decliner withdrawn, restores the other
 * contributors to "interested" (they were only marked not_selected because of
 * the now-reversed pick), and un-freezes pricing. Without this, a declined
 * marketplace assignment strands the task forever.
 */
export function reopenMarketTaskAfterDecline(
  taskId: string,
  contributorEmail: string,
): void {
  const t = getMarketTask(taskId);
  if (!t) return;
  const needle = contributorEmail.toLowerCase();
  const interests = t.interests.map((i) => {
    if (i.contributorEmail.toLowerCase() === needle) {
      return { ...i, status: "withdrawn" as const };
    }
    if (i.status === "not_selected") return { ...i, status: "interested" as const };
    return i;
  });
  const next: MarketplaceTask = {
    ...t,
    interests,
    status: "open",
    selectedContributorEmail: undefined,
    pricing: t.pricing ? { ...t.pricing, lockedAt: null } : t.pricing,
  };
  marketplaceOverlay.insert(taskId, next);
}
