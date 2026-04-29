"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, CheckCircle2, RotateCcw, AlertCircle,
  Hourglass, Send, Eye, ClipboardList, Paperclip, ShieldCheck,
  RefreshCw, Loader2, Hash, Calendar, Tag, Save, Pencil, X, Upload,
  Star, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  fetchSubmission, patchSubmission, resubmitSubmission, fetchReviewFeedback,
  type SubmissionDetail, type SubmissionFile,
  type SubmissionEvidence, type ChecklistAcknowledgement,
  type PatchChecklistAck, type ReviewFeedback,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/stores/toast-store";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500" },
  gold:   { bg: "bg-gold-50",   text: "text-gold-700",   dot: "bg-gold-500" },
  brown:  { bg: "bg-brown-50",  text: "text-brown-700",  dot: "bg-brown-500" },
  beige:  { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400" },
  danger: { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Status config ═══ */

const statusConfig: Record<string, { variant: string; label: string; icon: React.ElementType }> = {
  accepted:       { variant: "forest", label: "Accepted",       icon: CheckCircle2 },
  rework:         { variant: "gold",   label: "Rework",         icon: RotateCcw    },
  needs_revision: { variant: "gold",   label: "Needs Revision", icon: RotateCcw    },
  rejected:       { variant: "danger", label: "Rejected",       icon: AlertCircle  },
  pending:        { variant: "teal",   label: "Pending Review", icon: Hourglass    },
  draft:          { variant: "beige",  label: "Draft",          icon: FileText     },
  submitted:      { variant: "teal",   label: "Submitted",      icon: Send         },
  in_review:      { variant: "gold",   label: "In Review",      icon: Eye          },
  under_review:   { variant: "gold",   label: "Under Review",   icon: Eye          },
};

/* ═══ Helpers ═══ */

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function mimeIcon(mimeType: string | null | undefined): string {
  if (!mimeType) return "📎";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "🗜️";
  if (mimeType.includes("video")) return "🎬";
  if (mimeType.includes("audio")) return "🎵";
  return "📎";
}

/* ═══ Skeleton ═══ */

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[100, 75, 90, 55, 80].map((w, i) => (
        <div key={i} className="h-3 rounded bg-gray-200" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/* ═══ Section card ═══ */

function Section({
  icon: Icon, title, count, children,
}: {
  icon: React.ElementType; title: string; count?: number; children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp} className="card-parchment mb-5">
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        {count !== undefined && (
          <span className="text-[11px] text-gray-400">{count} item{count !== 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </motion.div>
  );
}

/* ═══ PAGE ═══ */

export default function SubmissionDetailPage() {
  const params        = useParams();
  const submissionId  = params.submissionId as string;
  const { data: session, status: sessionStatus } = useSession();

  const [detail, setDetail]   = React.useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);

  /* ── Edit state ── */
  const [editOpen, setEditOpen]     = React.useState(false);
  const [editNotes, setEditNotes]   = React.useState("");
  const [editAcks, setEditAcks]     = React.useState<PatchChecklistAck[]>([]);
  const [saving, setSaving]         = React.useState(false);
  const [saveError, setSaveError]   = React.useState<string | null>(null);

  /* ── Resubmit state ── */
  const [resubmitOpen, setResubmitOpen]     = React.useState(false);
  const [resubmitNotes, setResubmitNotes]   = React.useState("");
  const [resubmitting, setResubmitting]     = React.useState(false);
  const [resubmitError, setResubmitError]   = React.useState<string | null>(null);

  /* ── Review feedback state ── */
  const [feedback, setFeedback]             = React.useState<ReviewFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = React.useState(false);
  const [feedbackError, setFeedbackError]   = React.useState<string | null>(null);

  const RESUBMITTABLE = ["rework", "needs_revision", "rejected"];
  const canResubmit   = detail ? RESUBMITTABLE.includes(detail.status) : false;

  /* Stable token ref */
  const tokenRef = React.useRef<string | null>(null);
  tokenRef.current = getContributorAccessToken(session);

  /* Open edit panel — seed form with current values */
  function openEdit() {
    if (!detail) return;
    setEditNotes(detail.notes ?? "");
    setEditAcks(
      (detail.checklist_acknowledgements ?? []).map((a) => ({
        criterion_id: a.criteria_id ?? "",
        acknowledged: a.acknowledged,
        notes: "",
      })),
    );
    setSaveError(null);
    setEditOpen(true);
  }

  /* Manual refresh */
  const load = React.useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSubmission(token, submissionId);
      setDetail(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load submission.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  /* Save PATCH */
  async function handleSave() {
    const token = tokenRef.current;
    if (!token || !detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await patchSubmission(token, submissionId, {
        notes: editNotes,
        checklist_acknowledgements: editAcks,
      });
      setDetail(updated);
      setEditOpen(false);
      toast.success("Submission updated successfully.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save changes.";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  /* Resubmit handler */
  async function handleResubmit() {
    const token = tokenRef.current;
    if (!token || !detail) return;
    setResubmitting(true);
    setResubmitError(null);
    try {
      const updated = await resubmitSubmission(token, submissionId, {
        notes: resubmitNotes.trim() || undefined,
      });
      setDetail(updated);
      setResubmitOpen(false);
      toast.success("Submission resubmitted successfully.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to resubmit.";
      setResubmitError(msg);
      toast.error(msg);
    } finally {
      setResubmitting(false);
    }
  }

  /* Auto-load with cancelled-flag pattern */
  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      setError("Not authenticated.");
      return;
    }
    const token = getContributorAccessToken(session);

    setLoading(true);
    setError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:submission-detail:${submissionId}:${sk}`, () =>
      fetchSubmission(token, submissionId),
    )
      .then((res) => {
        if (!live) return;
        setDetail(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setError(err instanceof ApiError ? err.message : "Failed to load submission.");
        setLoading(false);
      });

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session, submissionId]);

  /* Fetch review feedback once we know the task_id */
  React.useEffect(() => {
    const token  = tokenRef.current;
    const taskId = detail?.task_id;
    if (!token || !taskId) return;

    setFeedbackLoading(true);
    setFeedbackError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:submission-feedback:${submissionId}:${taskId}:${sk}`, () =>
      fetchReviewFeedback(token, taskId),
    )
      .then((fb) => {
        if (!live) return;
        setFeedback(fb);
        setFeedbackLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        if (err instanceof ApiError && err.status === 404) {
          setFeedback(null);
        } else {
          setFeedbackError(err instanceof ApiError ? err.message : "Failed to load review feedback.");
        }
        setFeedbackLoading(false);
      });

    return () => {
      live = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.task_id]);

  const status     = detail ? (statusConfig[detail.status] || statusConfig.pending) : null;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ BACK + HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <Link
          href="/contributor/tasks/submissions"
          className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Submissions
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight leading-tight">
              Submission Detail
            </h1>
            <p className="text-[12px] text-gray-400 mt-0.5 font-mono">{submissionId}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Resubmit button — only when status allows it */}
            {!loading && !error && canResubmit && (
              <button
                onClick={() => { setResubmitNotes(detail?.notes ?? ""); setResubmitError(null); setResubmitOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white bg-teal-600 hover:bg-teal-700 transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> Resubmit
              </button>
            )}
            {/* Edit button */}
            {!loading && !error && detail && (
              <button
                onClick={openEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {/* Refresh */}
            {tokenRef.current && (
              <button
                onClick={() => tokenRef.current && load(tokenRef.current)}
                disabled={loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40"
                title="Refresh"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ LOADING ═══ */}
      {loading && (
        <motion.div variants={fadeUp} className="card-parchment px-6 py-8">
          <DetailSkeleton />
        </motion.div>
      )}

      {/* ═══ ERROR ═══ */}
      {!loading && error && (
        <motion.div variants={fadeUp} className="card-parchment px-6 py-14 text-center">
          <AlertCircle className="w-9 h-9 mx-auto mb-3 text-red-400" />
          <p className="text-[13px] font-medium text-gray-700 mb-1">Failed to load submission</p>
          <p className="text-[11px] text-gray-400 mb-4">{error}</p>
          {tokenRef.current && (
            <button
              onClick={() => tokenRef.current && load(tokenRef.current)}
              className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          )}
        </motion.div>
      )}

      {/* ═══ CONTENT ═══ */}
      {!loading && !error && detail && (
        <>
          {/* ── Overview ── */}
          <motion.div variants={fadeUp} className="card-parchment mb-5">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <span className="text-sm font-semibold text-gray-800">Overview</span>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Status</p>
                {status && <Badge variant={status.variant} dot>{status.label}</Badge>}
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Version</p>
                <div className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[14px] font-mono font-semibold text-gray-800">v{detail.version}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Submitted</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[12px] text-gray-700">{formatDateTime(detail.submitted_at)}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Task</p>
                <Link
                  href={`/contributor/tasks/${detail.task_id}`}
                  className="inline-flex items-center gap-1 text-[12px] text-teal-600 hover:text-teal-700 font-mono font-medium transition-colors"
                >
                  <Tag className="w-3 h-3" />{detail.task_id}
                </Link>
              </div>
            </div>
            {detail.notes && (
              <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--border-hair)" }}>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-3 mb-1.5">Notes</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{detail.notes}</p>
              </div>
            )}
          </motion.div>

          {/* ── Files ── */}
          <Section icon={Paperclip} title="Submitted Files" count={detail.files?.length ?? 0}>
            {!detail.files?.length ? (
              <p className="text-[12px] text-gray-400 py-2">No files attached to this submission.</p>
            ) : (
              <div className="space-y-2">
                {detail.files.map((file: SubmissionFile) => (
                  <div key={file.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-base leading-none">{mimeIcon(file.mime_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{file.filename ?? "Unnamed file"}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{file.mime_type ?? "unknown"}</p>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 shrink-0">{file.id?.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Evidence ── */}
          <Section icon={ClipboardList} title="Evidence" count={detail.evidence?.length ?? 0}>
            {!detail.evidence?.length ? (
              <p className="text-[12px] text-gray-400 py-2">No evidence items for this submission.</p>
            ) : (
              <div className="space-y-3">
                {detail.evidence.map((ev: SubmissionEvidence, idx: number) => (
                  <div
                    key={ev.id ?? idx}
                    className="flex items-start gap-3 pb-3"
                    style={{ borderBottom: idx < detail.evidence.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                  >
                    <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-teal-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {ev.label && <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{ev.label}</p>}
                      <p className="text-[13px] text-gray-800 leading-snug mb-1">{ev.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {ev.file_id && (
                          <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            file: {ev.file_id.slice(0, 12)}…
                          </span>
                        )}
                        {ev.checklist_item_id && (
                          <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            checklist: {ev.checklist_item_id.slice(0, 12)}…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Review Feedback ── */}
          <motion.div variants={fadeUp} className="card-parchment mb-5">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">Review Feedback</span>
              </div>
              {feedback && (
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] font-mono text-gray-500">
                    Score: <span className="font-semibold text-gray-700">{feedback.review_score}</span>
                    {" / "}
                    <span className="text-gray-500">rubric: {feedback.rubric_score}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="px-5 py-4">
              {feedbackLoading && (
                <div className="animate-pulse space-y-2">
                  {[80, 60, 75].map((w, i) => (
                    <div key={i} className="h-3 rounded bg-gray-200" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}

              {!feedbackLoading && feedbackError && (
                <p className="text-[12px] text-red-500">{feedbackError}</p>
              )}

              {!feedbackLoading && !feedbackError && !feedback && (
                <p className="text-[12px] text-gray-400 py-2">No review feedback available yet for this task.</p>
              )}

              {!feedbackLoading && !feedbackError && feedback && (
                <div className="space-y-5">
                  {/* Score bar */}
                  {(() => {
                    const criteria   = feedback.criteria ?? [];
                    const maxPossible = criteria.reduce((sum, c) => sum + (c.max_score ?? 0), 0) || 100;
                    const pct = Math.min(100, Math.round((feedback.review_score / maxPossible) * 100));
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Overall Score</span>
                          <span className="text-[11px] font-mono text-gray-600">{feedback.review_score} / {maxPossible}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700",
                              pct >= 80 ? "bg-forest-500" : pct >= 50 ? "bg-teal-400" : "bg-gold-400")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reviewer feedback text */}
                  {feedback.reviewer_feedback && (
                    <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Reviewer Comment</p>
                      <p className="text-[13px] text-gray-700 leading-relaxed">{feedback.reviewer_feedback}</p>
                    </div>
                  )}

                  {/* Per-criterion breakdown */}
                  {(feedback.criteria ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">Criteria Breakdown</p>
                      <div className="space-y-2">
                        {(feedback.criteria ?? []).map((c, idx) => {
                          const pct = c.max_score > 0 ? Math.round((c.score / c.max_score) * 100) : 0;
                          return (
                            <div key={c.criterion_id ?? idx} className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-mono text-gray-600 truncate flex-1">{c.criterion_id}</span>
                                <span className="text-[11px] font-mono text-gray-500 shrink-0">{c.score}/{c.max_score}</span>
                              </div>
                              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", pct >= 80 ? "bg-forest-500" : pct >= 50 ? "bg-teal-400" : "bg-gold-400")}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {c.comment && (
                                <p className="text-[11px] text-gray-500 italic">{c.comment}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Checklist Acknowledgements ── */}
          <Section icon={ShieldCheck} title="Checklist Acknowledgements" count={detail.checklist_acknowledgements?.length ?? 0}>
            {!detail.checklist_acknowledgements?.length ? (
              <p className="text-[12px] text-gray-400 py-2">No checklist items.</p>
            ) : (
              <div className="space-y-2">
                {detail.checklist_acknowledgements.map((ack: ChecklistAcknowledgement, idx: number) => {
                  const id = ack.criteria_id ?? `item-${idx}`;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{
                        background: ack.acknowledged ? "var(--color-forest-50, #f0fdf4)" : "#fafafa",
                        border: `1px solid ${ack.acknowledged ? "var(--color-forest-100, #dcfce7)" : "#f0f0f0"}`,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", ack.acknowledged ? "bg-forest-500" : "bg-gray-200")}>
                          {ack.acknowledged
                            ? <CheckCircle2 className="w-3 h-3 text-white" />
                            : <span className="w-2 h-2 rounded-full bg-gray-400 block" />}
                        </div>
                        <span className="text-[12px] text-gray-700 font-mono truncate">{id}</span>
                      </div>
                      <Badge variant={ack.acknowledged ? "forest" : "beige"}>
                        {ack.acknowledged ? "Acknowledged" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
            {(detail.checklist_acknowledgements?.length ?? 0) > 0 && (() => {
              const total = detail.checklist_acknowledgements.length;
              const done  = detail.checklist_acknowledgements.filter((a) => a.acknowledged).length;
              const pct   = Math.round((done / total) * 100);
              return (
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400">Completion</span>
                    <span className="text-[10px] font-mono text-gray-500">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", pct === 100 ? "bg-forest-500" : pct >= 50 ? "bg-teal-400" : "bg-gold-400")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </Section>
        </>
      )}

      {/* ═══ RESUBMIT DRAWER ═══ */}
      {resubmitOpen && detail && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => !resubmitting && setResubmitOpen(false)} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-500" />
                <span className="text-[15px] font-heading font-semibold text-gray-900">Resubmit</span>
                <Badge variant={statusConfig[detail.status]?.variant ?? "beige"}>
                  {statusConfig[detail.status]?.label ?? detail.status}
                </Badge>
              </div>
              <button onClick={() => !resubmitting && setResubmitOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Context */}
              <div className="px-4 py-3 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-[12px] text-teal-700 font-medium mb-0.5">Resubmitting v{detail.version}</p>
                <p className="text-[11px] text-teal-600">
                  A new version will be created and the status will be set to <strong>Submitted</strong>.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Notes <span className="text-gray-400 normal-case">(what changed?)</span>
                </label>
                <textarea
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  rows={5}
                  placeholder="Describe what you changed or fixed since the last submission…"
                  className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Error */}
              {resubmitError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-600">{resubmitError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <button
                onClick={handleResubmit}
                disabled={resubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all"
              >
                {resubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {resubmitting ? "Resubmitting…" : "Confirm Resubmit"}
              </button>
              <button onClick={() => setResubmitOpen(false)} disabled={resubmitting}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-all">
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* ═══ EDIT DRAWER ═══ */}
      {editOpen && detail && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => !saving && setEditOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-gray-400" />
                <span className="text-[15px] font-heading font-semibold text-gray-900">Edit Submission</span>
              </div>
              <button
                onClick={() => !saving && setEditOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={5}
                  placeholder="Add notes about this submission…"
                  className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Checklist acknowledgements */}
              {editAcks.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Checklist Acknowledgements
                  </label>
                  <div className="space-y-3">
                    {editAcks.map((ack, idx) => (
                      <div key={ack.criterion_id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                        {/* Toggle row */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-gray-600 truncate flex-1 pr-3">
                            {ack.criterion_id}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditAcks((prev) =>
                                prev.map((a, i) =>
                                  i === idx ? { ...a, acknowledged: !a.acknowledged } : a,
                                ),
                              )
                            }
                            className={cn(
                              "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
                              ack.acknowledged ? "bg-forest-500" : "bg-gray-300",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                                ack.acknowledged ? "translate-x-5" : "translate-x-0.5",
                              )}
                            />
                          </button>
                        </div>
                        {/* Per-item notes */}
                        <input
                          type="text"
                          value={ack.notes ?? ""}
                          onChange={(e) =>
                            setEditAcks((prev) =>
                              prev.map((a, i) => i === idx ? { ...a, notes: e.target.value } : a),
                            )
                          }
                          placeholder="Notes (optional)"
                          className="w-full text-[12px] text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder:text-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save error */}
              {saveError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-600">{saveError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
