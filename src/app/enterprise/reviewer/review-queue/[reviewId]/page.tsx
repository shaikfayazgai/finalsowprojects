"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { reviewerApi, type ReviewerAssignment } from "@/lib/api/reviewer";
import { ApiError } from "@/lib/api/client";
import { Button, Input, Label } from "@/components/ui";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const reviewId = params.reviewId as string;

  const [row, setRow] = React.useState<ReviewerAssignment | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [score, setScore] = React.useState(85);
  const [comment, setComment] = React.useState("");
  const [rec, setRec] = React.useState<"ACCEPT" | "REWORK" | "">("");

  const load = React.useCallback(async () => {
    if (!token || !reviewId) return;
    setError(null);
    try {
      const items = await reviewerApi.listAssignments(token);
      const found = items.find((a) => a.id === reviewId) ?? null;
      setRow(found);
      if (!found) setError("Assignment not found. It may have been removed.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load assignment.");
    }
  }, [token, reviewId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const startReview = async () => {
    if (!token || !row) return;
    setBusy(true);
    setError(null);
    try {
      await reviewerApi.updateAssignmentStatus(token, row.id, "in_progress");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  const completeNonEvidence = async () => {
    if (!token || !row) return;
    setBusy(true);
    setError(null);
    try {
      await reviewerApi.updateAssignmentStatus(token, row.id, "completed");
      router.push("/enterprise/reviewer/review-queue");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not complete assignment.");
    } finally {
      setBusy(false);
    }
  };

  const submitEvidence = async () => {
    if (!token || !row?.relatedId) return;
    if (!comment.trim() || comment.trim().length < 4) {
      setError("Comment is required for evidence review.");
      return;
    }
    if (!rec) {
      setError("Select ACCEPT or REWORK.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reviewerApi.recommendEvidence(token, row.relatedId, {
        score,
        comment: comment.trim(),
        recommendation: rec,
      });
      router.push("/enterprise/reviewer/review-queue");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit recommendation.");
    } finally {
      setBusy(false);
    }
  };

  const isEvidence = row?.taskKind === "evidence_review" && !!row.relatedId;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/enterprise/reviewer/review-queue")}
          className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to review queue
        </button>
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">
          {row?.title ?? "Assignment"}
        </h1>
        {row && (
          <p className="text-[12px] text-gray-400 mt-1">
            {row.taskKind?.replace("_", " ")} · {row.status}
            {row.relatedId ? ` · evidence / ref: ${row.relatedId}` : ""}
          </p>
        )}
      </motion.div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {!row && !error && <p className="text-sm text-gray-500">Loading…</p>}

      {row && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div variants={fadeUp} className="card-parchment p-5 space-y-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Details</p>
            {row.notes && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-1">Notes</p>
                <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{row.notes}</p>
              </div>
            )}
            <p className="text-[12px] text-gray-500">
              Use the actions on the right to move this assignment forward. Evidence reviews must be completed with a formal recommendation (API requirement).
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="card-parchment p-5 space-y-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
            <div className="flex flex-wrap gap-2">
              {row.status === "pending" && (
                <Button type="button" variant="primary" disabled={busy} onClick={() => void startReview()}>
                  Mark in progress
                </Button>
              )}
              {!isEvidence && row.status !== "completed" && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => void completeNonEvidence()}>
                  Mark completed
                </Button>
              )}
            </div>

            {isEvidence && row.status !== "completed" && (
              <div className="space-y-3 border-t border-gray-100 pt-4 mt-2">
                <p className="text-[12px] font-medium text-gray-800">Evidence recommendation</p>
                <div>
                  <Label>Score (0–100)</Label>
                  <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label>Comment</Label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="mt-1 w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Explain your assessment for the audit trail."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant={rec === "ACCEPT" ? "primary" : "outline"} size="sm" onClick={() => setRec("ACCEPT")}>
                    Accept
                  </Button>
                  <Button type="button" variant={rec === "REWORK" ? "primary" : "outline"} size="sm" onClick={() => setRec("REWORK")}>
                    Rework
                  </Button>
                </div>
                <Button type="button" className="w-full" variant="gradient-primary" disabled={busy} onClick={() => void submitEvidence()}>
                  Submit recommendation
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
