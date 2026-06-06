"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, FileText, Shield, ShieldCheck, DollarSign,
  Clock, Sparkles, Scale, XCircle, Send, MessageSquare, Paperclip, File,
  ImageIcon, Building2, GitBranch, Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Checkbox, Textarea, Skeleton } from "@/components/ui";
import type { ApprovalStage } from "@/types/enterprise";
import {
  useSOWDetail,
  useApprovalStages,
  useApproveStage,
  useRejectStage,
  useRecordApprovalDecision,
} from "@/lib/hooks/use-manual-sow";
import { useEmailTemplateStore } from "@/lib/stores/email-template-store";
import { fetchInternal } from "@/lib/api/client";

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

/* ═══ Stage config ═══ */

const stageLabels: Record<string, string> = {
  business:            "Business Owner",
  glimmora_commercial: "GlimmoraTeam Commercial",
  legal:               "Legal / Compliance",
  security:            "Security Review",
  final:               "Final Sign-off",
};
const stageDesc: Record<string, string> = {
  business:            "Verify budget, scope, and business alignment",
  glimmora_commercial: "Validate budget viability, rate cards, and contracted value",
  legal:               "Review contractual terms and compliance",
  security:            "Assess data sensitivity and security requirements",
  final:               "Executive sign-off for project initiation",
};
const stageIcons: Record<string, LucideIcon> = {
  business: DollarSign, glimmora_commercial: Target,
  legal: Scale, security: Shield, final: ShieldCheck,
};

interface CLI { id: string; label: string; description: string; }
const stageChecklists: Record<ApprovalStage, CLI[]> = {
  business: [
    { id: "scope-align",  label: "Scope aligns with business objectives", description: "SOW deliverables match strategic goals" },
    { id: "budget-ok",    label: "Budget within procurement limits",       description: "Cost falls within approved spending authority" },
    { id: "timeline-ok",  label: "Timeline is feasible",                  description: "Milestone dates are realistic" },
    { id: "stakeholders", label: "Stakeholders identified and notified",   description: "All decision-makers are listed and aware" },
  ],
  glimmora_commercial: [
    { id: "rate-card",        label: "Rate card alignment verified",        description: "All declared roles have configured rate cards" },
    { id: "margin-ok",        label: "Margin and fee structure approved",   description: "Budget viability vs scope confirmed" },
    { id: "resource-avail",   label: "Resource availability confirmed",     description: "Contributor matching feasible for declared skills" },
    { id: "commercial-terms", label: "Commercial terms standard-compliant", description: "Pricing model and payment schedule supported" },
  ],
  legal: [
    { id: "ip-rights",  label: "IP rights and ownership clauses reviewed", description: "Intellectual property terms are acceptable" },
    { id: "liability",  label: "Liability and indemnification verified",   description: "Risk allocation is balanced" },
    { id: "compliance", label: "Regulatory compliance confirmed",          description: "Meets all applicable regulations" },
    { id: "terms",      label: "Standard terms applied",                  description: "Terms match approved templates" },
  ],
  security: [
    { id: "data-class",  label: "Data classification appropriate",        description: "Sensitivity level matches data types" },
    { id: "access-ctrl", label: "Access controls specified",              description: "Auth requirements are defined" },
    { id: "encryption",  label: "Encryption requirements met",            description: "Data protection standards met" },
    { id: "audit-trail", label: "Audit logging requirements defined",     description: "Traceability mechanisms in place" },
  ],
  final: [
    { id: "all-stages",  label: "All prior stages approved",   description: "Business, Commercial, Legal, and Security reviews complete" },
    { id: "risk-accept", label: "Residual risks accepted",     description: "Outstanding risks documented" },
    { id: "decomp-ready",label: "Ready for decomposition",     description: "SOW can be broken into tasks" },
  ],
};

const stageNumToKey: Record<number, ApprovalStage> = {
  1: "business", 2: "glimmora_commercial", 3: "legal", 4: "security", 5: "final",
};
const stageKeys: ApprovalStage[] = ["business", "glimmora_commercial", "legal", "security", "final"];

