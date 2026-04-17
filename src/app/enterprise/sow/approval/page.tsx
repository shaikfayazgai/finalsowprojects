"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Eye, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Scale,
  UserCheck, DollarSign, Pen, Layers, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, MessageSquare, Sparkles, Upload,
  type LucideIcon,
} from "lucide-react";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";
import {
  useManualSOWList,
  useApprovalStages,
  useRecordApprovalDecision,
} from "@/lib/hooks/use-manual-sow";
import { useSowList } from "@/lib/hooks/use-sow-wizard";

// ── Types ─────────────────────────────────────────────────────────────────

interface PipelineStageConfig {
  number: number;
  name: string;
  shortName: string;
  icon: LucideIcon;
  slaDescription: string;
  color: string;
  bgColor: string;
}

interface ApiStage {
  stage: number;
  stage_name?: string;
  status: "pending" | "in_progress" | "approved" | "rejected" | "changes_requested" | string;
  reviewer?: string;
  reviewed_at?: string;
  comments?: string;
  decision?: string;
}

interface NormalisedSOW {
  id: string;
  title: string;
  client: string;
  intakeMode: "ai_generated" | "manual_upload";
  status: string;
  submittedAt: string;
  slaStatus: "on-track" | "at-risk" | "overdue";
}

// ── Stage config ──────────────────────────────────────────────────────────

