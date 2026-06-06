"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Plus, DollarSign, Shield, Upload, Sparkles, AlertTriangle,
  ArrowUp, ArrowDown, Clock,
  MoreVertical, Eye, Archive, CheckCircle2, X, PlayCircle, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn, getInitialVariant } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { TablePagination } from "@/components/ui/table-pagination";
import { useManualSOWList, useDeleteManualSOW } from "@/lib/hooks/use-manual-sow";
import { useSowList, useDeleteAiSOW } from "@/lib/hooks/use-sow-wizard";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";

const SOW_UPLOAD_STORAGE_KEY  = "gt-sow-upload";
const SOW_WIZARD_DRAFT_KEY    = "sow-generator-draft";
const SOW_WIZARD_ID_KEY       = "sow-wizard-id";
const SOW_AI_REVIEW_ACTIVE_KEY = "sow-ai-review-active";

/* ══════════════════════════════════════════ Resume Banner ══════════════════════════════════════════ */

const UPLOAD_STEP_LABELS: Record<number, string> = {
  1: "Document Upload",
  2: "Extraction Report",
  3: "Parsed Review",
  4: "Gap Analysis",
  5: "Commercial Details",
  6: "Generate SOW",
  7: "Preview & Confirm",
};

const UPLOAD_STEP_URLS: Record<number, string> = {
  1: "/enterprise/sow/upload",
  2: "/enterprise/sow/upload/report",
  3: "/enterprise/sow/upload/review",
  4: "/enterprise/sow/upload/gaps",
  5: "/enterprise/sow/upload/details",
  6: "/enterprise/sow/upload/generate",
  7: "/enterprise/sow/upload/preview-confirm",
};

type ResumeSession =
  | { type: "ai"; step: number; resumeUrl: string; label: string }
  | { type: "upload"; step: number; resumeUrl: string; label: string };

