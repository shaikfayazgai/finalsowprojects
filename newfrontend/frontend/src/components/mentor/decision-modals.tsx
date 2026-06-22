"use client";

/**
 * Decision modals for the mentor cockpit — spec doc 03 §5.D.2–§5.D.6.
 *
 * Five flavors: Accept, Rework, Reject, Reassign, Withdraw (conflict).
 * Each renders a focused dialog with the consequences preview + a required
 * reasoning input. Mock — onConfirm just resolves with a payload.
 */

import * as React from "react";
import { AlertTriangle, Send } from "lucide-react";
import type { MockReview } from "@/mocks/mentor";
import { Modal } from "@/components/meridian/overlays";
import {
  ModalCancelButton,
  ModalPrimaryButton,
  ModalDangerButton,
  modalFieldLabelClass,
  modalInputClass,
  modalTextareaClass,
} from "@/components/meridian/overlays/modal-actions";
import { cn } from "@/lib/utils/cn";
import {
  QualityRatingPanel,
  MENTOR_RATING_DIMENSIONS,
  ratingComplete,
  overallRating,
  type RatingValues,
} from "@/components/delivery/quality-rating";

type Confidence = "confident" | "comfortable" | "tentative";

function DecisionShell({
  title,
  onClose,
  footer,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Modal open onClose={onClose} title={title} footer={footer} size={size}>
      <div className="space-y-4">{children}</div>
    </Modal>
  );
}

// ── Accept ──────────────────────────────────────────────────────────────

