"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Eye, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Scale,
  UserCheck, DollarSign, Pen, Layers,
  X, Filter, Check, Send, Undo2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  useManualSOWList,
  useApprovalStages,
  useRecordApprovalDecision,
} from "@/lib/hooks/use-manual-sow";
import { useSowList } from "@/lib/hooks/use-sow-wizard";
import { useSOWPipelineStore } from "@/lib/stores/sow-pipeline-store";

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

interface ApiStageDecision {
  decision?: string;
  comments?: string;
  message?: string;
  text?: string;
  decided_at?: string;
  created_at?: string;
  decided_by?: string | { name?: string; email?: string };
  reviewer?: string;
  resolved?: boolean;
  resolved_at?: string;
  resolve_message?: string;
}

interface ApiStage {
  stage: number;
  stage_name?: string;
  status: "pending" | "in_progress" | "approved" | "rejected" | "changes_requested" | string;
  reviewer?: string;
  reviewed_at?: string;
  comments?: string;
  decision?: string;
  decisions?: ApiStageDecision[];
}

export interface ChangeRequestRow {
  id: string;
  sowId: string;
  sowTitle: string;
  client: string;
  requestedBy: string;
  message: string;
  resolveMessage?: string;
  resolved: boolean;
  resolvedAt?: string;
  stage: number;
  kind: "comment" | "request_changes";
}

