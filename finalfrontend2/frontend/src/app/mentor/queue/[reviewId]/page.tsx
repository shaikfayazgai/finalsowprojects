"use client";

/**
 * Mentor review detail — spec doc 03 §5.D.1.
 *
 * Three zones:
 *   A — header (sticky)
 *   B — work pane: brief + evidence + criteria rubric + 3-block feedback + coaching note
 *   C — context rail: contributor twin + AI assist + prior feedback + references
 *
 * Sticky footer: Reassign / Withdraw / Save draft / Decide.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  Eye, Play, FileText as FileIcon,
  GitCompare, ChevronDown, ChevronRight,
  Sparkles, ExternalLink, Save,
  AlertTriangle, Info, X, Plus,
} from "lucide-react";
import type { MockReview, MockRubricCriterion, MockContributorDecision } from "@/mocks/mentor";
import { fetchRealMentorSubmission, decideRealSubmission, MentorQueueError } from "@/lib/api/mentor-queue-real";
import { saveMentorReviewDraft } from "@/lib/api/mentor";
import {
  AcceptModal, ReworkModal, RejectModal, ReassignModal, WithdrawModal,
} from "@/components/mentor/decision-modals";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { cn } from "@/lib/utils/cn";
import { MentorBackLink } from "@/app/mentor/_components/mentor-ui";

type Severity = "blocker" | "major" | "nit";
type DecisionKind = "accept" | "rework" | "reject" | null;

interface RubricRowState {
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  commentOpen: boolean;
}

interface Correction {
  text: string;
  severity: Severity;
}

const EVIDENCE_ICON: Record<string, typeof FileIcon> = {
  doc: FileIcon, text: FileIcon, image: FileIcon, video: Play,
};

function fmtSlaRemaining(iso: string): { text: string; tone: "danger" | "warn" | "ok" } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return { text: "Breached", tone: "danger" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const text = h > 0 ? `${h}h ${m}m` : `${m}m`;
  if (ms < 4 * 3_600_000) return { text, tone: "warn" };
  return { text, tone: "ok" };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MentorReviewDetailPage() {
  const router = useRouter();
  const params = useParams<{ reviewId: string }>();
  const reviewId = params?.reviewId ?? "";

  const [review, setReview] = React.useState<MockReview | null>(null);
  const [contributorDecisions, setContributorDecisions] = React.useState<MockContributorDecision[]>([]);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);
  const [notFoundFlag, setNotFoundFlag] = React.useState(false);

  React.useEffect(() => {
    if (!reviewId) return;
    const c = new AbortController();
    fetchRealMentorSubmission(reviewId, c.signal)
      .then((res) => {
        setReview(res.review);
        setContributorDecisions(res.contributorDecisions);
        const seed: Record<string, RubricRowState> = {};
        for (const cr of res.review.criteria) {
          const draftStars = res.draft?.rubric?.[cr.id]?.stars;
          seed[cr.id] = {
            stars: (draftStars ?? cr.aiSuggestion ?? 5) as RubricRowState["stars"],
            comment: res.draft?.rubric?.[cr.id]?.comment ?? "",
            commentOpen: false,
          };
        }
        setRubric(seed);
        if (res.draft?.whatWorked) setWhatWorked(res.draft.whatWorked);
        if (res.draft?.corrections?.length) {
          setCorrections(res.draft.corrections as Correction[]);
        }
        if (res.draft?.suggestions?.length) setSuggestions(res.draft.suggestions);
        if (res.draft?.coachingNote) setCoachingNote(res.draft.coachingNote);
        if (res.draft?.savedAt) setSavedAt(res.draft.savedAt);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof MentorQueueError && err.status === 404) setNotFoundFlag(true);
        else setLoadErr(err instanceof Error ? err.message : "Could not load review.");
      });
    return () => c.abort();
  }, [reviewId]);

  if (notFoundFlag) notFound();

  // Rubric state — seeded after fetch completes (above)
  const [rubric, setRubric] = React.useState<Record<string, RubricRowState>>({});

  // Feedback editor state
  const [whatWorked, setWhatWorked] = React.useState("");
  const [corrections, setCorrections] = React.useState<Correction[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (review?.priorFeedback?.optionalSuggestions) setSuggestions(review.priorFeedback.optionalSuggestions);
  }, [review]);
  const [coachingNote, setCoachingNote] = React.useState("");
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  // Decision modal selector
  const [decision, setDecision] = React.useState<DecisionKind>(null);
  const [showReassign, setShowReassign] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);

  // AI panel collapse on error (simulated always-on here)
  const [aiAvailable] = React.useState(true);

  if (loadErr) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <MentorBackLink href="/mentor/queue">Back to queue</MentorBackLink>
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 font-body text-[12.5px] text-error-text">{loadErr}</div>
      </div>
    );
  }
  if (!review) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="h-4 w-48 rounded bg-bg-subtle animate-pulse" />
        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-3">
          <div className="h-6 w-2/3 rounded bg-bg-subtle animate-pulse" />
          <div className="h-3 w-full rounded bg-bg-subtle animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-bg-subtle animate-pulse" />
        </div>
        <div className="rounded-lg border border-stroke bg-surface shadow-xs h-96 animate-pulse" />
      </div>
    );
  }

  const sla = fmtSlaRemaining(review.dueAt);
  const totalScore = Object.values(rubric).reduce((sum, r) => sum + r.stars, 0);
  const overallScore = review.criteria.length > 0 ? totalScore / review.criteria.length : 0;

  const setStars = (id: string, stars: RubricRowState["stars"]) =>
    setRubric((p) => ({ ...p, [id]: { ...p[id], stars } }));
  const toggleComment = (id: string) =>
    setRubric((p) => ({ ...p, [id]: { ...p[id], commentOpen: !p[id].commentOpen } }));
  const setComment = (id: string, comment: string) =>
    setRubric((p) => ({ ...p, [id]: { ...p[id], comment } }));

  const onSaveDraft = async () => {
    if (!review) return;
    try {
      await saveMentorReviewDraft(review.id, {
        whatWorked,
        corrections,
        suggestions,
        coachingNote,
        rubric: Object.fromEntries(
          Object.entries(rubric).map(([id, row]) => [id, { stars: row.stars, comment: row.comment }]),
        ),
        savedAt: new Date().toISOString(),
      });
      setSavedAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }));
    } catch {
      setSavedAt(null);
    }
  };

  const onConfirmDecision = async (payload: object) => {
    if (!review) return;
    const p = payload as Record<string, unknown>;
    // Real backend accepts: accept | rework | escalate (no "reject" — map to escalate)
    const beDecision: "accept" | "rework" | "escalate" =
      decision === "accept" ? "accept" :
      decision === "rework" ? "rework" :
      "escalate";
    const comments =
      typeof p.finalComment === "string"
        ? p.finalComment
        : typeof p.reason === "string"
          ? p.reason
          : undefined;
    try {
      await decideRealSubmission(review.id, {
        decision: beDecision,
        score: typeof overallScore === "number" ? Math.round(overallScore * 20) : undefined,
        comments,
      });
      setDecision(null);
      router.push(`/mentor/queue?refresh=${Date.now()}`);
    } catch {
      setDecision(null);
    }
  };
  const onConfirmReassign = async () => {
    // No reassign endpoint on real backend — navigate away optimistically.
    setShowReassign(false);
    router.push(`/mentor/queue?refresh=${Date.now()}`);
  };
  const onConfirmWithdraw = async (_payload: { type: string; note: string }) => {
    // No withdraw endpoint on real backend — navigate away optimistically.
    setShowWithdraw(false);
    router.push(`/mentor/queue?refresh=${Date.now()}`);
  };

  return (
    <div className="space-y-5 pb-32 animate-fade-in">
      <MentorBackLink href="/mentor/queue">Back to queue</MentorBackLink>

      {/* A. Header — sticky */}
      <div className="sticky top-0 -mx-5 sm:-mx-6 lg:-mx-10 px-5 sm:px-6 lg:px-10 pt-2 pb-3 bg-surface/95 backdrop-blur z-10 border-b border-stroke-subtle">
        <header>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Review · Round {review.round} of {review.totalRounds}
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {review.taskTitle}
          </h1>
          <p className="mt-1 font-body text-[12px] text-text-secondary inline-flex items-center gap-2 flex-wrap">
            <span className="capitalize">{review.stage.replace("_", "-")}</span>
            <span aria-hidden className="opacity-50">·</span>
            <span>{review.project}</span>
            <span aria-hidden className="opacity-50">·</span>
            <span>{review.contributorName}</span>
            <span aria-hidden className="opacity-50">·</span>
            <StatusChip
              status={sla.tone === "danger" ? "error" : sla.tone === "warn" ? "warning" : "success"}
              size="sm"
            >
              SLA: {sla.text}
            </StatusChip>
          </p>
          {review.flag === "continuity" && (
            <p className="mt-1.5 font-body text-[11.5px] text-brand-subtle-text">
              ◉ You reviewed v1 (continuity) · <button type="button" className="underline">Switch reviewer?</button>
            </p>
          )}
          {review.flag === "fresh" && (
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              You've never reviewed this contributor — fresh reviewer banner.
            </p>
          )}
          {review.flag === "recent_paired" && (
            <p className="mt-1.5 font-body text-[11.5px] text-warning-text">
              ⚠ You've reviewed this contributor 4+ of the last 5 times — soft caution.
            </p>
          )}
        </header>
      </div>

      {/* B + C: split */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        {/* Work pane */}
        <div className="space-y-4 min-w-0">
          {/* Brief */}
          <Card title="Brief">
            <p className="font-body text-[12.5px] text-foreground leading-relaxed whitespace-pre-wrap">
              {review.brief}
            </p>
          </Card>

          {/* Evidence */}
          <Card title={`Evidence (${review.evidence.length} files)`} right={
            <Link href={`/mentor/queue/${review.id}/diff`} className="inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-text-link hover:underline">
              <GitCompare className="h-3 w-3" strokeWidth={2} aria-hidden /> Compare v1 ↔ v2
            </Link>
          }>
            <ul className="divide-y divide-stroke-subtle">
              {review.evidence.map((e) => {
                const Icon = EVIDENCE_ICON[e.kind] ?? FileIcon;
                return (
                  <li key={e.id} className="flex items-center gap-3 px-1 py-2">
                    <Icon className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                    <span className="font-body text-[12.5px] text-foreground truncate flex-1 min-w-0">{e.name}</span>
                    <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                      {(e.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                    <button type="button" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[11.5px] font-semibold text-foreground hover:bg-surface-hover">
                      <Eye className="h-3 w-3" strokeWidth={2} aria-hidden />
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Criteria rubric */}
          <Card title="Acceptance criteria · Rubric" right={
            <p className="font-body text-[11.5px] text-text-tertiary">
              Overall: <span className="font-mono font-semibold text-foreground tabular-nums">{overallScore.toFixed(2)}</span> / 5
            </p>
          }>
            <ul className="divide-y divide-stroke-subtle">
              {review.criteria.map((c) => (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <RubricRow
                    criterion={c}
                    state={rubric[c.id]}
                    onStars={(s) => setStars(c.id, s)}
                    onToggleComment={() => toggleComment(c.id)}
                    onCommentChange={(t) => setComment(c.id, t)}
                  />
                </li>
              ))}
            </ul>
          </Card>

          {/* Feedback editor */}
          <Card title="Feedback (3-block)">
            <FeedbackBlock label="What worked" count={whatWorked.trim() ? 1 : 0}>
              <div className="flex items-center gap-2 mb-2">
                <select className="h-7 px-2 rounded-md bg-surface border border-stroke font-body text-[11px] text-foreground">
                  <option>Templates ▾</option>
                  <option>Strong accessibility</option>
                  <option>Clear evidence</option>
                </select>
                <button type="button" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[11px] font-semibold text-foreground hover:bg-surface-hover">
                  <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                  Generate w/ AI
                </button>
              </div>
              <textarea
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                placeholder="What this contributor did well — be specific."
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 resize-y"
              />
            </FeedbackBlock>

            <FeedbackBlock label="Required corrections" count={corrections.length}>
              {corrections.length === 0 ? (
                <p className="font-body text-[12px] text-text-tertiary italic mb-2">No corrections required at this version.</p>
              ) : (
                <ul className="space-y-2 mb-2">
                  {corrections.map((c, i) => (
                    <li key={i} className="rounded-md border border-stroke-subtle bg-bg-subtle/50 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded font-body text-[10px] font-semibold capitalize shrink-0",
                          c.severity === "blocker" ? "bg-error-subtle text-error-text" :
                          c.severity === "major"   ? "bg-warning-subtle text-warning-text" :
                                                     "bg-bg-subtle text-text-secondary",
                        )}>{c.severity}</span>
                        <p className="font-body text-[12.5px] text-foreground flex-1 min-w-0">{c.text}</p>
                        <button
                          type="button"
                          onClick={() => setCorrections((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label="Remove correction"
                          className="text-text-tertiary hover:text-error-text"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <CorrectionAdder onAdd={(c) => setCorrections((p) => [...p, c])} />
            </FeedbackBlock>

            <FeedbackBlock label="Optional suggestions" count={suggestions.length}>
              {suggestions.length > 0 && (
                <ol className="space-y-1 list-decimal pl-5 mb-2">
                  {suggestions.map((s, i) => (
                    <li key={i} className="font-body text-[12.5px] text-foreground">
                      {s}
                      <button
                        type="button"
                        onClick={() => setSuggestions((p) => p.filter((_, idx) => idx !== i))}
                        className="ml-2 font-body text-[10.5px] text-text-tertiary hover:text-error-text"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <SuggestionAdder onAdd={(s) => setSuggestions((p) => [...p, s])} />
            </FeedbackBlock>
          </Card>

          {/* Coaching note */}
          <Card title="Coaching note (for mentorship)">
            <textarea
              value={coachingNote}
              onChange={(e) => setCoachingNote(e.target.value)}
              placeholder="A short note for the contributor's next mentorship session…"
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 resize-y"
            />
            <p className="mt-1 font-body text-[11px] text-text-tertiary">
              Saved with the next decision · visible to the contributor in their profile.
            </p>
          </Card>
        </div>

        {/* Context rail */}
        <aside className="space-y-4">
          <ContributorPanel review={review} decisions={contributorDecisions} />
          <AiAssistPanel review={review} available={aiAvailable} />
          {review.priorFeedback && <PriorFeedbackPanel review={review} />}
          {review.references.length > 0 && <ReferencesPanel review={review} />}
        </aside>
      </div>

      {/* Footer (sticky) */}
      <footer className="fixed bottom-0 left-0 lg:left-[256px] right-0 z-sticky bg-surface/95 backdrop-blur border-t border-stroke-subtle px-5 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReassign(true)}
            className="inline-flex items-center h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            Reassign
          </button>
          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            className="inline-flex items-center h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            Withdraw (conflict)
          </button>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && <span className="font-body text-[11px] text-text-tertiary">Draft saved {savedAt}</span>}
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Save draft
          </button>
          <DecideMenu onChoose={(k) => setDecision(k)} />
        </div>
      </footer>

      {/* Modals */}
      {decision === "accept" && (
        <AcceptModal review={review} rubricOverall={overallScore} onClose={() => setDecision(null)} onConfirm={onConfirmDecision} />
      )}
      {decision === "rework" && (
        <ReworkModal review={review} requiredCorrections={corrections} onClose={() => setDecision(null)} onConfirm={onConfirmDecision} />
      )}
      {decision === "reject" && (
        <RejectModal onClose={() => setDecision(null)} onConfirm={onConfirmDecision} />
      )}
      {showReassign && <ReassignModal onClose={() => setShowReassign(false)} onConfirm={onConfirmReassign} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} onConfirm={onConfirmWithdraw} />}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <DashboardSection title={title} actions={right}>
      {children}
    </DashboardSection>
  );
}

function RubricRow({
  criterion,
  state,
  onStars,
  onToggleComment,
  onCommentChange,
}: {
  criterion: MockRubricCriterion;
  state: RubricRowState;
  onStars: (s: RubricRowState["stars"]) => void;
  onToggleComment: () => void;
  onCommentChange: (t: string) => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 flex-wrap">
        <span aria-hidden className="text-success-text mt-0.5">✓</span>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[13px] font-medium text-foreground">{criterion.label}</p>
          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
            <StarInput value={state.stars} onChange={onStars} ariaLabel={`Rating for ${criterion.label}`} />
            <button
              type="button"
              onClick={onToggleComment}
              className="inline-flex items-center gap-1 font-body text-[11px] font-medium text-text-link hover:underline"
            >
              {state.commentOpen ? <ChevronDown className="h-3 w-3" strokeWidth={2} aria-hidden /> : <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />}
              Comment
            </button>
          </div>
          {state.commentOpen && (
            <textarea
              value={state.comment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={2}
              placeholder="Add a comment on this criterion (optional)…"
              className="mt-2 w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[12px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 resize-y"
            />
          )}
          {criterion.isCoverageGap ? (
            <p className="mt-1.5 font-body text-[11px] text-text-tertiary italic">
              AI suggest: not auto-checked · manual review required
            </p>
          ) : criterion.aiSuggestion !== null ? (
            <p className="mt-1.5 font-body text-[11px] text-text-tertiary">
              AI suggest: {"⭐".repeat(criterion.aiSuggestion)}
              {criterion.aiConfidence !== null && (
                <span> · <span className="font-mono tabular-nums">{Math.round((criterion.aiConfidence ?? 0) * 100)}%</span> conf</span>
              )}
              {state.stars !== criterion.aiSuggestion && (
                <span className="ml-1.5 text-warning-text">(you set {state.stars})</span>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StarInput({ value, onChange, ariaLabel }: { value: number; onChange: (n: 1 | 2 | 3 | 4 | 5) => void; ariaLabel: string }) {
  return (
    <div className="inline-flex items-center gap-0.5" role="slider" aria-valuemin={1} aria-valuemax={5} aria-valuenow={value} aria-label={ariaLabel} tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          if (value > 1) onChange((value - 1) as 1 | 2 | 3 | 4 | 5);
        }
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          if (value < 5) onChange((value + 1) as 1 | 2 | 3 | 4 | 5);
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i as 1 | 2 | 3 | 4 | 5)}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          className={cn(
            "h-5 w-5 inline-flex items-center justify-center text-[14px] leading-none transition-colors",
            i <= value ? "text-warning-text" : "text-text-disabled hover:text-text-tertiary",
          )}
        >
          {i <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

function FeedbackBlock({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 border-b border-stroke-subtle last:border-b-0">
      <p className="font-body text-[12px] font-semibold text-foreground mb-2 inline-flex items-center gap-1.5">
        <ChevronDown className="h-3 w-3 text-text-tertiary" strokeWidth={2} aria-hidden />
        {label} <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">({count})</span>
      </p>
      {children}
    </div>
  );
}

function CorrectionAdder({ onAdd }: { onAdd: (c: Correction) => void }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("major");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-dashed border-stroke text-text-tertiary hover:text-foreground hover:border-stroke-strong font-body text-[11.5px] font-semibold">
        <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> Add a correction
      </button>
    );
  }
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/50 px-3 py-2 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Required correction (specific, actionable)…"
        className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 resize-y"
        autoFocus
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mr-1">Severity</span>
        {(["blocker", "major", "nit"] as Severity[]).map((s) => (
          <label key={s} className="inline-flex items-center gap-1 font-body text-[11.5px] text-foreground cursor-pointer">
            <input type="radio" name="severity" checked={severity === s} onChange={() => setSeverity(s)} className="h-3 w-3 accent-brand" />
            <span className="capitalize">{s}</span>
          </label>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => { setOpen(false); setText(""); }} className="inline-flex items-center h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[11.5px] font-semibold text-foreground hover:bg-surface-hover">Cancel</button>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => { onAdd({ text: text.trim(), severity }); setText(""); setSeverity("major"); setOpen(false); }}
            className="inline-flex items-center h-7 px-2.5 rounded-md bg-brand text-on-brand shadow-xs font-body text-[11.5px] font-semibold hover:bg-brand-hover disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestionAdder({ onAdd }: { onAdd: (s: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-dashed border-stroke text-text-tertiary hover:text-foreground hover:border-stroke-strong font-body text-[11.5px] font-semibold">
        <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> Add a suggestion
      </button>
    );
  }
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/50 px-3 py-2 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Optional suggestion (nice-to-have, not required)…"
        className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 resize-y"
        autoFocus
      />
      <div className="flex items-center gap-2 ml-auto justify-end">
        <button type="button" onClick={() => { setOpen(false); setText(""); }} className="inline-flex items-center h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[11.5px] font-semibold text-foreground hover:bg-surface-hover">Cancel</button>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => { onAdd(text.trim()); setText(""); setOpen(false); }}
          className="inline-flex items-center h-7 px-2.5 rounded-md bg-brand text-on-brand shadow-xs font-body text-[11.5px] font-semibold hover:bg-brand-hover disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function DecideMenu({ onChoose }: { onChoose: (k: "accept" | "rework" | "reject") => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand text-on-brand shadow-xs font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
        aria-expanded={open}
      >
        Decide
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <ul className="absolute right-0 bottom-full mb-1.5 w-44 rounded-md border border-stroke bg-surface shadow-md py-1 z-modal">
          <li>
            <button type="button" onClick={() => { setOpen(false); onChoose("accept"); }} className="w-full text-left px-3 py-1.5 font-body text-[12.5px] text-foreground hover:bg-bg-subtle">Accept</button>
          </li>
          <li>
            <button type="button" onClick={() => { setOpen(false); onChoose("rework"); }} className="w-full text-left px-3 py-1.5 font-body text-[12.5px] text-foreground hover:bg-bg-subtle">Request rework</button>
          </li>
          <li>
            <button type="button" onClick={() => { setOpen(false); onChoose("reject"); }} className="w-full text-left px-3 py-1.5 font-body text-[12.5px] text-error-text hover:bg-error-subtle">Reject</button>
          </li>
        </ul>
      )}
    </div>
  );
}

function ContributorPanel({ review, decisions }: { review: MockReview; decisions: MockContributorDecision[] }) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <header className="px-4 py-2.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">Contributor · {review.contributorName}</h2>
      </header>
      <div className="p-4 space-y-3">
        <p className="font-body text-[12px] text-text-secondary">
          {review.contributorTrack && (
            <span className="capitalize inline-flex items-center px-1.5 py-0.5 rounded-full bg-bg-subtle font-body text-[10.5px] font-semibold text-text-secondary mr-1.5">{review.contributorTrack.replace("_", " ")}</span>
          )}
          Designer · L3 · India
        </p>
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Skills</p>
          <p className="mt-0.5 font-body text-[12px] text-foreground">{review.skills.join(" · ")} <span className="font-mono text-[11px] text-text-tertiary tabular-nums">({review.skills.length})</span></p>
        </div>
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Reliability</p>
          <ul className="mt-0.5 space-y-0.5 font-body text-[12px] text-foreground">
            <li>Tasks completed: <span className="font-mono tabular-nums">14</span></li>
            <li>Acceptance rate: <span className="font-mono tabular-nums">92%</span></li>
            <li>First-try: <span className="font-mono tabular-nums">71%</span></li>
            <li>On-time: <span className="font-mono tabular-nums">89%</span></li>
          </ul>
        </div>
        {decisions.length > 0 && (
          <div>
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Last {decisions.length} decisions</p>
            <ul className="mt-0.5 space-y-0.5 font-body text-[11.5px] text-text-secondary">
              {decisions.map((d, i) => (
                <li key={i}>
                  <span className="text-foreground">
                    {d.decision === "accept" ? "✓" : d.decision === "rework" ? "⟲" : "✗"}
                  </span>{" "}
                  {d.taskTitle} · <span className="capitalize">{d.decision}</span> {fmtDate(d.decidedAt)}
                  {d.yours && <span className="ml-1 text-text-tertiary">(yours)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Mentor watch</p>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary italic">None active</p>
        </div>
      </div>
    </section>
  );
}

function AiAssistPanel({ review, available }: { review: MockReview; available: boolean }) {
  if (!available) {
    return (
      <section className="rounded-xl border border-stroke-subtle bg-surface px-4 py-3">
        <p className="font-body text-[12px] text-text-tertiary italic">AI assist unavailable — review still possible.</p>
      </section>
    );
  }
  const sources = Array.from(new Set(review.criteria.map((c) => c.aiSource).filter(Boolean))).slice(0, 4);
  const coverageGaps = review.criteria.filter((c) => c.isCoverageGap);
  return (
    <section className="rounded-lg border border-stroke bg-surface shadow-xs" aria-live="polite">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-stroke-subtle">
        <Sparkles className="h-3.5 w-3.5 text-brand-subtle-text" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">AI assist</h2>
      </header>
      <div className="p-4 space-y-3">
        <p className="font-body text-[12px] text-foreground">
          Suggested rubric below.
          <br />
          <span className="font-mono tabular-nums font-semibold">{Math.round(review.aiOverallConfidence * 100)}%</span> overall confidence
        </p>
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Source signals</p>
          <ul className="mt-1 space-y-0.5 font-body text-[11.5px] text-text-secondary list-none">
            {sources.map((s, i) => <li key={i}>– {s}</li>)}
          </ul>
        </div>
        {coverageGaps.length > 0 && (
          <div>
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Coverage gaps (manual review)</p>
            <ul className="mt-1 space-y-0.5 font-body text-[11.5px] text-text-secondary list-none">
              {coverageGaps.map((c) => <li key={c.id}>– {c.label}</li>)}
            </ul>
          </div>
        )}
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Risk flags</p>
          <p className="mt-1 font-body text-[12px] text-foreground">{review.riskFlags.length === 0 ? "None" : review.riskFlags.join(", ")}</p>
        </div>
        <p className="font-body text-[11px] text-text-tertiary inline-flex items-center gap-1">
          <Info className="h-3 w-3" strokeWidth={2} aria-hidden /> Override delta logged
        </p>
      </div>
    </section>
  );
}

function PriorFeedbackPanel({ review }: { review: MockReview }) {
  const pf = review.priorFeedback!;
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <header className="px-4 py-2.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">Prior feedback (Round {review.round - 1})</h2>
      </header>
      <div className="p-4">
        <p className="font-body text-[11.5px] font-semibold text-foreground mb-1">You wrote:</p>
        <ul className="space-y-1 font-body text-[12px] text-text-secondary">
          {pf.requiredCorrections.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className={cn("text-[12px] mt-0.5", c.addressed ? "text-success-text" : "text-text-tertiary")}>
                {c.addressed ? "✓" : "○"}
              </span>
              <span className="flex-1 min-w-0">"{c.text}"</span>
            </li>
          ))}
        </ul>
        {pf.requiredCorrections.every((c) => c.addressed) && (
          <p className="mt-2 font-body text-[11.5px] text-success-text">Addressed status: ✓ all</p>
        )}
      </div>
    </section>
  );
}

function ReferencesPanel({ review }: { review: MockReview }) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <header className="px-4 py-2.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">References</h2>
      </header>
      <ul className="px-4 py-3 space-y-1.5">
        {review.references.map((r, i) => (
          <li key={i}>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-link hover:underline">
              {r.label}
              <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