export function AcceptModal({
  review,
  rubricOverall,
  onClose,
  onConfirm,
}: {
  review: MockReview;
  rubricOverall: number;
  onClose: () => void;
  onConfirm: (payload: {
    confidence: Confidence;
    finalComment: string;
    ratings?: RatingValues;
    ratingOverall?: number;
  }) => void;
}) {
  const [confidence, setConfidence] = React.useState<Confidence>("confident");
  const [finalComment, setFinalComment] = React.useState("");
  const [ratings, setRatings] = React.useState<RatingValues>({});
  const [confirming, setConfirming] = React.useState(false);

  const ratingsDone = ratingComplete(MENTOR_RATING_DIMENSIONS, ratings);

  const submit = async () => {
    if (!ratingsDone) return;
    if (confidence === "tentative" && !confirm("Tentative accepts are flagged for governance review. Continue?")) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 350));
    onConfirm({
      confidence,
      finalComment: finalComment.trim(),
      ratings,
      ratingOverall: overallRating(MENTOR_RATING_DIMENSIONS, ratings),
    });
  };

  return (
    <DecisionShell title="Accept this submission?" onClose={onClose} footer={
      <>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={submit} loading={confirming} disabled={!ratingsDone}>
          {confirming ? "Submitting…" : "Confirm accept"}
        </ModalPrimaryButton>
      </>
    }>
      <dl className="rounded-md bg-bg-subtle px-3 py-2 space-y-1.5 border border-stroke-subtle">
        <Row k="Task" v={`${review.taskTitle} · Round ${review.round}`} />
        <Row k="Contributor" v={review.contributorName} />
        <Row k="Overall rubric" v={`${rubricOverall.toFixed(2)} / 5`} mono />
      </dl>
      {review.stage === "two_stage" && (
        <div className="rounded-md bg-brand-subtle/50 border border-brand/20 px-3 py-2">
          <p className="font-body text-[11.5px] font-semibold text-brand-subtle-text">Two-stage routing</p>
          <p className="mt-0.5 font-body text-[11.5px] text-brand-subtle-text">After your accept, this goes to the enterprise reviewer.</p>
        </div>
      )}
      <div>
        <p className={modalFieldLabelClass}>Consequences</p>
        <ul className="font-body text-[12px] text-text-secondary space-y-0.5 list-none">
          <li>✓ Mentor decision: Accept</li>
          {review.stage === "two_stage" ? (
            <>
              <li>→ Route to enterprise reviewer (two-stage)</li>
              <li>→ If they also accept, contributor's payout becomes eligible</li>
            </>
          ) : (
            <li>→ Contributor's payout becomes eligible immediately</li>
          )}
          <li>→ A credential will be issued</li>
        </ul>
      </div>
      <div>
        <p className={modalFieldLabelClass}>Reviewer confidence</p>
        <div className="flex items-center gap-4">
          {(["confident", "comfortable", "tentative"] as Confidence[]).map((c) => (
            <label key={c} className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
              <input type="radio" name="confidence" checked={confidence === c} onChange={() => setConfidence(c)} className="h-3.5 w-3.5 accent-brand" />
              <span className="capitalize">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <QualityRatingPanel
        title="Quality rating"
        dimensions={MENTOR_RATING_DIMENSIONS}
        values={ratings}
        onChange={setRatings}
        disabled={confirming}
      />
      <div>
        <label className={modalFieldLabelClass}>Final comment (optional, visible to contributor)</label>
        <textarea value={finalComment} onChange={(e) => setFinalComment(e.target.value)} rows={3} className={modalTextareaClass} placeholder="e.g. great mobile testing this round." />
      </div>
    </DecisionShell>
  );
}

// ── Rework ──────────────────────────────────────────────────────────────

export function ReworkModal({
  review,
  requiredCorrections,
  onClose,
  onConfirm,
}: {
  review: MockReview;
  requiredCorrections: Array<{ text: string; severity: "blocker" | "major" | "nit" }>;
  onClose: () => void;
  onConfirm: (payload: { slaHours: number; corrections: typeof requiredCorrections }) => void;
}) {
  const [slaHours, setSlaHours] = React.useState(48);
  const isFinalRound = review.round >= review.totalRounds;

  if (isFinalRound) {
    return (
      <DecisionShell title="Round limit reached" onClose={onClose} footer={
        <ModalCancelButton onClick={onClose}>Close</ModalCancelButton>
      }>
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-foreground">
            This is round {review.round} of {review.totalRounds}. The round limit is exhausted — the system requires you to use <span className="font-semibold">Final reject</span> instead of Rework. Open the Reject modal to proceed.
          </p>
        </div>
      </DecisionShell>
    );
  }

  return (
    <DecisionShell title="Request rework?" onClose={onClose} footer={
      <>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton
          onClick={() => onConfirm({ slaHours, corrections: requiredCorrections })}
          disabled={requiredCorrections.length === 0}
        >
          Send for rework
        </ModalPrimaryButton>
      </>
    }>
      <p className="font-body text-[12.5px] text-foreground">
        Round {review.round} of {review.totalRounds} ·
        {review.round === review.totalRounds - 1 ? " one more rework round will exhaust the limit." : " contributor will have another resubmission round."}
      </p>
      <p className="font-body text-[12px] text-text-secondary">
        You've written <span className="font-semibold tabular-nums">{requiredCorrections.length}</span> required corrections. Confirm they're specific enough for the contributor to act on.
      </p>
      {requiredCorrections.length === 0 ? (
        <p className="rounded-md bg-warning-subtle border border-warning-border px-3 py-2 font-body text-[11.5px] text-warning-text">
          Add at least one required correction in the feedback editor before requesting rework.
        </p>
      ) : (
        <ol className="rounded-md bg-bg-subtle border border-stroke-subtle px-3 py-2 list-decimal pl-7 space-y-1">
          {requiredCorrections.map((c, i) => (
            <li key={i} className="font-body text-[12px] text-foreground">
              {c.text}
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-warning-subtle text-warning-text font-body text-[10px] font-semibold capitalize">{c.severity}</span>
            </li>
          ))}
        </ol>
      )}
      <div>
        <label className={modalFieldLabelClass}>SLA for contributor to resubmit</label>
        <select value={slaHours} onChange={(e) => setSlaHours(Number(e.target.value))} className={modalInputClass + " max-w-[200px]"}>
          <option value={24}>24 hours</option>
          <option value={48}>48 hours</option>
          <option value={72}>72 hours</option>
        </select>
      </div>
    </DecisionShell>
  );
}

// ── Reject ──────────────────────────────────────────────────────────────

export function RejectModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (payload: { reason: string; category: string; offerCoaching: boolean }) => void;
}) {
  const [reason, setReason] = React.useState("");
  const [category, setCategory] = React.useState("doesnt_meet_criteria");
  const [offerCoaching, setOfferCoaching] = React.useState(false);

  const valid = reason.trim().length > 0;
  const isPlagiarism = category === "plagiarism";

  return (
    <DecisionShell title="Reject this submission?" onClose={onClose} footer={
      <>
        <ModalCancelButton onClick={onClose} />
        <ModalDangerButton
          onClick={() => onConfirm({ reason: reason.trim(), category, offerCoaching })}
          disabled={!valid}
        >
          Confirm reject
        </ModalDangerButton>
      </>
    }>
      <p className="font-body text-[12.5px] text-text-secondary">
        This is a strong action. The contributor can dispute the decision — a senior mentor will review.
      </p>
      <div>
        <label className={modalFieldLabelClass}>Reason * (visible to contributor + audit)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className={modalTextareaClass} />
      </div>
      <div>
        <p className={modalFieldLabelClass}>Category</p>
        <div className="space-y-1.5">
          {([
            { v: "doesnt_meet_criteria", l: "Doesn't meet criteria" },
            { v: "off_spec", l: "Off-spec" },
            { v: "quality_below", l: "Quality below threshold" },
            { v: "plagiarism", l: "Plagiarism / fraud (escalates immediately)" },
            { v: "other", l: "Other" },
          ]).map((opt) => (
            <label key={opt.v} className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer block">
              <input type="radio" name="reject-cat" checked={category === opt.v} onChange={() => setCategory(opt.v)} className="h-3.5 w-3.5 accent-brand" />
              {opt.l}
            </label>
          ))}
        </div>
      </div>
      {isPlagiarism && (
        <div className="rounded-md bg-error-subtle border border-error-border px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[11.5px] text-error-text">This will auto-escalate to a senior mentor and governance.</p>
        </div>
      )}
      <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
        <input type="checkbox" checked={offerCoaching} onChange={(e) => setOfferCoaching(e.target.checked)} className="h-3.5 w-3.5 accent-brand rounded-sm" />
        Offer a mentorship session to discuss
      </label>
    </DecisionShell>
  );
}