interface NormalisedSOW {
  id: string;
  title: string;
  client: string;
  estimatedBudget?: number;
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
  // If any stage has changes_requested, stay on the earliest one
  for (let i = 1; i <= 5; i++) {
    const s = stages.find((x) => x.stage === i);
    const st = String(s?.status ?? "").toLowerCase();
    if (st === "changes_requested" || st === "rejected") return i;
  }
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
              style={{ width: 22, height: 22, fontSize: 9, fontWeight: 700,
                background: done ? "var(--color-forest-600)" : active ? stageColor : "transparent",
                border: done || active ? "none" : "1.5px solid var(--border-soft)",
                color: done || active ? "#fff" : "var(--ink-faint)" }}>
              {done ? <Check size={10} /> : n}
            </div>
            {n < 5 && (
              <div className="flex items-center justify-center" style={{ color: done ? "var(--color-forest-400)" : "var(--ink-faint)", opacity: done ? 0.8 : 0.35, fontSize: 10, fontWeight: 600, margin: "0 1px" }}>
                &rsaquo;
              </div> 
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── SOW pipeline row ──────────────────────────────────────────────────────

function SOWPipelineRow({ sow, onStageResolved, onDecisionsResolved }: {
  sow: NormalisedSOW;
  onStageResolved?: (sowId: string, activeStage: number) => void;
  onDecisionsResolved?: (sowId: string, rows: ChangeRequestRow[]) => void;
}) {
  const { data: pipelineRes, isLoading: pipelineLoading } = useApprovalStages(sow.id);
  // Keep hook instantiated so we don't break rules of hooks, even though we no longer render decision panels here
  useRecordApprovalDecision(sow.id);

  const apiStages = extractPipelineStages(pipelineRes);

  // Debug: log the raw pipeline response so we can inspect its shape
  React.useEffect(() => {
    if (pipelineRes && typeof window !== "undefined") {
      console.log(`[pipeline:${sow.id}]`, pipelineRes);
    }
  }, [pipelineRes, sow.id]);

  const currentStage = apiStages.length > 0 ? computeActiveStage(apiStages) : 1;
  const completedStages = computeCompleted(apiStages);
  const stageCfg = PIPELINE_STAGES[currentStage - 1] ?? PIPELINE_STAGES[0];

  // Detect if any stage is in changes_requested / rejected state
  const changesRequestedStage = apiStages.find((s) => {
    const st = String(s.status ?? "").toLowerCase();
    return st === "changes_requested" || st === "rejected";
  });

  // Extract comment + request_changes decisions for the Change Request History table.
  // Handles multiple API shapes:
  //   1. stage.decisions[] — array of decision records
  //   2. stage.comments (string) + stage.status === changes_requested/rejected
  //   3. data.decisions / data.comments at the pipeline root level
  const decisionRows = React.useMemo<ChangeRequestRow[]>(() => {
    const rows: ChangeRequestRow[] = [];

    const pushDecision = (
      d: ApiStageDecision,
      stageNum: number,
      idxKey: string | number,
    ) => {
      const decisionType = String(d.decision ?? "").toLowerCase();
      if (decisionType !== "comment" && decisionType !== "request_changes") return;
      const requestedBy = typeof d.decided_by === "string"
        ? d.decided_by
        : String((d.decided_by as { name?: string; email?: string })?.name ?? (d.decided_by as { name?: string; email?: string })?.email ?? d.reviewer ?? "Enterprise Admin");
      rows.push({
        id: `${sow.id}-${stageNum}-${idxKey}`,
        sowId: sow.id,
        sowTitle: sow.title,
        client: sow.client,
        requestedBy,
        message: String(d.comments ?? d.message ?? d.text ?? ""),
        resolveMessage: d.resolve_message,
        resolved: !!d.resolved || !!d.resolved_at,
        resolvedAt: d.resolved_at ?? d.decided_at ?? d.created_at,
        stage: stageNum,
        kind: decisionType as "comment" | "request_changes",
      });
    };

    apiStages.forEach((s) => {
      const stageNum = s.stage;
      // Case 1: array of decisions on the stage
      const ds = Array.isArray(s.decisions) ? s.decisions : [];
      ds.forEach((d, i) => pushDecision(d, stageNum, i));

      // Case 2: single comment stored on the stage + changes_requested/rejected status
      const st = String(s.status ?? "").toLowerCase();
      const stageComment = s.comments ? String(s.comments) : "";
      if (stageComment && (st === "changes_requested" || st === "rejected")) {
        rows.push({
          id: `${sow.id}-${stageNum}-rc`,
          sowId: sow.id,
          sowTitle: sow.title,
          client: sow.client,
          requestedBy: String(s.reviewer ?? "Glimmora Admin"),
          message: stageComment,
          resolved: false,
          resolvedAt: s.reviewed_at,
          stage: stageNum,
          kind: "request_changes",
        });
      }
    });

    // Case 3: decisions at the pipeline root level (not nested per stage)
    const r = pipelineRes as Record<string, unknown> | undefined;
    const d = (r?.data ?? r) as Record<string, unknown> | undefined;
    for (const key of ["decisions", "comments", "history", "change_requests"]) {
      const arr = d?.[key];
      if (Array.isArray(arr)) {
        arr.forEach((entry, i) => {
          const rawStage = (entry as Record<string, unknown>).stage ?? (entry as Record<string, unknown>).stage_number ?? 1;
          pushDecision(entry as ApiStageDecision, Number(rawStage), `root-${i}`);
        });
      }
    }

    // Deduplicate by id
    const seen = new Set<string>();
    return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineRes]);

  React.useEffect(() => {
    if (!pipelineLoading) onStageResolved?.(sow.id, currentStage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineLoading, currentStage, sow.id]);

  React.useEffect(() => {
    if (!pipelineLoading) onDecisionsResolved?.(sow.id, decisionRows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineLoading, decisionRows, sow.id]);

  // Initials for approver avatar
  const initials = "EA";

  return (
    <div
      className="grid items-start gap-4 px-5 py-4 transition-colors hover:bg-amber-50/20"
      style={{
        gridTemplateColumns: "1.8fr 1fr 2fr 1.1fr auto",
        borderBottom: "1px solid var(--border-hair)",
      }}
    >
      {/* SOW column */}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>{sow.title}</p>
        {sow.estimatedBudget != null && sow.estimatedBudget > 0 ? (
          <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--ink-faint)" }}>
            ${sow.estimatedBudget.toLocaleString()}
          </p>
        ) : null}
      </div>

      {/* Client column */}
      <div className="min-w-0 pt-0.5">
        <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-muted)" }}>{sow.client || "—"}</p>
      </div>

      {/* Pipeline progress column */}
      <div className="min-w-0">
        {pipelineLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
        ) : (
          <div>
            <PipelineDots currentStage={currentStage} completedStages={completedStages} stageColor={stageCfg.color} />
            <div className="mt-1.5">
              <span className="text-[10.5px] font-semibold block leading-tight" style={{ color: stageCfg.color }}>
                {stageCfg.name}
              </span>
              <span className="text-[10px] mt-0.5 block" style={{ color: "var(--ink-faint)" }}>
                {completedStages.length}/5 stages complete
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Approver column */}
      <div className="flex items-center gap-2 pt-0.5">
        <div
          className="flex items-center justify-center rounded-full shrink-0 text-[10px] font-bold text-white"
          style={{ width: 28, height: 28, background: "var(--color-brown-500)" }}
        >
          {initials}
        </div>
        <span className="text-[11.5px] leading-snug" style={{ color: "var(--ink-muted)" }}>Enterprise Admin</span>
      </div>

      {/* SLA + View column */}
      <div className="flex flex-col items-end gap-1.5 pt-0.5">
        {changesRequestedStage ? (
          <Badge variant="gold" size="sm" dot>Changes Requested</Badge>
        ) : (
          <Badge variant={slaVariant(sow.slaStatus)} size="sm" dot>{slaLabel(sow.slaStatus)}</Badge>
        )}
        <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--ink-faint)" }}>{formatDate(sow.submittedAt)}</span>
        <Link href={`/enterprise/sow/approval/${sow.id}`}>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80"
            style={{ background: stageCfg.bgColor, color: stageCfg.color, border: `1px solid ${stageCfg.color}22` }}
          >
            <Eye size={10} /> View
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

type ActiveTab = "all" | "s1" | "s2" | "s3" | "s4" | "s5" | "on-track" | "at-risk" | "overdue";

export default function SOWApprovalPipelinePage() {
  const [search, setSearch]           = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<number | null>(null);
  const [slaFilter, setSlaFilter]     = React.useState<"on-track" | "at-risk" | "overdue" | null>(null);
  const [activeTab, setActiveTab]     = React.useState<ActiveTab>("all");
  const [pageSize, setPageSize]       = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

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

  // Aggregate change-request decisions (comment + request_changes) from all pipelines
  const [decisionsMap, setDecisionsMap] = React.useState<Record<string, ChangeRequestRow[]>>({});
  const handleRowDecisions = React.useCallback((sowId: string, rows: ChangeRequestRow[]) => {
    setDecisionsMap((prev) => {
      const prevJson = JSON.stringify(prev[sowId] ?? []);
      const nextJson = JSON.stringify(rows);
      if (prevJson === nextJson) return prev;
      return { ...prev, [sowId]: rows };
    });
  }, []);
  const allDecisionRows = React.useMemo<ChangeRequestRow[]>(() => {
    return Object.values(decisionsMap).flat().sort((a, b) => {
      const ta = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0;
      const tb = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0;
      return tb - ta;
    });
  }, [decisionsMap]);

  // Resolve state: which row is being resolved, the text, and the mutation
  const [resolveRowId, setResolveRowId] = React.useState<string | null>(null);
  const [resolveText, setResolveText]   = React.useState("");
  const [resolvingSowId, setResolvingSowId] = React.useState<string | null>(null);
  const resolveMutation = useRecordApprovalDecision(resolvingSowId);
  const updatePipelineSOW = useSOWPipelineStore((s) => s.updateSOW);

  const openResolve = (row: ChangeRequestRow) => {
    setResolveRowId(row.id);
    setResolvingSowId(row.sowId);
    setResolveText("");
  };
  const closeResolve = () => {
    setResolveRowId(null);
    setResolveText("");
  };
  const submitResolve = (row: ChangeRequestRow) => {
    if (!resolveText.trim()) return;
    resolveMutation.mutate(
      { stage: row.stage, decision: "resolve" as never, comments: resolveText.trim() },
      {
        onSuccess: () => {
          toast.success("Change request resolved", "Your response has been sent to Glimmora admin for review.");
          if (resolvingSowId) updatePipelineSOW(resolvingSowId, { changesRequested: false });
          closeResolve();
        },
        onError: (err) => {
          toast.error("Failed to resolve", err instanceof Error ? err.message : "Please try again.");
        },
      }
    );
  };

  const { data: manualRes, isLoading: manualLoading } = useManualSOWList();
  const { data: aiRes,     isLoading: aiLoading }     = useSowList();
  const isLoading = manualLoading || aiLoading;

  const allSows: NormalisedSOW[] = React.useMemo(() => {
    const manual = normalizeManualList(manualRes).filter((s) => MANUAL_APPROVAL_STATUSES.has(s.status));
    const ai     = normalizeAiList(aiRes).filter((s) => s.id);
    const manualIds = new Set(manual.map((s) => s.id));
    return [...ai.filter((s) => !manualIds.has(s.id)), ...manual];
  }, [manualRes, aiRes]);

  // Apply tab selection to filters
  function applyTab(tab: ActiveTab) {
    setActiveTab(tab);
    setStageFilter(null);
    setSlaFilter(null);
    if (tab === "all") return;
    if (tab === "s1") { setStageFilter(1); return; }
    if (tab === "s2") { setStageFilter(2); return; }
    if (tab === "s3") { setStageFilter(3); return; }
    if (tab === "s4") { setStageFilter(4); return; }
    if (tab === "s5") { setStageFilter(5); return; }
    if (tab === "on-track" || tab === "at-risk" || tab === "overdue") {
      setSlaFilter(tab);
    }
  }

  const filtered = React.useMemo(() => {
    let list = [...allSows];
    if (stageFilter !== null)   list = list.filter((s) => sowStageMap[s.id] === stageFilter);
    if (slaFilter)              list = list.filter((s) => s.slaStatus === slaFilter);
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.client.toLowerCase().includes(q));
    }
    return list;
  }, [allSows, slaFilter, search, stageFilter, sowStageMap]);

  React.useEffect(() => { setCurrentPage(1); }, [slaFilter, search, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onTrackCount = allSows.filter((s) => s.slaStatus === "on-track").length;
  const atRiskCount  = allSows.filter((s) => s.slaStatus === "at-risk").length;
  const overdueCount = allSows.filter((s) => s.slaStatus === "overdue").length;

  const FILTER_TABS: { key: ActiveTab; label: string }[] = [
    { key: "all",      label: "All"      },
    { key: "s1",       label: "S1"       },
    { key: "s2",       label: "S2"       },
    { key: "s3",       label: "S3"       },
    { key: "s4",       label: "S4"       },
    { key: "s5",       label: "S5"       },
    { key: "on-track", label: "On Track" },
    { key: "at-risk",  label: "At Risk"  },
    { key: "overdue",  label: "Overdue"  },
  ];

  // ── Skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-52 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-4 w-80 rounded bg-gray-100 animate-pulse" />
            <div className="flex gap-2 mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-7 w-36 rounded-full bg-gray-100 animate-pulse" />
        </div>

        {/* Stage cards skeleton */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)" }}>
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
            <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="flex divide-x" style={{ borderColor: "var(--border-hair)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 px-4 py-5">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-7 w-8 rounded bg-gray-100 animate-pulse" />
                <div className="h-2.5 w-14 rounded bg-gray-100 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)" }}>
          <div className="h-14 bg-gray-50 animate-pulse" style={{ borderBottom: "1px solid var(--border-hair)" }} />
          <div className="h-10 bg-gray-50 animate-pulse" style={{ borderBottom: "1px solid var(--border-hair)" }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-5 px-5 py-4" style={{ borderBottom: "1px solid var(--border-hair)" }}>
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-gray-100 animate-pulse" />
                <div className="h-2.5 w-1/4 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
              <div className="h-5 w-40 rounded bg-gray-100 animate-pulse" />
              <div className="h-7 w-20 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-14 w-24 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-heading" style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Approval Pipeline
          </h1>
          {/* Badge: SOWs in pipeline */}
          <span
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: "var(--color-brown-50)", color: "var(--color-brown-700)", border: "1px solid var(--color-brown-200)" }}
          >
            <Layers size={13} />
            {allSows.length} SOWs in Pipeline
          </span>
        </div>
        <p className="text-[13px] mb-3" style={{ color: "var(--ink-muted)" }}>
          Track and manage SOW approvals across the five-stage review process.
        </p>
        {/* SLA pill summary row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSlaFilter(slaFilter === "on-track" ? null : "on-track"); setActiveTab(slaFilter === "on-track" ? "all" : "on-track"); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all hover:opacity-80"
            style={{
              background: slaFilter === "on-track" ? "var(--color-forest-700)" : "var(--color-forest-50)",
              color: slaFilter === "on-track" ? "#fff" : "var(--color-forest-700)",
              border: "1px solid var(--color-forest-200)",
            }}
          >
            <CheckCircle2 size={12} /> {onTrackCount} On Track
          </button>
          <button
            onClick={() => { setSlaFilter(slaFilter === "at-risk" ? null : "at-risk"); setActiveTab(slaFilter === "at-risk" ? "all" : "at-risk"); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all hover:opacity-80"
            style={{
              background: slaFilter === "at-risk" ? "var(--color-gold-700)" : "var(--color-gold-50)",
              color: slaFilter === "at-risk" ? "#fff" : "var(--color-gold-700)",
              border: "1px solid var(--color-gold-200)",
            }}
          >
            <AlertTriangle size={12} /> {atRiskCount} At Risk
          </button>
          <button
            onClick={() => { setSlaFilter(slaFilter === "overdue" ? null : "overdue"); setActiveTab(slaFilter === "overdue" ? "all" : "overdue"); }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all hover:opacity-80"
            style={{
              background: slaFilter === "overdue" ? "var(--danger)" : "rgba(239,68,68,0.06)",
              color: slaFilter === "overdue" ? "#fff" : "var(--danger)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Clock size={12} /> {overdueCount} Overdue
          </button>
        </div>
      </motion.div>

      {/* ── Pipeline Stages section ── */}
      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Pipeline Stages</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const count = computedStageCounts[stage.number] ?? 0;
            const isActive = stageFilter === stage.number;
            return (
              <button
                key={stage.number}
                onClick={() => {
                  const next = isActive ? null : stage.number;
                  setStageFilter(next);
                  if (next === null) setActiveTab("all");
                  else setActiveTab(`s${stage.number}` as ActiveTab);
                }}
                className="flex flex-col gap-3 px-4 py-5 text-left transition-all hover:brightness-[0.97]"
                style={{
                  borderRight: idx < 4 ? "1px solid var(--border-hair)" : "none",
                  background: isActive ? stage.bgColor : "transparent",
                  borderTop: isActive ? `2px solid ${stage.color}` : "2px solid transparent",
                }}
              >
                {/* Top: icon + count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center rounded-xl shrink-0"
                    style={{ width: 36, height: 36, background: isActive ? stage.color : stage.bgColor }}>
                    <Icon size={16} style={{ color: isActive ? "#fff" : stage.color }} />
                  </div>
                  <div className="text-right">
                    <div className="text-[1.75rem] font-bold leading-none" style={{ color: isActive ? stage.color : "var(--ink-dark)" }}>{count}</div>
                    <div className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: "var(--ink-faint)" }}>SOWs</div>
                  </div>
                </div>

                {/* Stage label + name */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: stage.color }}>
                    Stage {stage.number}
                  </div>
                  <div className="text-[11.5px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                    {stage.name}
                  </div>
                </div>

                {/* SLA info */}
                <div className="mt-auto pt-2" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  {stage.number === 2 && (
                    <div className="text-[10px] leading-snug mb-1.5" style={{ color: "var(--ink-faint)" }}>
                      {stage.slaDescription} standard, auto-escalation after 4
                    </div>
                  )}
                  <div className="flex items-center gap-1" style={{ color: "var(--ink-faint)" }}>
                    <Clock size={10} />
                    <span className="text-[10.5px]">{stage.slaDescription}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Main table card ── */}
      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)" }}>

        {/* Filters bar */}
        <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          {/* FILTERS button */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold shrink-0 transition-colors hover:bg-gray-50"
            style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}
          >
            <Filter size={12} />
            FILTERS
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
            <input
              type="text"
              placeholder="Search by title or client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg py-1.5 pl-8 pr-8 text-[12px] outline-none"
              style={{ background: "var(--color-gray-50)", border: "1px solid var(--border-soft)", color: "var(--ink)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X size={11} style={{ color: "var(--ink-faint)" }} />
              </button>
            )}
          </div>

          {/* Pill tabs */}
          <div className="flex items-center gap-1 ml-auto">
            {FILTER_TABS.map(({ key, label }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => applyTab(key)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? "var(--color-brown-600)" : "transparent",
                    color: isActive ? "#fff" : "var(--ink-muted)",
                    border: isActive ? "1px solid var(--color-brown-600)" : "1px solid var(--border-soft)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid items-center gap-3 px-5 py-2.5"
          style={{
            gridTemplateColumns: "2fr 1fr 2.2fr 1fr 1fr",
            background: "var(--color-gray-50)",
            borderBottom: "1px solid var(--border-hair)",
          }}
        >
          {["SOW", "CLIENT", "PIPELINE PROGRESS", "APPROVER", "SLA"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {allSows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "var(--color-brown-100)" }}>
              <Layers className="w-5 h-5" style={{ color: "var(--color-brown-600)" }} />
            </div>
            <p className="text-[13.5px] font-semibold mb-1" style={{ color: "var(--ink)" }}>No SOWs in the approval pipeline</p>
            <p className="text-[12px] max-w-70" style={{ color: "var(--ink-faint)" }}>SOWs submitted for approval will appear here with real-time pipeline status.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={24} style={{ color: "var(--ink-faint)", opacity: 0.35, marginBottom: 10 }} />
            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>No SOWs match your filters</p>
            <button
              onClick={() => { setSearch(""); setSlaFilter(null); setStageFilter(null); setActiveTab("all"); }}
              className="mt-2.5 text-[12px] font-medium hover:underline"
              style={{ color: "var(--color-brown-500)" }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          paginated.map((sow) => (
            <SOWPipelineRow key={sow.id} sow={sow} onStageResolved={handleRowStage} onDecisionsResolved={handleRowDecisions} />
          ))
        )}

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
          />
        )}
      </motion.div>

      {/* ── Change Request History ── */}
      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Change Request History</span>
          <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>{allDecisionRows.length} total</span>
        </div>

        {/* Column headers */}
        <div
          className="grid items-center gap-4 px-5 py-2.5"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 2fr 0.9fr",
            background: "var(--color-gray-50)",
            borderBottom: "1px solid var(--border-hair)",
          }}
        >
          {["SOW TITLE", "CLIENT", "REQUESTED BY", "MESSAGE", "STATUS"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>{h}</span>
          ))}
        </div>

        {allDecisionRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Clock size={22} style={{ color: "var(--ink-faint)", opacity: 0.35 }} />
            <p className="text-[12.5px]" style={{ color: "var(--ink-faint)" }}>No change requests yet.</p>
          </div>
        ) : (
          allDecisionRows.map((row, i) => {
            const isResolving   = resolveRowId === row.id;
            const canResolve    = row.kind === "request_changes" && !row.resolved;
            return (
              <React.Fragment key={row.id}>
                <div
                  className="grid items-start gap-4 px-5 py-3.5 transition-colors hover:bg-amber-50/20"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 2fr 0.9fr",
                    borderBottom: !isResolving && i < allDecisionRows.length - 1 ? "1px solid var(--border-hair)" : undefined,
                  }}
                >
                  <div className="min-w-0">
                    <Link href={`/enterprise/sow/${row.sowId}`} className="text-[11.5px] font-semibold leading-snug hover:underline" style={{ color: "var(--ink)" }}>
                      {row.sowTitle}
                    </Link>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--ink-faint)" }}>
                      Stage {row.stage} · {row.kind === "comment" ? "Comment" : "Change Request"}
                    </p>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-muted)" }}>{row.client || "—"}</p>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-muted)" }}>{row.requestedBy}</p>
                    {row.resolvedAt && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-faint)" }}>{formatDate(row.resolvedAt)}</p>
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11.5px] leading-snug" style={{ color: "var(--ink-muted)" }}>{row.message || "—"}</p>
                    {row.resolveMessage && (
                      <p className="text-[10.5px] italic mt-1" style={{ color: "var(--ink-faint)" }}>Resolved: {row.resolveMessage}</p>
                    )}
                  </div>
                  <div className="pt-0.5 flex flex-col items-start gap-1.5">
                    <Badge variant={row.resolved ? "forest" : row.kind === "request_changes" ? "gold" : "teal"} size="sm" dot>
                      {row.resolved ? "Resolved" : row.kind === "request_changes" ? "Pending" : "Open"}
                    </Badge>
                    {canResolve && !isResolving && (
                      <button
                        onClick={() => openResolve(row)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all hover:opacity-90"
                        style={{ background: "var(--color-brown-500)", color: "#fff" }}
                      >
                        <Undo2 size={10} /> Resolve
                      </button>
                    )}
                  </div>
                </div>

                {isResolving && (
                  <div
                    className="px-5 py-4 bg-amber-50/30"
                    style={{ borderBottom: i < allDecisionRows.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--color-brown-500)" }}>
                        <Undo2 size={12} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: "var(--ink)" }}>Resolve change request</p>
                        <p className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                          Describe what you changed. This will be sent to Glimmora admin for re-approval.
                        </p>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={600}
                      value={resolveText}
                      onChange={(e) => setResolveText(e.target.value)}
                      placeholder="Explain how you addressed the change request..."
                      className="w-full rounded-xl px-3 py-2.5 text-[12px] leading-relaxed resize-none focus:outline-none transition-all border bg-white"
                      style={{ borderColor: "var(--border-soft)", color: "var(--ink)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brown-400)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(166,119,99,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>{resolveText.length}/600</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={closeResolve}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{ background: "var(--color-gray-100)", color: "var(--ink-muted)" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitResolve(row)}
                          disabled={!resolveText.trim() || resolveMutation.isPending}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "var(--color-brown-500)" }}
                        >
                          <Send size={10} />
                          {resolveMutation.isPending ? "Sending…" : "Send to Admin"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </motion.div>

    </motion.div>
  );
}
