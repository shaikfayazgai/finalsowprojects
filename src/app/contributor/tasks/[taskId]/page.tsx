"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, DollarSign, CheckCircle2, Zap, Target, Calendar,
  Upload, FileText, Download, ExternalLink, MessageSquare,
  Bot, User, ShieldCheck, AlertTriangle,
  Circle, Sparkles, Award, Send, Paperclip, Link2, Star,
  ArrowRight, RotateCcw, Timer, Check, X,
  GraduationCap, TrendingUp, Eye, Ban, Lightbulb, Package, RefreshCw, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockSubmissions } from "@/mocks/data/contributor";
import type { ContributorTaskStatus } from "@/types/contributor";
import { useTaskStore } from "@/lib/stores/task-store";
import { fetchTask, fetchAcceptImpact, acceptTask, declineTask, startTask, requestExtension, fetchTaskTimeline, fetchWorkroom, fetchWorkroomTemplates, fetchWorkroomLinks, postWorkroomMessage, fetchWorkroomMessages, uploadWorkroomFile, deleteWorkroomUpload, patchChecklistItem, type TaskDetail, type AcceptImpact, type TaskTimelineEvent, type Workroom, type WorkroomChecklistItem, type WorkroomTemplate, type WorkroomLink } from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";

/* ═══ Helpers ═══ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: "Available",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  assigned:    { label: "Assigned",    color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  in_progress: { label: "In Progress", color: "var(--color-brown-700)",  bg: "var(--color-brown-50)" },
  submitted:   { label: "Submitted",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  in_review:   { label: "In Review",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  accepted:    { label: "Completed",   color: "var(--color-forest-700)", bg: "var(--color-forest-50)" },
  rework:      { label: "Rework",      color: "var(--danger)",           bg: "var(--danger-light)" },
  rejected:    { label: "Rejected",    color: "var(--danger)",           bg: "var(--danger-light)" },
};
const prioCfg: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "var(--color-gray-600)",  bg: "var(--color-gray-100)" },
  medium:   { label: "Medium",   color: "var(--color-teal-700)",  bg: "var(--color-teal-50)" },
  high:     { label: "High",     color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  critical: { label: "Critical", color: "var(--danger)",          bg: "var(--danger-light)" },
};

function fmt$(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function fmtSize(bytes: number) { if (bytes < 1024) return bytes + " B"; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"; return (bytes / 1048576).toFixed(1) + " MB"; }
function daysUntil(iso: string) { return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); }
function slaCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Overdue";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

/* Reusable section card */
function Section({ title, badge, action, children, className }: {
  title: string; badge?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("card-parchment", className)}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ═══ PAGE ═══ */

/* Normalise TaskDetail (snake_case) → camelCase shape the UI expects */
function normalise(d: TaskDetail): Record<string, any> {
  return {
    id:                      d.id,
    title:                   d.title,
    projectTitle:            d.project_title,
    milestoneTitle:          d.milestone_title,
    status:                  d.status,
    priority:                d.priority,
    skillsRequired:          d.skills_required,
    estimatedHours:          d.estimated_hours,
    pricing:                 d.pricing,
    matchScore:              d.match_score,
    matchReason:             d.match_reason,
    dueDate:                 d.due_date,
    slaDeadline:             d.sla_deadline,
    description:             d.description,
    assignedAt:              d.assigned_at,
    startedAt:               d.started_at,
    submittedAt:             d.submitted_at,
    acceptedAt:              d.accepted_at,
    reviewScore:             d.review_score,
    reviewComment:           d.review_comment,
    reworkReason:            d.rework_reason,
    reworkDeadline:          d.rework_deadline,
    acceptanceCriteria:      d.acceptance_criteria,
    evidenceTypesRequired:   d.evidence_types_required,
    milestoneNumber:         d.milestone_number,
    referenceMaterials:      d.reference_materials,
    reviewerGuidancePreview: d.reviewer_guidance_preview,
    domainTag:               d.domain_tag,
    skillsMatched:           d.skills_matched,
    offerExpiresAt:          d.offer_expires_at,
    ndaRequired:             d.nda_required,
    effortDisplay:           d.effort_display,
    progressPercent:         0,
    hoursLogged:             0,
  };
}

export default function ContributorTaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.user?.accessToken;

  /* Store task used as instant preview while API loads */
  const storeTask = useTaskStore((s) => s.selectedTask);

  /* ── API fetch ── */
  const [taskDetail, setTaskDetail] = React.useState<TaskDetail | null>(null);
  const [taskLoading, setTaskLoading] = React.useState(true);
  const [taskError, setTaskError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setTaskLoading(false); return; }
    setTaskLoading(true);
    setTaskError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:task-detail:${taskId}:${sk}`, () => fetchTask(token, taskId))
      .then((data) => {
        if (!live) return;
        setTaskDetail(data);
        setTaskLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setTaskError(err?.message ?? "Failed to load task");
        setTaskLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus, taskId]);

  /* Use API data when ready; fall back to store for instant display */
  const task: Record<string, any> | null = React.useMemo(() => {
    if (taskDetail) return normalise(taskDetail);
    if (storeTask && storeTask.id === taskId) {
      return {
        id: storeTask.id, title: storeTask.title,
        projectTitle: storeTask.project_title, milestoneTitle: storeTask.milestone_title,
        status: storeTask.status, priority: storeTask.priority,
        skillsRequired: storeTask.skills_required, estimatedHours: storeTask.estimated_hours,
        pricing: storeTask.pricing, matchScore: storeTask.match_score,
        matchReason: storeTask.match_reason, dueDate: storeTask.due_date,
        slaDeadline: storeTask.sla_deadline, progressPercent: 0, hoursLogged: 0,
      };
    }
    return null;
  }, [taskDetail, storeTask, taskId]);

  /* Hooks must run unconditionally before any early return */
  const [taskStatus, setTaskStatus] = React.useState<ContributorTaskStatus>("available");

  /* Sync status whenever task data resolves */
  React.useEffect(() => {
    if (task?.status) setTaskStatus(task.status as ContributorTaskStatus);
  }, [task?.status]);

  /* Fallback: seed checklist from task.evidenceTypesRequired ONLY if workroom
     didn't return real checklist items (no real IDs available from server yet) */
  React.useEffect(() => {
    if (!task?.evidenceTypesRequired?.length) return;
    setChecklist((prev) => {
      // Skip if already populated with real server items (no synthetic IDs)
      if (prev.length > 0 && !prev[0].id.includes("-chk-")) return prev;
      // Only seed synthetic items if nothing was seeded by workroom fetch yet
      if (prev.length > 0) return prev;
      return (task.evidenceTypesRequired as string[]).map((label: string, i: number) => ({
        id: `${task.id}-chk-${i}`,   // synthetic — server won't know these
        label,
        completed: false,
        _synthetic: true,
      }));
    });
  }, [task?.id, task?.evidenceTypesRequired]);

  const [showAcceptDialog, setShowAcceptDialog] = React.useState(false);
  const [acceptImpact, setAcceptImpact] = React.useState<AcceptImpact | null>(null);
  const [acceptImpactLoading, setAcceptImpactLoading] = React.useState(false);
  const [acceptNote, setAcceptNote] = React.useState("");
  const [acceptSubmitting, setAcceptSubmitting] = React.useState(false);
  const [acceptError, setAcceptError] = React.useState<string | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = React.useState(false);
  const [declineReason, setDeclineReason] = React.useState("");
  const [declineNotes, setDeclineNotes] = React.useState("");
  const [declineSubmitting, setDeclineSubmitting] = React.useState(false);
  const [declineError, setDeclineError] = React.useState<string | null>(null);
  const [startSubmitting, setStartSubmitting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);
  // Task timeline
  const [timeline, setTimeline] = React.useState<TaskTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = React.useState(false);
  const [timelineError, setTimelineError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token || !taskId) return;
    setTimelineLoading(true);
    setTimelineError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:task-timeline:${taskId}:${sk}`, () => fetchTaskTimeline(token, taskId))
      .then((data) => {
        if (!live) return;
        setTimeline(data);
        setTimelineLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setTimelineError(err?.message ?? "Failed to load timeline");
        setTimelineLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, taskId]);

  // Extension request dialog
  const [showExtensionDialog, setShowExtensionDialog] = React.useState(false);
  const [extDate, setExtDate] = React.useState("");
  const [extReason, setExtReason] = React.useState("");
  const [extNotes, setExtNotes] = React.useState("");
  const [extSubmitting, setExtSubmitting] = React.useState(false);
  const [extError, setExtError] = React.useState<string | null>(null);
  const [extSuccess, setExtSuccess] = React.useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [qaInput, setQaInput] = React.useState("");
  const [qaSending, setQaSending] = React.useState(false);
  const [qaError, setQaError] = React.useState<string | null>(null);
  // These must be declared BEFORE the workroom effect that seeds them
  const [qaMessages, setQaMessages] = React.useState<any[]>([]);
  const [qaLoading, setQaLoading] = React.useState(false);
  const [qaFetchError, setQaFetchError] = React.useState<string | null>(null);
  const [qaPage, setQaPage] = React.useState(1);
  const [qaTotal, setQaTotal] = React.useState(0);
  const qaPageSize = 20;

  /* Helper: map API author string → UI sender role */
  const resolveQASender = React.useCallback((author: string) => {
    const lower = author.toLowerCase();
    if (/\b(ai|bot|assistant|glimmora_ai|system|support)\b/.test(lower)) return "ai";
    if (/\b(reviewer|mentor|evaluator|manager)\b/.test(lower)) return "reviewer";
    const myName = session?.user?.name?.toLowerCase() ?? "";
    const myEmail = session?.user?.email?.toLowerCase() ?? "";
    if (myName && lower === myName) return "contributor";
    if (myEmail && lower === myEmail) return "contributor";
    return "other"; // unknown external author
  }, [session?.user?.name, session?.user?.email]);

  const loadQAMessages = React.useCallback((page: number) => {
    if (!token || !taskId) return;
    setQaLoading(true);
    setQaFetchError(null);
    const sk = sessionKeyFragment(token);
    void dedupeAsync(`contrib:workroom-msg:${taskId}:${sk}:${page}`, () =>
      fetchWorkroomMessages(token, taskId, { page, page_size: qaPageSize }),
    )
      .then((res) => {
        const normalised = res.items.map((m) => ({
          id: m.id,
          sender: resolveQASender(m.author),
          senderName: m.author,
          message: m.message,
          sentAt: m.created_at,
          attachmentIds: m.attachment_ids,
        }));
        setQaMessages((prev) => {
          // On page 1 replace fully; on subsequent pages append (deduplicated)
          const base = page === 1 ? [] : prev.filter((p) => !p._fromApi);
          const existing = new Set(base.map((p: any) => p.id));
          return [...base, ...normalised.filter((m) => !existing.has(m.id)).map((m) => ({ ...m, _fromApi: true }))];
        });
        setQaTotal(res.total);
        setQaPage(page);
        setQaLoading(false);
      })
      .catch((err) => { setQaFetchError(err?.message ?? "Failed to load messages"); setQaLoading(false); });
  }, [token, taskId, resolveQASender]);

  React.useEffect(() => {
    if (sessionStatus === "loading" || !token || !taskId) return;
    loadQAMessages(1);
  }, [token, taskId, sessionStatus, loadQAMessages]);

  const [checklist, setChecklist] = React.useState<any[]>([]);
  const [patchingChecklistId, setPatchingChecklistId] = React.useState<string | null>(null);
  const [checklistPatchError, setChecklistPatchError] = React.useState<string | null>(null);
  const [uploads, setUploads] = React.useState<any[]>([]);
  const [uploadFileName, setUploadFileName] = React.useState(""); // kept for legacy reference
  const uploadFileRef = React.useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = React.useState("deliverable");
  const [uploadTitle, setUploadTitle] = React.useState("");
  const [uploadDescription, setUploadDescription] = React.useState("");
  const [uploadSubmitting, setUploadSubmitting] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [deletingUploadId, setDeletingUploadId] = React.useState<string | null>(null);
  const [deleteUploadError, setDeleteUploadError] = React.useState<string | null>(null);
  // Workroom API state
  const [workroomData, setWorkroomData] = React.useState<Workroom | null>(null);
  const [workroomLoading, setWorkroomLoading] = React.useState(false);
  const [workroomError, setWorkroomError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token || !taskId) return;
    setWorkroomLoading(true);
    setWorkroomError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:workroom:${taskId}:${sk}`, () => fetchWorkroom(token, taskId))
      .then((data) => {
        if (!live) return;
        setWorkroomData(data);
        // Seed uploads from workroom API (only if none locally added yet)
        setUploads((prev) => prev.length === 0 ? data.uploads.map((u) => ({
          id: u.id,
          fileName: u.filename,
          fileSize: u.size_bytes,
          fileType: "application/octet-stream",
          uploadedAt: u.uploaded_at,
          category: u.category,
          title: u.title,
          description: u.description,
        })) : prev);
        // Seed checklist from workroom API if server returns real items (with real IDs)
        if (data.checklist && data.checklist.length > 0) {
          setChecklist(data.checklist.map((item: WorkroomChecklistItem) => ({
            id: item.id,
            label: item.label,
            completed: item.completed,
            completedAt: item.completed_at,
            notes: item.notes,
          })));
        }
        setWorkroomLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setWorkroomError(err?.message ?? "Failed to load workroom");
        setWorkroomLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, taskId, sessionStatus]);

  // Dedicated templates endpoint — overlays / refreshes what the workroom fetch returned
  const [dedicatedTemplates, setDedicatedTemplates] = React.useState<WorkroomTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);

  React.useEffect(() => {
    if (sessionStatus === "loading" || !token || !taskId) return;
    setTemplatesLoading(true);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:workroom-templates:${taskId}:${sk}`, () => fetchWorkroomTemplates(token, taskId))
      .then((data) => {
        if (!live) return;
        setDedicatedTemplates(data);
        setTemplatesLoading(false);
      })
      .catch(() => {
        if (live) setTemplatesLoading(false);
      }); // silent fallback to workroom templates
    return () => {
      live = false;
    };
  }, [token, taskId, sessionStatus]);

  // Dedicated links endpoint — overlays / refreshes what the workroom fetch returned
  const [dedicatedLinks, setDedicatedLinks] = React.useState<WorkroomLink[]>([]);
  const [linksLoading, setLinksLoading] = React.useState(false);

  React.useEffect(() => {
    if (sessionStatus === "loading" || !token || !taskId) return;
    setLinksLoading(true);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:workroom-links:${taskId}:${sk}`, () => fetchWorkroomLinks(token, taskId))
      .then((data) => {
        if (!live) return;
        setDedicatedLinks(data);
        setLinksLoading(false);
      })
      .catch(() => {
        if (live) setLinksLoading(false);
      }); // silent fallback to workroom links
    return () => {
      live = false;
    };
  }, [token, taskId, sessionStatus]);

  /* ── Loading state ── */
  if (taskLoading && !task) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="h-6 w-48 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-9 w-80 rounded-xl bg-gray-100 animate-pulse" />
          <div className="card-parchment flex items-center divide-x divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 px-5 py-4 space-y-2">
                <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
                <div className="h-5 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="card-parchment h-48 animate-pulse bg-gray-50" />
        </motion.div>
      </motion.div>
    );
  }

  /* ── Error state ── */
  if (taskError && !task) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-300" />
          <p className="text-[14px] font-medium text-gray-700 mb-1">Failed to load task</p>
          <p className="text-[12px] text-gray-400 mb-4 max-w-xs mx-auto">{taskError}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => { setTaskError(null); setTaskLoading(true); if (token) fetchTask(token, taskId).then(setTaskDetail).catch((e) => setTaskError(e?.message ?? "Error")).finally(() => setTaskLoading(false)); }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-brown-500 px-4 py-2 rounded-xl border border-brown-200 hover:bg-brown-50 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link href="/contributor/tasks" className="text-[12px] font-medium text-gray-400 hover:text-gray-600">
              ← Back to tasks
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  /* ── Not found ── */
  if (!task) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-600 mb-1">Task not found</p>
          <p className="text-[12px] text-gray-400 mb-4">This task may have been removed or you don&apos;t have access.</p>
          <Link href="/contributor/tasks" className="text-[12px] font-medium text-brown-600 hover:text-brown-700">
            ← Back to tasks
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  const workroom = workroomData;
  const submissions = mockSubmissions.filter((s) => s.taskId === task.id);
  const latestSubmission = submissions.length > 0 ? submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] : null;

  const sc = statusCfg[taskStatus] || statusCfg.available;
  const pc = prioCfg[task.priority] || prioCfg.medium;
  const slaDays = daysUntil(task.slaDeadline);
  const isOverdue = slaDays < 0;
  const isUrgent = slaDays >= 0 && slaDays <= 3;
  const completedChecklist = checklist.filter((e: any) => e.completed).length;
  const totalChecklist = checklist.length;

  /* Fetch accept-impact then open the dialog */
  function openAcceptDialog() {
    setAcceptImpact(null);
    setShowAcceptDialog(true);
    if (!token) return;
    setAcceptImpactLoading(true);
    fetchAcceptImpact(token, taskId)
      .then((data) => setAcceptImpact(data))
      .catch(() => setAcceptImpact(null))
      .finally(() => setAcceptImpactLoading(false));
  }

  async function sendQA() {
    const text = qaInput.trim();
    if (!text || qaSending || !token) return;
    // Optimistically add the message to the list
    const tempId = `qa-optimistic-${Date.now()}`;
    setQaMessages((prev: any[]) => [
      ...prev,
      { id: tempId, sender: "contributor", senderName: "You", message: text, sentAt: new Date().toISOString(), sending: true },
    ]);
    setQaInput("");
    setQaError(null);
    setQaSending(true);
    try {
      const msgId = await postWorkroomMessage(token, taskId, { message: text });
      // Replace the optimistic message with the confirmed one
      setQaMessages((prev: any[]) =>
        prev.map((m) => m.id === tempId ? { ...m, id: msgId ?? tempId, sending: false } : m),
      );
    } catch (err: any) {
      // Mark the optimistic message as failed and surface the error
      setQaMessages((prev: any[]) => prev.filter((m) => m.id !== tempId));
      setQaInput(text); // restore input so user can retry
      setQaError(err?.message ?? "Failed to send message. Please try again.");
    } finally {
      setQaSending(false);
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER — shared across all states ═══ */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
          <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
          {task.milestoneTitle && <Pill bg="var(--color-gray-100)" color="var(--color-gray-600)">{task.milestoneTitle}</Pill>}
        </div>
        <h1 className="font-heading text-[22px] font-semibold text-gray-900 tracking-tight leading-tight mb-1.5">{task.title}</h1>
        <div className="flex items-center gap-2 flex-wrap text-[12px] text-gray-400">
          <span className="text-brown-500 font-medium">{task.projectTitle}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {fmtDate(task.dueDate)}</span>
        </div>
      </motion.div>

      {/* ═══ COMPACT META STRIP — key numbers at a glance ═══ */}
      <motion.div variants={fadeUp} className="card-parchment flex items-center divide-x divide-gray-100 mb-6">
        {[
          { label: "Effort", value: `${task.estimatedHours}h`, icon: Clock },
          { label: "Earn", value: fmt$(task.pricing.amount), icon: DollarSign },
          { label: "Match", value: `${task.matchScore}%`, icon: Target },
          { label: "SLA", value: slaCountdown(task.slaDeadline), icon: Timer },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2.5 flex-1 px-5 py-3.5">
            <m.icon className={cn("w-4 h-4 shrink-0", m.label === "SLA" && isOverdue ? "text-red-400" : m.label === "SLA" && isUrgent ? "text-gold-400" : "text-gray-300")} />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">{m.label}</div>
              <div className={cn("text-[14px] font-semibold text-gray-800 font-mono leading-none mt-0.5", m.label === "SLA" && isOverdue && "text-red-500", m.label === "Earn" && "text-forest-600")}>{m.value}</div>
            </div>
          </div>
        ))}
      </motion.div>


      {/* ╔═══════════════════════════════════════════════╗
         ║  AVAILABLE — Opportunity Preview               ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "available" && (
        <>
          {/* Description — full width */}
          <motion.div variants={fadeUp}>
            <Section title="Task Description">
              <div className="px-5 py-4">
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {task.description ?? "No description provided."}
                </p>
              </div>
            </Section>
          </motion.div>

          {/* Two columns: Skills + Match | Task Details */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            {/* Match + Skills */}
            <Section title="Why This Matches You">
              <div className="px-5 py-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-800 mb-0.5">{task.matchScore}% Skill Match</div>
                    <p className="text-[12px] text-gray-500 leading-relaxed">{task.matchReason ?? "Skills and availability match your profile."}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  {task.skillsRequired.map((skill: string) => (
                    <span key={skill} className="text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">{skill}</span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Task Details */}
            <Section title="Task Details">
              <div className="py-1">
                {[
                  { label: "Pricing Model", value: task.pricing?.model ? task.pricing.model.charAt(0).toUpperCase() + task.pricing.model.slice(1) : "—" },
                  { label: "Complexity",    value: pc.label },
                  { label: "SLA Deadline",  value: task.slaDeadline ? fmtDate(task.slaDeadline) : "—" },
                  { label: "Effort",        value: `${task.estimatedHours} hours` },
                  { label: "Earnings",      value: fmt$(task.pricing?.amount ?? 0) },
                  ...(task.ndaRequired ? [{ label: "NDA", value: "Required" }] : []),
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <span className="text-[12px] text-gray-400">{item.label}</span>
                    <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Acceptance Criteria */}
          {task.acceptanceCriteria?.length > 0 && (
            <motion.div variants={fadeUp} className="mt-5">
              <Section title="Acceptance Criteria" badge={
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{task.acceptanceCriteria.length}</span>
              }>
                <div className="py-1">
                  {task.acceptanceCriteria.map((criterion: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-2.5"
                      style={{ borderBottom: i < task.acceptanceCriteria.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span className="text-[12px] text-gray-600">{criterion}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}

          {/* Reference Materials */}
          {task.referenceMaterials?.length > 0 && (
            <motion.div variants={fadeUp} className="mt-5">
              <Section title="Reference Materials">
                <div>
                  {task.referenceMaterials.map((ref: any, i: number) => (
                    <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
                      style={{ borderBottom: i < task.referenceMaterials.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                      <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-3 h-3 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium text-gray-700 block truncate">{ref.name}</span>
                        {ref.description && <span className="text-[10px] text-gray-400">{ref.description}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}

          {/* Reviewer Guidance Preview */}
          {task.reviewerGuidancePreview && (
            <motion.div variants={fadeUp} className="mt-5">
              <Section title="Reviewer Guidance">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-gray-500 leading-relaxed">{task.reviewerGuidancePreview}</p>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* Accept CTA */}
          <motion.div variants={fadeUp} className="card-parchment px-5 py-5 mt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-gray-800">Ready to take on this task?</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Once accepted, you commit to delivering by {task.slaDeadline ? fmtDate(task.slaDeadline) : "the deadline"}.</p>
              </div>
              <button onClick={openAcceptDialog}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all shrink-0"
                style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                <CheckCircle2 className="w-4 h-4" /> Accept Task
              </button>
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  ASSIGNED — Get Ready                          ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "assigned" && (
        <>
          {/* Action banner */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-4 px-5 py-4" style={{ background: "linear-gradient(135deg, var(--color-gold-50), var(--color-brown-50))" }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-800">Assigned to you on {fmtDate(task.assignedAt!)}</p>
                <p className="text-[11px] text-gray-500">Start working to open your workroom with instructions, resources, and Q&A.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={startSubmitting}
                  onClick={() => setShowDeclineDialog(true)}
                  className="text-[12px] font-medium text-gray-400 px-4 py-2 rounded-xl border border-gray-200 hover:bg-white transition-all disabled:opacity-50">
                  Decline
                </button>
                <button
                  disabled={startSubmitting}
                  onClick={async () => {
                    if (!token) return;
                    setStartSubmitting(true);
                    setStartError(null);
                    try {
                      await startTask(token, taskId, {
                        started_at: new Date().toISOString(),
                      });
                      setTaskStatus("in_progress");
                    } catch (err: any) {
                      setStartError(err?.message ?? "Failed to start task. Please try again.");
                    } finally {
                      setStartSubmitting(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-semibold text-white px-5 py-2.5 rounded-xl transition-all",
                    startSubmitting
                      ? "bg-brown-400 cursor-wait opacity-80"
                      : "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                  )}
                  style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                  {startSubmitting
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting…</>
                    : <><ArrowRight className="w-4 h-4" /> Start Working</>
                  }
                </button>
              </div>
            </div>
          </motion.div>

          {/* Start error banner */}
          {startError && (
            <motion.div variants={fadeUp} className="flex items-center gap-3 rounded-xl border border-red-200 px-4 py-3 mb-5"
              style={{ background: "var(--danger-light)" }}>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[12px] text-red-700 flex-1">{startError}</p>
              <button onClick={() => setStartError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <Section title="Task Description">
              <div className="px-5 py-4">
                <p className="text-[13px] text-gray-600 leading-relaxed">{task.description}</p>
              </div>
            </Section>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <Section title="Required Skills">
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {task.skillsRequired.map((skill: string) => (
                    <span key={skill} className="text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">{skill}</span>
                  ))}
                </div>
              </div>
            </Section>
            <Section title="Match Explanation">
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-gray-500 leading-relaxed">{task.matchReason ?? "Skills and availability match your profile."}</p>
                </div>
              </div>
            </Section>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  IN PROGRESS — Two-column Workroom             ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "in_progress" && (
        <>
          {/* Progress bar */}
          <motion.div variants={fadeUp} className="card-parchment px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Progress</span>
                <span className="font-mono text-[12px] font-semibold text-brown-600">{task.progressPercent || 0}%</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <span><span className="font-semibold text-gray-600">{task.hoursLogged || 0}h</span> / {task.estimatedHours}h logged</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="flex items-center gap-1">
                  <Timer className={cn("w-3 h-3", isOverdue ? "text-red-500" : isUrgent ? "text-gold-500" : "text-gray-400")} />
                  <span className={cn("font-mono font-semibold", isOverdue ? "text-red-500" : isUrgent ? "text-gold-600" : "text-gray-600")}>{slaCountdown(task.slaDeadline)}</span>
                  left
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${task.progressPercent || 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full rounded-full", (task.progressPercent || 0) >= 100 ? "bg-forest-500" : "bg-gradient-to-r from-brown-400 to-brown-500")} />
            </div>
          </motion.div>

          {/* Two-column workroom — NO tabs, both visible */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* LEFT (3/5): Instructions + Q&A */}
            <div className="lg:col-span-3 space-y-5">
              {/* Instructions */}
              <Section title="Instructions" badge={workroomLoading ? <span className="text-[10px] text-gray-400 animate-pulse">Loading…</span> : undefined}>
                <div className="px-5 py-4">
                  {workroomLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="h-3 bg-gray-100 rounded w-4/6" />
                    </div>
                  ) : workroomError ? (
                    <div className="flex items-center gap-2 text-[12px] text-red-500">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {workroomError}
                    </div>
                  ) : workroom ? (
                    <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{workroom.instructions}</div>
                  ) : (
                    <p className="text-[13px] text-gray-600 leading-relaxed">{task.description}</p>
                  )}
                </div>
                {/* Resources inline — use dedicated templates endpoint, fall back to workroom templates */}
                {(() => {
                  const templates = dedicatedTemplates.length > 0 ? dedicatedTemplates : (workroom?.templates ?? []);
                  const links = dedicatedLinks.length > 0 ? dedicatedLinks : (workroom?.links ?? []);
                  const hasResources = templates.length > 0 || links.length > 0 || templatesLoading || linksLoading;
                  if (!hasResources) return null;
                  return (
                    <div style={{ borderTop: "1px solid var(--border-soft)" }}>
                      <div className="px-5 py-2.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Resources</span>
                        {(templatesLoading || linksLoading) && <RefreshCw className="w-3 h-3 text-gray-300 animate-spin" />}
                      </div>
                      {/* Skeleton while loading */}
                      {(templatesLoading || linksLoading) && templates.length === 0 && links.length === 0 && (
                        <div className="flex items-center gap-3 px-5 py-2.5 animate-pulse"
                          style={{ borderTop: "1px solid var(--border-hair)" }}>
                          <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                            <div className="h-2.5 bg-gray-50 rounded w-1/3" />
                          </div>
                        </div>
                      )}
                      {templates.map((tmpl) => (
                        <a key={tmpl.id} href={tmpl.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
                          style={{ borderTop: "1px solid var(--border-hair)" }}>
                          <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center shrink-0"><Download className="w-3 h-3 text-brown-400" /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-gray-700 block truncate">{tmpl.name}</span>
                            <span className="text-[10px] text-gray-400">{tmpl.description}</span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-300 shrink-0" />
                        </a>
                      ))}
                      {links.map((link) => (
                        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
                          style={{ borderTop: "1px solid var(--border-hair)" }}>
                          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0"><ExternalLink className="w-3 h-3 text-teal-400" /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-gray-700 block truncate">{link.title}</span>
                            <span className="text-[10px] text-gray-400 truncate block">{link.url}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </Section>

              {/* Q&A */}
              <Section title="Q&A" badge={
                qaLoading && qaMessages.length === 0
                  ? <span className="text-[10px] text-gray-400 animate-pulse">Loading…</span>
                  : qaTotal > 0
                    ? <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">{qaTotal}</span>
                    : undefined
              }>
                {/* Fetch-error banner */}
                {qaFetchError && (
                  <div className="px-5 py-2.5 flex items-center gap-2 bg-red-50" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <p className="text-[11.5px] text-red-700 flex-1">{qaFetchError}</p>
                    <button onClick={() => loadQAMessages(1)} className="text-[10px] font-medium text-red-600 hover:text-red-800 underline mr-2">Retry</button>
                    <button onClick={() => setQaFetchError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {qaLoading && qaMessages.length === 0 ? (
                  /* Initial load skeleton */
                  <div className="py-1">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-start gap-3 px-5 py-3 animate-pulse"
                        style={{ borderBottom: i < 2 ? "1px solid var(--border-hair)" : undefined }}>
                        <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                        <div className="flex-1 space-y-1.5 pt-0.5">
                          <div className="h-2.5 bg-gray-100 rounded w-24" />
                          <div className="h-3 bg-gray-100 rounded w-full" />
                          <div className="h-3 bg-gray-50 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : qaMessages.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto py-1">
                    {qaMessages.map((msg: any, i: number) => {
                      const isAI = msg.sender === "ai";
                      const isReviewer = msg.sender === "reviewer";
                      const isContributor = msg.sender === "contributor";
                      return (
                        <div key={msg.id} className={cn("px-5 py-3 transition-opacity", msg.sending && "opacity-60")} style={{ borderBottom: i < qaMessages.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                          <div className="flex items-start gap-3">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                              isAI ? "bg-teal-50" : isReviewer ? "bg-gold-50" : isContributor ? "bg-brown-50" : "bg-gray-50")}>
                              {isAI ? <Bot className="w-3.5 h-3.5 text-teal-500" /> : isReviewer ? <ShieldCheck className="w-3.5 h-3.5 text-gold-500" /> : isContributor ? <User className="w-3.5 h-3.5 text-brown-500" /> : <User className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-gray-700">{isContributor ? "You" : msg.senderName || msg.sender}</span>
                                {msg.sending && <span className="text-[9px] text-gray-400 animate-pulse">Sending…</span>}
                                {isAI && <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">AI</span>}
                                <span className="text-[10px] text-gray-400 ml-auto">{fmtDateTime(msg.sentAt)}</span>
                              </div>
                              <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Load more */}
                    {qaMessages.filter((m) => m._fromApi).length < qaTotal && (
                      <div className="px-5 py-3 text-center" style={{ borderTop: "1px solid var(--border-hair)" }}>
                        <button
                          onClick={() => loadQAMessages(qaPage + 1)}
                          disabled={qaLoading}
                          className="text-[11px] font-medium text-brown-600 hover:text-brown-800 disabled:opacity-50 flex items-center gap-1.5 mx-auto">
                          {qaLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                          {qaLoading ? "Loading…" : `Load older messages (${qaTotal - qaMessages.filter((m) => m._fromApi).length} more)`}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <MessageSquare className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-400">Ask a question to get help from the AI assistant or project team.</p>
                  </div>
                )}
                {qaError && (
                  <div className="px-5 py-2.5 flex items-center gap-2 bg-red-50" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <p className="text-[11.5px] text-red-700 flex-1">{qaError}</p>
                    <button onClick={() => setQaError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      value={qaInput}
                      disabled={qaSending}
                      onChange={(e) => setQaInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendQA(); }}
                      className="flex-1 text-[12px] text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                    <button onClick={() => setShowUploadDialog(true)} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"><Paperclip className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={sendQA}
                      disabled={!qaInput.trim() || qaSending}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-brown-400 to-brown-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {qaSending
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </Section>
            </div>

            {/* RIGHT (2/5): Files + Evidence + Submit */}
            <div className="lg:col-span-2 space-y-5">
              {/* Files */}
              <Section title="Files" badge={uploads.length > 0 ? <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">{uploads.length}</span> : undefined}
                action={<button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors"><Upload className="w-3 h-3" /> Upload</button>}>
                {/* Delete error banner */}
                {deleteUploadError && (
                  <div className="px-5 py-2.5 flex items-center gap-2 bg-red-50" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <p className="text-[11.5px] text-red-700 flex-1">{deleteUploadError}</p>
                    <button onClick={() => setDeleteUploadError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                {uploads.length > 0 ? (
                  <div>
                    {uploads.map((file: any, i: number) => {
                      const isDeleting = deletingUploadId === file.id;
                      return (
                        <div key={file.id}
                          className={cn("flex items-center gap-3 px-5 py-2.5 group transition-colors", isDeleting ? "opacity-50" : "hover:bg-black/[0.02]")}
                          style={{ borderBottom: i < uploads.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                          <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                            {isDeleting
                              ? <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />
                              : <FileText className="w-3 h-3 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-gray-700 block truncate">{file.title || file.fileName || file.filename}</span>
                            <span className="text-[10px] text-gray-400">{fmtSize(file.size_bytes ?? file.fileSize ?? file.size ?? 0)}</span>
                          </div>
                          {/* Delete button — visible on hover */}
                          <button
                            disabled={!!deletingUploadId}
                            title="Delete file"
                            onClick={async () => {
                              if (!token || isDeleting) return;
                              setDeletingUploadId(file.id);
                              setDeleteUploadError(null);
                              try {
                                await deleteWorkroomUpload(token, taskId as string, file.id);
                                setUploads((prev: any[]) => prev.filter((u) => u.id !== file.id));
                              } catch (err: any) {
                                setDeleteUploadError(err?.message ?? "Failed to delete file. Please try again.");
                              } finally {
                                setDeletingUploadId(null);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:cursor-not-allowed shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <button onClick={() => setShowUploadDialog(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-brown-300 hover:bg-brown-50/30 transition-all group">
                      <Upload className="w-4 h-4 text-gray-300 group-hover:text-brown-400 transition-colors" />
                      <span className="text-[11px] text-gray-400 group-hover:text-gray-600">Upload deliverables</span>
                    </button>
                  </div>
                )}
              </Section>

              {/* Evidence checklist */}
              {checklist.length > 0 && (
                <Section title="Evidence Checklist" badge={
                  <span className="text-[10px] font-medium text-gray-400">{completedChecklist}/{totalChecklist}</span>
                }>
                  {/* Patch error banner */}
                  {checklistPatchError && (
                    <div className="px-5 py-2.5 flex items-center gap-2 bg-red-50" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <p className="text-[11.5px] text-red-700 flex-1">{checklistPatchError}</p>
                      <button onClick={() => setChecklistPatchError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <div className="py-1">
                    {checklist.map((item: any, i: number) => {
                      const isPatching = patchingChecklistId === item.id;
                      return (
                        <div key={item.id}
                          className={cn("flex items-center gap-3 px-5 py-2.5 transition-colors", isPatching ? "opacity-60 cursor-wait" : "cursor-pointer hover:bg-black/[0.02]")}
                          style={{ borderBottom: i < checklist.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                          onClick={async () => {
                            if (isPatching || !!patchingChecklistId) return;
                            const nextCompleted = !item.completed;
                            // Optimistic toggle — update UI immediately
                            setChecklist((prev: any[]) => prev.map((c: any) =>
                              c.id === item.id ? { ...c, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined } : c
                            ));
                            // Skip API for synthetic items — they have no server ID
                            if (!token || item._synthetic) return;
                            setPatchingChecklistId(item.id);
                            setChecklistPatchError(null);
                            try {
                              await patchChecklistItem(token, taskId as string, item.id, { completed: nextCompleted });
                            } catch (err: any) {
                              // Revert optimistic toggle on any real error
                              setChecklist((prev: any[]) => prev.map((c: any) =>
                                c.id === item.id ? { ...c, completed: !nextCompleted, completedAt: !nextCompleted ? new Date().toISOString() : undefined } : c
                              ));
                              setChecklistPatchError(err?.message ?? "Failed to update checklist item. Please try again.");
                            } finally {
                              setPatchingChecklistId(null);
                            }
                          }}>
                          {isPatching
                            ? <RefreshCw className="w-4 h-4 text-gray-400 shrink-0 animate-spin" />
                            : item.completed
                              ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                              : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                          <span className={cn("text-[12px] flex-1", item.completed ? "text-gray-400 line-through" : "text-gray-700")}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Submit CTA */}
              <div className="card-parchment px-5 py-5">
                <p className="text-[13px] font-semibold text-gray-800 mb-1">Ready to submit?</p>
                <p className="text-[11px] text-gray-400 mb-4">{totalChecklist > 0 ? `${completedChecklist}/${totalChecklist} evidence items complete` : "Ensure all deliverables are uploaded."}</p>
                <button onClick={() => setShowSubmitDialog(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all mb-3"
                  style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                  <Send className="w-4 h-4" /> Submit for Review
                </button>
                <button
                  onClick={() => {
                    setExtDate("");
                    setExtReason("");
                    setExtNotes("");
                    setExtError(null);
                    setExtSuccess(false);
                    setShowExtensionDialog(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-6 py-2.5 rounded-xl transition-all">
                  <Calendar className="w-4 h-4" /> Request Extension
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  SUBMITTED / IN REVIEW — Waiting Room          ║
         ╚═══════════════════════════════════════════════╝ */}
      {(taskStatus === "submitted" || taskStatus === "in_review") && (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Review pipeline */}
            <div className="lg:col-span-3">
              <Section title="Review Pipeline">
                <div className="px-5 py-5">
                  {[
                    { label: "Submitted", desc: task.submittedAt ? `Deliverables submitted on ${fmtDateTime(task.submittedAt)}` : "Deliverables submitted", icon: Send, done: true },
                    { label: "AI Review", desc: "Automated quality checks and compliance verification", icon: Bot, active: true },
                    { label: "Peer Review", desc: "Pending AI review completion", icon: User, active: false },
                    { label: "Mentor Review", desc: "Final human review and approval", icon: ShieldCheck, active: false },
                    { label: "Decision", desc: "Accept, rework, or feedback", icon: CheckCircle2, active: false },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          step.done ? "bg-forest-50" : step.active ? "bg-teal-50" : "bg-gray-50")}>
                          <step.icon className={cn("w-4 h-4", step.done ? "text-forest-500" : step.active ? "text-teal-500" : "text-gray-300")} />
                        </div>
                        {i < arr.length - 1 && <div className={cn("w-px flex-1 my-1", step.done ? "bg-forest-200" : "bg-gray-100")} />}
                      </div>
                      <div className={cn("pb-5", i === arr.length - 1 && "pb-0")}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-[12px] font-semibold", step.done ? "text-gray-800" : step.active ? "text-gray-700" : "text-gray-400")}>{step.label}</span>
                          {step.active && <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full animate-pulse">Processing</span>}
                          {step.done && <Check className="w-3 h-3 text-forest-500" />}
                        </div>
                        <p className="text-[11px] text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Right: Submission details */}
            <div className="lg:col-span-2 space-y-5">
              {latestSubmission && latestSubmission.files.length > 0 && (
                <Section title="Submitted Files">
                  <div>
                    {latestSubmission.files.map((f: any, i: number) => (
                      <div key={f.name} className="flex items-center gap-3 px-5 py-2.5"
                        style={{ borderBottom: i < latestSubmission.files.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-[12px] text-gray-700 flex-1 truncate">{f.name}</span>
                        <span className="text-[10px] text-gray-400">{fmtSize(f.size)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {latestSubmission && latestSubmission.evidence.length > 0 && (
                <Section title="Evidence" badge={<span className="text-[10px] text-gray-400">{latestSubmission.evidence.filter((e: any) => e.verified).length}/{latestSubmission.evidence.length}</span>}>
                  <div className="py-1">
                    {latestSubmission.evidence.map((ev: any, i: number) => (
                      <div key={ev.label} className="flex items-center gap-3 px-5 py-2.5"
                        style={{ borderBottom: i < latestSubmission.evidence.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        {ev.verified ? <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                        <span className="text-[11px] text-gray-600 flex-1">{ev.label}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  ACCEPTED — Achievement                        ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "accepted" && (
        <>
          {/* Celebration */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-5 px-6 py-6" style={{ background: "linear-gradient(135deg, var(--color-forest-50), var(--color-teal-50))" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-[16px] font-heading font-semibold text-gray-900 mb-0.5">Task Accepted</h2>
                <p className="text-[12px] text-gray-500">Your delivery has been recorded on the Proof-of-Delivery Ledger.</p>
              </div>
              {task.reviewScore && (
                <div className="flex items-center gap-2 bg-white/80 px-4 py-2.5 rounded-xl shrink-0">
                  <Star className="w-4 h-4 text-gold-500" />
                  <span className="text-[15px] font-semibold text-gray-800">{task.reviewScore}</span>
                  <span className="text-[11px] text-gray-500">/ 5.0</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Feedback */}
            {(task.reviewComment || (latestSubmission && typeof latestSubmission.reviewerFeedback === "string")) && (
              <Section title="Reviewer Feedback">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="w-3.5 h-3.5 text-forest-500" /></div>
                    <p className="text-[12px] text-gray-600 leading-relaxed">{task.reviewComment || latestSubmission?.reviewerFeedback}</p>
                  </div>
                </div>
              </Section>
            )}

            {/* Earnings */}
            <Section title="Earnings">
              <div className="py-1">
                {[
                  { label: "Task Value", value: fmt$(task.pricing.amount) },
                  { label: "Hours Logged", value: `${task.hoursLogged || task.estimatedHours}h` },
                  { label: "Accepted On", value: task.acceptedAt ? fmtDate(task.acceptedAt) : "—" },
                  { label: "Payment", value: "Paid" },
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <span className="text-[12px] text-gray-400">{item.label}</span>
                    <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Skills + PoDL + Browse */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <Section title="Skills Validated">
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {task.skillsRequired.map((skill: string) => (
                    <span key={skill} className="inline-flex items-center gap-1 text-[11px] font-medium text-forest-600 bg-forest-50 px-3 py-1.5 rounded-lg"><Check className="w-3 h-3" /> {skill}</span>
                  ))}
                </div>
              </div>
            </Section>

            <div className="card-parchment px-5 py-5 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, var(--color-gold-50), var(--color-brown-50))" }}>
              <GraduationCap className="w-5 h-5 text-gold-500 mb-2" />
              <p className="text-[12px] font-semibold text-gray-800 mb-0.5">PoDL Credential Earned</p>
              <p className="text-[10px] text-gray-500">Recorded as a verified credential on the Proof-of-Delivery Ledger.</p>
            </div>

            <Link href="/contributor/tasks" className="card-parchment px-5 py-5 flex flex-col items-center justify-center text-center hover:bg-brown-50/30 transition-colors">
              <Sparkles className="w-5 h-5 text-brown-400 mb-2" />
              <p className="text-[12px] font-semibold text-gray-800 mb-0.5">Browse More Tasks</p>
              <p className="text-[10px] text-gray-500">Find your next opportunity.</p>
            </Link>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  REWORK — Improvement Opportunity              ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "rework" && (
        <>
          {/* Alert banner */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-4 px-5 py-4" style={{ background: "linear-gradient(135deg, var(--danger-light), var(--color-gold-50))" }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shrink-0"><RotateCcw className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-800">Changes Requested</p>
                <p className="text-[11px] text-gray-500">Revisions needed before acceptance.{task.reworkDeadline && <> Deadline: <span className="font-semibold text-gray-700">{fmtDate(task.reworkDeadline)}</span></>}</p>
              </div>
              <button onClick={() => setShowSubmitDialog(true)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2.5 rounded-xl transition-all shrink-0">
                <Send className="w-4 h-4" /> Resubmit
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-5">
              {/* Reviewer feedback */}
              <Section title="Reviewer Feedback">
                <div className="px-5 py-4">
                  {task.reworkReason && (
                    <div className="flex items-start gap-3 p-3 rounded-xl mb-3" style={{ background: "var(--danger-light)" }}>
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-red-700 leading-relaxed">{task.reworkReason}</p>
                    </div>
                  )}
                  {latestSubmission && typeof latestSubmission.reviewerFeedback === "string" && (
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-gray-600 leading-relaxed">{latestSubmission.reviewerFeedback}</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Evidence pass/fail */}
              {latestSubmission && latestSubmission.evidence.length > 0 && (
                <Section title="Evidence Status" badge={<span className="text-[10px] text-gray-400">{latestSubmission.evidence.filter((e: any) => e.verified).length}/{latestSubmission.evidence.length} passed</span>}>
                  <div className="py-1">
                    {latestSubmission.evidence.map((ev: any, i: number) => (
                      <div key={ev.label} className="flex items-center gap-3 px-5 py-2.5"
                        style={{ borderBottom: i < latestSubmission.evidence.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        {ev.verified ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
                        <span className={cn("text-[12px] flex-1", !ev.verified && "text-red-600 font-medium")}>{ev.label}</span>
                        {!ev.verified && <span className="text-[9px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Needs Fix</span>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="lg:col-span-2 space-y-5">
              {/* Upload revised files */}
              <Section title="Upload Revised Files" action={
                <button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-1 text-[11px] font-medium text-brown-500"><Upload className="w-3 h-3" /> Upload</button>
              }>
                <div className="px-5 py-6 text-center">
                  <button onClick={() => setShowUploadDialog(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-brown-300 hover:bg-brown-50/30 transition-all group">
                    <Upload className="w-4 h-4 text-gray-300 group-hover:text-brown-400 transition-colors" />
                    <span className="text-[11px] text-gray-400 group-hover:text-gray-600">Upload revised deliverables</span>
                  </button>
                </div>
              </Section>

              {/* Original description for reference */}
              <Section title="Original Task">
                <div className="px-5 py-4">
                  <p className="text-[12px] text-gray-500 leading-relaxed">{task.description}</p>
                </div>
              </Section>
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  REJECTED — Learning Moment                    ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "rejected" && (
        <>
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-5 px-6 py-6" style={{ background: "linear-gradient(135deg, var(--danger-light), var(--color-gray-50))" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shrink-0"><Ban className="w-7 h-7 text-white" /></div>
              <div>
                <h2 className="text-[16px] font-heading font-semibold text-gray-900 mb-0.5">Submission Not Accepted</h2>
                <p className="text-[12px] text-gray-500">This does not affect your standing. Use the feedback to grow.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {latestSubmission && typeof latestSubmission.reviewerFeedback === "string" && (
              <Section title="Reviewer Feedback">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-gray-600 leading-relaxed">{latestSubmission.reviewerFeedback}</p>
                  </div>
                </div>
              </Section>
            )}

            <div className="card-parchment px-5 py-5" style={{ background: "linear-gradient(135deg, var(--color-teal-50), var(--color-beige-50))" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-teal-500" />
                <span className="text-[12px] font-semibold text-gray-800">Growth Opportunity</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">Consider taking related tasks at a lower complexity to build confidence.</p>
              <div className="flex gap-2">
                <Link href="/contributor/learning">
                  <button className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 bg-white/60 hover:bg-white px-3 py-2 rounded-lg transition-all"><TrendingUp className="w-3 h-3" /> Learning</button>
                </Link>
                <Link href="/contributor/tasks">
                  <button className="flex items-center gap-1.5 text-[11px] font-medium text-brown-600 bg-white/60 hover:bg-white px-3 py-2 rounded-lg transition-all"><Sparkles className="w-3 h-3" /> Browse Tasks</button>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}


      {/* ═══ ACTIVITY TIMELINE ═══ */}
      {taskStatus !== "available" && (
        <motion.div variants={fadeUp} className="mt-6">
          <Section
            title="Activity Timeline"
            badge={
              timeline.length > 0 ? (
                <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {timeline.length} event{timeline.length !== 1 ? "s" : ""}
                </span>
              ) : undefined
            }>
            <div className="px-5 py-4">
              {timelineLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-1.5 pt-1">
                        <div className="h-3 bg-gray-100 rounded w-2/5" />
                        <div className="h-2.5 bg-gray-50 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timelineError ? (
                <div className="flex items-center gap-2 text-[12px] text-red-500">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {timelineError}
                </div>
              ) : timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Activity className="w-6 h-6 text-gray-300 mb-2" />
                  <p className="text-[12px] text-gray-400">No timeline events yet.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-100" />
                  <div className="space-y-0">
                    {timeline.map((evt, idx) => {
                      /* map common event_type values to colours */
                      const typeMap: Record<string, { dot: string; icon: React.ReactNode }> = {
                        task_accepted:   { dot: "bg-forest-500", icon: <Check className="w-3 h-3 text-white" /> },
                        task_started:    { dot: "bg-teal-500",   icon: <ArrowRight className="w-3 h-3 text-white" /> },
                        task_submitted:  { dot: "bg-brown-500",  icon: <Send className="w-3 h-3 text-white" /> },
                        task_reviewed:   { dot: "bg-blue-500",   icon: <Eye className="w-3 h-3 text-white" /> },
                        task_rework:     { dot: "bg-red-500",    icon: <RotateCcw className="w-3 h-3 text-white" /> },
                        task_completed:  { dot: "bg-forest-600", icon: <CheckCircle2 className="w-3 h-3 text-white" /> },
                        extension_requested: { dot: "bg-blue-400", icon: <Calendar className="w-3 h-3 text-white" /> },
                        task_declined:   { dot: "bg-gray-500",   icon: <Ban className="w-3 h-3 text-white" /> },
                      };
                      const style = typeMap[evt.event_type] ?? {
                        dot: "bg-gray-400",
                        icon: <Activity className="w-3 h-3 text-white" />,
                      };

                      return (
                        <div key={evt.id} className={cn("flex gap-4 relative", idx < timeline.length - 1 && "pb-5")}>
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 z-10", style.dot)}>
                            {style.icon}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-[12px] font-semibold text-gray-800 leading-snug">{evt.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              {new Date(evt.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                            {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {Object.entries(evt.metadata).map(([k, v]) => (
                                  <span key={k} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5 font-mono">
                                    {k}: {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </motion.div>
      )}


      {/* ═══ DIALOGS ═══ */}

      {showAcceptDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowAcceptDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-heading font-semibold text-gray-900">Accept this task?</h3>
                <p className="text-[11px] text-gray-400">Review your capacity before confirming</p>
              </div>
            </div>

            {/* Task summary line */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 mb-4">
              <p className="text-[13px] font-semibold text-gray-800 mb-0.5 truncate">{task.title}</p>
              <p className="text-[11px] text-gray-400">
                {task.estimatedHours}h &nbsp;·&nbsp; {fmt$(task.pricing?.amount ?? 0)} &nbsp;·&nbsp; Due {task.slaDeadline ? fmtDate(task.slaDeadline) : "—"}
              </p>
            </div>

            {/* Capacity section */}
            {acceptImpactLoading ? (
              <div className="space-y-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 rounded-md bg-gray-100 animate-pulse" style={{ width: i === 1 ? "100%" : i === 2 ? "75%" : "55%" }} />
                ))}
              </div>
            ) : acceptImpact ? (
              <div className="mb-4 space-y-3">
                {/* Capacity bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-gray-500">Capacity after accepting</span>
                    <span className={cn("text-[12px] font-bold font-mono",
                      acceptImpact.would_exceed_capacity ? "text-red-500" :
                      acceptImpact.advisory_near_capacity ? "text-gold-600" : "text-forest-600")}>
                      {acceptImpact.capacity_percent_after}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500",
                      acceptImpact.would_exceed_capacity ? "bg-red-400" :
                      acceptImpact.advisory_near_capacity ? "bg-gold-400" : "bg-forest-400")}
                      style={{ width: `${Math.min(acceptImpact.capacity_percent_after, 100)}%` }} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Active tasks",        value: String(acceptImpact.current_active_tasks) },
                    { label: "Hours this week",      value: `${acceptImpact.hours_committed_this_week}h` },
                    { label: "After accept",         value: `${acceptImpact.after_accept_weekly_hours}h / wk` },
                    { label: "Declared capacity",    value: `${acceptImpact.declared_hours_per_week}h / wk` },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className="text-[10px] text-gray-400 mb-0.5">{s.label}</div>
                      <div className="text-[13px] font-semibold text-gray-800 font-mono">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Warning banners */}
                {acceptImpact.would_exceed_capacity && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--danger-light)" }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-red-700 leading-relaxed">
                      <span className="font-semibold">Capacity exceeded.</span> This task would push you beyond your declared weekly hours.
                    </p>
                  </div>
                )}
                {!acceptImpact.would_exceed_capacity && acceptImpact.advisory_near_capacity && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--color-gold-50)" }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-gold-700 leading-relaxed">
                      <span className="font-semibold">Near capacity.</span> You&apos;re approaching your weekly limit — plan accordingly.
                    </p>
                  </div>
                )}
                {acceptImpact.concurrent_deadlines_notice && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-gray-50">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-gray-600 leading-relaxed">{acceptImpact.concurrent_deadlines_notice}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Commit notice when impact API unavailable */
              <div className="bg-gold-50 rounded-xl px-4 py-3 mb-4">
                <p className="text-[12px] text-gold-700">
                  By accepting, you commit to delivering by <span className="font-semibold">{task.slaDeadline ? fmtDate(task.slaDeadline) : "the deadline"}</span>.
                </p>
              </div>
            )}

            {/* Optional note */}
            {acceptImpact?.accept_allowed !== false && (
              <div className="mb-4">
                <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                  Note <span className="text-gray-300">(optional)</span>
                </label>
                <textarea
                  value={acceptNote}
                  onChange={(e) => setAcceptNote(e.target.value)}
                  placeholder="Any message for the project team..."
                  rows={2}
                  className="w-full text-[12px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all resize-none"
                />
              </div>
            )}

            {/* API error */}
            {acceptError && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: "var(--danger-light)" }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-[11.5px] text-red-700">{acceptError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowAcceptDialog(false); setAcceptNote(""); setAcceptError(null); }}
                disabled={acceptSubmitting}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button
                disabled={acceptImpactLoading || acceptSubmitting || acceptImpact?.accept_allowed === false}
                onClick={async () => {
                  if (!token) return;
                  setAcceptSubmitting(true);
                  setAcceptError(null);
                  try {
                    await acceptTask(token, taskId, {
                      accepted_at: new Date().toISOString(),
                      ...(acceptNote.trim() ? { note: acceptNote.trim() } : {}),
                    });
                    setTaskStatus("assigned");
                    setShowAcceptDialog(false);
                    setAcceptNote("");
                  } catch (err: any) {
                    setAcceptError(err?.message ?? "Failed to accept task. Please try again.");
                  } finally {
                    setAcceptSubmitting(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 text-[12px] font-semibold text-white px-5 py-2 rounded-xl transition-all",
                  acceptImpact?.accept_allowed === false
                    ? "bg-gray-300 cursor-not-allowed"
                    : acceptSubmitting
                      ? "bg-brown-400 cursor-wait opacity-80"
                      : "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                )}>
                {acceptSubmitting ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Accepting…</>
                ) : acceptImpact?.accept_allowed === false ? (
                  "Not Allowed"
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Confirm Accept</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeclineDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onClick={() => !declineSubmitting && setShowDeclineDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-heading font-semibold text-gray-900">Decline Assignment</h3>
                <p className="text-[11px] text-gray-400">This task will be returned to the pool</p>
              </div>
            </div>

            {/* Task name */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 mb-4">
              <p className="text-[12px] font-medium text-gray-700 truncate">{task.title}</p>
            </div>

            <div className="space-y-3 mb-4">
              {/* Reason */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                  Reason <span className="text-red-400">*</span>
                </label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
                >
                  <option value="">Select a reason...</option>
                  <option value="schedule_conflict">Schedule conflict</option>
                  <option value="skills_mismatch">Skills mismatch</option>
                  <option value="scope_too_large">Scope too large</option>
                  <option value="personal_reasons">Personal reasons</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                  Notes <span className="text-gray-300">(optional)</span>
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Any additional context for the project team..."
                  rows={3}
                  className="w-full text-[12px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all resize-none"
                />
              </div>
            </div>

            {/* API error */}
            {declineError && (
              <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: "var(--danger-light)" }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-red-700">{declineError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={declineSubmitting}
                onClick={() => { setShowDeclineDialog(false); setDeclineReason(""); setDeclineNotes(""); setDeclineError(null); }}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button
                disabled={!declineReason || declineSubmitting}
                onClick={async () => {
                  if (!token || !declineReason) return;
                  setDeclineSubmitting(true);
                  setDeclineError(null);
                  try {
                    await declineTask(token, taskId, {
                      reason: declineReason,
                      ...(declineNotes.trim() ? { notes: declineNotes.trim() } : {}),
                    });
                    setTaskStatus("available");
                    setShowDeclineDialog(false);
                    setDeclineReason("");
                    setDeclineNotes("");
                  } catch (err: any) {
                    setDeclineError(err?.message ?? "Failed to decline task. Please try again.");
                  } finally {
                    setDeclineSubmitting(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 text-[12px] font-semibold text-white px-5 py-2 rounded-xl transition-all",
                  !declineReason || declineSubmitting
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                )}>
                {declineSubmitting
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Declining…</>
                  : <><X className="w-3.5 h-3.5" /> Confirm Decline</>
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowSubmitDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center"><Send className="w-5 h-5 text-white" /></div>
              <h3 className="text-[16px] font-heading font-semibold text-gray-900">{taskStatus === "rework" ? "Resubmit?" : "Submit for Review?"}</h3>
            </div>
            <p className="text-[13px] font-medium text-gray-800 mb-1">{task.title}</p>
            <p className="text-[12px] text-gray-400 mb-4">{totalChecklist > 0 ? `${completedChecklist}/${totalChecklist} evidence items complete` : "All deliverables will be submitted."}</p>
            {totalChecklist > 0 && completedChecklist < totalChecklist && (
              <div className="bg-gold-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-gold-600 shrink-0" /><p className="text-[12px] text-gold-700">Incomplete evidence items may delay review.</p></div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowSubmitDialog(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => { setTaskStatus("submitted"); setShowSubmitDialog(false); }}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                {taskStatus === "rework" ? "Resubmit" : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onClick={() => !uploadSubmitting && (setShowUploadDialog(false), setUploadFile(null), setUploadTitle(""), setUploadDescription(""), setUploadCategory("deliverable"), setUploadError(null), setUploadSuccess(false))}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[16px] font-heading font-semibold text-gray-900">Upload Deliverable</h3>
            </div>

            {uploadSuccess ? (
              <div className="bg-green-50 rounded-xl px-4 py-4 mb-5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-green-800">File Uploaded</p>
                  <p className="text-[12px] text-green-700 mt-0.5">Your file has been added to the workroom.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                {/* Drop-zone / file picker */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    File <span className="text-red-400">*</span>
                  </label>
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-xl px-4 py-5 text-center transition-all cursor-pointer",
                      uploadFile ? "border-brown-300 bg-brown-50/30" : "border-gray-200 hover:border-brown-300 hover:bg-brown-50/20",
                    )}>
                    <input
                      ref={uploadFileRef}
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setUploadFile(f);
                        if (f && !uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ""));
                      }}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-brown-400 shrink-0" />
                        <span className="text-[12px] font-medium text-gray-700 truncate max-w-[240px]">{uploadFile.name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{fmtSize(uploadFile.size)}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-[12px] text-gray-500">Click to browse or drag a file here</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Any format, max 50 MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-200 focus:border-brown-300 transition-all">
                    <option value="deliverable">Deliverable</option>
                    <option value="evidence">Evidence</option>
                    <option value="reference">Reference</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Title <span className="text-gray-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Final Report v2"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full text-[12px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-200 focus:border-brown-300 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Description <span className="text-gray-300">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief note about this file…"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full text-[12px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-200 focus:border-brown-300 transition-all resize-none"
                  />
                </div>

                {uploadError && (
                  <div className="bg-red-50 rounded-xl px-4 py-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-700">{uploadError}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                disabled={uploadSubmitting}
                onClick={() => { setShowUploadDialog(false); setUploadFile(null); setUploadTitle(""); setUploadDescription(""); setUploadCategory("deliverable"); setUploadError(null); setUploadSuccess(false); }}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">
                {uploadSuccess ? "Close" : "Cancel"}
              </button>
              {!uploadSuccess && (
                <button
                  disabled={!uploadFile || !uploadCategory || uploadSubmitting}
                  onClick={async () => {
                    if (!uploadFile || !uploadCategory || !token) return;
                    setUploadSubmitting(true);
                    setUploadError(null);
                    try {
                      const result = await uploadWorkroomFile(token, taskId as string, {
                        file: uploadFile,
                        category: uploadCategory,
                        title: uploadTitle.trim() || undefined,
                        description: uploadDescription.trim() || undefined,
                      });
                      setUploads((prev: any[]) => [...prev, {
                        id: result.id,
                        fileName: result.filename,
                        title: result.title || result.filename,
                        fileSize: uploadFile.size,
                        size_bytes: uploadFile.size,
                        uploadedAt: result.uploaded_at,
                        category: result.category,
                        description: result.description,
                      }]);
                      setUploadSuccess(true);
                    } catch (err: any) {
                      setUploadError(err?.message ?? "Upload failed. Please try again.");
                    } finally {
                      setUploadSubmitting(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-semibold text-white px-5 py-2 rounded-xl transition-all",
                    !uploadFile || !uploadCategory || uploadSubmitting
                      ? "bg-brown-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700",
                  )}>
                  {uploadSubmitting
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                    : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Request Extension Dialog ─── */}
      {showExtensionDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onClick={() => !extSubmitting && setShowExtensionDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-heading font-semibold text-gray-900">Request Deadline Extension</h3>
                <p className="text-[11px] text-gray-400">{task?.title}</p>
              </div>
            </div>

            {extSuccess ? (
              <div className="bg-green-50 rounded-xl px-4 py-4 mb-5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-green-800">Extension Requested</p>
                  <p className="text-[12px] text-green-700 mt-0.5">Your request has been submitted for review.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-5">
                {/* Requested due date */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Requested Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={extDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExtDate(e.target.value)}
                    className="w-full text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scope expanded unexpectedly"
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                    className="w-full text-[13px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Additional Notes <span className="text-gray-300">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any extra context for the reviewer…"
                    value={extNotes}
                    onChange={(e) => setExtNotes(e.target.value)}
                    className="w-full text-[13px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all resize-none"
                  />
                </div>

                {extError && (
                  <div className="bg-red-50 rounded-xl px-4 py-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-700">{extError}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExtensionDialog(false)}
                disabled={extSubmitting}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">
                {extSuccess ? "Close" : "Cancel"}
              </button>
              {!extSuccess && (
                <button
                  disabled={!extDate || !extReason.trim() || extSubmitting}
                  onClick={async () => {
                    if (!token || !taskId || !extDate || !extReason.trim()) return;
                    setExtSubmitting(true);
                    setExtError(null);
                    try {
                      await requestExtension(token, taskId as string, {
                        requested_due_date: extDate,
                        reason: extReason.trim(),
                        notes: extNotes.trim() || undefined,
                      });
                      setExtSuccess(true);
                    } catch (err: any) {
                      setExtError(err?.message ?? "Failed to submit extension request. Please try again.");
                    } finally {
                      setExtSubmitting(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-semibold text-white px-5 py-2 rounded-xl transition-all",
                    !extDate || !extReason.trim() || extSubmitting
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                  )}>
                  {extSubmitting ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                  ) : (
                    <><Calendar className="w-3.5 h-3.5" /> Request Extension</>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
