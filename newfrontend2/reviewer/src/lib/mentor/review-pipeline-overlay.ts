/**
 * Cross-portal review pipeline (mock). The contributor portal (client Zustand)
 * and the mentor portal (client-rendered) can't share server state, but in one
 * browser they share localStorage — so this overlay is the bridge for the live
 * hero-loop review handoff:
 *
 *   contributor submits  → record { status: "submitted" }   (contributor store)
 *   mentor decides        → patch  { status: "rework"|"accepted", comment }  (mentor queue)
 *   contributor applies   → mentorRespond(...) + record removed              (contributor store)
 *
 * Same `createOverlayStore` pattern as the SOW/projects overlays.
 */
import { createOverlayStore } from "@/lib/enterprise/mocks/overlay";

export type ReviewPipelineStatus = "submitted" | "rework" | "accepted";

export interface ReviewPipelineRecord {
  taskId: string; // contributor-portal task id (the shared key)
  title: string;
  contributorName: string;
  round: number;
  status: ReviewPipelineStatus;
  mentorName?: string;
  mentorComment?: string;
  submittedAt: string;
  decidedAt?: string;
}

export const reviewPipelineOverlay = createOverlayStore<ReviewPipelineRecord>(
  "glimmora.mock.reviewPipeline.v1",
);

export function submitToReviewPipeline(rec: {
  taskId: string;
  title: string;
  contributorName: string;
  round: number;
}): void {
  reviewPipelineOverlay.insert(rec.taskId, {
    ...rec,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });
}

export function decideReviewPipeline(
  taskId: string,
  decision: "approve" | "revise",
  mentorName: string,
  comment?: string,
): void {
  reviewPipelineOverlay.patch(taskId, {
    status: decision === "approve" ? "accepted" : "rework",
    mentorName,
    mentorComment: comment,
    decidedAt: new Date().toISOString(),
  });
}

/** Pending submissions awaiting a mentor decision (drives the mentor queue panel). */
export function listPendingReviewSubmissions(): ReviewPipelineRecord[] {
  const o = reviewPipelineOverlay.read();
  return Object.values(o)
    .filter(
      (r): r is ReviewPipelineRecord =>
        !!r && !(r as { __deletedAt?: string }).__deletedAt && r.status === "submitted",
    )
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

/** Decisions the contributor hasn't consumed yet. */
export function listDecidedReviews(): ReviewPipelineRecord[] {
  const o = reviewPipelineOverlay.read();
  return Object.values(o).filter(
    (r): r is ReviewPipelineRecord =>
      !!r &&
      !(r as { __deletedAt?: string }).__deletedAt &&
      (r.status === "rework" || r.status === "accepted"),
  );
}

export function clearReviewRecord(taskId: string): void {
  reviewPipelineOverlay.remove(taskId);
}