// ── Reassign ────────────────────────────────────────────────────────────

const REASSIGN_CANDIDATES = [
  { id: "mentor-amelia", name: "Amelia Stone", note: "20% load · Accessibility expert" },
  { id: "mentor-rajesh", name: "Rajesh Verma", note: "80% load · React focus" },
];

export function ReassignModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (payload: { mentorId: string; reasonCategory: string; reason: string }) => void;
}) {
  const [mentorId, setMentorId] = React.useState(REASSIGN_CANDIDATES[0].id);
  const [reasonCategory, setReasonCategory] = React.useState("capacity");
  const [reason, setReason] = React.useState("");
  const valid = reason.trim().length > 0;

  return (
    <DecisionShell title="Reassign this review" onClose={onClose} footer={
      <>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton
          onClick={() => onConfirm({ mentorId, reasonCategory, reason: reason.trim() })}
          disabled={!valid}
        >
          Reassign
        </ModalPrimaryButton>
      </>
    }>
      <p className="font-body text-[12px] text-text-secondary">Pool: <span className="font-semibold text-foreground">Helios review mentors</span></p>
      <div>
        <p className={modalFieldLabelClass}>Suggested (capacity, fit)</p>
        <div className="space-y-1.5">
          {REASSIGN_CANDIDATES.map((m) => (
            <label key={m.id} className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
              <input type="radio" name="reassign-to" checked={mentorId === m.id} onChange={() => setMentorId(m.id)} className="h-3.5 w-3.5 accent-brand" />
              <span className="font-semibold">{m.name}</span>
              <span className="text-text-tertiary">· {m.note}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className={modalFieldLabelClass}>Reason category</p>
        <div className="flex flex-wrap gap-1.5">
          {["capacity", "conflict", "expertise", "other"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReasonCategory(r)}
              className={cn(
                "inline-flex items-center h-7 px-3 rounded-full font-body text-[11.5px] font-semibold transition-colors duration-fast capitalize",
                reasonCategory === r ? "bg-brand text-on-brand shadow-xs" : "bg-surface border border-stroke text-foreground hover:bg-surface-hover",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={modalFieldLabelClass}>Reason * (audit + visible to next reviewer)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={modalTextareaClass} />
      </div>
    </DecisionShell>
  );
}

// ── Withdraw ───────────────────────────────────────────────────────────

export function WithdrawModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (payload: { type: string; note: string }) => void;
}) {
  const [type, setType] = React.useState("personal");
  const [note, setNote] = React.useState("");
  const valid = note.trim().length > 0;

  return (
    <DecisionShell title="Withdraw from this review" onClose={onClose} footer={
      <>
        <ModalCancelButton onClick={onClose} />
        <ModalDangerButton
          onClick={() => onConfirm({ type, note: note.trim() })}
          disabled={!valid}
        >
          Withdraw
        </ModalDangerButton>
      </>
    }>
      <p className="font-body text-[12.5px] text-text-secondary">
        Use this when you have a conflict of interest (you know the contributor outside Glimmora, you're related, etc.).
      </p>
      <div>
        <p className={modalFieldLabelClass}>Type</p>
        <div className="space-y-1.5">
          {([
            { v: "personal",          l: "Personal connection" },
            { v: "prior_employment",  l: "Prior employment / collaboration" },
            { v: "financial",         l: "Financial interest" },
            { v: "other",             l: "Other" },
          ]).map((opt) => (
            <label key={opt.v} className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer block">
              <input type="radio" name="withdraw-type" checked={type === opt.v} onChange={() => setType(opt.v)} className="h-3.5 w-3.5 accent-brand" />
              {opt.l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={modalFieldLabelClass}>Brief note * (governance only — not shown to contributor)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={modalTextareaClass} />
      </div>
      <p className="font-body text-[11.5px] text-text-tertiary">The review will be reassigned automatically.</p>
    </DecisionShell>
  );
}

// ── small helpers ───────────────────────────────────────────────────────

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-body text-[11.5px] text-text-tertiary">{k}</dt>
      <dd className={cn("font-body text-[12.5px] text-foreground", mono && "font-mono tabular-nums")}>{v}</dd>
    </div>
  );
}

// Re-export the kind for the cockpit
export type { Confidence };

// Re-export Send icon for callers that want to render the same submit affordance
export { Send };
