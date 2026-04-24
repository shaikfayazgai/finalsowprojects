"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ClipboardCheck, FileText, ChevronRight, Eye, Plus,
  CheckCircle2, RotateCcw, AlertCircle, Hourglass, Send,
  RefreshCw, Loader2, X, Save,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  fetchSubmissions, createSubmission, fetchLatestSubmission,
  type SubmissionItem, type SubmissionsListResponse, type SubmissionDetail,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/stores/toast-store";

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

/* ═══ Skeleton ═══ */

function RowSkeleton() {
  return (
    <div className="grid items-center px-5 py-3.5 animate-pulse"
      style={{ gridTemplateColumns: "1fr 70px 120px 120px 100px 40px", borderBottom: "1px solid var(--border-hair)" }}>
      <div className="h-3 w-48 bg-gray-200 rounded" />
      <div className="h-3 w-8 bg-gray-200 rounded mx-auto" />
      <div className="h-3 w-24 bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded-full" />
      <div className="h-3 w-8 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
    </div>
  );
}

/* ═══ Helpers ═══ */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const statusConfig: Record<string, { variant: string; label: string; icon: React.ElementType; dotColor: string }> = {
  accepted:       { variant: "forest", label: "Accepted",       icon: CheckCircle2, dotColor: "bg-forest-500" },
  rework:         { variant: "gold",   label: "Rework",         icon: RotateCcw,    dotColor: "bg-gold-500" },
  needs_revision: { variant: "gold",   label: "Needs Revision", icon: RotateCcw,    dotColor: "bg-gold-500" },
  rejected:       { variant: "danger", label: "Rejected",       icon: AlertCircle,  dotColor: "bg-red-500" },
  pending:        { variant: "teal",   label: "Pending Review", icon: Hourglass,    dotColor: "bg-teal-500" },
  draft:          { variant: "beige",  label: "Draft",          icon: FileText,     dotColor: "bg-gray-400" },
  submitted:      { variant: "teal",   label: "Submitted",      icon: Send,         dotColor: "bg-teal-500" },
  in_review:      { variant: "gold",   label: "In Review",      icon: Eye,          dotColor: "bg-gold-500" },
  under_review:   { variant: "gold",   label: "Under Review",   icon: Eye,          dotColor: "bg-gold-500" },
};

/* ═══ Task lookup ═══ */
const taskMap = new Map<string, any>(mockContributorTasks.map((t: any) => [t.id, t]));
function getTaskTitle(taskId: string) {
  return taskMap.get(taskId)?.title ?? taskId;
}
function getTaskProject(taskId: string) {
  return taskMap.get(taskId)?.projectTitle ?? "";
}

/* ═══ PAGE ═══ */