function ResumeBanner() {
  const router = useRouter();
  const [session, setSession] = React.useState<ResumeSession | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // ── Priority 1: AI Review & Submit (standalone review page) ─────────────
    try {
      if (sessionStorage.getItem(SOW_AI_REVIEW_ACTIVE_KEY) === "true") {
        setSession({
          type: "ai",
          step: -1,
          resumeUrl: "/enterprise/sow/generate/review",
          label: "AI SOW — Review & Submit",
        });
        return;
      }
    } catch { /* ignore */ }

    // ── Priority 2: AI wizard draft (sessionStorage) ─────────────────────────
    try {
      const raw = sessionStorage.getItem(SOW_WIZARD_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const step: number = parsed?.currentStep ?? 0;
        const genComplete: boolean = parsed?.generationComplete ?? false;
        // generationComplete=true means wizard finished and review page is showing
        if (genComplete) {
          setSession({
            type: "ai",
            step,
            resumeUrl: `/enterprise/sow/generate?step=${step}`,
            label: "AI SOW Wizard — Review & Submit",
          });
          return;
        }
        // currentStep is 0-indexed — step 0 is UI "Step 1"
        if (typeof step === "number" && step >= 0) {
          setSession({
            type: "ai",
            step,
            resumeUrl: `/enterprise/sow/generate?step=${step}`,
            label: `AI SOW Wizard — Step ${step + 1} of 10`,
          });
          return;
        }
      }
    } catch { /* ignore */ }

    // ── Priority 3: Manual upload (localStorage via Zustand persist) ─────────
    try {
      const raw = localStorage.getItem(SOW_UPLOAD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const state = parsed?.state ?? parsed;
        const flowStep: number = state?.currentFlowStep ?? 1;
        const hasFile = state?.uploadedFile != null;
        if (hasFile || flowStep > 1) {
          const stepLabel = UPLOAD_STEP_LABELS[flowStep] ?? "In Progress";
          setSession({
            type: "upload",
            step: flowStep,
            resumeUrl: UPLOAD_STEP_URLS[flowStep] ?? "/enterprise/sow/upload",
            label: `Manual Upload — Step ${flowStep} of 7: ${stepLabel}`,
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  function handleDiscard() {
    if (session?.type === "ai") {
      sessionStorage.removeItem(SOW_WIZARD_DRAFT_KEY);
      sessionStorage.removeItem(SOW_WIZARD_ID_KEY);
      sessionStorage.removeItem(SOW_AI_REVIEW_ACTIVE_KEY);
    } else if (session?.type === "upload") {
      useSOWUploadStore.getState().reset();
    }
    setDismissed(true);
  }

  if (!session || dismissed) return null;

  const isAi = session.type === "ai";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="mb-5 rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${isAi ? "rgba(42,96,104,0.25)" : "rgba(166,119,99,0.25)"}`,
          background: isAi
            ? "linear-gradient(135deg, rgba(42,96,104,0.06), rgba(91,155,162,0.04))"
            : "linear-gradient(135deg, rgba(166,119,99,0.07), rgba(196,162,78,0.04))",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Icon */}
          <div
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: isAi ? "rgba(42,96,104,0.12)" : "rgba(166,119,99,0.12)",
              border: `1px solid ${isAi ? "rgba(42,96,104,0.2)" : "rgba(166,119,99,0.2)"}`,
            }}
          >
            {isAi
              ? <Sparkles className="w-4.5 h-4.5" style={{ color: "#2A6068" }} />
              : <Upload className="w-4.5 h-4.5" style={{ color: "#A67763" }} />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>
              You have an in-progress SOW session
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
              <span
                className="font-semibold"
                style={{ color: isAi ? "#2A6068" : "#A67763" }}
              >
                {session.label}
              </span>
              {" "}— pick up right where you left off.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(session.resumeUrl)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: isAi
                  ? "linear-gradient(135deg, #2A6068, #3A7A82)"
                  : "linear-gradient(135deg, #A67763, #8B5A48)",
                boxShadow: `0 2px 8px ${isAi ? "rgba(42,96,104,0.30)" : "rgba(166,119,99,0.30)"}`,
              }}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Resume
            </button>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all hover:bg-red-50"
              style={{
                border: "1px solid rgba(239,68,68,0.20)",
                color: "var(--danger, #ef4444)",
                background: "rgba(239,68,68,0.04)",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════ Status config (per FSD §7.1.4) ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:                      { label: "Draft",                    color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  review:                     { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  approval:                   { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  submitted:                  { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  in_review:                  { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  under_review:               { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  pending_review:             { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  pending_approval:           { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  pending_commercial_review:  { label: "Pending Commercial Review", color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  approved:                   { label: "Approved",                 color: "var(--color-forest-700)", bg: "var(--color-forest-50)" },
  rejected:                   { label: "Rejected",                 color: "var(--danger)",           bg: "var(--danger-light)" },
  changes_requested:          { label: "Changes Requested",        color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  archived:                   { label: "Archived",                 color: "var(--color-gray-500)",   bg: "var(--color-gray-100)" },
};

const sensitivityConfig: Record<string, { label: string; color: string; bg: string }> = {
  public:       { label: "Public",       color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  internal:     { label: "Internal",     color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  confidential: { label: "Confidential", color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  restricted:   { label: "Restricted",   color: "var(--danger)",           bg: "var(--danger-light)" },
};

/* FSD §7.1.4: Risk bar colors — green 0–25, amber 26–50, orange-red 51–75, red 76–100 */
function riskBarColor(score: number): string {
  if (score <= 25) return "var(--color-forest-500)";
  if (score <= 50) return "var(--color-gold-500)";
  if (score <= 75) return "#e67e22";
  return "var(--danger)";
}
function riskScoreColor(score: number): string {
  if (score <= 25) return "var(--color-forest-700)";
  if (score <= 50) return "var(--color-gold-700)";
  if (score <= 75) return "#c0570a";
  return "var(--danger)";
}

/* FSD §7.1.4: DD Mon YYYY format */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

type SortField = "title" | "client" | "intake" | "status" | "sensitivity" | "risk" | "version" | "modified";
type SortDir = "asc" | "desc";

/* FSD §7.1.3: STATUS filter options (only showing submitted SOWs) */
const statusFilterOptions = [
  { value: "all",       label: "STATUS: ALL" },
  { value: "in_review", label: "In Review" },
  { value: "pending_commercial_review", label: "Pending Commercial Review" },
  { value: "approved",  label: "Approved" },
  { value: "rejected",  label: "Rejected" },
];

/* FSD §7.1.3: INTAKE filter options */
const intakeFilterOptions = [
  { value: "all",          label: "INTAKE: ALL" },
  { value: "ai_generated", label: "AI-Generated" },
  { value: "manual_upload", label: "Manual Upload" },
];

/* FSD §7.1.3: RISK filter options */
const riskFilterOptions = [
  { value: "all",      label: "RISK: ALL" },
  { value: "low",      label: "Low (0–25)" },
  { value: "medium",   label: "Medium (26–50)" },
  { value: "high",     label: "High (51–75)" },
  { value: "critical", label: "Critical (76–100)" },
];

/* ══════════════════════════════════════════ Pill helper ══════════════════════════════════════════ */

function Pill({ bg, color, children, bold, className }: { bg: string; color: string; children: React.ReactNode; bold?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] tracking-wide uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap", bold ? "font-bold" : "font-medium", className)}
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════ Risk Bar (FSD §7.1.4) ══════════════════════════════════════════ */

function RiskBar({ score }: { score: number }) {
  if (score <= 0) return <span className="text-[11px] text-gray-300">—</span>;
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%`, background: riskBarColor(score) }} />
      </div>
      <span className="font-mono text-[11px] font-semibold" style={{ color: riskScoreColor(score), minWidth: 20, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════ Row Kebab Menu (FSD §7.1.5) ══════════════════════════════════════════ */

function RowKebab({ sow, onAction }: { sow: import("@/types/enterprise").SOW; onAction: (action: string, sowId: string, sow: import("@/types/enterprise").SOW) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items: { label: string; action: string; show: boolean; danger?: boolean }[] = [
    { label: "View Detail",            action: "view",     show: true },
    { label: "Edit",                   action: "edit",     show: sow.status === "draft" },
    { label: "View Approval Progress", action: "approval", show: ["approval", "review", "pending_commercial_review"].includes(sow.status) },
    { label: "Delete",                 action: "delete",   show: true, danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-gray-100"
        style={{ color: "var(--ink)" }}>
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 rounded-xl bg-white py-1.5 border border-beige-200/60"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          {items.filter((i) => i.show).map((item) => (
            <button key={item.action} onClick={(e) => { e.stopPropagation(); onAction(item.action, sow.id, sow); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-[12px] hover:bg-beige-50 transition-colors text-left"
              style={{ color: item.danger ? "var(--danger)" : undefined }}>
              {item.action === "view" && <Eye className="w-3.5 h-3.5" />}
              {item.action === "edit" && <FileText className="w-3.5 h-3.5" />}
{item.action === "approval" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {item.action === "delete" && <Archive className="w-3.5 h-3.5" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════ Recently Viewed Panel (FSD §7.1.3) ══════════════════════════════════════════ */

function RecentlyViewedPanel({ open, onClose, sows }: { open: boolean; onClose: () => void; sows: import("@/types/enterprise").SOW[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const recentItems = [...sows]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (!open) return null;
  return (
    <div ref={ref} className="absolute right-0 top-10 z-50 w-80 rounded-xl bg-white border border-beige-200/60"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
        <span className="text-[12px] font-semibold text-brown-800">Recently Modified</span>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {recentItems.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-beige-400">No SOWs yet</p>
        )}
        {recentItems.map((item) => {
          const sc = statusConfig[item.status] || statusConfig.draft;
          return (
            <Link key={item.id} href={`/enterprise/sow/${item.id}`}>
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-beige-50/60 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-brown-900 truncate">{item.title}</div>
                  <div className="text-[10px] text-beige-400 mt-0.5">{item.client || "—"}</div>
                </div>
                <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ SOW REPOSITORY PAGE (FSD §7.1) ══════════════════════════════════════════ */

export default function SOWListPage() {
  const router = useRouter();
  const [initialVariant] = React.useState<"hidden" | "show">(getInitialVariant);

  /* Filters — FSD §7.1.3 */
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [intakeFilter, setIntakeFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [recentViewedOpen, setRecentViewedOpen] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string; intakeMode: "ai_generated" | "manual_upload" } | null>(null);

  const { data: manualSowListRes, isFetching: manualFetching, isLoading: manualLoading } = useManualSOWList();
  const { data: aiSowListRes, isFetching: aiFetching, isLoading: aiLoading } = useSowList();
  const isFetchingAny = manualFetching || aiFetching;
  const isLoading = manualLoading || aiLoading;
  const deleteManualSow = useDeleteManualSOW();
  const deleteAiSow = useDeleteAiSOW();
  const isDeleting = deleteManualSow.isPending || deleteAiSow.isPending;

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.intakeMode === "ai_generated") {
      deleteAiSow.mutate({ sowId: deleteTarget.id }, { onSuccess: () => setDeleteTarget(null) });
    } else {
      deleteManualSow.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    }
  }

  /* Normalise raw API responses into the shape the table expects */
  function extractList(res: unknown): Record<string, unknown>[] {
    if (!res) return [];
    const r = res as Record<string, unknown>;
    if (Array.isArray(r)) return r as Record<string, unknown>[];
    if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
    const d = (r.data ?? r) as Record<string, unknown>;
    for (const k of ["sows", "items", "results", "documents", "list"]) {
      if (Array.isArray(d[k])) return d[k] as Record<string, unknown>[];
    }
    return [];
  }

  /* Derive SOW-level status from the approval pipeline (source of truth). */
  function deriveStatusFromStages(stages: import("@/types/enterprise").SOWApprovalStage[], fallback: string): string {
    if (!stages || stages.length === 0) return fallback;
    if (stages.every((s) => s.status === "approved")) return "approved";
    if (stages.some((s) => s.status === "rejected")) return "changes_requested";
    if (stages.some((s) => s.status === "in_review")) return "approval";
    if (stages.some((s) => s.status === "approved")) return "approval";
    return fallback;
  }

  function normaliseToSOW(item: Record<string, unknown>, mode: "ai_generated" | "manual_upload") {
    const updatedAt = String(item.updated_at ?? item.updatedAt ?? item.created_at ?? item.createdAt ?? new Date().toISOString());
    const gc = mode === "ai_generated" ? ((item.generated_content ?? {}) as Record<string, unknown>) : {};

    /* Title — manual SOWs store it as projectTitle (camelCase, top-level). */
    const title = String(item.projectTitle ?? gc.document_title ?? item.title ?? item.project_title ?? item.document_title ?? "Untitled SOW").replace(/^statement of work for\s*/i, "").trim();

    /* Client — manual SOWs store clientOrganisation; AI SOWs vary. */
    let client = String(item.clientOrganisation ?? item.client ?? item.client_organisation ?? gc.client_name ?? gc.client ?? "");
    if (!client && mode === "ai_generated") {
      const bizOwner = String(item.business_owner_approver_id ?? "");
      if (bizOwner.includes(", ")) client = bizOwner.split(", ").pop()?.trim() ?? "";
    }

    /* Risk score — try all known paths for both AI and manual SOWs */
    const qm = (item.quality_metrics ?? item.qualityMetrics ?? {}) as Record<string, unknown>;
    const gen = (typeof item.generated === "object" && item.generated !== null ? item.generated : {}) as Record<string, unknown>;
    const genRisk = (typeof gen.risk === "object" && gen.risk !== null ? gen.risk : {}) as Record<string, unknown>;
    const topRisk = (typeof item.risk === "object" && item.risk !== null ? item.risk : {}) as Record<string, unknown>;
    const riskAssessment = (typeof item.risk_assessment === "object" && item.risk_assessment !== null ? item.risk_assessment : {}) as Record<string, unknown>;
    const riskRaw = item.risk_score ?? item.riskScore ?? qm.risk_score ?? qm.riskScore;
    let riskOverall = 0;
    // 1. Manual SOW: generated.risk.risk_score or generated.risk.overall
    if (genRisk.risk_score != null) {
      riskOverall = Number(genRisk.risk_score);
    } else if (genRisk.overall != null) {
      riskOverall = Number(genRisk.overall);
    // 2. risk_assessment object (manual SOW)
    } else if (riskAssessment.risk_score != null) {
      riskOverall = Number(riskAssessment.risk_score);
    } else if (riskAssessment.overall != null) {
      riskOverall = Number(riskAssessment.overall);
    } else if (riskAssessment.overall_score != null) {
      riskOverall = Number(riskAssessment.overall_score);
    // 3. Top-level risk object: { risk_score: N } or { overall: N }
    } else if (topRisk.risk_score != null) {
      riskOverall = Number(topRisk.risk_score);
    } else if (topRisk.overall != null) {
      riskOverall = Number(topRisk.overall);
    // 4. Top-level numeric fields
    } else if (typeof riskRaw === "number") {
      riskOverall = riskRaw;
    } else if (item.overall_risk_score != null) {
      riskOverall = Number(item.overall_risk_score);
    // 5. risk_score object with .overall
    } else if (riskRaw && typeof riskRaw === "object") {
      riskOverall = Number((riskRaw as Record<string, unknown>).overall ?? 0);
    // 6. AI SOW fallback: derive from confidence
    } else if (mode === "ai_generated") {
      const conf = Number(qm.overall_confidence ?? item.confidence_score ?? item.confidenceScore ?? 0);
      riskOverall = conf > 0 ? Math.round(100 - conf) : 0;
    }

    const rawApprovalStages = ((item.approval_stages ?? item.approvalStages ?? []) as import("@/types/enterprise").SOWApprovalStage[]);
    const rawStatus = String(item.status ?? "draft");
    // Normalise API status values that aren't in statusConfig to a known key.
    // Only remap statuses that don't already appear in statusConfig — all the
    // *_review / *_approval variants are already handled there and must NOT be
    // collapsed to "review" or they'll be treated as pre-submission and hidden.
    const STATUS_MAP: Record<string, string> = {
      generated: "review", complete: "review", completed: "review",
    };
    const normalisedStatus = STATUS_MAP[rawStatus] ?? rawStatus;
    const derivedStatus = deriveStatusFromStages(rawApprovalStages, normalisedStatus);

    return {
      id:               String(item.id ?? item._id ?? item.sow_id ?? item.wizard_id ?? ""),
      title,
      client,
      status:           derivedStatus,
      intakeMode:       mode,
      dataSensitivity:  String(item.data_sensitivity ?? item.dataSensitivity ?? "internal"),
      riskScore:        { overall: riskOverall, completeness: 0, confidence: 0, compliance: 0, patternMatch: 0 },
      version:          Number(item.version ?? 1),
      updatedAt,
      createdAt:        String(item.created_at ?? item.createdAt ?? updatedAt),
      estimatedBudget:  Number(item.estimated_budget ?? item.estimatedBudget ?? 0),
      createdBy:        String(item.created_by ?? item.createdBy ?? ""),
      approvedBy:       String(item.approved_by ?? item.approvedBy ?? ""),
      approvalStages:   rawApprovalStages,
      parsedSections:   Number(item.parsed_sections ?? item.parsedSections ?? 0),
      totalSections:    Number(item.total_sections ?? item.totalSections ?? 0),
      pages:            Number(item.pages ?? 0),
    } as import("@/types/enterprise").SOW;
  }

  const manualSows = extractList(manualSowListRes).map((item) => normaliseToSOW(item, "manual_upload"));
  const aiSows = extractList(aiSowListRes).map((item) => normaliseToSOW(item, "ai_generated"));

  // Dedupe by id — the AI list and manual list can surface the same SOW row
  // (both read enterprise_sows), which would otherwise produce duplicate React
  // keys. Manual entries win since they carry the upload metadata.
  const apiCombined = React.useMemo(() => {
    const byId = new Map<string, (typeof manualSows)[number]>();
    for (const s of aiSows) byId.set(s.id, s);
    for (const s of manualSows) byId.set(s.id, s); // manual overrides ai on collision
    return Array.from(byId.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualSowListRes, aiSowListRes]);

  // Only show SOWs that have been submitted for approval.
  // "review" covers AI SOWs that are generated but not yet submitted, and
  // manual SOWs still in the upload pipeline — both should be hidden.
  const PRE_SUBMISSION_STATUSES = new Set([
    "draft", "review",
    "uploading", "processing", "extracting", "extraction",
    "uploaded", "created", "new",
  ]);

  const allSows = apiCombined.filter((s) => !PRE_SUBMISSION_STATUSES.has(s.status));


  const [sortField, setSortField] = React.useState<SortField>("modified");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  /* ⌘K / Ctrl+K keyboard shortcut for search — FSD §7.1.3 */
  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  /* Filter + Sort logic — FSD §7.1.3 (AND logic, real-time) */
  const filtered = React.useMemo(() => {
    let list = [...allSows];
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "in_review": list = list.filter((s) => ["review", "approval"].includes(s.status)); break;
        case "pending_commercial_review": list = list.filter((s) => s.status === "pending_commercial_review"); break;
        case "approved": list = list.filter((s) => s.status === "approved"); break;
        case "rejected": list = list.filter((s) => s.status === "rejected"); break;
      }
    }

    /* INTAKE filter */
    if (intakeFilter !== "all") list = list.filter((s) => s.intakeMode === intakeFilter);

    /* RISK filter */
    if (riskFilter !== "all") {
      switch (riskFilter) {
        case "low":      list = list.filter((s) => (s.riskScore?.overall ?? 0) >= 0 && (s.riskScore?.overall ?? 0) <= 25); break;
        case "medium":   list = list.filter((s) => (s.riskScore?.overall ?? 0) >= 26 && (s.riskScore?.overall ?? 0) <= 50); break;
        case "high":     list = list.filter((s) => (s.riskScore?.overall ?? 0) >= 51 && (s.riskScore?.overall ?? 0) <= 75); break;
        case "critical": list = list.filter((s) => (s.riskScore?.overall ?? 0) >= 76 && (s.riskScore?.overall ?? 0) <= 100); break;
      }
    }

    /* Search — FSD §7.1.3: min 3 chars, searches title, client, ID */
    if (search.trim().length >= 3) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) || s.client.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      );
    }

    /* Sort — FSD §7.1.4: default sort Modified descending */
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title": cmp = a.title.localeCompare(b.title); break;
        case "client": cmp = a.client.localeCompare(b.client); break;
        case "intake": cmp = a.intakeMode.localeCompare(b.intakeMode); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "sensitivity": cmp = (a.dataSensitivity || "").localeCompare(b.dataSensitivity || ""); break;
        case "risk": cmp = (a.riskScore?.overall ?? 0) - (b.riskScore?.overall ?? 0); break;
        case "version": cmp = a.version - b.version; break;
        case "modified": cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [allSows, statusFilter, intakeFilter, riskFilter, search, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [statusFilter, intakeFilter, riskFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [statusFilter, intakeFilter, riskFilter].filter((v) => v !== "all").length;

  function clearAllFilters() { setStatusFilter("all"); setIntakeFilter("all"); setRiskFilter("all"); setSearch(""); }

  const totalSOWs = allSows.length;
  const pendingCount = allSows.filter((s) => ["approval", "review", "changes_requested"].includes(s.status)).length;
  const approvedCount = allSows.filter((s) => s.status === "approved").length;
  const scoredSOWs = allSows.filter((s) => (s.riskScore?.overall ?? 0) > 0);
  const avgRisk = scoredSOWs.length > 0 ? Math.round(scoredSOWs.reduce((sum, s) => sum + (s.riskScore?.overall ?? 0), 0) / scoredSOWs.length) : 0;
  const totalBudget = allSows.filter((s) => s.status === "approved").reduce((sum, s) => sum + (s.estimatedBudget ?? 0), 0);

  /* Tile click handlers — FSD §7.1.2 */
  function handleTileClick(tile: string) {
    switch (tile) {
      case "total": clearAllFilters(); break;
      case "pending": clearAllFilters(); setStatusFilter("in_review"); break;
      case "approved": clearAllFilters(); setStatusFilter("approved"); break;
      case "risk": clearAllFilters(); setSortField("risk"); setSortDir("desc"); break;
      case "budget": router.push("/enterprise/billing"); break;
    }
  }

  /* Row action handler — FSD §7.1.5 */
  function handleRowAction(action: string, sowId: string, sow?: import("@/types/enterprise").SOW) {
    switch (action) {
      case "view": router.push(`/enterprise/sow/${sowId}`); break;
      case "edit": router.push(`/enterprise/sow/${sowId}`); break;
      case "approval": router.push(`/enterprise/sow/approval`); break;
      case "delete":
        if (sow) setDeleteTarget({ id: sow.id, title: sow.title, intakeMode: sow.intakeMode });
        break;
    }
  }

  const columns = [
    { field: "title" as SortField, label: "Project Title", align: "left", minW: 240 },
    { field: "client" as SortField, label: "Client", align: "left", minW: 120 },
    { field: "status" as SortField, label: "Status", align: "left", minW: 130 },
    { field: "sensitivity" as SortField, label: "Sensitivity", align: "left", minW: 100 },
    { field: "version" as SortField, label: "Version", align: "center", minW: 70 },
    { field: "modified" as SortField, label: "Modified", align: "left", minW: 100 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-beige-100 animate-pulse shrink-0" />
            <div className="space-y-2 mt-1">
              <div className="h-5 w-44 rounded-lg bg-beige-100 animate-pulse" />
              <div className="h-3.5 w-72 rounded bg-beige-100 animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-xl bg-beige-100 animate-pulse" />
        </div>

        {/* KPI tiles skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-beige-100 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-10 rounded bg-beige-100 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-beige-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Table card skeleton */}
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="h-4 w-48 rounded bg-beige-100 animate-pulse" />
          </div>
          {/* Filter bar */}
          <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
            <div className="h-8 w-60 rounded-xl bg-beige-100 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-32 rounded-xl bg-beige-100 animate-pulse" />
              <div className="h-8 w-28 rounded-xl bg-beige-100 animate-pulse" />
              <div className="h-8 w-24 rounded-xl bg-beige-100 animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-beige-100 animate-pulse" />
            </div>
          </div>
          {/* Table header */}
          <div className="h-9 bg-beige-50/60 animate-pulse" style={{ borderBottom: "1px solid var(--border-hair)" }} />
          {/* Table rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-beige-100 animate-pulse" />
              </div>
              <div className="h-3 w-24 rounded bg-beige-100 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-beige-100 animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-beige-100 animate-pulse" />
              <div className="h-3 w-16 rounded bg-beige-100 animate-pulse" />
              <div className="flex items-center gap-1.5 justify-center">
                <div className="h-1.5 w-14 rounded-full bg-beige-100 animate-pulse" />
                <div className="h-3 w-6 rounded bg-beige-100 animate-pulse" />
              </div>
              <div className="h-3 w-8 rounded bg-beige-100 animate-pulse" />
              <div className="h-3 w-16 rounded bg-beige-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <motion.div variants={stagger} initial={initialVariant} animate="show">

      {/* Resume banner removed — upload now lands straight on the SOW detail
          (no multi-step wizard to resume). */}

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brown-500 to-brown-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">SOW Repository</h1>
              <p className="text-[13px] text-beige-500 mt-0.5">
                Manage all Statements of Work — upload, track, and approve across projects.
              </p>
            </div>
          </div>
          <Link href="/enterprise/sow/intake">
            <button className="flex items-center gap-1.5 rounded-xl text-white text-xs font-semibold px-4 py-2.5 shrink-0 transition-all hover:-translate-y-0.5 bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800"
              style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 30%, transparent)" }}>
              <Plus className="w-3 h-3" /> New SOW
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ═══ KPI TILES — FSD §7.1.2 ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
        {[
          { key: "total",    label: "Total SOWs",    value: String(totalSOWs), icon: FileText,       iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { key: "pending",  label: "Pending Action", value: String(pendingCount), icon: AlertTriangle, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { key: "approved", label: "Approved",       value: String(approvedCount), icon: Shield,       iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { key: "risk",     label: "Avg Risk Score", value: String(avgRisk),  icon: AlertTriangle,  iconBg: "bg-gradient-to-br from-brown-500 to-brown-700" },
          { key: "budget",   label: "Total Budget",   value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          /* FSD §7.1.2: Avg Risk color — green ≤25, amber 26–50, red >50 */
          const riskTextColor = kpi.key === "risk" && avgRisk > 0
            ? (avgRisk <= 25 ? "var(--color-forest-700)" : avgRisk <= 50 ? "var(--color-gold-700)" : "var(--danger)")
            : undefined;
          return (
            <motion.button key={kpi.key} variants={scaleIn}
              className="rounded-2xl border bg-white/70 backdrop-blur-sm p-4 flex items-center gap-4 text-left transition-all cursor-pointer hover:border-beige-300/60 hover:shadow-sm border-beige-200/50"
              onClick={() => handleTileClick(kpi.key)}>
              <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none" style={{ color: riskTextColor || undefined }}>
                  {kpi.value}
                </p>
                <p className="text-[10px] text-beige-500 mt-0.5 font-medium uppercase tracking-wide">{kpi.label}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ═══ TABLE CARD ═══ */}
        <motion.div variants={fadeUp} className="rounded-2xl mb-5"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "visible" }}>

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl" style={{ borderBottom: "1px solid var(--border-hair)" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "var(--color-brown-50)", border: "1px solid var(--color-brown-100)" }}>
                <FileText className="w-4 h-4" style={{ color: "var(--color-brown-600)" }} />
              </div>
              <div>
                <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>All Statements of Work</span>
                {filtered.length !== allSows.length && (
                  <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>
                    {filtered.length} of {allSows.length}
                  </span>
                )}
                {filtered.length === allSows.length && allSows.length > 0 && (
                  <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: "var(--color-gray-100)", color: "var(--ink-faint)" }}>
                    {allSows.length} total
                  </span>
                )}
              </div>
            </div>
            {/* Recently Viewed */}
            <div className="relative">
              <button onClick={() => setRecentViewedOpen(!recentViewedOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all hover:bg-gray-50"
                style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}>
                <Clock className="w-3.5 h-3.5" />
                Recent
              </button>
              <RecentlyViewedPanel open={recentViewedOpen} onClose={() => setRecentViewedOpen(false)} sows={allSows} />
            </div>
          </div>

          {/* ═══ FILTER BAR ═══ */}
          <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)", background: "rgba(249,247,245,0.4)" }}>
            {/* Search */}
            <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0 bg-white", searchFocused ? "w-72" : "w-60")}
              style={{
                border: searchFocused ? "1px solid var(--color-brown-400)" : "1px solid var(--border-soft)",
                padding: "6px 11px",
                boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : "none",
              }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ink-faint)" }} />
              <input ref={searchRef} type="text" placeholder="Search by title, client, or ID…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                className="border-none outline-none bg-transparent w-full text-[12px]"
                style={{ color: "var(--ink)" }} />
              {search ? (
                <button onClick={() => setSearch("")} className="shrink-0"><X className="w-3 h-3" style={{ color: "var(--ink-faint)" }} /></button>
              ) : !searchFocused ? (
                <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] px-1.5 py-px rounded" style={{ color: "var(--ink-faint)", background: "var(--color-gray-100)", border: "1px solid var(--border-soft)" }}>⌘K</kbd>
              ) : null}
            </div>

            <div className="w-px h-5" style={{ background: "var(--border-soft)" }} />

            {/* STATUS filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white px-3 text-[12px] transition-all" style={{ minWidth: 130, border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}><SelectValue placeholder="Status: All" /></SelectTrigger>
              <SelectContent>{statusFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={intakeFilter} onValueChange={setIntakeFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white px-3 text-[12px] transition-all" style={{ minWidth: 120, border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}><SelectValue placeholder="Intake: All" /></SelectTrigger>
              <SelectContent>{intakeFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white px-3 text-[12px] transition-all" style={{ minWidth: 110, border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}><SelectValue placeholder="Risk: All" /></SelectTrigger>
              <SelectContent>{riskFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all hover:opacity-80"
                style={{ background: "var(--color-brown-50)", color: "var(--color-brown-700)", border: "1px solid var(--color-brown-100)" }}>
                <X className="w-3 h-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* ═══ TABLE ═══ */}
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hair)", background: "rgba(249,247,245,0.8)" }}>
                {columns.map((col) => {
                  const active = sortField === col.field;
                  return (
                    <th key={col.field} onClick={() => handleSort(col.field)}
                      className="cursor-pointer select-none"
                      style={{
                        padding: "10px 14px", textAlign: col.align as "left" | "center",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                        color: active ? "var(--color-brown-600)" : "var(--ink-faint)",
                        whiteSpace: "nowrap",
                      }}>
                      <div className="flex items-center gap-1" style={{ justifyContent: col.align === "center" ? "center" : "flex-start" }}>
                        <span>{col.label}</span>
                        <span style={{ opacity: active ? 1 : 0, transition: "opacity 0.15s" }}>
                          {sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {/* Skeleton rows */}
              {isFetchingAny && paginated.length === 0 && Array.from({ length: 7 }).map((_, i) => (
                <tr key={`sk-${i}`} style={{ borderBottom: "1px solid var(--border-hair)" }}>
                  <td style={{ padding: "13px 14px" }}>
                    <div className="animate-pulse rounded" style={{ height: 13, width: "72%", background: "var(--color-beige-100)" }} />
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div className="animate-pulse rounded" style={{ height: 12, width: "65%", background: "var(--color-beige-100)" }} />
                  </td>
                  {[80, 60, 24, 50, 0].map((w, j) => (
                    <td key={j} style={{ padding: "13px 14px", textAlign: j === 2 ? "center" : "left" }}>
                      {w > 0 && <div className="animate-pulse rounded-full" style={{ height: 20, width: w, background: "var(--color-beige-100)" }} />}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Empty state */}
              {!isFetchingAny && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "56px 16px", textAlign: "center" }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: "var(--color-brown-50)", border: "1px solid var(--color-brown-100)" }}>
                        <FileText className="w-5 h-5" style={{ color: "var(--color-brown-400)" }} />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold mb-1" style={{ color: "var(--ink)" }}>
                          {activeFilterCount > 0 || search ? "No SOWs match your filters" : "No statements of work yet"}
                        </p>
                        <p className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
                          {activeFilterCount > 0 || search ? "Try adjusting your search or filter criteria." : "Create your first SOW to get started."}
                        </p>
                      </div>
                      {(activeFilterCount > 0 || search) && (
                        <button onClick={clearAllFilters}
                          className="mt-1 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-brown-50)", color: "var(--color-brown-700)", border: "1px solid var(--color-brown-100)" }}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {paginated.map((sow, rowIdx) => {
                const sc = statusConfig[sow.status] || statusConfig.draft;
                const sens = sensitivityConfig[sow.dataSensitivity] || sensitivityConfig.internal;

                return (
                  <tr key={sow.id}
                    className="group"
                    style={{
                      borderBottom: "1px solid var(--border-hair)",
                      background: rowIdx % 2 === 0 ? "transparent" : "rgba(249,247,245,0.4)",
                    }}
                  >
                    {/* Project Title + Intake */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <span className="text-[12.5px] font-semibold leading-snug block mb-1.5" style={{ color: "var(--ink)" }}>{sow.title}</span>
                      <Pill bg={sow.intakeMode === "ai_generated" ? "var(--color-teal-50)" : "var(--color-gray-100)"}
                            color={sow.intakeMode === "ai_generated" ? "var(--color-teal-700)" : "var(--color-gray-600)"}>
                        {sow.intakeMode === "ai_generated"
                          ? <><Sparkles className="w-2.5 h-2.5" /> AI-Generated</>
                          : <><Upload className="w-2.5 h-2.5" /> Manual Upload</>}
                      </Pill>
                    </td>

                    {/* Client */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <span className="text-[12px] block" style={{ color: sow.client ? "var(--ink-muted)" : "var(--ink-faint)" }}>
                        {sow.client || "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: sc.bg, color: sc.color }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
                        {sc.label}
                      </span>
                    </td>

                    {/* Sensitivity */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap" style={{ color: sens.color }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sens.color }} />
                        {sens.label}
                      </span>
                    </td>

                    {/* Version */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center" }}>
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: "var(--color-gray-100)", color: "var(--ink-muted)" }}>
                        v{sow.version}
                      </span>
                    </td>

                    {/* Modified */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--ink-faint)" }}>{formatDate(sow.updatedAt)}</span>
                    </td>

                    {/* Kebab */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <RowKebab sow={sow} onAction={handleRowAction} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rounded-b-2xl overflow-hidden">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
              />
            </div>
          )}

        </motion.div>
    </motion.div>

    {/* ── Delete confirmation dialog ── */}
    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
              <Archive className="w-5 h-5" style={{ color: "var(--danger)" }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Delete SOW</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
                {deleteTarget.intakeMode === "ai_generated" ? "AI-generated" : "Manual"} SOW
              </p>
            </div>
          </div>
          <p className="text-[13px] mb-5" style={{ color: "var(--ink-muted)" }}>
            Are you sure you want to delete <span className="font-semibold" style={{ color: "var(--ink)" }}>&ldquo;{deleteTarget.title}&rdquo;</span>? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--danger)" }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
