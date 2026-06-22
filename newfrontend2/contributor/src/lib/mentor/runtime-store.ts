/**
 * Server-side mentor portal runtime — review decisions, drafts, profile
 * overlays, settings, and onboarding flags (dev / mock phase).
 */

import type { MockMentorDecision, MentorDecisionKind } from "@/mocks/mentor/decisions";
import type { MockReview, ReviewState } from "@/mocks/mentor/reviews";
import { MOCK_DECISIONS } from "@/mocks/mentor/decisions";
import { MOCK_REVIEWS, getMockReview } from "@/mocks/mentor/reviews";

const globalKey = "__glimmoraMentorRuntime" as const;

export interface ReviewDraftPayload {
  whatWorked?: string;
  corrections?: Array<{ text: string; severity: string }>;
  suggestions?: string[];
  coachingNote?: string;
  rubric?: Record<string, { stars: number; comment: string }>;
  savedAt: string;
}

export interface MentorProfileOverrides {
  bio?: string;
  mentorshipIntro?: string;
  languages?: string[];
  timezone?: string;
}

export interface MentorAvailabilitySettings {
  activeDays: Record<string, boolean>;
  from: string;
  to: string;
  timezone: string;
  capacity: number;
  oooEnabled: boolean;
  oooFrom: string;
  oooTo: string;
}

export interface MentorNotificationPrefs {
  rows: Array<{
    key: string;
    prefs: { inApp: boolean; email: boolean; sms: boolean };
  }>;
}

interface MentorRuntimeState {
  reviewPatches: Map<string, { state?: ReviewState; draft?: ReviewDraftPayload }>;
  decisions: MockMentorDecision[];
  profileByUser: Map<string, MentorProfileOverrides>;
  availabilityByUser: Map<string, MentorAvailabilitySettings>;
  notificationsByUser: Map<string, MentorNotificationPrefs>;
  onboardingComplete: Set<string>;
}

function store(): MentorRuntimeState {
  const g = globalThis as typeof globalThis & { [globalKey]?: MentorRuntimeState };
  if (!g[globalKey]) {
    g[globalKey] = {
      reviewPatches: new Map(),
      decisions: [],
      profileByUser: new Map(),
      availabilityByUser: new Map(),
      notificationsByUser: new Map(),
      onboardingComplete: new Set(),
    };
  }
  return g[globalKey]!;
}

export function mergeReview(review: MockReview): MockReview {
  const patch = store().reviewPatches.get(review.id);
  if (!patch) return review;
  return { ...review, ...(patch.state ? { state: patch.state } : {}) };
}

export function getRuntimeReview(id: string): MockReview | undefined {
  const base = getMockReview(id);
  if (!base) return undefined;
  return mergeReview(base);
}

export function listOpenReviews(): MockReview[] {
  return MOCK_REVIEWS.map((r) => mergeReview(r)).filter(
    (r) => r.state === "open" || r.state === "draft_saved",
  );
}

export function listAllDecisions(): MockMentorDecision[] {
  return [...MOCK_DECISIONS, ...store().decisions].sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime(),
  );
}

export function getRuntimeDecision(id: string): MockMentorDecision | undefined {
  return listAllDecisions().find((d) => d.id === id);
}

export function saveReviewDraft(reviewId: string, draft: ReviewDraftPayload): void {
  const s = store();
  const existing = s.reviewPatches.get(reviewId) ?? {};
  s.reviewPatches.set(reviewId, {
    ...existing,
    state: "draft_saved",
    draft,
  });
}

export function getReviewDraft(reviewId: string): ReviewDraftPayload | undefined {
  return store().reviewPatches.get(reviewId)?.draft;
}

export function recordReviewDecision(input: {
  reviewId: string;
  kind: MentorDecisionKind | "withdrawn" | "reassigned";
  reviewerConfidence?: MockMentorDecision["reviewerConfidence"];
  finalComment?: string;
  rejectReason?: string;
  rejectCategory?: MockMentorDecision["rejectCategory"];
  reworkCorrections?: string[];
  withdrawType?: MockMentorDecision["withdrawType"];
  rubricOverall?: number;
}): MockMentorDecision {
  const review = getRuntimeReview(input.reviewId);
  if (!review) throw new Error("Review not found");

  const stateMap: Record<string, ReviewState> = {
    accept: "decided_accept",
    rework: "decided_rework",
    reject: "decided_reject",
    withdrawn: "withdrawn",
    reassigned: "reassigned",
  };

  const s = store();
  s.reviewPatches.set(input.reviewId, {
    ...s.reviewPatches.get(input.reviewId),
    state: stateMap[input.kind] ?? "decided_accept",
  });

  const decision: MockMentorDecision = {
    id: `dec-${Date.now()}`,
    reviewId: review.id,
    taskTitle: review.taskTitle,
    contributorId: review.contributorId,
    contributorName: review.contributorName,
    project: review.project,
    round: review.round,
    totalRounds: review.totalRounds,
    decision: input.kind === "reassigned" ? "withdrawn" : input.kind,
    decidedAt: new Date().toISOString(),
    reviewerConfidence: input.reviewerConfidence ?? "confident",
    finalComment: input.finalComment,
    rejectReason: input.rejectReason,
    rejectCategory: input.rejectCategory,
    reworkCorrections: input.reworkCorrections,
    withdrawType: input.withdrawType,
    rubricOverall: input.rubricOverall,
    aiAlignment: "modified",
  };

  s.decisions.unshift(decision);
  return decision;
}

export function getProfileOverrides(userId: string): MentorProfileOverrides | undefined {
  return store().profileByUser.get(userId);
}

export function setProfileOverrides(userId: string, patch: MentorProfileOverrides): void {
  const s = store();
  s.profileByUser.set(userId, { ...s.profileByUser.get(userId), ...patch });
}

export function getAvailabilitySettings(userId: string): MentorAvailabilitySettings | undefined {
  return store().availabilityByUser.get(userId);
}

export function setAvailabilitySettings(userId: string, settings: MentorAvailabilitySettings): void {
  store().availabilityByUser.set(userId, settings);
}

export function getNotificationPrefs(userId: string): MentorNotificationPrefs | undefined {
  return store().notificationsByUser.get(userId);
}

export function setNotificationPrefs(userId: string, prefs: MentorNotificationPrefs): void {
  store().notificationsByUser.set(userId, prefs);
}

export function isOnboardingComplete(userId: string): boolean {
  return store().onboardingComplete.has(userId);
}

export function markOnboardingComplete(userId: string): void {
  store().onboardingComplete.add(userId);
}