export default function SubmissionsPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [data, setData]       = React.useState<SubmissionsListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);

  /* Evidence map: task_id → latest SubmissionDetail (for Evidence Summary) */
  const [evidenceMap, setEvidenceMap] = React.useState<Map<string, SubmissionDetail>>(new Map());
  const [evidenceLoading, setEvidenceLoading] = React.useState(false);

  /* New submission drawer */
  const [drawerOpen, setDrawerOpen]   = React.useState(false);
  const [taskId, setTaskId]           = React.useState("");
  const [mode, setMode]               = React.useState<"draft" | "submit">("draft");
  const [version, setVersion]         = React.useState(1);
  const [notes, setNotes]             = React.useState("");
  const [submitting, setSubmitting]   = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const tokenRef = React.useRef<string | null>(null);
  if (session?.user?.accessToken) tokenRef.current = session.user.accessToken as string;

  const loadRevision = React.useRef(0);

  /* Load submissions list then fetch latest-submission for each unique task_id */
  const load = React.useCallback(async (token: string, opts?: { bust?: boolean }) => {
    if (opts?.bust) loadRevision.current += 1;
    const rev = loadRevision.current;
    const sk = sessionKeyFragment(token);
    setLoading(true);
    setError(null);
    try {
      await dedupeAsync(`contrib:submissions-bundle:${sk}:${rev}`, async () => {
        const res = await fetchSubmissions(token, { page: 1, page_size: 100 });
        setData(res);

  const statusCounts = submissions.reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const kpis = [
    { label: "Total Submissions", value: data?.total ?? 0,                        icon: ClipboardCheck, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
    { label: "Accepted",          value: statusCounts.accepted ?? 0,              icon: CheckCircle2,   iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
    { label: "Pending Review",    value: (statusCounts.pending ?? 0) + (statusCounts.submitted ?? 0) + (statusCounts.under_review ?? 0), icon: Hourglass, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
    { label: "Rework",            value: (statusCounts.rework ?? 0) + (statusCounts.needs_revision ?? 0), icon: RotateCcw, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
            Submissions
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">Track all your task submissions and review outcomes</p>
        </div>
        {tokenRef.current && (
          <button onClick={openDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-all shrink-0 shadow-sm">
            <Plus className="w-4 h-4" /> New Submission
          </button>
        )}
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {kpis.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                {loading
                  ? <div className="h-6 w-10 bg-gray-200 rounded animate-pulse mt-1" />
                  : <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ SUBMISSIONS TABLE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Submission History</span>
            <div className="flex items-center gap-3">
              {!loading && <span className="text-[11px] text-gray-400">{data?.total ?? 0} submissions</span>}
              {tokenRef.current && (
                <button onClick={() => tokenRef.current && load(tokenRef.current, { bust: true })} disabled={loading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40" title="Refresh">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid items-center px-5 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider"
          style={{ gridTemplateColumns: "1fr 70px 120px 120px 100px 40px", borderBottom: "1px solid var(--border-hair)" }}>
          <span>Task</span><span className="text-center">Version</span>
          <span>Submitted</span><span>Status</span><span>Review</span><span />
        </div>

        {/* Rows */}
        {submissions.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-[13px] text-gray-500 mb-1">No submissions yet</p>
            <p className="text-[11px] text-gray-400">Submitted task deliverables will appear here.</p>
          </div>
        )}
        {submissions.map((sub: any, i: number) => {
          const status = statusConfig[sub.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          const taskId = sub.taskId;

        {!loading && !error && submissions.map((sub, i) => {
          const status = statusConfig[sub.status] || statusConfig.pending;
          return (
            <Link key={sub.id} href={`/contributor/tasks/submissions/${sub.id}`}>
              <div className="grid items-center px-5 py-3.5 transition-colors hover:bg-black/[0.02] cursor-pointer"
                style={{ gridTemplateColumns: "1fr 70px 120px 120px 100px 40px", borderBottom: i < submissions.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <div className="min-w-0 pr-3">
                  <span className="text-[13px] font-medium text-gray-800 truncate block">{sub.task_id}</span>
                </div>
                <div className="text-center">
                  <span className="text-[12px] font-mono font-medium text-gray-700">v{sub.version}</span>
                </div>
                <div>
                  <span className="text-[12px] text-gray-700 block">{formatDate(sub.submitted_at)}</span>
                  <span className="text-[10px] text-gray-400">{formatTime(sub.submitted_at)}</span>
                </div>
                <div><Badge variant={status.variant} dot>{status.label}</Badge></div>
                <div><span className="text-[11px] text-gray-400">--</span></div>
                <div className="flex justify-end"><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></div>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* ═══ EVIDENCE SUMMARY ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Evidence Summary</span>
        </div>
        <div className="py-2">
          {submissions.length === 0 && (
            <div className="px-5 py-8 text-center"><p className="text-[12px] text-gray-400">No evidence to show</p></div>
          )}
          {submissions.map((sub: any, si: number) => {
            const verifiedCount = sub.evidence.filter((e: any) => e.verified).length;
            const totalCount = sub.evidence.length;
            const pct = totalCount ? Math.round((verifiedCount / totalCount) * 100) : 0;
            const status = statusConfig[sub.status] || statusConfig.pending;

            return (
              <div
                key={sub.id}
                className="px-5 py-3"
                style={{ borderBottom: si < submissions.length - 1 ? "1px solid var(--border-hair)" : undefined }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12px] font-medium text-gray-700 truncate">{getTaskTitle(sub.taskId)}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">{verifiedCount}/{totalCount} verified</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      pct === 100 ? "bg-forest-500" : pct >= 50 ? "bg-teal-400" : "bg-gold-400"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {sub.files.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {sub.files.map((file: any) => (
                      <span key={file.name} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />{file.name}
                      </span>
                    ))}
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700",
                      pct === 100 ? "bg-forest-500" : pct >= 50 ? "bg-teal-400" : "bg-gold-400")}
                      style={{ width: `${pct}%` }} />
                  </div>
                  {files.length > 0 && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {files.map((file) => (
                        <span key={file.id} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />{file.filename ?? "file"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      </motion.div>

      {/* ═══ NEW SUBMISSION DRAWER ═══ */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => !submitting && setDrawerOpen(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-gray-400" />
                <span className="text-[15px] font-heading font-semibold text-gray-900">New Submission</span>
              </div>
              <button onClick={() => !submitting && setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Task ID <span className="text-red-400">*</span>
                </label>
                <input type="text" value={taskId} onChange={(e) => setTaskId(e.target.value)}
                  placeholder="e.g. tsk_001"
                  className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Submission Mode
                </label>
                <div className="flex gap-2">
                  {(["draft", "submit"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={cn("flex-1 py-2 rounded-xl text-[12px] font-medium border transition-all",
                        mode === m ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300")}>
                      {m === "draft" ? "Save as Draft" : "Submit Now"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Version</label>
                <input type="number" min={1} value={version} onChange={(e) => setVersion(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                  placeholder="Describe what you've submitted…"
                  className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder:text-gray-400" />
              </div>
              {submitError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-600">{submitError}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <button onClick={handleCreate} disabled={submitting || !taskId.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? "Creating…" : mode === "draft" ? "Save Draft" : "Submit"}
              </button>
              <button onClick={() => setDrawerOpen(false)} disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-all">
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}

    </motion.div>
  );
}