const PIPELINE_STAGES: PipelineStageConfig[] = [
  { number: 1, name: "Business Owner Review",          shortName: "Business",   icon: UserCheck,   slaDescription: "3 business days", color: "var(--color-brown-600)",  bgColor: "var(--color-brown-50)"  },
  { number: 2, name: "GlimmoraTeam Commercial Review", shortName: "Commercial", icon: DollarSign,  slaDescription: "2 business days", color: "var(--color-gold-700)",   bgColor: "var(--color-gold-50)"   },
  { number: 3, name: "Legal / Compliance Review",      shortName: "Legal",      icon: Scale,       slaDescription: "5 business days", color: "var(--color-teal-700)",   bgColor: "var(--color-teal-50)"   },
  { number: 4, name: "Security Review",                shortName: "Security",   icon: ShieldCheck, slaDescription: "3 business days", color: "var(--color-forest-700)", bgColor: "var(--color-forest-50)" },
  { number: 5, name: "Final Sign-off",                 shortName: "Sign-off",   icon: Pen,         slaDescription: "2 business days", color: "var(--color-brown-700)",  bgColor: "var(--color-brown-100)" },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function extractPipelineStages(res: unknown): ApiStage[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  const d = (r.data ?? r) as Record<string, unknown>;
  for (const key of ["stages", "approval_stages", "pipeline", "items"]) {
    if (Array.isArray(d[key])) return d[key] as ApiStage[];
  }
  return [];
}

function computeActiveStage(stages: ApiStage[]): number {
  for (let i = 1; i <= 5; i++) {
    const s = stages.find((x) => x.stage === i);
    if (!s || s.status === "pending") return i;
    if (s.status !== "approved") return i;
  }
  return 5;
}

function computeCompleted(stages: ApiStage[]): number[] {
  return stages.filter((s) => s.status === "approved").map((s) => s.stage);
}

function deriveSLA(submittedAt: string): "on-track" | "at-risk" | "overdue" {
  const days = (Date.now() - new Date(submittedAt).getTime()) / 86_400_000;
  if (days > 10) return "overdue";
  if (days > 5) return "at-risk";
  return "on-track";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function slaLabel(s: "on-track" | "at-risk" | "overdue") {
  return s === "on-track" ? "On Track" : s === "at-risk" ? "At Risk" : "Overdue";
}
function slaVariant(s: "on-track" | "at-risk" | "overdue"): "forest" | "gold" | "danger" {
  return s === "on-track" ? "forest" : s === "at-risk" ? "gold" : "danger";
}

function stageStatusStyle(status: string) {
  if (status === "approved")           return { color: "var(--color-forest-700)", bg: "var(--color-forest-50)" };
  if (status === "rejected")           return { color: "var(--danger)",           bg: "var(--danger-light)"    };
  if (status === "changes_requested")  return { color: "var(--color-gold-700)",   bg: "var(--color-gold-50)"   };
  if (status === "in_progress")        return { color: "var(--color-teal-700)",   bg: "var(--color-teal-50)"   };
  return                                      { color: "var(--color-gray-500)",   bg: "var(--color-gray-100)"  };
}

// ── Normalize ─────────────────────────────────────────────────────────────

function normalizeManualList(res: unknown): NormalisedSOW[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  let arr: Record<string, unknown>[] = [];
  if (Array.isArray(r)) arr = r as Record<string, unknown>[];
  else if (Array.isArray(r.data)) arr = r.data as Record<string, unknown>[];
  else {
    const d = (r.data ?? r) as Record<string, unknown>;
    for (const k of ["sows", "items", "results", "documents"]) {
      if (Array.isArray(d[k])) { arr = d[k] as Record<string, unknown>[]; break; }
    }
  }
  return arr.map((item) => {
    const submittedAt = String(item.submitted_at ?? item.submittedAt ?? item.created_at ?? item.createdAt ?? new Date().toISOString());
    return {
      id:         String(item.id ?? item._id ?? ""),
      title:      String(item.title ?? item.project_title ?? item.document_title ?? "Untitled"),
      client:     String(item.client ?? item.client_organisation ?? item.clientOrganisation ?? ""),
      intakeMode: "manual_upload" as const,
      status:     String(item.status ?? ""),
      submittedAt,
      slaStatus:  deriveSLA(submittedAt),
    };
  });
}

function normalizeAiList(res: unknown): NormalisedSOW[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  let arr: Record<string, unknown>[] = [];
  if (Array.isArray(r)) arr = r as Record<string, unknown>[];
  else if (Array.isArray(r.data)) arr = r.data as Record<string, unknown>[];
  else {
    const d = (r.data ?? r) as Record<string, unknown>;
    for (const k of ["sows", "items", "results"]) {
      if (Array.isArray(d[k])) { arr = d[k] as Record<string, unknown>[]; break; }
    }
  }
  return arr.map((item) => {
    const gc = (item.generated_content ?? {}) as Record<string, unknown>;
    const title = gc.document_title ? String(gc.document_title)
      : String(item.document_title ?? item.title ?? item.project_title ?? `AI SOW ${String(item.wizard_id ?? item.id ?? "").slice(-6).toUpperCase()}`);
    const bizOwner = String(item.business_owner_approver_id ?? "");
    const client = bizOwner.includes(", ") ? bizOwner.split(", ").pop()?.trim() ?? "" : "";
    const submittedAt = String(item.submitted_at ?? item.created_at ?? new Date().toISOString());
    return {
      id:         String(item.id ?? item._id ?? item.sow_id ?? item.wizard_id ?? ""),
      title,
      client,
      intakeMode: "ai_generated" as const,
      status:     String(item.status ?? "in_review"),
      submittedAt,
      slaStatus:  deriveSLA(submittedAt),
    };
  });
}

const MANUAL_APPROVAL_STATUSES = new Set(["approval", "in_review", "review", "pending_commercial_review", "changes_requested", "in_progress"]);

// ── Pipeline dot progress ─────────────────────────────────────────────────

function PipelineDots({ currentStage, completedStages, stageColor }: {
  currentStage: number; completedStages: number[]; stageColor: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const done = completedStages.includes(n);
        const active = n === currentStage;
        return (
          <React.Fragment key={n}>
            <div className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 16, height: 16, fontSize: 8, fontWeight: 700,
                background: done ? "var(--color-forest-600)" : active ? stageColor : "transparent",
                border: done || active ? "none" : "1.5px solid var(--border-soft)",
                color: done || active ? "#fff" : "var(--ink-faint)" }}>
              {done ? <CheckCircle2 size={9} /> : n}
            </div>
            {n < 5 && <div className="h-[1.5px] w-3 rounded-full" style={{ background: done ? "var(--color-forest-400)" : "var(--border-soft)", opacity: done ? 0.7 : 0.3 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Stage detail row (inside expanded panel) ──────────────────────────────

function StageDetailRow({ stage, apiStage, isCurrent, onDecide }: {
  stage: PipelineStageConfig;
  apiStage?: ApiStage;
  isCurrent: boolean;
  onDecide: (stageNum: number, type: "approve" | "request_changes") => void;
}) {
  const Icon = stage.icon;
  const status = apiStage?.status ?? "pending";
  const { color, bg } = stageStatusStyle(status);

  const statusLabel =
    status === "approved"          ? "Approved" :
    status === "rejected"          ? "Rejected" :
    status === "changes_requested" ? "Changes Requested" :
    status === "in_progress"       ? "In Progress" : "Pending";

  return (
    <div className="flex items-start gap-4 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
      <div className="flex items-center justify-center rounded-xl shrink-0 mt-0.5"
        style={{ width: 32, height: 32, background: stage.bgColor }}>
        <Icon size={14} style={{ color: stage.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: stage.color }}>Stage {stage.number}</span>
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>{stage.name}</span>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: stage.bgColor, color: stage.color }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: stage.color }} />
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
          <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>{statusLabel}</span>
          {apiStage?.reviewer && <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>Reviewer: {apiStage.reviewer}</span>}
          {apiStage?.reviewed_at && <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>· {formatDate(apiStage.reviewed_at)}</span>}
          <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>SLA: {stage.slaDescription}</span>
        </div>
        {apiStage?.comments && (
          <p className="mt-1.5 text-[11.5px] leading-snug italic" style={{ color: "var(--ink-muted)" }}>&ldquo;{apiStage.comments}&rdquo;</p>
        )}
      </div>
      {isCurrent && (status === "pending" || status === "in_progress") && (
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button onClick={() => onDecide(stage.number, "approve")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all hover:opacity-85 from-forest-500 to-forest-700 bg-gradient-to-r text-white">
            <Check size={11} /> Approve
          </button>
          <button onClick={() => onDecide(stage.number, "request_changes")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all hover:opacity-85 from-gold-500 to-gold-700 bg-gradient-to-r text-white">
            <MessageSquare size={11} /> Request Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ── Decision panel ────────────────────────────────────────────────────────

function DecisionPanel({ stageNum, decisionType, onSubmit, onCancel, isPending }: {
  stageNum: number;
  decisionType: "approve" | "request_changes";
  onSubmit: (comments: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [comments, setComments] = React.useState("");
  const stageCfg = PIPELINE_STAGES[stageNum - 1];
  const isApprove = decisionType === "approve";

  return (
    <div className="px-6 py-4" style={{ background: isApprove ? "var(--color-forest-50)" : "var(--color-gold-50)", borderTop: "1px solid var(--border-hair)" }}>
      <div className="flex items-center gap-2 mb-3">
        {isApprove
          ? <Check size={13} style={{ color: "var(--color-forest-700)" }} />
          : <MessageSquare size={13} style={{ color: "var(--color-gold-700)" }} />}
        <span className="text-[12px] font-semibold" style={{ color: isApprove ? "var(--color-forest-700)" : "var(--color-gold-700)" }}>
          {isApprove ? `Approve — Stage ${stageNum}: ${stageCfg.name}` : `Request Changes — Stage ${stageNum}: ${stageCfg.name}`}
        </span>
      </div>
      <textarea rows={3} placeholder={isApprove ? "Optional: add approval comments…" : "Describe the required changes…"}
        value={comments} onChange={(e) => setComments(e.target.value)}
        className="w-full resize-none rounded-xl px-4 py-3 text-[12.5px] outline-none"
        style={{ background: "white", border: `1px solid ${isApprove ? "var(--color-forest-200)" : "var(--color-gold-200)"}`, color: "var(--ink)" }} />
      <div className="flex items-center justify-end gap-2 mt-3">
        <button onClick={onCancel} disabled={isPending}
          className="px-4 py-2 rounded-xl text-[12px] font-medium border transition-all hover:bg-white"
          style={{ color: "var(--ink-muted)", borderColor: "var(--border-soft)" }}>Cancel</button>
        <button onClick={() => onSubmit(comments)} disabled={isPending || (!isApprove && !comments.trim())}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all disabled:opacity-50 bg-gradient-to-r ${isApprove ? "from-forest-500 to-forest-700" : "from-gold-500 to-gold-700"}`}>
          {isPending ? "Submitting…" : isApprove ? "Confirm Approval" : "Send Request"}
        </button>
      </div>
    </div>
  );
}

// ── SOW pipeline row ──────────────────────────────────────────────────────

function SOWPipelineRow({ sow, onStageResolved }: {
  sow: NormalisedSOW;
  onStageResolved?: (sowId: string, activeStage: number) => void;
}) {
  const { data: pipelineRes, isLoading: pipelineLoading } = useApprovalStages(sow.id);
  const recordDecision = useRecordApprovalDecision(sow.id);

  const [expanded, setExpanded] = React.useState(false);
  const [decidingStage, setDecidingStage] = React.useState<number | null>(null);
  const [decisionType, setDecisionType] = React.useState<"approve" | "request_changes" | null>(null);

  const apiStages = extractPipelineStages(pipelineRes);
  const currentStage = apiStages.length > 0 ? computeActiveStage(apiStages) : 1;
  const completedStages = computeCompleted(apiStages);
  const stageCfg = PIPELINE_STAGES[currentStage - 1] ?? PIPELINE_STAGES[0];

  React.useEffect(() => {
    if (!pipelineLoading) onStageResolved?.(sow.id, currentStage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineLoading, currentStage, sow.id]);

  function handleDecide(stageNum: number, type: "approve" | "request_changes") {
    setDecidingStage(stageNum);
    setDecisionType(type);
    setExpanded(true);
  }

  function submitDecision(comments: string) {
    if (!decidingStage || !decisionType) return;
    recordDecision.mutate(
      { stage: decidingStage, decision: decisionType, comments: comments || undefined },
      { onSuccess: () => { setDecidingStage(null); setDecisionType(null); } }
    );
  }

  return (
    <div style={{ borderBottom: "1px solid var(--border-hair)" }}>
      {/* Main row */}
      <div
        className="grid items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors hover:bg-amber-50/30"
        style={{ gridTemplateColumns: "2.2fr 1fr 1.6fr 0.9fr 0.8fr auto" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Title + intake badge */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {sow.intakeMode === "ai_generated"
              ? <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(13,148,136,0.1)", color: "#0f766e" }}><Sparkles size={8} />AI</span>
              : <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(107,114,128,0.1)", color: "#6B7280" }}><Upload size={8} />Manual</span>
            }
            <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>{sow.title}</p>
          </div>
          {sow.client && <p className="text-[11px] truncate pl-0.5" style={{ color: "var(--ink-faint)" }}>{sow.client}</p>}
        </div>

        {/* Current stage */}
        <div>
          {pipelineLoading
            ? <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
            : (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center rounded shrink-0" style={{ width: 20, height: 20, background: stageCfg.bgColor }}>
                  {React.createElement(stageCfg.icon, { size: 10, style: { color: stageCfg.color } })}
                </div>
                <span className="text-[11.5px] font-medium" style={{ color: stageCfg.color }}>{stageCfg.shortName}</span>
              </div>
            )}
        </div>

        {/* Progress dots */}
        <div>
          {pipelineLoading
            ? <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
            : (
              <>
                <PipelineDots currentStage={currentStage} completedStages={completedStages} stageColor={stageCfg.color} />
                <span className="text-[10px] mt-0.5 block" style={{ color: "var(--ink-faint)" }}>{completedStages.length}/5 stages done</span>
              </>
            )}
        </div>

        {/* SLA */}
        <Badge variant={slaVariant(sow.slaStatus)} size="sm" dot>{slaLabel(sow.slaStatus)}</Badge>

        {/* Date */}
        <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--ink-faint)" }}>{formatDate(sow.submittedAt)}</span>

        {/* Actions */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/enterprise/sow/${sow.id}`}>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80"
              style={{ background: stageCfg.bgColor, color: stageCfg.color }}>
              <Eye size={11} /> View
            </button>
          </Link>
          <button onClick={() => setExpanded((v) => !v)}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "var(--ink-faint)" }}>
            <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div key="exp" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
            <div style={{ background: "var(--color-gray-50)", borderTop: "1px solid var(--border-hair)" }}>
              {pipelineLoading
                ? (
                  <div className="px-6 py-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
                          <div className="h-2.5 w-20 rounded bg-gray-100 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : PIPELINE_STAGES.map((stage) => (
                  <StageDetailRow key={stage.number} stage={stage}
                    apiStage={apiStages.find((s) => s.stage === stage.number)}
                    isCurrent={stage.number === currentStage}
                    onDecide={handleDecide} />
                ))
              }

              <AnimatePresence initial={false}>
                {decidingStage && decisionType && (
                  <motion.div key="dec" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <DecisionPanel stageNum={decidingStage} decisionType={decisionType}
                      onSubmit={submitDecision}
                      onCancel={() => { setDecidingStage(null); setDecisionType(null); }}
                      isPending={recordDecision.isPending} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Compact stage summary strip ───────────────────────────────────────────

function StageSummaryStrip({ counts, activeStage, onStageClick }: {
  counts: Record<number, number>;
  activeStage: number | null;
  onStageClick: (n: number | null) => void;
}) {
  return (
    <div className="flex items-stretch gap-0 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-soft)" }}>
      {PIPELINE_STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const count = counts[stage.number] ?? 0;
        const isActive = activeStage === stage.number;
        return (
          <button key={stage.number} onClick={() => onStageClick(isActive ? null : stage.number)}
            className="flex items-center gap-2.5 px-4 py-3 transition-all relative shrink-0"
            style={{
              borderRight: i < 4 ? "1px solid var(--border-hair)" : "none",
              background: isActive ? stage.bgColor : "transparent",
              minWidth: 0,
            }}>
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: stage.color }} />}
            <div className="flex items-center justify-center rounded-lg shrink-0"
              style={{ width: 28, height: 28, background: isActive ? stage.bgColor : "rgba(0,0,0,0.04)" }}>
              <Icon size={13} style={{ color: isActive ? stage.color : "#9CA3AF" }} />
            </div>
            <div className="text-left min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                style={{ color: isActive ? stage.color : "var(--ink-faint)" }}>
                S{stage.number} · {stage.shortName}
              </div>
              <div className="font-mono text-[13px] font-bold leading-none mt-0.5"
                style={{ color: isActive ? stage.color : "var(--ink)" }}>
                {count}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function SOWApprovalPipelinePage() {
  const [search, setSearch]             = React.useState("");
  const [stageFilter, setStageFilter]   = React.useState<number | null>(null);
  const [slaFilter, setSlaFilter]       = React.useState<"on-track" | "at-risk" | "overdue" | null>(null);
  const [intakeFilter, setIntakeFilter] = React.useState<"all" | "ai_generated" | "manual_upload">("all");
  const [pageSize, setPageSize]         = React.useState(10);
  const [currentPage, setCurrentPage]   = React.useState(1);

  // Live stage counts from per-row pipeline fetches
  const [sowStageMap, setSowStageMap] = React.useState<Record<string, number>>({});
  const handleRowStage = React.useCallback((sowId: string, activeStage: number) => {
    setSowStageMap((prev) => prev[sowId] === activeStage ? prev : { ...prev, [sowId]: activeStage });
  }, []);
  const computedStageCounts = React.useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const stage of Object.values(sowStageMap)) {
      if (stage >= 1 && stage <= 5) counts[stage] = (counts[stage] ?? 0) + 1;
    }
    return counts;
  }, [sowStageMap]);

  const { data: manualRes, isLoading: manualLoading } = useManualSOWList();
  const { data: aiRes,     isLoading: aiLoading }     = useSowList();
  const isLoading = manualLoading || aiLoading;

  const allSows: NormalisedSOW[] = React.useMemo(() => {
    const manual = normalizeManualList(manualRes).filter((s) => MANUAL_APPROVAL_STATUSES.has(s.status));
    const ai     = normalizeAiList(aiRes).filter((s) => s.id);
    const manualIds = new Set(manual.map((s) => s.id));
    return [...ai.filter((s) => !manualIds.has(s.id)), ...manual];
  }, [manualRes, aiRes]);

  const filtered = React.useMemo(() => {
    let list = [...allSows];
    if (stageFilter !== null)   list = list.filter((s) => sowStageMap[s.id] === stageFilter);
    if (slaFilter)              list = list.filter((s) => s.slaStatus === slaFilter);
    if (intakeFilter !== "all") list = list.filter((s) => s.intakeMode === intakeFilter);
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.client.toLowerCase().includes(q));
    }
    return list;
  }, [allSows, slaFilter, intakeFilter, search, stageFilter, sowStageMap]);

  React.useEffect(() => { setCurrentPage(1); }, [slaFilter, intakeFilter, search, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onTrackCount = allSows.filter((s) => s.slaStatus === "on-track").length;
  const atRiskCount  = allSows.filter((s) => s.slaStatus === "at-risk").length;
  const overdueCount = allSows.filter((s) => s.slaStatus === "overdue").length;
  const aiCount      = allSows.filter((s) => s.intakeMode === "ai_generated").length;
  const manualCount  = allSows.filter((s) => s.intakeMode === "manual_upload").length;

  const activeFilterCount = [stageFilter !== null, !!slaFilter, intakeFilter !== "all", search.trim().length >= 2].filter(Boolean).length;

  // ── Skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-44 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-4 w-72 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)" }}>
              <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
              <div className="h-7 w-10 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="card-parchment" style={{ overflow: "hidden" }}>
          <div className="h-12 bg-gray-50 animate-pulse" style={{ borderBottom: "1px solid var(--border-hair)" }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-5 px-6 py-4" style={{ borderBottom: "1px solid var(--border-hair)" }}>
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-gray-100 animate-pulse" />
                <div className="h-2.5 w-1/3 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-3 w-14 rounded bg-gray-100 animate-pulse" />
              <div className="h-7 w-14 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h1 className="font-heading" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Approval Pipeline
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Track and manage SOW approvals across the five-stage review process.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)", color: "var(--ink)" }}>
          <Layers size={14} style={{ color: "var(--ink-muted)" }} />
          {allSows.length} SOWs in Pipeline
        </div>
      </motion.div>

      {/* ── KPI row — 3 cards ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { key: "on-track", label: "On Track",  count: onTrackCount, textColor: "var(--color-forest-700)", bgColor: "var(--color-forest-50)", iconGrad: "from-forest-400 to-forest-600", Icon: CheckCircle2 },
          { key: "at-risk",  label: "At Risk",   count: atRiskCount,  textColor: "var(--color-gold-700)",   bgColor: "var(--color-gold-50)",   iconGrad: "from-gold-400 to-gold-600",     Icon: AlertTriangle },
          { key: "overdue",  label: "Overdue",   count: overdueCount, textColor: "var(--danger)",           bgColor: "var(--danger-light)",    iconGrad: "from-brown-500 to-brown-700",   Icon: Clock },
        ].map(({ key, label, count, textColor, bgColor, iconGrad, Icon }) => {
          const active = slaFilter === key;
          return (
            <button key={key} onClick={() => setSlaFilter(active ? null : key as typeof slaFilter)}
              className="card-parchment flex items-center gap-4 px-5 py-4 text-left transition-all hover:shadow-md"
              style={{ border: active ? `1.5px solid ${textColor}` : undefined }}>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${iconGrad} flex items-center justify-center shrink-0`}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>{label}</div>
                <div className="font-heading text-[1.75rem] font-bold leading-none mt-0.5" style={{ color: active ? textColor : "var(--ink-dark)" }}>{count}</div>
              </div>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: textColor }} />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ── Main table card ── */}
      <motion.div variants={fadeUp} className="card-parchment" style={{ overflow: "hidden" }}>

        {/* ── Card header: title + search + intake toggle ── */}
        <div className="flex items-center justify-between gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-3">
            <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>All SOWs</span>
            {filtered.length !== allSows.length && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--color-gray-100)", color: "var(--ink-muted)" }}>
                {filtered.length} of {allSows.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI / Manual toggle */}
            <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--color-gray-100)", border: "1px solid var(--border-hair)" }}>
              {([
                { value: "all",           label: "All" },
                { value: "ai_generated",  label: "AI",     icon: <Sparkles size={10} /> },
                { value: "manual_upload", label: "Manual", icon: <Upload size={10} /> },
              ] as { value: string; label: string; icon?: React.ReactNode }[]).map(({ value, label, icon }) => (
                <button key={value} onClick={() => setIntakeFilter(value as typeof intakeFilter)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-all"
                  style={{
                    background: intakeFilter === value ? "white" : "transparent",
                    color: intakeFilter === value ? "var(--color-brown-700)" : "var(--ink-faint)",
                    boxShadow: intakeFilter === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    fontWeight: intakeFilter === value ? 600 : 500,
                  }}>
                  {icon}{label}
                  {value !== "all" && (
                    <span className="ml-1 font-mono text-[10px]" style={{ color: intakeFilter === value ? "var(--ink-muted)" : "var(--ink-faint)" }}>
                      {value === "ai_generated" ? aiCount : manualCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
              <input type="text" placeholder="Search SOWs…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg py-2 pl-8 pr-8 text-[12.5px] outline-none"
                style={{ width: 200, background: "var(--color-gray-50)", border: "1px solid var(--border-soft)", color: "var(--ink)" }} />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X size={12} style={{ color: "var(--ink-faint)" }} />
                </button>
              )}
            </div>

            {/* Clear all filters */}
            {activeFilterCount > 0 && (
              <button onClick={() => { setSearch(""); setSlaFilter(null); setIntakeFilter("all"); setStageFilter(null); }}
                className="flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-brown-50"
                style={{ color: "var(--color-brown-500)" }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Stage strip (acts as both overview + stage filter) ── */}
        <StageSummaryStrip counts={computedStageCounts} activeStage={stageFilter} onStageClick={setStageFilter} />

        {/* ── Column headers ── */}
        <div className="grid items-center gap-4 px-6 py-2.5"
          style={{ gridTemplateColumns: "2.2fr 1fr 1.6fr 0.9fr 0.8fr auto", background: "var(--color-gray-50)", borderBottom: "1px solid var(--border-hair)" }}>
          {["SOW / Intake", "Stage", "Progress", "SLA", "Submitted", ""].map((h, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>{h}</span>
          ))}
        </div>

        {/* ── Rows ── */}
        {allSows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <p className="text-[13.5px] font-semibold text-gray-800 mb-1">No SOWs in the approval pipeline</p>
            <p className="text-xs text-gray-500 max-w-[280px]">SOWs submitted for approval will appear here with real-time pipeline status.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={24} style={{ color: "var(--ink-faint)", opacity: 0.35, marginBottom: 10 }} />
            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>No SOWs match your filters</p>
            <button onClick={() => { setSearch(""); setSlaFilter(null); setIntakeFilter("all"); setStageFilter(null); }}
              className="mt-2.5 text-[12px] font-medium hover:underline" style={{ color: "var(--color-brown-500)" }}>
              Clear all filters
            </button>
          </div>
        ) : (
          paginated.map((sow) => (
            <SOWPipelineRow key={sow.id} sow={sow} onStageResolved={handleRowStage} />
          ))
        )}

        {/* ── Pagination footer ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>Rows per page</span>
              <div className="flex items-center gap-1">
                {[10, 25, 50].map((n) => (
                  <button key={n} onClick={() => { setPageSize(n); setCurrentPage(1); }}
                    className="w-8 h-7 rounded-md text-[11px] font-medium transition-colors"
                    style={{ background: pageSize === n ? "var(--ink)" : "transparent", color: pageSize === n ? "var(--page-bg)" : "var(--ink-muted)", border: pageSize === n ? "none" : "1px solid var(--border-soft)" }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                  className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…"
                      ? <span key={`el-${i}`} className="w-7 text-center text-[11px]" style={{ color: "var(--ink-faint)" }}>…</span>
                      : <button key={p} onClick={() => setCurrentPage(p as number)}
                          className="w-7 h-7 rounded-lg text-[11px] font-medium transition-colors"
                          style={{ background: currentPage === p ? "var(--color-brown-500)" : "transparent", color: currentPage === p ? "#fff" : "var(--ink-muted)", border: currentPage === p ? "none" : "1px solid var(--border-soft)" }}>
                          {p}
                        </button>
                  )}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                  className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