function riskVariant(s: number) { return s <= 25 ? "forest" : s <= 50 ? "gold" : "danger"; }
const statusVariant: Record<string, string> = {
  draft: "beige", parsing: "teal", review: "teal", approval: "gold",
  approved: "forest", archived: "beige", rejected: "danger", changes_requested: "gold",
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

type ChatMsg = {
  from: "enterprise" | "glimmora";
  text: string;
  time: string;
  stageLabel?: string;
  files?: { name: string; size: number; type: string }[];
};

/* ═══ PAGE ═══ */

export default function SOWApprovePage() {
  const params = useParams();
  const router = useRouter();
  const sowId  = params.sowId as string;

  /* ── API data ── */
  const { data: apiSowData, isLoading: sowLoading } = useSOWDetail(sowId);
  // Poll every 15 s so newly recorded decisions appear automatically
  const { data: stagesRes, isLoading: stagesLoading } = useApprovalStages(sowId, 15000);
  const approveStageMutation = useApproveStage(sowId);
  const rejectStageMutation  = useRejectStage(sowId);
  const recordDecision       = useRecordApprovalDecision(sowId);
  const getEmailTemplate     = useEmailTemplateStore((s) => s.getTemplate);

  function fireEmail(event: string, payload: Record<string, string>) {
    const tmpl = getEmailTemplate(event as Parameters<typeof getEmailTemplate>[0]);
    if (!tmpl?.isActive) return;
    fetchInternal("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, subject: tmpl.subject, headerColor: tmpl.headerColor, logoUrl: tmpl.logoUrl, footerText: tmpl.footerText }),
    }).catch(() => {});
  }

  /* ── Derive SOW (supports both AI and manual SOWs) ── */
  const raw = apiSowData as Record<string, unknown> | null;
  const gc  = (raw?.generated_content ?? {}) as Record<string, unknown>;
  const sowTitle   = String(raw?.projectTitle ?? gc.document_title ?? raw?.title ?? raw?.project_title ?? "Untitled SOW");
  const sowClient  = String(raw?.clientOrganisation ?? raw?.client ?? raw?.client_organisation ?? gc.client_name ?? "");
  const sowStatus  = String(raw?.status ?? "approval");
  const sowVersion = Number(raw?.version ?? 1);
  const sowPages   = Number(raw?.pages ?? raw?.page_count ?? 0);
  const riskRaw    = raw?.risk_score ?? raw?.riskScore ?? { overall: 0 };
  const sowRiskScore = { overall: typeof riskRaw === "number" ? riskRaw : Number((riskRaw as Record<string, unknown>)?.overall ?? 0) };
  const sowCreatedBy = String(raw?.created_by ?? raw?.createdBy ?? "Enterprise Admin");

  /* ── Derive pipeline stages from GET /api/v1/approvals/{sow_id} ── */
  const pipelineRaw = (stagesRes as unknown as Record<string, unknown>)?.data as Record<string, unknown> | unknown[] | undefined;

  // The API may return data as an object with a `stages` array, or directly as an array
  const rawStagesArr: Record<string, unknown>[] = (() => {
    if (Array.isArray(pipelineRaw)) return pipelineRaw as Record<string, unknown>[];
    if (pipelineRaw && typeof pipelineRaw === "object") {
      const obj = pipelineRaw as Record<string, unknown>;
      if (Array.isArray(obj.stages)) return obj.stages as Record<string, unknown>[];
      if (Array.isArray(obj.approval_stages)) return obj.approval_stages as Record<string, unknown>[];
    }
    return [];
  })();

  const currentActiveStage: number | null = (() => {
    if (!pipelineRaw || Array.isArray(pipelineRaw)) return null;
    const obj = pipelineRaw as Record<string, unknown>;
    return (obj.current_active_stage ?? obj.currentStage ?? null) as number | null;
  })();

  const apiStages: { stage: ApprovalStage; status: string; reviewer?: string; reviewedAt?: string; comments?: string; decisions: Record<string, unknown>[] }[] = (() => {
    if (rawStagesArr.length > 0) {
      return rawStagesArr.map((s) => {
        const stageNum = (s.stage_number ?? s.stage) as number;
        const stageKey = stageNumToKey[stageNum] ?? stageKeys[stageNum - 1] ?? "business";
        const rawStatus = String(s.status ?? "pending").toLowerCase();
        const status =
          rawStatus === "approved" ? "approved" :
          rawStatus === "rejected" || rawStatus === "changes_requested" ? "rejected" :
          rawStatus === "in_review" || rawStatus === "active" ? "in_review" :
          "pending";
        return {
          stage:      stageKey,
          status,
          reviewer:   (s.reviewer_name ?? s.reviewer) as string | undefined,
          reviewedAt: (s.decided_at ?? s.updated_at ?? s.reviewed_at) as string | undefined,
          comments:   s.comments as string | undefined,
          decisions:  Array.isArray(s.decisions) ? s.decisions as Record<string, unknown>[] : [],
        };
      });
    }
    return stageKeys.map((k) => ({ stage: k, status: "pending", decisions: [] }));
  })();

  const fullStages = stageKeys.map((key) => {
    const existing = apiStages.find((s) => s.stage === key);
    return existing ?? { stage: key, status: "pending", decisions: [] };
  });

  const firstPendingKey = currentActiveStage
    ? stageNumToKey[currentActiveStage]
    : fullStages.find((s) => s.status === "pending")?.stage;

  const finalStages = fullStages.map((s) =>
    s.stage === firstPendingKey && s.status === "pending" ? { ...s, status: "in_review" } : s,
  );

  const sow = {
    id: sowId, title: sowTitle, client: sowClient, status: sowStatus,
    version: sowVersion, pages: sowPages, riskScore: sowRiskScore,
    createdBy: sowCreatedBy, approvalStages: finalStages,
  };

  const activeStageIndex = sow.approvalStages.findIndex((s) => s.status === "in_review");
  const activeStage      = activeStageIndex >= 0 ? sow.approvalStages[activeStageIndex] : null;
  const activeChecklist  = activeStage ? stageChecklists[activeStage.stage] : [];

  const [checked, setChecked]                       = React.useState<Record<string, boolean>>({});
  const [comments, setComments]                     = React.useState("");
  const [showRejectForm, setShowRejectForm]         = React.useState(false);
  const [rejectionReason, setRejectionReason]       = React.useState("");
  const [rejectionSubmitted, setRejectionSubmitted] = React.useState(false);
  const [approvalSubmitted, setApprovalSubmitted]   = React.useState(false);

  const allChecked     = activeChecklist.every((item) => checked[item.id]);
  const checkedCount   = activeChecklist.filter((item) => checked[item.id]).length;
  const allStagesApproved = sow.approvalStages.every((s) => s.status === "approved");

  /* ── Build chat messages from pipeline decisions ── */
  const apiChatMessages: ChatMsg[] = React.useMemo(() => {
    const msgs: ChatMsg[] = [];
    fullStages.forEach((s) => {
      const label = stageLabels[s.stage] ?? s.stage;

      // Surface stage-level comment (from the approve/reject action)
      const stageComment = s.comments as string | undefined;
      if (stageComment?.trim()) {
        const rawStage = rawStagesArr.find((r) => {
          const n = (r.stage_number ?? r.stage) as number;
          return (stageNumToKey[n] ?? stageKeys[n - 1]) === s.stage;
        });
        const time   = String(rawStage?.decided_at ?? rawStage?.updated_at ?? "");
        const reviewer = String(rawStage?.reviewer_name ?? rawStage?.reviewer ?? "");
        const isGlimmora = reviewer.toLowerCase().includes("glimmora") || reviewer.toLowerCase().includes("admin");
        msgs.push({
          from: isGlimmora ? "glimmora" : "enterprise",
          text: stageComment,
          time: time ? fmtTime(time) : "",
          stageLabel: label,
        });
      }

      // Also include individual decision entries if present
      (s.decisions ?? []).forEach((d) => {
        const decisionType = String(d.decision ?? d.type ?? "comment").toLowerCase();
        const text         = String(d.comments ?? d.message ?? d.text ?? "");
        const time         = String(d.decided_at ?? d.created_at ?? d.timestamp ?? "");
        const authorName   = String((d.decided_by as Record<string, unknown>)?.name ?? d.decided_by ?? d.author ?? d.reviewer ?? "");
        if (!text) return;

        const isGlimmora = decisionType === "approve" || authorName.toLowerCase().includes("glimmora") || authorName.toLowerCase().includes("admin");
        msgs.push({
          from: isGlimmora ? "glimmora" : "enterprise",
          text,
          time: time ? fmtTime(time) : "",
          stageLabel: label,
        });

        if (d.reply) {
          msgs.push({
            from: "glimmora",
            text: String(d.reply),
            time: time ? fmtTime(time) : "",
            stageLabel: label,
          });
        }
      });
    });
    return msgs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagesRes]);

  const [chatMessages, setChatMessages] = React.useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = React.useState("");
  const [chatFiles, setChatFiles]       = React.useState<{ name: string; size: number; type: string }[]>([]);
  const chatFileRef                     = React.useRef<HTMLInputElement>(null);
  const chatScrollRef                   = React.useRef<HTMLDivElement>(null);

  // Sync API decisions into chat messages once loaded
  React.useEffect(() => {
    if (apiChatMessages.length > 0) {
      setChatMessages(apiChatMessages);
    }
  }, [apiChatMessages]);

  React.useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);

  function handleChatSend() {
    if (!chatInput.trim() && chatFiles.length === 0) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const msg: ChatMsg = {
      from: "enterprise",
      text: chatInput.trim(),
      time: now,
      files: chatFiles.length > 0 ? [...chatFiles] : undefined,
    };
    setChatMessages((prev) => [...prev, msg]);
    const text = chatInput.trim();
    setChatInput("");
    setChatFiles([]);

    // Send comment to API if there's an active stage
    if (text && activeStage) {
      recordDecision.mutate(
        { stage: activeStageIndex + 1, decision: "comment" as any, comments: text },
        {
          onError: () => {
            // Show simulated acknowledgement if API fails
            setTimeout(() => {
              setChatMessages((prev) => [...prev, {
                from: "glimmora",
                text: "Message received. Our team will review and respond shortly.",
                time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
              }]);
            }, 1200);
          },
        }
      );
    } else if (!activeStage) {
      // Simulate reply when no active stage (pipeline complete)
      setTimeout(() => {
        setChatMessages((prev) => [...prev, {
          from: "glimmora",
          text: "Message received. Our team will review and respond shortly.",
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }]);
      }, 1200);
    }
  }

  /* ── Approve / reject handlers ── */
  function handleApproveStage() {
    if (!activeStage) return;
    const isFinalStage = activeStage.stage === "final";
    const stageLabelsMap: Record<string, string> = {
      business: "Business Owner Review", glimmora_commercial: "GlimmoraTeam Commercial Review",
      legal: "Legal / Compliance Review", security: "Security Review", final: "Final Sign-off",
    };
    const nextStageKey  = stageKeys[activeStageIndex + 1];
    const nextStageName = nextStageKey ? stageLabelsMap[nextStageKey] : undefined;
    const baseUrl       = typeof window !== "undefined" ? window.location.origin : "";
    const sowUrl        = `${baseUrl}/enterprise/sow/${sow.id}/approve`;

    approveStageMutation.mutate(
      { stageKey: activeStage.stage, data: { reviewer: "Enterprise Admin", comments: comments || undefined, checklist: checked } },
      {
        onSuccess: () => {
          if (isFinalStage) {
            fireEmail("sow_fully_approved", { adminName: "Enterprise Admin", sowTitle: sow.title, approvedAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), sowUrl });
            setApprovalSubmitted(true);
            setTimeout(() => router.push("/enterprise/sow"), 2000);
          } else {
            fireEmail("sow_stage_approved", { recipientName: sow.createdBy, stageName: stageLabelsMap[activeStage.stage] ?? activeStage.stage, approverName: "Enterprise Admin", sowTitle: sow.title, sowUrl, ...(nextStageName ? { nextStageName } : {}) });
            setApprovalSubmitted(true);
          }
        },
      },
    );
  }

  function handleRejectStage() {
    if (!activeStage || !rejectionReason.trim()) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    rejectStageMutation.mutate(
      { stageKey: activeStage.stage, data: { reviewer: "Enterprise Admin", reason: rejectionReason } },
      {
        onSuccess: () => {
          fireEmail("sow_changes_requested", { recipientName: sow.createdBy, stageName: stageLabels[activeStage.stage] ?? activeStage.stage, reason: rejectionReason, sowTitle: sow.title, sowUrl: `${baseUrl}/enterprise/sow/${sow.id}/approve` });
          setRejectionSubmitted(true);
          setShowRejectForm(false);
        },
      },
    );
  }

  const showMain = activeStage && !approvalSubmitted && !rejectionSubmitted;

  /* ═══ LOADING ═══ */
  if (sowLoading || stagesLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8 space-y-3">
          <div className="flex gap-2"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
          <Skeleton className="h-7 w-2/3" />
          <div className="flex gap-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-16" /></div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="card-parchment">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < 4 ? "1px solid var(--border-hair)" : undefined }}>
                <Skeleton className="w-[18px] h-[18px] rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-40 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-56" /></div>
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="card-parchment p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <Skeleton className="w-5 h-5 rounded shrink-0" />
                <div className="space-y-1 flex-1"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ MAIN ═══ */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex gap-8 items-start">

      {/* ──────────────── LEFT COLUMN ──────────────── */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant={statusVariant[sow.status] || "beige"} dot>{sow.status === "approval" ? "In Approval" : sow.status}</Badge>
            {sow.riskScore.overall > 0 && <Badge variant={riskVariant(sow.riskScore.overall)}>Risk {sow.riskScore.overall}/100</Badge>}
          </div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">{sow.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-[12px] text-gray-400">
            {sow.client && <><span>{sow.client}</span><span className="w-1 h-1 rounded-full bg-gray-300" /></>}
            <span>v{sow.version}</span>
            {sow.pages > 0 && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span>{sow.pages} pages</span></>}
          </div>
        </motion.div>

        {showMain && (
          <>
            {/* Pipeline */}
            <motion.div variants={fadeUp} className="mb-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Approval Pipeline</h2>
              <div className="card-parchment">
                {sow.approvalStages.map((stage, i) => {
                  const isActive  = activeStage?.stage === stage.stage;
                  const done      = stage.status === "approved";
                  const rejected  = stage.status === "rejected";
                  const variant   = done ? "forest" : isActive ? "gold" : rejected ? "danger" : "beige";
                  const StageIcon = done ? CheckCircle2 : rejected ? XCircle : isActive ? Clock : stageIcons[stage.stage] || FileText;
                  const apiStage  = apiStages.find((s) => s.stage === stage.stage);
                  return (
                    <div key={stage.stage}
                      className={cn("flex items-center gap-4 px-5 py-4", isActive && "bg-gold-50/50")}
                      style={{ borderBottom: i < sow.approvalStages.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                    >
                      <StageIcon className={cn("w-[18px] h-[18px] shrink-0",
                        done ? "text-forest-500" : isActive ? "text-gold-600" : rejected ? "text-red-500" : "text-gray-400",
                      )} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-gray-800">{stageLabels[stage.stage]}</span>
                        {apiStage?.reviewer && <span className="text-[11px] text-gray-400 ml-2">— {apiStage.reviewer}</span>}
                        {apiStage?.reviewedAt && done && (
                          <span className="text-[10px] text-gray-400 ml-2">{fmtTime(apiStage.reviewedAt)}</span>
                        )}
                      </div>
                      <Badge variant={variant}>{done ? "Approved" : isActive ? "In Review" : rejected ? "Rejected" : "Pending"}</Badge>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── GlimmoraTeam Commercial is admin-only — enterprise sees a waiting banner, no sign-off UI ── */}
            {activeStage.stage === "glimmora_commercial" ? (
              <motion.div variants={fadeUp} className="mb-6">
                <div className="card-parchment px-5 py-5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-gold-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-800 mb-0.5">Awaiting GlimmoraTeam admin review</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                      This stage is reviewed by a GlimmoraTeam admin. You&apos;ll be notified once the commercial review is complete and the SOW advances to Legal &amp; Compliance.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
            <>
            {/* Checklist */}
            <motion.div variants={fadeUp} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">{stageLabels[activeStage.stage]}</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">{stageDesc[activeStage.stage]}</p>
                </div>
                <Badge variant={allChecked ? "forest" : "gold"}>{checkedCount}/{activeChecklist.length}</Badge>
              </div>
              <div className="card-parchment">
                <div className="px-5 pt-4 pb-2">
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", allChecked ? "bg-forest-500" : "bg-gradient-to-r from-brown-400 to-brown-500")}
                      style={{ width: `${activeChecklist.length > 0 ? (checkedCount / activeChecklist.length) * 100 : 0}%` }} />
                  </div>
                </div>
                {activeChecklist.map((item, idx) => {
                  const isChecked = !!checked[item.id];
                  return (
                    <label key={item.id}
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-black/[0.02]"
                      style={{ borderBottom: idx < activeChecklist.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                    >
                      <Checkbox checked={isChecked} onCheckedChange={(val) => setChecked((prev) => ({ ...prev, [item.id]: !!val }))} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-medium transition-colors", isChecked ? "text-forest-700" : "text-gray-800")}>{item.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>
                      </div>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />}
                    </label>
                  );
                })}
                <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  <div className="label-caps mb-2">Approval Notes</div>
                  <Textarea value={comments} onChange={(e) => setComments(e.target.value)}
                    placeholder="Optional notes or conditions..." className="min-h-[80px]" />
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div variants={fadeUp} className="flex items-center justify-end gap-2 mb-6">
              <button onClick={() => setShowRejectForm((p) => !p)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                <AlertTriangle className="w-3.5 h-3.5" /> Request Changes
              </button>
              <button disabled={!allChecked || approveStageMutation.isPending} onClick={handleApproveStage}
                className={cn("flex items-center gap-1.5 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all",
                  allChecked && !approveStageMutation.isPending
                    ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed",
                )}>
                <CheckCircle2 className="w-4 h-4" />
                {approveStageMutation.isPending ? "Approving…" : allChecked ? "Approve Stage" : `${checkedCount}/${activeChecklist.length} Verified`}
              </button>
            </motion.div>

            {/* Rejection form */}
            <AnimatePresence>
              {showRejectForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6"
                >
                  <div className="card-parchment px-5 py-5">
                    <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Request Changes</h3>
                    <p className="text-[12px] text-gray-400 mb-4">Describe what needs to be modified before this stage can be approved.</p>
                    <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Describe what needs to change..." className="min-h-[100px] mb-4" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowRejectForm(false)}
                        className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                        Cancel
                      </button>
                      <button disabled={!rejectionReason.trim() || rejectStageMutation.isPending} onClick={handleRejectStage}
                        className={cn("flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg transition-all",
                          rejectionReason.trim() && !rejectStageMutation.isPending
                            ? "text-white bg-gradient-to-r from-brown-400 to-brown-600"
                            : "text-gray-400 bg-gray-100 cursor-not-allowed",
                        )}>
                        <Send className="w-3 h-3" /> {rejectStageMutation.isPending ? "Sending…" : "Submit Changes"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </>
            )}
          </>
        )}

        {/* Success states */}
        {approvalSubmitted && activeStage?.stage !== "final" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-parchment text-center px-10 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-900 mb-1">Stage Approved</h2>
            <p className="text-[13px] text-gray-400"><span className="font-semibold text-gray-700">{activeStage ? stageLabels[activeStage.stage] : ""}</span> review completed.</p>
            {comments && <p className="text-[12px] text-gray-400 italic mt-3 max-w-[360px] mx-auto">&ldquo;{comments}&rdquo;</p>}
            <Link href={`/enterprise/sow/${sow.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all mt-6">
              Return to SOW
            </Link>
          </motion.div>
        )}

        {approvalSubmitted && activeStage?.stage === "final" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-parchment text-center px-10 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-900 mb-2">SOW Fully Approved</h2>
            <p className="text-[13px] text-gray-400 max-w-[320px] mx-auto">All 5 stages complete. Redirecting you to the SOW Repository…</p>
            {comments && <p className="text-[12px] text-gray-400 italic mt-3 max-w-[360px] mx-auto">&ldquo;{comments}&rdquo;</p>}
            <Link href="/enterprise/sow" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-forest-500 to-forest-600 px-6 py-2.5 rounded-xl transition-all mt-6">
              <CheckCircle2 className="w-4 h-4" /> Go to SOW Repository
            </Link>
          </motion.div>
        )}

        {rejectionSubmitted && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-parchment text-center px-10 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-900 mb-1">Changes Requested</h2>
            <p className="text-[13px] text-gray-400">Sent back for modifications.</p>
            <p className="text-[12px] text-gray-400 italic mt-3 max-w-[380px] mx-auto">&ldquo;{rejectionReason}&rdquo;</p>
            <Link href={`/enterprise/sow/${sow.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all mt-6">
              Return to SOW
            </Link>
          </motion.div>
        )}

        {allStagesApproved && !activeStage && !approvalSubmitted && !rejectionSubmitted && (
          <motion.div variants={fadeUp} className="card-parchment text-center px-10 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-900 mb-1">All Stages Approved</h2>
            <p className="text-[13px] text-gray-400 max-w-[340px] mx-auto mb-6">Ready for decomposition into tasks.</p>
            <Link href={`/enterprise/sow/${sow.id}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all">
              <GitBranch className="w-4 h-4" /> Proceed to Decomposition
            </Link>
          </motion.div>
        )}
      </div>

      {/* ──────────────── RIGHT COLUMN — Pipeline Notifications ──────────────── */}
      <motion.div variants={fadeUp} className="w-[320px] shrink-0 sticky top-[60px]">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 100px)" }}>

          {/* Panel header */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-brown-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-brown-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-gray-900">Pipeline Notifications</p>
              <p className="text-[10.5px] text-gray-400 mt-0.5">Send messages to GlimmoraTeam reviewers</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-forest-400 shrink-0" title="Online" />
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
            {chatMessages.length === 0 && (
              <p className="text-[11px] text-gray-400 text-center py-6">No messages yet. Send a message to GlimmoraTeam reviewers.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.from === "enterprise" && "justify-end")}>
                {msg.from === "glimmora" && (
                  <div className="w-6 h-6 rounded-full bg-brown-100 border border-brown-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-brown-600" />
                  </div>
                )}
                <div className={cn("max-w-[85%] space-y-1.5", msg.from === "enterprise" && "items-end flex flex-col")}>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {msg.from === "glimmora" && <span className="text-[10px] font-semibold text-gray-700">GlimmoraTeam</span>}
                    {msg.from === "enterprise" && <span className="text-[10px] font-semibold text-gray-700">You</span>}
                    {msg.stageLabel && <span className="text-[9px] text-gray-400 italic">{msg.stageLabel}</span>}
                    {msg.time && <span className="text-[9px] text-gray-400">{msg.time}</span>}
                  </div>

                  {/* File chips */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {msg.files.map((f, fi) => (
                        <div key={fi} className={cn("flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[10px]",
                          msg.from === "enterprise" ? "bg-brown-500 text-white" : "bg-gray-100 text-gray-700")}>
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                            msg.from === "enterprise" ? "bg-white/20" : "bg-brown-50")}>
                            {f.type.startsWith("image/")
                              ? <ImageIcon className={cn("w-3 h-3", msg.from === "enterprise" ? "text-white" : "text-brown-500")} />
                              : <File className={cn("w-3 h-3", msg.from === "enterprise" ? "text-white" : "text-brown-500")} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium max-w-[120px]">{f.name}</p>
                            <p className={cn("text-[9px]", msg.from === "enterprise" ? "text-white/60" : "text-gray-400")}>{formatBytes(f.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text bubble */}
                  {msg.text && (
                    <div className={cn("rounded-2xl px-3 py-2.5",
                      msg.from === "glimmora"
                        ? "rounded-tl-none bg-gray-50 border border-gray-100"
                        : "rounded-tr-none bg-brown-500")}>
                      <p className={cn("text-[11.5px] leading-relaxed",
                        msg.from === "glimmora" ? "text-gray-600" : "text-white")}>
                        {msg.text}
                      </p>
                    </div>
                  )}
                </div>
                {msg.from === "enterprise" && (
                  <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-3 h-3 text-teal-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
            <AnimatePresence>
              {chatFiles.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {chatFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 max-w-full">
                        <div className="w-5 h-5 rounded-md bg-brown-50 flex items-center justify-center shrink-0">
                          {f.type.startsWith("image/") ? <ImageIcon className="w-3 h-3 text-brown-500" /> : <File className="w-3 h-3 text-brown-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-700 truncate max-w-[110px]">{f.name}</p>
                          <p className="text-[9px] text-gray-400">{formatBytes(f.size)}</p>
                        </div>
                        <button onClick={() => setChatFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all shrink-0">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              placeholder="Send a notification or message…"
              rows={2}
              className="w-full text-[12px] text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-100 transition-all placeholder:text-gray-400 resize-none mb-2"
            />

            <input ref={chatFileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setChatFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size, type: f.type }))]);
                e.target.value = "";
              }}
            />

            <div className="flex items-center gap-2">
              <button onClick={() => chatFileRef.current?.click()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-brown-500 hover:bg-brown-50 border border-gray-200 hover:border-brown-200 transition-all shrink-0"
                title="Attach file">
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleChatSend} disabled={!chatInput.trim() && chatFiles.length === 0}
                className={cn("flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2 rounded-xl transition-all",
                  (chatInput.trim() || chatFiles.length > 0)
                    ? "text-white bg-brown-500 hover:bg-brown-600"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed")}>
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
