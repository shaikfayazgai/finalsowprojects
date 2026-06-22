/**
 * In-memory reviewer mock state — persists decisions within the dev server process.
 * API routes read/write here so queue + history stay in sync after submit.
 */

import {
  MOCK_REVIEWER_DECISIONS,
  MOCK_REVIEWER_ITEMS,
  type MockReviewerDecision,
  type MockReviewerItem,
  type ReviewerDecisionKind,
} from "@/mocks/reviewer";

type ReviewerMockState = {
  items: MockReviewerItem[];
  decisions: MockReviewerDecision[];
};

const globalKey = "__glimmoraReviewerMockState" as const;

function getState(): ReviewerMockState {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: ReviewerMockState;
  };
  if (!g[globalKey]) {
    g[globalKey] = {
      items: structuredClone(MOCK_REVIEWER_ITEMS),
      decisions: structuredClone(MOCK_REVIEWER_DECISIONS),
    };
  }
  return g[globalKey]!;
}

export function getReviewerOpenItems(): MockReviewerItem[] {
  return getState()
    .items.filter((r) => r.state === "open")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export function getReviewerItem(id: string): MockReviewerItem | undefined {
  return getState().items.find((r) => r.id === id);
}

export function getReviewerDecisions(): MockReviewerDecision[] {
  return [...getState().decisions].sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime(),
  );
}

export function submitReviewerDecision(
  reviewId: string,
  decision: ReviewerDecisionKind,
  comment?: string,
): MockReviewerDecision {
  const state = getState();
  const review = state.items.find((r) => r.id === reviewId);
  if (!review) {
    throw new Error("Review not found");
  }
  if (review.state !== "open") {
    throw new Error("Review already decided");
  }

  const stateMap: Record<ReviewerDecisionKind, MockReviewerItem["state"]> = {
    accept: "decided_accept",
    rework: "decided_rework",
    reject: "decided_reject",
  };
  review.state = stateMap[decision];

  const mentorRecommendedAccept = review.mentorOverall >= 4;
  const agreedWithMentor =
    decision === "accept"
      ? mentorRecommendedAccept
      : decision === "rework" || decision === "reject"
        ? mentorRecommendedAccept
        : true;

  const record: MockReviewerDecision = {
    id: `rdec-${Date.now()}`,
    reviewId: review.id,
    taskTitle: review.taskTitle,
    contributorName: review.contributorName,
    mentorName: review.mentorName,
    project: review.project,
    decision,
    agreedWithMentor: decision === "accept" ? agreedWithMentor : !mentorRecommendedAccept,
    decidedAt: new Date().toISOString(),
    comment: comment?.trim() || undefined,
  };

  state.decisions.unshift(record);
  return record;
}
