"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  DollarSign,
  Clock,
  Tag,
  Layers,
  Shield,
  Users,
  GitBranch,
  History,
  ClipboardList,
  Link2,
  User,
  ExternalLink,
  Bot,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Send,
  X,
  Search,
  Download,
  Scale,
  Eye,
  Gauge,
  Ban,
  Lock,
  Fingerprint,
  Filter,
  MessageSquareDiff,
  Undo2,
  Check,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { sowApi } from "@/lib/api/sow";
import { createEnterpriseDecompositionPlan } from "@/lib/api/decomposition-plans";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/stores/toast-store";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { useSowMessagesStore } from "@/lib/stores/sow-messages-store";
import { buildActivatedMessage, buildApprovedMessage, buildNextApproverMessage, buildChangesRequestedMessage } from "@/mocks/data/sow-approval-messages";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Progress,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";
import { useSowStore, INITIAL_APPROVAL_STAGES } from "@/lib/stores/sow-store";
import { useSOWPipelineStore } from "@/lib/stores/sow-pipeline-store";
import { useConfirmAndSubmit, useSOWDetail, useApprovalStages, useRecordApprovalDecision, useManualSOW, useSOWSections, useHallucinationAnalysis, useRiskAssessment } from "@/lib/hooks/use-manual-sow";
import { mockProjects } from "@/mocks/data/enterprise-projects";
import {
  mockSOWClauses,
  mockEthicsScreening,
  mockRegulatoryAlignment,
  mockGenerationParams,
  mockHallucinationLayers,
  sensitivityHandlingRequirements,
} from "@/mocks/data/enterprise-sow-detail";

/* ══════════════════════════════════════════════════════════════
   Shared config maps
   ══════════════════════════════════════════════════════════════ */

const statusVariantMap: Record<string, "beige" | "forest" | "teal" | "gold" | "brown"> = {
  draft: "beige",
  parsing: "teal",
  review: "teal",
  approval: "gold",
  approved: "forest",
  archived: "beige",
  rejected: "brown",
  changes_requested: "gold",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  parsing: "Parsing",
  review: "In Review",
  approval: "In Approval",
  approved: "Approved",
  archived: "Archived",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

const confidentialityVariantMap: Record<string, "teal" | "beige" | "gold" | "brown"> = {
  public: "teal",
  internal: "beige",
  confidential: "gold",
  restricted: "brown",
};

const clauseTypeConfig: Record<string, { label: string; variant: "beige" | "forest" | "teal" | "gold" | "brown" }> = {
  dependency: { label: "Dependency", variant: "teal" },
  assumption: { label: "Assumption", variant: "beige" },
  constraint: { label: "Constraint", variant: "gold" },
  acceptance_criteria: { label: "Acceptance Criteria", variant: "forest" },
  ethical: { label: "Ethical", variant: "teal" },
  security: { label: "Security", variant: "brown" },
  ip: { label: "IP", variant: "gold" },
  liability: { label: "Liability", variant: "brown" },
  confidentiality: { label: "Confidentiality", variant: "beige" },
  sla: { label: "SLA", variant: "teal" },
  warranty: { label: "Warranty", variant: "forest" },
  termination: { label: "Termination", variant: "beige" },
};

function confidenceColor(c: number): "forest" | "teal" | "gold" {
  if (c >= 90) return "forest";
  if (c >= 75) return "teal";
  return "gold";
}

function confidenceVariant(c: number): "gradient-forest" | "teal" | "gold" {
  if (c >= 90) return "gradient-forest";
  if (c >= 75) return "teal";
  return "gold";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Mock generators ── */

function generateVersionHistory(sow: import("@/types/enterprise").SOW) {
  const versions = [];
  for (let v = sow.version; v >= 1; v--) {
    const date = new Date(sow.createdAt);
    date.setDate(date.getDate() + (v - 1) * 5);
    versions.push({
      version: v,
      date: date.toISOString(),
      status: v === sow.version ? sow.status : "draft",
      changedBy: v === 1 ? sow.createdBy : sow.approvedBy || sow.createdBy,
      intakeMode: v === 1 ? sow.intakeMode : sow.intakeMode, // per B8: intake mode indicator per version
      changes:
        v === sow.version && sow.status === "approved"
          ? "Final approval and sign-off"
          : v === 1
          ? "Initial document upload"
          : `Revision ${v} -- updated scope and budget sections`,
    });
  }
  return versions;
}

type AuditEvent = {
  id: string;
  action: "created" | "updated" | "approved" | "submitted" | "parsed" | "reviewed";
  actor: string;
  timestamp: string;
  details: string;
};

function generateAuditTrail(sow: import("@/types/enterprise").SOW) {
  const events: AuditEvent[] = [
    {
      id: "audit-1",
      action: "created",
      actor: sow.createdBy,
      timestamp: sow.createdAt,
      details: `SOW "${sow.title}" ${sow.intakeMode === "ai_generated" ? "generated via AI wizard" : "uploaded manually"}`,
    },
  ];
  if (sow.parsedSections > 0) {
    const parseDate = new Date(sow.createdAt);
    parseDate.setMinutes(parseDate.getMinutes() + 15);
    events.push({
      id: "audit-1b",
      action: "parsed",
      actor: "AI Engine",
      timestamp: parseDate.toISOString(),
      details: `AI extraction completed: ${sow.parsedSections} sections, ${mockSOWClauses.filter((c) => c.sowId === sow.id).length} clauses tagged`,
    });
  }
  if (sow.version > 1) {
    const editDate = new Date(sow.createdAt);
    editDate.setDate(editDate.getDate() + 3);
    events.push({
      id: "audit-2",
      action: "updated",
      actor: sow.createdBy,
      timestamp: editDate.toISOString(),
      details: "Scope sections revised based on AI suggestions",
    });
  }
  if (sow.status === "approval" || sow.status === "approved") {
    const submitDate = new Date(sow.createdAt);
    submitDate.setDate(submitDate.getDate() + 5);
    events.push({
      id: "audit-2b",
      action: "submitted",
      actor: sow.createdBy,
      timestamp: submitDate.toISOString(),
      details: "SOW submitted for multi-stage approval",
    });
  }
  if (sow.status === "approved" && sow.approvedBy) {
    events.push({
      id: "audit-3",
      action: "approved",
      actor: sow.approvedBy,
      timestamp: sow.updatedAt,
      details: "SOW approved and locked for decomposition",
    });
  }
  return events.reverse();
}

const auditActionConfig: Record<string, { color: string; bg: string }> = {
  created: { color: "text-teal-700", bg: "bg-teal-100" },
  updated: { color: "text-gold-700", bg: "bg-gold-100" },
  approved: { color: "text-forest-700", bg: "bg-forest-100" },
  submitted: { color: "text-brown-700", bg: "bg-brown-100" },
  parsed: { color: "text-teal-700", bg: "bg-teal-100" },
  reviewed: { color: "text-gold-700", bg: "bg-gold-100" },
};

const auditActionIcon: Record<string, React.ElementType> = {
  created: FileText,
  updated: ClipboardList,
  approved: CheckCircle2,
  submitted: Send,
  parsed: Bot,
  reviewed: Eye,
};

const DEFAULT_APPROVAL_STAGES = [
  { stage: "business" as const,            status: "in_review" as const, reviewer: "Enterprise Admin" },
  { stage: "glimmora_commercial" as const, status: "pending" as const },
  { stage: "legal" as const,               status: "pending" as const },
  { stage: "security" as const,            status: "pending" as const },
  { stage: "final" as const,               status: "pending" as const },
];

const SOW_DEFAULTS = {
  title: "Untitled SOW", client: "", status: "draft" as const,
  intakeMode: "manual_upload" as const, confidentiality: "internal" as const,
  dataSensitivity: "internal" as const, version: 1,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  createdBy: "", fileSize: "—", pages: 0, parsedSections: 0, totalSections: 0,
  aiConfidence: 0, riskScore: { overall: 0, completeness: 0, confidence: 0, compliance: 0, patternMatch: 0 },
  tags: [], estimatedBudget: 0, estimatedDuration: "", stakeholders: [],
  approvalStages: DEFAULT_APPROVAL_STAGES,
};

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

export default function SOWDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const backHref = pathname.includes("/approval/") ? "/enterprise/sow/approval" : "/enterprise/sow";
  const backLabel = pathname.includes("/approval/") ? "Approval Pipeline" : "SOW Repository";
  const sowId = params.sowId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isDecomposing, setIsDecomposing] = React.useState(false);
  const allSows = useSowStore((s) => s.sows);
  const addSow = useSowStore((s) => s.addSow);
  const updateSow = useSowStore((s) => s.updateSow);
  const addPipelineSOW = useSOWPipelineStore((s) => s.addSOW);
  const updatePipelineSOW = useSOWPipelineStore((s) => s.updateSOW);
  const pipelineSows = useSOWPipelineStore((s) => s.sows);
  const { data: apiSowData, isLoading: apiSowLoading, flow: apiFlow } = useSOWDetail(sowId);

  // Direct query for the header — only for manual SOWs; AI SOWs use apiSowData from useSOWDetail
  const manualSowQuery = useManualSOW(sowId, apiFlow === "manual");
  const headerData = React.useMemo(() => {
    const raw = manualSowQuery.data as Record<string, unknown> | null | undefined;
    if (!raw) return null;
    // unwrap { success, data: {...} } wrapper if present
    const d = (typeof raw.data === "object" && raw.data !== null ? raw.data : raw) as Record<string, unknown>;

    // nested sub-objects
    const gc = (typeof d.generated_content === "object" && d.generated_content !== null ? d.generated_content : {}) as Record<string, unknown>;
    const gen = (typeof d.generated === "object" && d.generated !== null ? d.generated : {}) as Record<string, unknown>;
    const genContent = (typeof gen.content === "object" && gen.content !== null ? gen.content : {}) as Record<string, unknown>;
    const qm = (typeof d.quality_metrics === "object" && d.quality_metrics !== null ? d.quality_metrics : {}) as Record<string, unknown>;

    // risk: prefer generated.risk (manual SOW), then top-level risk, then risk_score object
    const genRisk = (typeof gen.risk === "object" && gen.risk !== null ? gen.risk : {}) as Record<string, unknown>;
    const topRisk = (typeof d.risk === "object" && d.risk !== null ? d.risk : {}) as Record<string, unknown>;
    const rsObj = (typeof d.risk_score === "object" && d.risk_score !== null ? d.risk_score : {}) as Record<string, unknown>;
    const riskScore = Number(genRisk.risk_score ?? topRisk.risk_score ?? topRisk.riskScore ?? 0);
    const riskLevel = String(genRisk.risk_level ?? topRisk.risk_level ?? topRisk.riskLevel ?? "");

    // budget: prefer commercial_details.budgetRisk (manual SOW embed), then AI SOW flat fields
    const cd = (typeof d.commercial_details === "object" && d.commercial_details !== null ? d.commercial_details : {}) as Record<string, unknown>;
    const br = (typeof cd.budgetRisk === "object" && cd.budgetRisk !== null ? cd.budgetRisk : {}) as Record<string, unknown>;
    const budgetMin = Number(br.budgetMinimum ?? br.budget_minimum ?? d.budgetMinimum ?? d.budget_minimum ?? d.minimum_budget ?? 0);
    const budgetMax = Number(br.budgetMaximum ?? br.budget_maximum ?? d.budgetMaximum ?? d.budget_maximum ?? d.maximum_budget ?? 0);

    // duration: prefer timelineTeam section, then flat fields
    const tt = (typeof cd.timelineTeam === "object" && cd.timelineTeam !== null ? cd.timelineTeam : {}) as Record<string, unknown>;
    const startDate = String(tt.startDate ?? "");
    const endDate = String(tt.targetEndDate ?? "");
    let estimatedDuration = String(d.estimated_duration ?? d.estimatedDuration ?? d.timeline ?? "");
    if (!estimatedDuration && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const weeks = Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      estimatedDuration = weeks > 0 ? `${weeks} week${weeks > 1 ? "s" : ""}` : "";
    }

    const intakeMode = String(d.intake_mode ?? d.intakeMode ?? "");
    const isAI = intakeMode === "ai_generated";

    // title from generated.content.document_title, then generated_content, then top-level
    const title = String(genContent.document_title ?? gc.document_title ?? d.title ?? d.project_title ?? "");
    const client = String(d.client ?? d.client_name ?? d.client_organisation ?? genContent.client ?? gc.client_name ?? gc.client ?? "");

    // confidence: prefer generated.confidence.overall, then ai_confidence
    const genConf = (typeof gen.confidence === "object" && gen.confidence !== null ? gen.confidence : {}) as Record<string, unknown>;
    const aiConfidence = Number(genConf.overall ?? d.ai_confidence ?? d.aiConfidence ?? qm.overall_confidence ?? rsObj.overall ?? 0);

    return {
      title,
      client,
      version:           d.version != null ? Number(d.version) : null,
      status:            String(d.status ?? ""),
      intakeMode,
      isAI,
      confidentiality:   String(d.confidentiality ?? d.data_sensitivity ?? "internal"),
      updatedAt:         String(d.updated_at ?? d.updatedAt ?? d.created_at ?? ""),
      budgetMin,
      budgetMax,
      estimatedBudget:   Number(d.estimated_budget ?? d.estimatedBudget ?? 0),
      estimatedDuration,
      riskScore,
      riskLevel,
      aiConfidence,
      completeness:      Number(qm.completeness ?? rsObj.completeness ?? 0),
      templateId:        String(d.template_id ?? d.templateId ?? gc.template_id ?? ""),
      industry:          String(d.industry ?? gc.industry ?? ""),
    };
  }, [manualSowQuery.data]);

  const confirmAndSubmit = useConfirmAndSubmit(sowId);
  // Declared up here so the approval-pipeline query below can enable polling
  // while stage 2 is active (the enterprise user waits for GlimmoraTeam admin).
  const [activeApprovalIdx, setActiveApprovalIdx] = React.useState(0);
  const { data: pipelineApiData } = useApprovalStages(
    sowId,
    activeApprovalIdx === 1 ? 10000 : undefined,
  );
  const recordDecision = useRecordApprovalDecision(sowId);
  const sow = React.useMemo(() => {
    // Real-time API data takes priority (works for both manual and AI SOWs)
    const raw = apiSowData as Record<string, unknown> | null | undefined;
    if (raw) {
      const gc = apiFlow === "ai"
        ? ((raw.generated_content ?? {}) as Record<string, unknown>)
        : ({} as Record<string, unknown>);
      const updatedAt = String(raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? raw.createdAt ?? new Date().toISOString());
      const title = String(raw.projectTitle ?? gc.document_title ?? raw.title ?? raw.project_title ?? "Untitled SOW").replace(/^statement of work for\s*/i, "").trim();
      let client = String(raw.clientOrganisation ?? raw.client ?? raw.client_organisation ?? gc.client_name ?? gc.client ?? "");
      if (!client) {
        const bizOwner = String(raw.business_owner_approver_id ?? "");
        if (bizOwner.includes(", ")) client = bizOwner.split(", ").pop()?.trim() ?? "";
      }
      const qm = (raw.quality_metrics ?? raw.qualityMetrics ?? {}) as Record<string, unknown>;
      const riskObj = (typeof raw.risk === "object" && raw.risk !== null ? raw.risk : {}) as Record<string, unknown>;
      const riskRaw = raw.risk_score ?? raw.riskScore ?? qm.risk_score ?? qm.riskScore;
      let riskOverall = 0;
      // First try nested risk object (e.g. { risk: { risk_score: 15, risk_level: "Low" } })
      if (riskObj.risk_score != null) {
        riskOverall = Number(riskObj.risk_score);
      } else if (typeof riskRaw === "number") {
        riskOverall = riskRaw;
      } else if (riskRaw && typeof riskRaw === "object") {
        riskOverall = Number((riskRaw as Record<string, unknown>).overall ?? 0);
      } else {
        const conf = Number(qm.overall_confidence ?? raw.confidence_score ?? raw.confidenceScore ?? raw.aiConfidence ?? 0);
        riskOverall = conf > 0 ? Math.round(100 - conf) : 0;
      }
      const rawStages = (raw.approval_stages ?? raw.approvalStages) as unknown[] | undefined;
      const approvalStages: import("@/types/enterprise").SOWApprovalStage[] =
        Array.isArray(rawStages) && rawStages.length > 0
          ? (rawStages as import("@/types/enterprise").SOWApprovalStage[])
          : DEFAULT_APPROVAL_STAGES;
      const fileSizeBytes = Number(raw.file_size ?? raw.fileSize ?? 0);
      const fileSize = fileSizeBytes > 0
        ? fileSizeBytes >= 1_000_000
          ? `${(fileSizeBytes / 1_000_000).toFixed(1)} MB`
          : `${(fileSizeBytes / 1_000).toFixed(0)} KB`
        : String(raw.file_size_label ?? raw.fileSizeLabel ?? "—");
      return {
        ...SOW_DEFAULTS,
        id: String(raw.id ?? raw._id ?? raw.sow_id ?? sowId),
        title,
        client,
        status: String(raw.status ?? "draft") as import("@/types/enterprise").SowStatus,
        intakeMode: (String(raw.intake_mode ?? raw.intakeMode ?? (apiFlow === "ai" ? "ai_generated" : "manual_upload"))) as import("@/types/enterprise").SowIntakeMode,
        confidentiality: String(raw.confidentiality ?? raw.data_sensitivity ?? raw.dataSensitivity ?? "internal") as import("@/types/enterprise").ConfidentialityLevel,
        dataSensitivity: String(raw.data_sensitivity ?? raw.dataSensitivity ?? "internal") as import("@/types/enterprise").DataSensitivity,
        version: Number(raw.version ?? 1),
        createdAt: String(raw.created_at ?? raw.createdAt ?? updatedAt),
        updatedAt,
        createdBy: String(raw.created_by ?? raw.createdBy ?? "Enterprise Admin"),
        approvedBy: raw.approved_by ? String(raw.approved_by) : raw.approvedBy ? String(raw.approvedBy) : undefined,
        approvedAt: raw.approved_at ? String(raw.approved_at) : raw.approvedAt ? String(raw.approvedAt) : undefined,
        fileSize,
        pages: Number(raw.pages ?? raw.page_count ?? raw.pageCount ?? 0),
        parsedSections: Number(raw.parsed_sections ?? raw.parsedSections ?? 0),
        totalSections: Number(raw.total_sections ?? raw.totalSections ?? 0),
        aiConfidence: Number(raw.ai_confidence ?? raw.aiConfidence ?? (typeof raw.risk_score === "object" && raw.risk_score !== null ? (raw.risk_score as Record<string, unknown>).overall : null) ?? qm.overall_confidence ?? raw.confidence_score ?? 0),
        riskScore: {
          overall: riskOverall,
          completeness: Number((riskRaw as Record<string, unknown>)?.completeness ?? qm.completeness ?? 0),
          confidence: Number((riskRaw as Record<string, unknown>)?.confidence ?? qm.confidence ?? 0),
          compliance: Number((riskRaw as Record<string, unknown>)?.compliance ?? qm.compliance ?? 0),
          patternMatch: Number((riskRaw as Record<string, unknown>)?.pattern_match ?? (riskRaw as Record<string, unknown>)?.patternMatch ?? 0),
        },
        tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
        estimatedBudget: Number(raw.budgetAmount ?? raw.estimated_budget ?? raw.estimatedBudget ?? raw.minimum_budget ?? 0),
        estimatedDuration: String(
          raw.durationDays ? `${raw.durationDays} days`
          : raw.estimated_duration ?? raw.estimatedDuration ?? raw.timeline ?? ""),
        stakeholders: Array.isArray(raw.stakeholders) ? (raw.stakeholders as string[]) : [],
        slaCompliance: raw.sla_compliance ? Number(raw.sla_compliance) : raw.slaCompliance ? Number(raw.slaCompliance) : undefined,
        industry: raw.industry ? String(raw.industry) : undefined,
        gapAnalysisScore: raw.gap_analysis_score ? Number(raw.gap_analysis_score) : raw.gapAnalysisScore ? Number(raw.gapAnalysisScore) : undefined,
        approvalStages,
        planId: raw.plan_id ? String(raw.plan_id) : raw.planId ? String(raw.planId) : allSows.find((s) => s.id === sowId)?.planId ?? undefined,
        templateId: raw.template_id ? String(raw.template_id) : raw.templateId ? String(raw.templateId) : undefined,
      } satisfies import("@/types/enterprise").SOW;
    }

    const exactMatch = allSows.find((s) => s.id === sowId)
      ?? mockSOWs.find((s) => s.id === sowId);
    const pipelineMeta = pipelineSows.find((s) => s.id === sowId);

    if (exactMatch) return exactMatch;

    if (pipelineMeta) {
      const stageKeys = ["business", "glimmora_commercial", "legal", "security", "final"] as const;
      const completed = pipelineMeta.completedStages;
      const current = pipelineMeta.currentStage;
      return {
        ...SOW_DEFAULTS,
        id: sowId,
        title: pipelineMeta.title,
        client: pipelineMeta.client,
        status: "approval" as const,
        approvalStages: stageKeys.map((key, idx) => {
          const num = idx + 1;
          if (completed.includes(num)) return { stage: key, status: "approved" as const };
          if (num === current) return { stage: key, status: "in_review" as const, reviewer: "Enterprise Admin" };
          return { stage: key, status: "pending" as const };
        }),
      } as import("@/types/enterprise").SOW;
    }

    return { ...SOW_DEFAULTS, id: sowId } as import("@/types/enterprise").SOW;
  }, [apiSowData, apiFlow, allSows, pipelineSows, sowId]);

  const handleStartDecomposition = React.useCallback(async () => {
    if (isDecomposing) return;
    setIsDecomposing(true);
    try {
      const raw = apiSowData as Record<string, unknown> | null;
      const cd = (typeof raw?.commercial_details === "object" && raw?.commercial_details !== null ? raw.commercial_details : {}) as Record<string, unknown>;
      const br = (typeof cd.budgetRisk === "object" && cd.budgetRisk !== null ? cd.budgetRisk : {}) as Record<string, unknown>;
      const tt = (typeof cd.timelineTeam === "object" && cd.timelineTeam !== null ? cd.timelineTeam : {}) as Record<string, unknown>;
      const minBudget = Number(br.budgetMinimum ?? br.budget_minimum ?? raw?.budgetMinimum ?? raw?.budget_minimum ?? raw?.minimum_budget ?? 0);
      const maxBudget = Number(br.budgetMaximum ?? br.budget_maximum ?? raw?.budgetMaximum ?? raw?.budget_maximum ?? raw?.maximum_budget ?? 0);
      const startDate = String(tt.startDate ?? raw?.start_date ?? "");
      const endDate = String(tt.targetEndDate ?? raw?.end_date ?? "");
      const payload = {
        wizard_id:      String(raw?.wizard_id ?? raw?.id ?? sowId),
        enterprise_id:  String(raw?.enterprise_id ?? (session?.user as { id?: string })?.id ?? ""),
        sow_reference:  String(raw?._id ?? raw?.id ?? raw?.sow_id ?? sowId),
        project_name:   sow.title,
        minimum_budget: minBudget > 0 ? minBudget : 850000.0,
        maximum_budget: maxBudget > 0 ? maxBudget : 1200000.0,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      };
      const res = await createEnterpriseDecompositionPlan(payload);
      const planId = String(
        (res.data as Record<string, unknown> | null)?.id ??
        (res.data as Record<string, unknown> | null)?.plan_id ?? ""
      );
      await queryClient.invalidateQueries({ queryKey: ["enterprise", "decomposition", "plans"] });
      addSow({ ...sow, planId: planId || sowId });
      router.push("/enterprise/decomposition");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start decomposition";
      toast.error("Decomposition failed", msg);
    } finally {
      setIsDecomposing(false);
    }
  }, [isDecomposing, apiSowData, sowId, session, sow, router, queryClient, addSow]);

  const linkedProject = sow ? mockProjects.find((p) => p.sowId === sow.id) : undefined;

  const { data: sectionsApiData, isLoading: sectionsLoading } = useSOWSections(sowId, apiFlow === "manual");

  const sections = React.useMemo(() => {
    type SectionItem = { section_id: string; title: string; confidence: number; content: string };

    function mapSections(list: SectionItem[]) {
      return list.map((s, i) => ({
        id: String((s as Record<string,unknown>).section_id ?? (s as Record<string,unknown>).id ?? `sec-${i}`),
        sowId,
        title: String(s.title ?? ""),
        content: String(s.content ?? ""),
        confidence: Number(s.confidence ?? (s as Record<string,unknown>).confidence_score ?? 0),
        order: Number((s as Record<string,unknown>).order ?? (s as Record<string,unknown>).section_order ?? i + 1),
      }));
    }

    // 1. Primary: GET /api/v1/sow/{sowId}/sections (manual SOW endpoint)
    const sRaw = sectionsApiData as Record<string, unknown> | null | undefined;
    if (sRaw) {
      const list = (Array.isArray(sRaw.data) ? sRaw.data : Array.isArray(sRaw) ? sRaw : []) as SectionItem[];
      if (list.length > 0) return mapSections(list);
    }

    // 2. AI SOW: sections embedded directly in GET /api/v1/sows/{sowId} response.
    //    apiSowData is already the unwrapped inner data object.
    if (apiFlow === "ai" && apiSowData) {
      const aData = apiSowData as Record<string, unknown>;
      // Try common paths: data.sections, data.generated_sow.sections, data.generated.content.sections
      const aiSections =
        (Array.isArray(aData.sections) ? aData.sections : null) ??
        (Array.isArray((aData.generated_sow as any)?.sections) ? (aData.generated_sow as any).sections : null) ??
        (Array.isArray((aData.generated as any)?.sections) ? (aData.generated as any).sections : null) ??
        (Array.isArray(((aData.generated as any)?.content as any)?.sections) ? ((aData.generated as any)?.content as any).sections : null) ??
        (Array.isArray((aData.generated_content as any)?.sections) ? (aData.generated_content as any).sections : null);
      if (aiSections?.length) return mapSections(aiSections as SectionItem[]);
    }

    // 3. Fallback: sections embedded in manual SOW response
    //    Response shape: { data: { generated: { content: { sections: [...] } } } }
    const mRaw = manualSowQuery.data as Record<string, unknown> | null | undefined;
    const mData = (typeof mRaw?.data === "object" && mRaw?.data !== null ? mRaw.data : mRaw) as Record<string, unknown> | null ?? {};
    const gen = (typeof mData?.generated === "object" && mData?.generated !== null ? mData.generated : {}) as Record<string, unknown>;
    const genContent = (typeof gen.content === "object" && gen.content !== null ? gen.content : {}) as Record<string, unknown>;
    const genList = genContent.sections as SectionItem[] | undefined;
    if (genList?.length) return mapSections(genList);

    // 4. Also check generated_content (AI SOW shape in manual query)
    const gcFallback = (typeof mData?.generated_content === "object" && mData?.generated_content !== null ? mData.generated_content : {}) as Record<string, unknown>;
    const gcList = gcFallback.sections as SectionItem[] | undefined;
    if (gcList?.length) return mapSections(gcList);

    // 5. Last resort: local mock data
    return sow ? mockSOWSections.filter((s) => s.sowId === sow.id) : [];
  }, [sectionsApiData, apiSowData, apiFlow, manualSowQuery.data, sow, sowId]);

  // Derive approval stages from GET /api/v1/approvals/{sow_id} when available,
  // so the stepper always reflects the real pipeline state.
  const pipelineResolvedStages = React.useMemo(() => {
    const pRaw = (pipelineApiData as Record<string, unknown> | null | undefined)?.data as Record<string, unknown> | undefined;
    const pArr: Record<string, unknown>[] = Array.isArray(pRaw)
      ? pRaw
      : Array.isArray((pRaw as Record<string, unknown>)?.stages)
      ? (pRaw as Record<string, unknown>).stages as Record<string, unknown>[]
      : Array.isArray((pRaw as Record<string, unknown>)?.approval_stages)
      ? (pRaw as Record<string, unknown>).approval_stages as Record<string, unknown>[]
      : [];
    if (pArr.length === 0) return null;
    // current_active_stage tells us which stage is actively being reviewed
    // (API may return all stages as "pending" and rely on this field)
    const currentActive = Number((pRaw as Record<string, unknown>)?.current_active_stage ?? 0);
    const overallStatus = String((pRaw as Record<string, unknown>)?.overall_status ?? "");
    const stageKeyMap: Record<number, string> = { 1: "business", 2: "glimmora_commercial", 3: "legal", 4: "security", 5: "final" };
    // reverse map to match string stage keys returned by the API (e.g. "business" → 1).
    // The backend now uses "commercial" (not "glimmora_commercial") for stage 2,
    // so include both aliases.
    const stageNumMap: Record<string, number> = {
      ...Object.fromEntries(Object.entries(stageKeyMap).map(([k, v]) => [v, Number(k)])),
      commercial: 2,
    };
    return [1, 2, 3, 4, 5].map((num) => {
      const apiSt = pArr.find((s) => {
        const stageVal = s.stage ?? s.stage_key ?? s.stage_number;
        if (typeof stageVal === "number") return stageVal === num;
        if (typeof stageVal === "string") {
          return stageNumMap[stageVal] === num || Number(stageVal) === num;
        }
        return false;
      });
      const rawStatus = String(apiSt?.status ?? "pending").toLowerCase();
      let status: import("@/types/enterprise").ApprovalStageStatus;
      if (rawStatus === "approved") {
        status = "approved";
      } else if (rawStatus === "rejected" || rawStatus === "changes_requested") {
        status = "rejected";
      } else if (
        rawStatus === "in_review" || rawStatus === "active" || rawStatus === "in_progress" ||
        // Use current_active_stage when the API returns "pending" for all stages
        (rawStatus === "pending" && currentActive === num && overallStatus !== "completed")
      ) {
        status = "in_review";
      } else if (overallStatus !== "completed" && currentActive > num) {
        // stages before the active one that are still "pending" were already passed
        status = "approved";
      } else {
        status = "pending";
      }
      const stageName = String(apiSt?.stage_name ?? "");
      const reviewerVal = apiSt?.reviewer_name ?? apiSt?.reviewer ?? apiSt?.reviewer_email ?? null;
      const slaStatus = String(apiSt?.sla_status ?? "");
      const slaDueDays = apiSt?.sla_due_days != null ? Number(apiSt.sla_due_days) : null;
      return {
        stage: stageKeyMap[num] as import("@/types/enterprise").ApprovalStage,
        status,
        reviewer: reviewerVal ? String(reviewerVal) : undefined,
        ...(stageName ? { stageName } : {}),
        ...(slaStatus ? { slaStatus } : {}),
        ...(slaDueDays != null ? { slaDueDays } : {}),
      } satisfies import("@/types/enterprise").SOWApprovalStage & { stageName?: string; slaStatus?: string; slaDueDays?: number };
    });
  }, [pipelineApiData]);

  // Extract approval_route and overall_status for display
  const pipelineInfo = React.useMemo(() => {
    const pRaw = (pipelineApiData as Record<string, unknown> | null | undefined)?.data as Record<string, unknown> | undefined;
    if (!pRaw) return null;
    return {
      approvalRoute: String(pRaw.approval_route ?? ""),
      overallStatus: String(pRaw.overall_status ?? ""),
      currentActiveStage: Number(pRaw.current_active_stage ?? 0),
    };
  }, [pipelineApiData]);

  // Use pipeline API stages for the stepper display; fall back to sow.approvalStages
  const displayStages = pipelineResolvedStages ?? sow?.approvalStages ?? DEFAULT_APPROVAL_STAGES;

  // Derive the effective active stage index from the pipeline API (when available),
  // so checklist + form reflect the real in_review stage, not just local clicks.
  // If any stage has been sent back with changes_requested ("rejected"), stay on
  // that stage — the SOW must be resolved before it can advance.
  const effectiveActiveIdx = React.useMemo(() => {
    if (!pipelineResolvedStages) return null;
    const rejectedIdx = pipelineResolvedStages.findIndex((s) => s.status === "rejected");
    if (rejectedIdx >= 0) return rejectedIdx;
    const inReviewIdx = pipelineResolvedStages.findIndex((s) => s.status === "in_review");
    if (inReviewIdx >= 0) return inReviewIdx;
    const pendingIdx = pipelineResolvedStages.findIndex((s) => s.status === "pending");
    if (pendingIdx >= 0) return pendingIdx;
    return pipelineResolvedStages.length; // all approved
  }, [pipelineResolvedStages]);

  const changesRequestedStageIdx = React.useMemo(() => {
    if (!pipelineResolvedStages) return -1;
    return pipelineResolvedStages.findIndex((s) => s.status === "rejected");
  }, [pipelineResolvedStages]);

  const clauses = sow ? mockSOWClauses.filter((c) => c.sowId === sow.id) : [];
  const versions = sow ? generateVersionHistory(sow) : [];
  const auditTrail = sow ? generateAuditTrail(sow) : [];
  const ethicsScreening = sow ? mockEthicsScreening[sow.id] || [] : [];
  const regulatoryItems = sow ? mockRegulatoryAlignment[sow.id] || [] : [];
  const genParams = sow ? mockGenerationParams[sow.id] : undefined;
  // Only call the wizard/AI analysis endpoints when the SOW was loaded from /api/v1/sows/
  // (apiFlow === "ai"). Manual SOWs with intake_mode "ai_generated" still live in the
  // /api/v1/sow/ namespace and will 404 on the /sows/ endpoints.
  const isAiFlow = apiFlow === "ai";
  const { data: hallucinationApiData } = useHallucinationAnalysis(sowId, isAiFlow);
  const { data: riskAssessmentApiData } = useRiskAssessment(sowId, isAiFlow);

  // Normalise hallucination analysis API response → UI shape
  const hallucinationLayers = React.useMemo(() => {
    const raw = hallucinationApiData as Record<string, unknown> | null | undefined;
    const d = (typeof raw?.data === "object" && raw?.data !== null ? raw.data : raw) as Record<string, unknown> | null ?? {};
    const list = (Array.isArray(d?.layers) ? d.layers
      : Array.isArray((d as Record<string,unknown>)?.hallucination_layers) ? (d as Record<string,unknown>).hallucination_layers
      : []) as Array<Record<string, unknown>>;
    if (list.length > 0) {
      const statusMap: Record<string, string> = {
        green: "passed", passed: "passed",
        yellow: "warning", warning: "warning", amber: "warning",
        red: "failed", failed: "failed",
        skipped: "skipped", inactive: "skipped",
      };
      return list.map((l) => ({
        layer: Number(l.layer_id ?? l.layer ?? l.id ?? 0),
        name: String(l.name ?? l.layer_name ?? ""),
        status: statusMap[String(l.status ?? "").toLowerCase()] ?? "skipped",
        description: String(l.description ?? l.detail ?? ""),
        details: String(l.detail ?? l.description ?? l.result ?? ""),
      }));
    }
    // Fallback to mock data if API returned nothing
    return sow ? mockHallucinationLayers[sow.id] || [] : [];
  }, [hallucinationApiData, sow]);

  // Normalise risk assessment API response → { overall, completeness, confidence, compliance, patternMatch }
  const apiRiskBreakdown = React.useMemo(() => {
    if (!riskAssessmentApiData) return null;
    const raw = riskAssessmentApiData as unknown as Record<string, unknown>;
    // Unwrap { success, data } wrapper if present
    const d = (typeof raw.data === "object" && raw.data !== null
      ? raw.data
      : raw) as Record<string, unknown>;
    if (!d || Object.keys(d).length === 0) return null;

    // Nested breakdown object (most common)
    const breakdown = (typeof d.breakdown === "object" && d.breakdown !== null
      ? d.breakdown
      : typeof d.scores === "object" && d.scores !== null
      ? d.scores
      : typeof d.categories === "object" && d.categories !== null
      ? d.categories
      : d) as Record<string, unknown>;

    // Overall score — try every plausible field name
    const overall = Number(
      d.overall ?? d.risk_score ?? d.overall_score ?? d.total_score ??
      d.score ?? d.riskScore ?? d.totalScore ?? 0
    );

    const completeness = Number(
      breakdown.completeness ?? d.completeness ?? breakdown.completeness_score ?? 0
    );
    const confidence = Number(
      breakdown.confidence ?? d.confidence ?? breakdown.confidence_score ?? 0
    );
    const compliance = Number(
      breakdown.compliance ?? d.compliance ?? breakdown.compliance_score ?? 0
    );
    const patternMatch = Number(
      breakdown.pattern_match ?? breakdown.patternMatch ?? d.pattern_match ??
      d.patternMatch ?? breakdown.pattern_match_score ?? 0
    );

    // If everything resolved to zero there's nothing to show
    if (overall === 0 && completeness === 0 && confidence === 0 && compliance === 0 && patternMatch === 0) return null;

    return { overall, completeness, confidence, compliance, patternMatch };
  }, [riskAssessmentApiData]);

  const sensitivityReqs = sow ? sensitivityHandlingRequirements[sow.dataSensitivity] || [] : [];

  /* UI state */
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    () => new Set(sections.slice(0, 3).map((s) => s.id))
  );
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  // Set to "closed" right after a successful close so the UI flips immediately
  // (the store/query may not have re-fetched yet).
  const [closedOverride, setClosedOverride] = React.useState(false);
  const [showComment, setShowComment] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [clauseTypeFilter, setClauseTypeFilter] = React.useState("all");
  const [clauseSearch, setClauseSearch] = React.useState("");
  const [auditTypeFilter, setAuditTypeFilter] = React.useState("all");
  const [docSearch, setDocSearch] = React.useState("");
  const [approvalChecked, setApprovalChecked] = React.useState<Record<string, boolean>>({});
  const [signatureText, setSignatureText] = React.useState("");
  const [showRequestChanges, setShowRequestChanges] = React.useState(false);
  const [requestChangesNote, setRequestChangesNote] = React.useState("");
  const [requestCategory, setRequestCategory] = React.useState<"scope"|"deliverables"|"timeline"|"other">("scope");
  const [requestSection, setRequestSection] = React.useState("Section 3 — Deliverables");
  const [sectionDropdownOpen, setSectionDropdownOpen] = React.useState(false);
  const sectionDropdownRef = React.useRef<HTMLDivElement>(null);
  const sectionTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownCoords, setDropdownCoords] = React.useState({ top: 0, left: 0, width: 0 });
  // Track which SOW ID we've already initialised the stage index for so that
  // API refetches (triggered after approve/comment) never reset the stage the
  // user has already advanced to.
  const approvalInitialisedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!sow) return;
    // Only auto-sync once per SOW — after that, user actions drive the index.
    if (approvalInitialisedFor.current === sowId) return;
    approvalInitialisedFor.current = sowId;
    // An already-approved/closed SOW is done — park the index past the last
    // stage so the UI shows all stages approved (not "Approve Stage 1") on load.
    if (sow.status === "approved" || sow.status === "closed") {
      setActiveApprovalIdx(sow.approvalStages.length);
      setApprovalChecked({});
      return;
    }
    const idx = sow.approvalStages.findIndex((s) => s.status === "in_review");
    if (idx >= 0) {
      setActiveApprovalIdx(idx);
    } else {
      const pendingIdx = sow.approvalStages.findIndex((s) => s.status === "pending");
      setActiveApprovalIdx(pendingIdx >= 0 ? pendingIdx : sow.approvalStages.length);
    }
    setApprovalChecked({});
  }, [sow?.id]);

  // When the pipeline API resolves and reports an in_review stage different
  // from our local index, advance the local index to match. This keeps the
  // checklist/form in sync with the real pipeline state across refetches.
  React.useEffect(() => {
    if (effectiveActiveIdx === null) return;
    setActiveApprovalIdx((prev) => (prev === effectiveActiveIdx ? prev : effectiveActiveIdx));
    setApprovalChecked({});
  }, [effectiveActiveIdx]);

  React.useEffect(() => {
    if (!sectionDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target as Node) &&
        sectionTriggerRef.current && !sectionTriggerRef.current.contains(e.target as Node)
      ) {
        setSectionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sectionDropdownOpen]);

  const openSectionDropdown = () => {
    if (sectionTriggerRef.current) {
      const rect = sectionTriggerRef.current.getBoundingClientRect();
      setDropdownCoords({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 220) });
    }
    setSectionDropdownOpen(v => !v);
  };
  const pushNotification = useNotificationStore((s) => s.push);
  const addSowMessage = useSowMessagesStore((s) => s.addMessage);

  // Seed initial stage_activated message on first visit
  React.useEffect(() => {
    if (!sow) return;
    const thread = useSowMessagesStore.getState().getThread(sow.id);
    if (thread.length === 0) {
      const activatedMsg = buildActivatedMessage(sow.id, 0, sow.title);
      useSowMessagesStore.getState().addMessage(sow.id, activatedMsg);
      useNotificationStore.getState().push({
        title: activatedMsg.subject,
        body: activatedMsg.body,
        severity: "medium",
        href: `/enterprise/sow/${sow.id}`,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sow?.id]);

  /* Filtered clauses */
  const filteredClauses = React.useMemo(() => {
    let list = [...clauses];
    if (clauseTypeFilter !== "all") list = list.filter((c) => c.type === clauseTypeFilter);
    if (clauseSearch.trim()) {
      const q = clauseSearch.toLowerCase();
      list = list.filter(
        (c) => c.text.toLowerCase().includes(q) || c.sectionRef.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clauses, clauseTypeFilter, clauseSearch]);

  /* Prohibited clause count */
  const prohibitedCount = clauses.filter((c) => c.isProhibited).length;

  /* Clause type counts for filter */
  const clauseTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    clauses.forEach((c) => { counts[c.type] = (counts[c.type] || 0) + 1; });
    return counts;
  }, [clauses]);

  /* Filtered audit events */
  const filteredAudit = React.useMemo(() => {
    if (auditTypeFilter === "all") return auditTrail;
    return auditTrail.filter((e) => e.action === auditTypeFilter);
  }, [auditTrail, auditTypeFilter]);

  /* Document sections filtered by search */
  const filteredDocSections = React.useMemo(() => {
    if (!docSearch.trim()) return sections;
    const q = docSearch.toLowerCase();
    return sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }, [sections, docSearch]);

  if (apiSowLoading && !apiSowData) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-5 p-6">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 p-6 space-y-4">
          <Skeleton className="h-7 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  if (!sow) return null;

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* SOW is ready for submission only if it's been parsed and has content */
  const isValidated = sow.parsedSections > 0 && sow.totalSections > 0;

  function handleConfirmSubmit() {
    if (confirmAndSubmit.isPending) return;

    const nowIso = new Date().toISOString();
    const patch = {
      status: "approval" as const,
      approvalStages: INITIAL_APPROVAL_STAGES,
      updatedAt: nowIso,
    };

    const upsertLocalSow = () => {
      const exists = allSows.some((s) => s.id === sow.id);
      if (exists) {
        updateSow(sow.id, patch);
      } else {
        addSow({ ...sow, ...patch });
      }
    };

    const upsertPipeline = () => {
      const exists = pipelineSows.some((s) => s.id === sow.id);
      const submittedDate = nowIso.split("T")[0];
      const totalValue = sow.estimatedBudget > 0 ? `$${sow.estimatedBudget.toLocaleString()}` : "$0";
      const stageApprover =
        sow.approvalStages?.find((s) => s.stage === "business")?.reviewer
        ?? sow.createdBy
        ?? "Enterprise Admin";

      const pipelinePayload = {
        id: sow.id,
        title: sow.title,
        client: sow.client,
        currentStage: 1,
        stageApprover,
        slaStatus: "on-track" as const,
        submittedDate,
        totalValue,
        completedStages: [],
        submittedBy: sow.createdBy,
      };

      if (exists) updatePipelineSOW(sow.id, pipelinePayload);
      else addPipelineSOW(pipelinePayload);
    };

    const finalizeSubmit = () => {
      upsertLocalSow();
      upsertPipeline();
      // Seed the first stage activation message
      const thread = useSowMessagesStore.getState().getThread(sow.id);
      if (thread.length === 0) {
        const activatedMsg = buildActivatedMessage(sow.id, 0, sow.title);
        useSowMessagesStore.getState().addMessage(sow.id, activatedMsg);
        useNotificationStore.getState().push({
          title: activatedMsg.subject,
          body: activatedMsg.body,
          severity: "medium",
          href: `/enterprise/sow/${sow.id}`,
        });
      }
      setSubmitSuccess(true);
      setTimeout(() => setShowSubmitModal(false), 2000);
    };

    if (apiSowData) {
      confirmAndSubmit.mutate(
        { confirms_accuracy: true },
        {
          onSuccess: finalizeSubmit,
          onError: (err) => {
            const message = err instanceof Error ? err.message : "Unable to submit for approval.";
            toast.error("Submission failed", message);
          },
        }
      );
      return;
    }

    finalizeSubmit();
  }

  async function handleDownloadPdf() {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await sowApi.exportSOW(sowId, "pdf");
      const contentType = blob.type;

      // API may return JSON with a download URL instead of raw bytes
      if (contentType.includes("json") || blob.size < 500) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          const downloadUrl = json?.data?.url ?? json?.url ?? json?.download_url ?? json?.pdf_url;
          if (downloadUrl) {
            window.open(downloadUrl, "_blank");
            return;
          }
        } catch {
          // not JSON — fall through to blob download
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sow.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      // Delay revoke so browser has time to start the download
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error("Download failed", msg);
    } finally {
      setIsDownloading(false);
    }
  }

  // Close out the SOW once all tasks are accepted → releases payout + credentials.
  // (isClosing useState is declared up top with the other hooks — see above —
  // because this function lives after an early return.)
  async function handleCloseSow() {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await sowApi.closeSOW(sowId, "All tasks accepted — closed from SOW detail.");
      // Flip the UI immediately: button → "SOW Closed" badge.
      setClosedOverride(true);
      try { updateSow(sowId, { status: "closed" }); } catch { /* store may not hold this sow */ }
      toast.success("SOW closed", "Payout released and credentials issued.");
    } catch (err) {
      toast.error("Could not close SOW", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-5"
    >
      {/* ── Breadcrumb ── */}
      <motion.div variants={fadeUp}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>
      </motion.div>

      {/* ── Header ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white overflow-hidden"
      >
        <div className="px-7 pt-6 pb-5">

          {/* ── SOW Header (live data from headerData, falls back to sow memo) ── */}
          {(() => {
            const h = headerData;
            const title     = h?.title     || sow.title;
            const client    = h?.client    || sow.client;
            const version   = h?.version   ?? sow.version;
            const status    = (closedOverride ? "closed" : (h?.status || sow.status)) as import("@/types/enterprise").SowStatus;
            const intake    = h?.intakeMode || sow.intakeMode;
            const conf      = h?.confidentiality || sow.confidentiality;
            const updatedAt = h?.updatedAt  || sow.updatedAt;
            const createdBy = sow.createdBy;
            const isAI      = intake === "ai_generated";

            const apiRaw = apiSowData as Record<string, unknown> | null | undefined;
            const apiBudgetMin = Number(apiRaw?.minimum_budget ?? apiRaw?.budget_minimum ?? 0);
            const apiBudgetMax = Number(apiRaw?.maximum_budget ?? apiRaw?.budget_maximum ?? 0);
            const resolvedBudgetMin = (h?.budgetMin ?? 0) > 0 ? h!.budgetMin : apiBudgetMin;
            const resolvedBudgetMax = (h?.budgetMax ?? 0) > 0 ? h!.budgetMax : apiBudgetMax;
            const budgetText = resolvedBudgetMin > 0 || resolvedBudgetMax > 0
              ? `$${resolvedBudgetMin.toLocaleString()}–$${resolvedBudgetMax.toLocaleString()}`
              : (h?.estimatedBudget ?? sow.estimatedBudget) > 0
              ? `$${(h?.estimatedBudget ?? sow.estimatedBudget).toLocaleString()}`
              : "TBD";
            const durationText = h?.estimatedDuration || sow.estimatedDuration || "TBD";

            // risk & confidence — in badges row
            const riskScore = h?.riskScore ?? sow.riskScore.overall;
            const riskLevel = h?.riskLevel ?? "";
            const aiConf    = h?.aiConfidence ?? sow.aiConfidence ?? 0;

            return (
              <>
                {/* ── Row 1: title · status · CTA ── */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <h1 className="text-[21px] font-bold text-brown-900 tracking-tight font-heading leading-snug">
                      {title}
                    </h1>
                    <Badge variant={statusVariantMap[status] ?? "beige"} size="md" dot>
                      {statusLabel[status] ?? status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {(status === "draft" || status === "review") && isValidated && (
                      <Button variant="gradient-primary" size="sm" onClick={() => setShowSubmitModal(true)}>
                        <Send className="w-3.5 h-3.5" /> Submit for Approval
                      </Button>
                    )}
                    {status === "draft" && !isValidated && (
                      <Link href={isAI ? "/enterprise/sow/generate" : "/enterprise/sow/upload"}>
                        <Button variant="outline" size="sm">
                          <Settings className="w-3.5 h-3.5" /> Continue Setup
                        </Button>
                      </Link>
                    )}
                    {status === "approval" && (
                      <Link href={`/enterprise/sow/${sow.id}/approve`}>
                        <Button variant="outline" size="sm">
                          <Clock className="w-3.5 h-3.5" /> View Approval Progress
                        </Button>
                      </Link>
                    )}
                    {status === "approved" && sow.planId && (
                      <Link href={`/enterprise/decomposition/${sow.planId}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3.5 h-3.5" /> View Plan
                        </Button>
                      </Link>
                    )}
                    {status === "approved" && (
                      <Button variant="gradient-primary" size="sm" onClick={handleCloseSow} disabled={isClosing}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isClosing ? "Closing…" : "Close SOW"}
                      </Button>
                    )}
                    {status === "closed" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                        <CheckCircle2 className="w-3 h-3" /> SOW Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Row 2: client | v{version} | 👤 createdBy ── */}
                <div className="flex items-center gap-0 mt-2 text-[12px] text-beige-500">
                  {client && (
                    <span className="font-medium text-brown-700">{client}</span>
                  )}
                  {client && <span className="mx-2.5 text-beige-300">|</span>}
                  <span>v{version}</span>
                  {createdBy && (
                    <>
                      <span className="mx-2.5 text-beige-300">|</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-beige-200 flex items-center justify-center shrink-0">
                          <User className="w-2.5 h-2.5 text-beige-500" />
                        </span>
                        {createdBy}
                      </span>
                    </>
                  )}
                </div>

                {/* ── Divider ── */}
                <div className="mt-4 mb-4 border-t border-beige-100" />

                {/* ── Row 3: 2-column metrics ── */}
                <div className="flex items-stretch">
                  <div className="pr-6">
                    <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-widest mb-1">Estimated Budget</p>
                    <p className="text-[13px] font-bold text-brown-800">{budgetText}</p>
                  </div>
                  <div className="w-px bg-beige-200 self-stretch" />
                  <div className="pl-6">
                    <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-widest mb-1">Estimated Duration</p>
                    <p className="text-[13px] font-bold text-brown-800">{durationText}</p>
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="mt-4 mb-3 border-t border-beige-100" />

                {/* ── Row 4: badges ── */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Intake mode */}
                  <Badge variant={isAI ? "teal" : "beige"} size="sm">
                    {isAI ? <><Bot className="w-3 h-3" /> AI Generated</> : <><Upload className="w-3 h-3" /> Manual Upload</>}
                  </Badge>

                  {/* Confidentiality */}
                  <Badge variant={confidentialityVariantMap[conf as import("@/types/enterprise").ConfidentialityLevel] ?? "beige"} size="sm">
                    <Lock className="w-3 h-3" />
                    {conf.charAt(0).toUpperCase() + conf.slice(1)}
                  </Badge>

                  {/* Risk score — manual: shows level; AI: just number */}
                  {riskScore > 0 && (
                    <Badge variant={riskScore <= 25 ? "forest" : riskScore <= 50 ? "gold" : "brown"} size="sm">
                      <Gauge className="w-3 h-3" />
                      Risk {riskScore}/100{riskLevel && !isAI ? ` · ${riskLevel}` : ""}
                    </Badge>
                  )}

                  {/* AI confidence */}
                  {aiConf > 0 && (
                    <Badge variant={confidenceColor(aiConf) === "forest" ? "forest" : confidenceColor(aiConf) === "teal" ? "teal" : "gold"} size="sm">
                      <Sparkles className="w-3 h-3" />
                      AI {aiConf % 1 === 0 ? aiConf : aiConf.toFixed(1)}% Confidence
                    </Badge>
                  )}

                  {updatedAt && (
                    <span className="text-[11px] text-beige-400 ml-0.5">Updated {formatDate(updatedAt)}</span>
                  )}
                </div>
              </>
            );
          })()}

        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
         9-TAB CONTENT (B6 Steps 2-10)
         ══════════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-100 bg-beige-50/50 overflow-hidden">
        <Tabs defaultValue="approval" className="w-full">
          <div className="border-b border-beige-200/50 bg-beige-50/30">
            <TabsList className="flex flex-wrap bg-transparent gap-0 p-0 px-3">
              <TabsTrigger value="approval" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-brown-500 data-[state=active]:text-brown-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[12.5px] font-medium text-gray-500 px-3 py-3 hover:text-gray-700 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Approval
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-brown-500 data-[state=active]:text-brown-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[12.5px] font-medium text-gray-500 px-3 py-3 hover:text-gray-700 transition-colors">
                <BookOpen className="w-3.5 h-3.5 shrink-0" /> Document
              </TabsTrigger>
              <TabsTrigger value="linked" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-brown-500 data-[state=active]:text-brown-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[12.5px] font-medium text-gray-500 px-3 py-3 hover:text-gray-700 transition-colors">
                <Link2 className="w-3.5 h-3.5 shrink-0" /> Linked
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-brown-500 data-[state=active]:text-brown-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[12.5px] font-medium text-gray-500 px-3 py-3 hover:text-gray-700 transition-colors">
                <GitBranch className="w-3.5 h-3.5 shrink-0" /> Versions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════════════════════════════════════════════════
             TAB 1: Metadata (B6 Step 2)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="metadata" className="mt-0">
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Core Details */}
                <div className="rounded-2xl border border-beige-200/50 bg-beige-50/30 p-5">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">
                    SOW Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Client", value: sow.client },
                      { label: "Created By", value: sow.createdBy },
                      { label: "Created", value: formatDateTime(sow.createdAt) },
                      { label: "Last Updated", value: formatDateTime(sow.updatedAt) },
                      { label: "File Size", value: sow.fileSize },
                      { label: "Pages", value: `${sow.pages} pages` },
                      { label: "Estimated Budget", value: (() => { const ar = apiSowData as Record<string, unknown> | null | undefined; const mn = (headerData?.budgetMin ?? 0) > 0 ? headerData!.budgetMin : Number(ar?.minimum_budget ?? ar?.budget_minimum ?? 0); const mx = (headerData?.budgetMax ?? 0) > 0 ? headerData!.budgetMax : Number(ar?.maximum_budget ?? ar?.budget_maximum ?? 0); return mn > 0 || mx > 0 ? `$${mn.toLocaleString()}–$${mx.toLocaleString()}` : sow.estimatedBudget > 0 ? `$${sow.estimatedBudget.toLocaleString()}` : "TBD"; })() },
                      { label: "Estimated Duration", value: sow.estimatedDuration },
                      { label: "Version", value: `v${sow.version}` },
                      { label: "Approved By", value: sow.approvedBy || "--" },
                      { label: "SLA Compliance", value: sow.slaCompliance ? `${sow.slaCompliance}%` : "--" },
                      { label: "Confidentiality", value: sow.confidentiality.charAt(0).toUpperCase() + sow.confidentiality.slice(1) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">{label}</span>
                        <span className="text-[13px] font-medium text-brown-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stakeholders */}
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-3">Stakeholders</h3>
                  <div className="flex flex-wrap gap-2">
                    {sow.stakeholders.map((name) => (
                      <div key={name} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-beige-50 border border-beige-200/50">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brown-200 to-beige-200 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-brown-600" />
                        </div>
                        <span className="text-[13px] font-medium text-brown-800">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {sow.tags.map((tag) => (
                      <Badge key={tag} variant="beige" size="md">
                        <Tag className="w-3 h-3" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right sidebar: AI Confidence + quick risk */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5 text-center">
                  <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-4">
                    Overall AI Confidence
                  </h3>
                  <div className="flex justify-center mb-3">
                    <MetricRing
                      value={sow.aiConfidence}
                      size={110}
                      strokeWidth={8}
                      color={confidenceColor(sow.aiConfidence)}
                      label="Confidence"
                    />
                  </div>
                  <p className="text-[12px] text-beige-600 mt-2">
                    {sow.aiConfidence >= 90 ? "High confidence -- ready for review"
                      : sow.aiConfidence >= 70 ? "Good confidence -- some sections need attention"
                      : sow.aiConfidence > 0 ? "Needs review -- several sections below threshold"
                      : "Not yet parsed"}
                  </p>
                </div>

                {/* Quick risk summary */}
                {(() => {
                  const r = apiRiskBreakdown ?? sow.riskScore;
                  return r.overall > 0 ? (
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                      <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">Risk Score</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className={cn("w-5 h-5", r.overall <= 30 ? "text-forest-500" : r.overall <= 60 ? "text-gold-500" : "text-brown-600")} />
                        <span className={cn("text-[18px] font-bold", r.overall <= 30 ? "text-forest-600" : r.overall <= 60 ? "text-gold-600" : "text-brown-700")}>
                          {r.overall}/100
                        </span>
                        <Badge variant={r.overall <= 25 ? "forest" : r.overall <= 50 ? "gold" : "brown"} size="sm">
                          {r.overall <= 25 ? "Low" : r.overall <= 50 ? "Medium" : r.overall <= 75 ? "High" : "Critical"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-beige-500">See Risk & Compliance tab for full breakdown.</p>
                    </div>
                  ) : null;
                })()}

                {/* Deliverables summary */}
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                  <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">Content Summary</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-beige-600">Sections parsed</span>
                      <span className="text-[12px] font-bold text-brown-800">{sow.parsedSections}/{sow.totalSections}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-beige-600">Clauses tagged</span>
                      <span className="text-[12px] font-bold text-brown-800">{clauses.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-beige-600">Prohibited clauses</span>
                      <span className={cn("text-[12px] font-bold", prohibitedCount > 0 ? "text-brown-700" : "text-forest-600")}>
                        {prohibitedCount}
                      </span>
                    </div>
                    {sow.industry && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-beige-600">Industry</span>
                        <span className="text-[12px] font-bold text-brown-800">{sow.industry}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 2: Clauses (B6 Step 3)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="clauses" className="mt-0">
            <div className="p-5 space-y-4">
              {/* Header + filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">
                  Tagged Clauses
                  <span className="ml-2 text-[12px] font-normal text-beige-500">({clauses.length} total)</span>
                </h2>
                <div className="flex items-center gap-2">
                  <Select value={clauseTypeFilter} onValueChange={setClauseTypeFilter}>
                    <SelectTrigger className="h-8 text-xs w-[160px]">
                      <Filter className="w-3 h-3 mr-1 text-beige-400" />
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types ({clauses.length})</SelectItem>
                      {Object.entries(clauseTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <SelectItem key={type} value={type}>
                          {clauseTypeConfig[type]?.label || type} ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400" />
                    <input
                      type="text"
                      value={clauseSearch}
                      onChange={(e) => setClauseSearch(e.target.value)}
                      placeholder="Search clauses..."
                      className="h-8 pl-8 pr-3 text-xs rounded-lg border border-beige-200 bg-white/80 text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200 w-[180px]"
                    />
                  </div>
                </div>
              </div>

              {/* Prohibited clauses warning */}
              {prohibitedCount > 0 && (
                <div className="rounded-xl bg-gradient-to-r from-brown-50 to-beige-50 border border-brown-200/60 p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brown-100 flex items-center justify-center shrink-0">
                    <Ban className="w-4 h-4 text-brown-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-brown-800">
                      {prohibitedCount} Prohibited Clause{prohibitedCount > 1 ? "s" : ""} Detected
                    </p>
                    <p className="text-[12px] text-beige-600 mt-0.5">
                      These clauses violate standard risk allocation policy and must be addressed before approval.
                    </p>
                  </div>
                </div>
              )}

              {/* Clause list */}
              <div className="space-y-2">
                {filteredClauses.length === 0 ? (
                  <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-12 text-center">
                    <p className="text-sm text-beige-500">No clauses match your filters.</p>
                  </div>
                ) : (
                  filteredClauses.map((clause) => (
                    <div
                      key={clause.id}
                      className={cn(
                        "rounded-xl border p-4 transition-all",
                        clause.isProhibited
                          ? "border-brown-200/80 bg-brown-50/30"
                          : "border-beige-200/50 bg-white/70 backdrop-blur-sm hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {clause.isProhibited && (
                          <div className="w-7 h-7 rounded-full bg-brown-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Ban className="w-3.5 h-3.5 text-brown-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant={clauseTypeConfig[clause.type]?.variant || "beige"} size="sm">
                              {clauseTypeConfig[clause.type]?.label || clause.type}
                            </Badge>
                            <span className="text-[10px] text-beige-500 font-mono">{clause.sectionRef}</span>
                            {clause.isProhibited && (
                              <Badge variant="brown" size="sm">
                                <Ban className="w-2.5 h-2.5" /> Prohibited
                              </Badge>
                            )}
                          </div>
                          <p className="text-[13px] text-brown-800 leading-relaxed">{clause.text}</p>
                          {clause.isProhibited && clause.prohibitedReason && (
                            <div className="mt-2 rounded-lg bg-brown-50 border border-brown-200/50 p-3">
                              <p className="text-[11px] font-semibold text-brown-700 mb-0.5">Violation</p>
                              <p className="text-[12px] text-brown-600">{clause.prohibitedReason}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-10 h-1.5 rounded-full bg-beige-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                clause.confidence >= 90 ? "bg-forest-500" : clause.confidence >= 75 ? "bg-teal-500" : "bg-gold-500"
                              )}
                              style={{ width: `${clause.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-beige-600 w-7 text-right">{clause.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 3: Document (B6 Step 4)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="document" className="mt-0">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide flex items-center gap-2">
                  {sow.intakeMode === "ai_generated" ? "Generated Document" : "Uploaded Document"}
                  {sectionsLoading && sections.length === 0
                    ? <span className="ml-1 w-3.5 h-3.5 rounded-full border-2 border-beige-300 border-t-brown-500 animate-spin inline-block" />
                    : <span className="ml-2 text-[12px] font-normal text-beige-500">({sections.length} sections)</span>
                  }
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400" />
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Search document..."
                      className="h-8 pl-8 pr-3 text-xs rounded-lg border border-beige-200 bg-white/80 text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200 w-[180px]"
                    />
                  </div>
                </div>
              </div>

              {/* Expand/collapse all */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (expandedSections.size === sections.length) setExpandedSections(new Set());
                    else setExpandedSections(new Set(sections.map((s) => s.id)));
                  }}
                  className="text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  {expandedSections.size === sections.length ? "Collapse all" : "Expand all"}
                </button>
              </div>

              {sectionsLoading && sections.length === 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-beige-100 bg-beige-50/50 p-4 flex items-center gap-3">
                      <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/5 rounded" />
                        <Skeleton className="h-3 w-3/5 rounded" />
                      </div>
                      <Skeleton className="w-16 h-1.5 rounded-full hidden sm:block" />
                      <Skeleton className="w-8 h-3 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredDocSections.length === 0 ? (
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-7 h-7 text-beige-400" />
                  </div>
                  <p className="text-sm font-semibold text-brown-800 mb-1">
                    {sections.length === 0 ? "No sections parsed yet" : "No matching sections"}
                  </p>
                  <p className="text-xs text-beige-500">
                    {sections.length === 0
                      ? "Sections will appear here once the AI finishes parsing the document."
                      : "Try different search terms."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocSections.map((section, idx) => {
                    const isExpanded = expandedSections.has(section.id);
                    const realIdx = sections.findIndex((s) => s.id === section.id);
                    return (
                      <div
                        key={section.id}
                        className="rounded-2xl border border-beige-100 bg-beige-50/50 overflow-hidden hover:shadow-md transition-all"
                      >
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center gap-3 p-4 text-left hover:bg-beige-50/40 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-beige-100 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-beige-600">
                              {String(realIdx + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[13px] font-semibold text-brown-900 truncate">{section.title}</h3>
                            {!isExpanded && (
                              <p className="text-[11px] text-beige-500 truncate mt-0.5">
                                {section.content.substring(0, 80)}...
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1.5 rounded-full bg-beige-100 overflow-hidden hidden sm:block">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  section.confidence >= 90 ? "bg-forest-500" : section.confidence >= 75 ? "bg-teal-500" : "bg-gold-500"
                                )}
                                style={{ width: `${section.confidence}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-beige-600 w-8 text-right">{section.confidence}%</span>
                            {(section as { aiSuggestion?: string }).aiSuggestion && <Sparkles className="w-3.5 h-3.5 text-gold-500 shrink-0" />}
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-beige-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-beige-400 shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-beige-100">
                            <div className="mt-3 text-[13px] text-brown-700 leading-relaxed space-y-2">
                              {section.content.split("\n\n").map((block, bi) => {
                                const lines = block.split("\n").filter(Boolean);
                                const isBulletBlock = lines.every((l) => l.trimStart().startsWith("-") || l.trimStart().startsWith("*") || l.startsWith("  -"));
                                if (isBulletBlock) {
                                  return (
                                    <ul key={bi} className="list-none space-y-1 pl-1">
                                      {lines.map((line, li) => (
                                        <li key={li} className="flex items-start gap-2">
                                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brown-300 shrink-0" />
                                          <span dangerouslySetInnerHTML={{ __html: line.replace(/^\s*[-*]\s*/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                }
                                return (
                                  <p key={bi} dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
                                );
                              })}
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">Confidence</span>
                              <div className="flex-1">
                                <Progress value={section.confidence} size="sm" variant={confidenceVariant(section.confidence)} />
                              </div>
                              <span className="text-[11px] font-mono font-bold text-brown-700">{section.confidence}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 4: AI Analysis (B6 Step 5)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="ai-analysis" className="mt-0">
            <div className="p-5 space-y-5">
              {sow.intakeMode === "ai_generated" ? (
                /* ── AI-Generated SOWs ── */
                <>
                  <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">AI Generation Analysis</h2>

                  {/* Generation Parameters */}
                  {genParams && (
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                      <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Generation Parameters</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: "Template", value: genParams.templateUsed },
                          { label: "Industry", value: genParams.industry },
                          { label: "Project Type", value: genParams.projectType },
                          { label: "Wizard Progress", value: `${genParams.wizardStepsCompleted}/${genParams.totalWizardSteps} steps` },
                          { label: "Generated At", value: formatDateTime(genParams.generatedAt) },
                          { label: "Duration", value: genParams.generationDuration },
                          { label: "Guardrails Passed", value: `${genParams.guardrailsPassed}/${genParams.totalGuardrails}` },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <span className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">{label}</span>
                            <p className="text-[13px] font-medium text-brown-800 mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Breakdown */}
                  <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                    <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Confidence Score Breakdown</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <MetricRing value={sow.aiConfidence} size={80} strokeWidth={7} color={confidenceColor(sow.aiConfidence)} label="Overall" />
                      <div>
                        <p className="text-[18px] font-bold text-brown-900">{sow.aiConfidence}% Confidence</p>
                        <p className="text-[12px] text-beige-600">
                          {sow.aiConfidence >= 90 ? "High confidence — all sections above threshold" : "Some sections need review"}
                        </p>
                      </div>
                    </div>
                    {sections.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">Per-Section Confidence</p>
                        {sections.map((sec) => (
                          <div key={sec.id} className="flex items-center gap-3">
                            <span className="text-[12px] text-brown-700 w-[200px] truncate">{sec.title}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-beige-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", sec.confidence >= 90 ? "bg-forest-500" : sec.confidence >= 75 ? "bg-teal-500" : "bg-gold-500")}
                                style={{ width: `${sec.confidence}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-beige-600 w-8 text-right">{sec.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 8-Layer Hallucination Prevention */}
                  {hallucinationLayers.length > 0 && (
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                      <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">
                        8-Layer Hallucination Prevention
                      </h3>
                      <div className="space-y-3">
                        {hallucinationLayers.map((layer) => {
                          const statusConfig = {
                            passed: { badge: "forest" as const, icon: CheckCircle2, label: "Passed" },
                            warning: { badge: "gold" as const, icon: AlertTriangle, label: "Warning" },
                            failed: { badge: "brown" as const, icon: X, label: "Failed" },
                            skipped: { badge: "beige" as const, icon: Clock, label: "Skipped" },
                          }[layer.status];
                          if (!statusConfig) return null;
                          return (
                            <div key={layer.layer} className="flex items-start gap-3 p-3 rounded-xl bg-beige-50/50 border border-beige-200/30">
                              <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                layer.status === "passed" ? "bg-forest-100" : layer.status === "warning" ? "bg-gold-100" : layer.status === "failed" ? "bg-brown-100" : "bg-beige-100"
                              )}>
                                <statusConfig.icon className={cn("w-3.5 h-3.5",
                                  layer.status === "passed" ? "text-forest-600" : layer.status === "warning" ? "text-gold-600" : layer.status === "failed" ? "text-brown-600" : "text-beige-500"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-bold text-beige-500">Layer {layer.layer}</span>
                                  <span className="text-[13px] font-semibold text-brown-800">{layer.name}</span>
                                  <Badge variant={statusConfig.badge} size="sm">{statusConfig.label}</Badge>
                                </div>
                                <p className="text-[11px] text-beige-500 mb-1">{layer.description}</p>
                                <p className="text-[12px] text-brown-700">{layer.details}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Overall status */}
                      <div className="mt-4 pt-4 border-t border-beige-200/50 flex items-center gap-3">
                        {hallucinationLayers.some((l) => l.status === "failed") ? (
                          <Badge variant="brown" size="md"><X className="w-3 h-3" /> Issues Found</Badge>
                        ) : hallucinationLayers.some((l) => l.status === "warning") ? (
                          <Badge variant="gold" size="md"><AlertTriangle className="w-3 h-3" /> Warnings Detected</Badge>
                        ) : (
                          <Badge variant="forest" size="md"><CheckCircle2 className="w-3 h-3" /> All Clear</Badge>
                        )}
                        <span className="text-[12px] text-beige-600">
                          {hallucinationLayers.filter((l) => l.status === "passed").length}/{hallucinationLayers.length} layers passed
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hallucination Flags */}
                  {sow.hallucinationFlags && sow.hallucinationFlags.length > 0 && (
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                      <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Red-Flag Detections</h3>
                      <div className="space-y-3">
                        {sow.hallucinationFlags.map((flag) => (
                          <div key={flag.id} className={cn("rounded-xl border p-4", flag.resolved ? "border-forest-200/50 bg-forest-50/20" : "border-gold-200/50 bg-gold-50/20")}>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", flag.resolved ? "text-forest-500" : flag.severity === "high" ? "text-brown-600" : "text-gold-500")} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={flag.severity === "high" ? "brown" : flag.severity === "medium" ? "gold" : "beige"} size="sm">
                                    {flag.severity}
                                  </Badge>
                                  {flag.resolved && <Badge variant="forest" size="sm">Resolved</Badge>}
                                </div>
                                <p className="text-[13px] font-medium text-brown-800 mb-1">&ldquo;{flag.clause}&rdquo;</p>
                                <p className="text-[12px] text-beige-600">{flag.reason}</p>
                                <p className="text-[12px] text-teal-700 mt-1">Suggestion: {flag.suggestion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* ── Manual Upload SOWs ── */
                <>
                  <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">Parsing & Analysis Results</h2>

                  {/* Completeness Score */}
                  <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                    <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Completeness Score</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <MetricRing
                        value={sow.gapAnalysisScore || Math.round(sections.length > 0 ? (sections.reduce((s, sec) => s + sec.confidence, 0) / sections.length) : 0)}
                        size={80}
                        strokeWidth={7}
                        color={confidenceColor(sow.gapAnalysisScore || 0)}
                        label="Complete"
                      />
                      <div>
                        <p className="text-[18px] font-bold text-brown-900">
                          {sow.gapAnalysisScore || "--"}% Complete
                        </p>
                        <p className="text-[12px] text-beige-600">Minimum recommended: 80%</p>
                      </div>
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                    <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Gap Analysis</h3>
                    <p className="text-[12px] text-beige-600 mb-4">Comparison against platform SOW standard template.</p>
                    {sections.length > 0 ? (
                      <div className="space-y-3">
                        {sections.map((sec) => (
                          <div key={sec.id} className="flex items-center gap-3">
                            <span className="text-[12px] text-brown-700 w-[200px] truncate">{sec.title}</span>
                            <div className="flex-1 h-2 rounded-full bg-beige-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", sec.confidence >= 90 ? "bg-forest-500" : sec.confidence >= 75 ? "bg-teal-500" : "bg-gold-500")}
                                style={{ width: `${sec.confidence}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-brown-700 w-8 text-right">{sec.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-beige-500">No sections parsed yet.</p>
                    )}
                  </div>

                  {/* Hallucination Flags (manual uploads can have them too) */}
                  {sow.hallucinationFlags && sow.hallucinationFlags.length > 0 && (
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                      <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Red-Flag Detections</h3>
                      <div className="space-y-3">
                        {sow.hallucinationFlags.map((flag) => (
                          <div key={flag.id} className="rounded-xl border border-gold-200/50 bg-gold-50/20 p-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                              <div>
                                <Badge variant={flag.severity === "high" ? "brown" : "gold"} size="sm">{flag.severity}</Badge>
                                <p className="text-[13px] text-brown-800 mt-1">&ldquo;{flag.clause}&rdquo;</p>
                                <p className="text-[12px] text-beige-600 mt-0.5">{flag.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 5: Risk & Compliance (B6 Step 6)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="risk" className="mt-0">
            <div className="p-5 space-y-5">
              <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">Risk & Compliance</h2>

              {/* Risk Score Breakdown */}
              {(() => {
                const r = apiRiskBreakdown ?? sow.riskScore;
                return r.overall > 0 ? (
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider">Risk Score Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={cn("w-5 h-5", r.overall <= 30 ? "text-forest-500" : r.overall <= 60 ? "text-gold-500" : "text-brown-600")} />
                      <span className={cn("text-[20px] font-bold", r.overall <= 30 ? "text-forest-600" : r.overall <= 60 ? "text-gold-600" : "text-brown-700")}>
                        {r.overall}/100
                      </span>
                      <Badge variant={r.overall <= 25 ? "forest" : r.overall <= 50 ? "gold" : "brown"} size="md">
                        {r.overall <= 25 ? "Low Risk" : r.overall <= 50 ? "Medium Risk" : r.overall <= 75 ? "High Risk" : "Critical Risk"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Completeness", value: r.completeness, max: 30, weight: "30%" },
                      { label: "Confidence", value: r.confidence, max: 25, weight: "25%" },
                      { label: "Compliance", value: r.compliance, max: 25, weight: "25%" },
                      { label: "Pattern Match", value: r.patternMatch, max: 20, weight: "20%" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-beige-50/60 border border-beige-200/30 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-beige-600">{item.label}</span>
                          <span className="text-[10px] text-beige-400">Weight: {item.weight}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-[18px] font-bold text-brown-800">{item.value}</span>
                          <span className="text-[12px] text-beige-500">/{item.max}</span>
                        </div>
                        <div className="h-2 rounded-full bg-beige-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              (item.value / item.max) >= 0.85 ? "bg-forest-500" : (item.value / item.max) >= 0.6 ? "bg-teal-500" : "bg-gold-500"
                            )}
                            style={{ width: `${(item.value / item.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                ) : null;
              })()}

              {/* Ethics Screening */}
              <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Ethics Screening</h3>
                {ethicsScreening.length > 0 ? (
                  <div className="space-y-2">
                    {ethicsScreening.map((item) => {
                      const statusStyle = {
                        pass: { bg: "bg-forest-100", text: "text-forest-700", icon: CheckCircle2, label: "Pass" },
                        fail: { bg: "bg-brown-100", text: "text-brown-700", icon: X, label: "Fail" },
                        warning: { bg: "bg-gold-100", text: "text-gold-700", icon: AlertTriangle, label: "Warning" },
                        not_applicable: { bg: "bg-beige-100", text: "text-beige-600", icon: Clock, label: "N/A" },
                      }[item.status];
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-beige-200/30 bg-beige-50/30">
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", statusStyle.bg)}>
                            <statusStyle.icon className={cn("w-3.5 h-3.5", statusStyle.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-semibold text-brown-800">{item.criterion}</span>
                              <Badge
                                variant={item.status === "pass" ? "forest" : item.status === "fail" ? "brown" : item.status === "warning" ? "gold" : "beige"}
                                size="sm"
                              >
                                {statusStyle.label}
                              </Badge>
                            </div>
                            <p className="text-[12px] text-beige-600">{item.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-beige-500">No ethics screening data available.</p>
                )}
              </div>

              {/* Data Sensitivity Handling */}
              <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider">
                    Data Sensitivity: {sow.dataSensitivity.charAt(0).toUpperCase() + sow.dataSensitivity.slice(1)}
                  </h3>
                  <Badge variant={confidentialityVariantMap[sow.dataSensitivity]} size="sm">
                    <Lock className="w-2.5 h-2.5" />
                    {sow.dataSensitivity.charAt(0).toUpperCase() + sow.dataSensitivity.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {sensitivityReqs.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-beige-50/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                      <span className="text-[12px] text-brown-700">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Alignment */}
              <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-4">Regulatory Alignment</h3>
                {regulatoryItems.length > 0 ? (
                  <div className="space-y-2">
                    {regulatoryItems.map((item) => {
                      const statusStyle = {
                        compliant: { variant: "forest" as const, label: "Compliant" },
                        non_compliant: { variant: "brown" as const, label: "Non-Compliant" },
                        partial: { variant: "gold" as const, label: "Partial" },
                        not_assessed: { variant: "beige" as const, label: "Not Assessed" },
                      }[item.status];
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-beige-200/30 bg-beige-50/30">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-semibold text-brown-800">{item.regulation}</span>
                              <Badge variant={statusStyle.variant} size="sm">{statusStyle.label}</Badge>
                            </div>
                            <p className="text-[11px] text-beige-500 mb-1">{item.description}</p>
                            <p className="text-[12px] text-brown-700">{item.notes}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-beige-500">No regulatory alignment data available.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 6: Approval Status (B6 Step 7)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="approval" className="mt-0">
            {(() => {
              const STAGE_META: Record<string, { name: string; role: string }> = {
                business:            { name: "Business Owner Review",        role: "Enterprise Admin" },
                glimmora_commercial: { name: "GlimmoraTeam Commercial Review", role: "GlimmoraTeam Admin" },
                legal:               { name: "Legal / Compliance Review",    role: "Enterprise Admin" },
                security:            { name: "Security Review",              role: "Enterprise Admin" },
                final:               { name: "Final Sign-off",               role: "Enterprise Admin" },
              };
              const STAGE_CHECKLISTS: Record<string, string[]> = {
                business: [
                  "Scope aligns with stated business objectives",
                  "Budget range is within my authorisation limit",
                  "Timeline is realistic for the project scope",
                  "Deliverables are clearly defined",
                  "Stakeholders correctly identified",
                ],
                glimmora_commercial: [
                  "Commercial terms are acceptable",
                  "Pricing model is validated",
                  "Revenue recognition clauses reviewed",
                  "Client credit check completed",
                  "Contract template approved",
                ],
                legal: [
                  "IP ownership clauses are compliant",
                  "Liability caps are within policy",
                  "Data processing agreement reviewed",
                  "Dispute resolution terms accepted",
                  "Governing law confirmed",
                ],
                security: [
                  "Data classification requirements met",
                  "Security controls are documented",
                  "Penetration testing scope defined",
                  "Access control policy aligned",
                  "Incident response plan referenced",
                ],
                final: [
                  "All prior stages approved",
                  "Executive sign-off obtained",
                  "SOW filed in document repository",
                  "Client countersignature received",
                  "Kick-off meeting scheduled",
                ],
              };

              const totalStages = displayStages.length;
              // isDone: pipeline says all approved, OR the local index has passed
              // the last stage. Both are checked so we never render a 6th stage
              // (only 5 exist) even if the backend refetch lags behind clicks.
              const isDone = (totalStages > 0 && activeApprovalIdx >= totalStages)
                || (pipelineResolvedStages ? displayStages.every((s) => s.status === "approved") : false);
              const activeStageIdx = isDone ? totalStages - 1 : Math.min(activeApprovalIdx, totalStages - 1);
              // activeStage for checklist/form (clamped so it's never undefined)
              const activeStage    = isDone ? undefined : sow.approvalStages[activeStageIdx];
              const activeMeta     = !isDone && activeStage ? STAGE_META[activeStage.stage] : null;
              // The enterprise admin now signs ALL FIVE stages in sequence
              // (including Commercial), so this stage is never blocked/waiting.
              const isGlimmoraCommercialStage = false;
              const checklist      = !isDone && activeStage && !isGlimmoraCommercialStage
                ? (STAGE_CHECKLISTS[activeStage.stage] ?? [])
                : [];
              const allChecked     = checklist.every((_, i) => approvalChecked[`${activeApprovalIdx}-${i}`]);
              // Signature is required ONLY on the first stage (Business) and the
              // last stage (Final). The middle stages (Commercial/Legal/Security)
              // just need an Approve click.
              const signatureRequired = activeStageIdx === 0 || activeStageIdx === totalStages - 1;
              const canApprove = allChecked && (!signatureRequired || signatureText.trim().length > 0);

              const handleApprove = () => {
                const stageName = activeMeta?.name ?? "Stage";
                const doLocalApprove = () => {
                  toast.success(`Stage ${activeApprovalIdx + 1} Approved`, `${stageName} has been approved successfully.`);
                  addSowMessage(sow.id, buildApprovedMessage(sow.id, activeApprovalIdx, sow.title, sow.createdBy));
                  pushNotification({
                    title: `Stage ${activeApprovalIdx + 1} Approved — ${stageName}`,
                    body: `"${sow.title}" has moved to the next approval stage.`,
                    severity: "medium",
                    href: `/enterprise/sow/${sow.id}`,
                  });
                  const nextMsg = buildNextApproverMessage(sow.id, activeApprovalIdx + 1, sow.title);
                  if (nextMsg) {
                    addSowMessage(sow.id, nextMsg);
                    pushNotification({
                      title: nextMsg.subject,
                      body: nextMsg.body,
                      severity: "medium",
                      href: `/enterprise/sow/${sow.id}`,
                    });
                  }
                  setApprovalChecked({});
                  setSignatureText("");
                  setShowRequestChanges(false);
                  setRequestChangesNote("");
                  setShowComment(false);
                  setCommentText("");
                  // Never advance past the final stage (only 5 exist). Once the
                  // last stage is approved the pipeline is done.
                  setActiveApprovalIdx(prev => Math.min(prev + 1, totalStages));
                };

                recordDecision.mutate(
                  {
                    stage: activeApprovalIdx + 1,
                    decision: "approve",
                    // Middle stages don't require a signature → fall back to the
                    // admin's name so the audit trail still records who approved.
                    reviewer: signatureText.trim() || sow.createdBy || "Enterprise Admin",
                  },
                  {
                    onSuccess: doLocalApprove,
                    onError: (err) => {
                      console.error("[Approval] POST failed:", err);
                      // Advance locally so the UI is not blocked
                      doLocalApprove();
                    },
                  }
                );
              };

              const PRE_FILLED_NOTES: Record<number, string> = {
                0: "Please revisit the scope definition — deliverables in Section 3 are too broad and need measurable acceptance criteria before I can approve.",
                1: "The commercial terms need revision. The payment schedule doesn't align with milestone completion. Please adjust the invoicing structure.",
                2: "Legal review requires additional clarity on IP ownership clauses and data processing agreement references.",
                3: "Security controls documentation is incomplete. Please provide evidence of penetration testing scope and access control policies.",
                4: "Final sign-off pending resolution of all prior stage comments. Please resubmit after addressing feedback.",
              };

              const handleSubmitRequestChanges = () => {
                const stageName = activeMeta?.name ?? `Stage ${activeApprovalIdx + 1}`;
                const noteText = requestChangesNote || PRE_FILLED_NOTES[activeApprovalIdx] || "Please review and address the feedback.";

                // Send to decide API with decision: request_changes
                recordDecision.mutate(
                  {
                    stage: activeApprovalIdx + 1,
                    decision: "request_changes",
                    comments: `[${requestSection}] ${noteText}`,
                    reviewer: signatureText.trim() || sow.createdBy || "Enterprise Admin",
                  },
                  {
                    onError: (err) => console.error("[Approval] request_changes POST failed:", err),
                  }
                );

                // Push into global notification bell
                pushNotification({
                  title: `Changes Requested — ${stageName}`,
                  body: noteText,
                  severity: "high",
                  href: `/enterprise/sow/${sow.id}`,
                });

                // Play notification sound
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const playTone = (freq: number, start: number, dur: number, gain: number) => {
                    const osc = ctx.createOscillator();
                    const g   = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    g.gain.setValueAtTime(0, ctx.currentTime + start);
                    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
                    osc.connect(g);
                    g.connect(ctx.destination);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + dur);
                  };
                  playTone(880, 0,    0.18, 0.18);
                  playTone(660, 0.18, 0.22, 0.14);
                  playTone(440, 0.38, 0.30, 0.10);
                } catch (_) {}

                toast.warning(`Changes Requested — Stage ${activeApprovalIdx + 1}`, noteText);
                addSowMessage(sow.id, buildChangesRequestedMessage(sow.id, activeApprovalIdx, sow.title, sow.createdBy, noteText, requestSection));

                // Update SOW status in repository store
                updateSow(sow.id, { status: "changes_requested" });

                // Flag in pipeline store so it surfaces at the top with notification
                updatePipelineSOW(sow.id, {
                  changesRequested: true,
                  changeRequestReason: noteText,
                  changeRequestedAt: new Date().toISOString(),
                  changeRequestedBy: stageName,
                });

                setShowRequestChanges(false);
              };

              const handleSendComment = () => {
                if (!commentText.trim()) return;
                recordDecision.mutate(
                  {
                    stage: activeApprovalIdx + 1,
                    decision: "comment" as any,
                    comments: commentText,
                    reviewer: signatureText.trim() || sow.createdBy || "Enterprise Admin",
                  },
                  {
                    onSuccess: () => {
                      toast.success("Comment sent", "Your comment has been sent to Glimmora admin.");
                      setCommentText("");
                      setShowComment(false);
                    },
                    onError: (err) => {
                      toast.error("Failed to send", err instanceof Error ? err.message : "Please try again.");
                    },
                  }
                );
              };

              // Extract decisions/comments from the API pipeline for each stage
              const pipelineRawData = (pipelineApiData as any)?.data ?? {};
              const pipelineStageArr: any[] =
                Array.isArray(pipelineRawData?.stages) ? pipelineRawData.stages
                : Array.isArray(pipelineRawData?.approval_stages) ? pipelineRawData.approval_stages
                : Array.isArray(pipelineRawData) ? pipelineRawData
                : [];
              const stageNumLookup: Record<string, number> = { business: 1, glimmora_commercial: 2, commercial: 2, legal: 3, security: 4, final: 5 };
              const stageDecisions: Array<{ decision: string; comments: string; decided_at: string; decided_by: string; reply?: string }> =
                (() => {
                  const targetNum = activeApprovalIdx + 1;
                  const stage = pipelineStageArr.find((s: any) => {
                    const sVal = s.stage ?? s.stage_key ?? s.stage_number;
                    if (typeof sVal === "number") return sVal === targetNum;
                    if (typeof sVal === "string") return stageNumLookup[sVal] === targetNum || Number(sVal) === targetNum;
                    return false;
                  });
                  if (!stage) return [];
                  const raw = stage?.decisions ?? [];
                  const entries: Array<{ decision: string; comments: string; decided_at: string; decided_by: string; reply?: string }> = [];
                  // Stage-level comment string (from approve/reject action)
                  if (typeof stage.comments === "string" && stage.comments.trim()) {
                    entries.push({
                      decision: String(stage.status ?? "comment"),
                      comments: stage.comments,
                      decided_at: String(stage.decided_at ?? stage.updated_at ?? ""),
                      decided_by: String(stage.reviewer_name ?? stage.reviewer ?? ""),
                    });
                  }
                  // Individual decision entries
                  if (Array.isArray(raw)) {
                    raw.forEach((d: any) => {
                      entries.push({
                        decision: String(d.decision ?? d.type ?? "comment"),
                        comments: String(d.comments ?? d.message ?? d.text ?? ""),
                        decided_at: String(d.decided_at ?? d.created_at ?? d.timestamp ?? ""),
                        decided_by: String(d.decided_by?.name ?? d.decided_by?.email ?? d.author ?? d.reviewer ?? ""),
                        reply: d.reply ? String(d.reply) : undefined,
                      });
                    });
                  }
                  return entries;
                })();

              const isChangesRequested = changesRequestedStageIdx >= 0;
              const rejectedStageMeta = isChangesRequested
                ? STAGE_META[displayStages[changesRequestedStageIdx].stage]
                : null;

              return (
                <div className="space-y-0">
                  {/* ── Banner ── */}
                  {isChangesRequested && (
                    <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gold-50 border-b border-gold-100">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0" />
                        <p className="text-[13px] text-gold-800">
                          Changes requested on{" "}
                          <span className="font-bold">{rejectedStageMeta?.name ?? `Stage ${changesRequestedStageIdx + 1}`}</span>
                          {" "}— resolve the request below to resume approval.
                        </p>
                      </div>
                      <Link
                        href="/enterprise/sow/approval"
                        className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all"
                        style={{ background: "linear-gradient(135deg,#A67763,#8B5E4A)", boxShadow: "0 2px 8px rgba(166,119,99,0.35)" }}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Resolve in Pipeline
                      </Link>
                    </div>
                  )}
                  {!isChangesRequested && !isDone && activeMeta && (
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-teal-50 border-b border-teal-100">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <p className="text-[13px] text-teal-800">
                        {activeMeta.name} — waiting for:{" "}
                        <span className="font-bold">{activeMeta.role}</span>
                      </p>
                    </div>
                  )}
                  {isDone && (
                    <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-forest-50 border-b border-forest-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                        <p className="text-[13px] text-forest-800 font-medium">All stages approved — SOW is fully signed off.</p>
                      </div>
                      {sow.planId ? (
                        <Link
                          href="/enterprise/decomposition"
                          className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all"
                          style={{ background: "linear-gradient(135deg,#2A6068,#1D4A50)", boxShadow: "0 2px 8px rgba(42,96,104,0.30)" }}
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          View Decomposition
                        </Link>
                      ) : (
                        <button
                          onClick={handleStartDecomposition}
                          disabled={isDecomposing}
                          className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg,#2A6068,#1D4A50)", boxShadow: "0 2px 8px rgba(42,96,104,0.30)" }}
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          {isDecomposing ? "Starting…" : "Start Decomposition"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── Pipeline metadata from API ── */}
                  {pipelineInfo && (
                    <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-beige-50/60 border-b border-beige-100">
                      {pipelineInfo.approvalRoute && (
                        <p className="text-[11px] text-beige-500 truncate">
                          <span className="font-semibold text-beige-600 mr-1">Route:</span>
                          {pipelineInfo.approvalRoute}
                        </p>
                      )}
                      <span className={cn(
                        "shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        pipelineInfo.overallStatus === "completed" ? "bg-forest-100 text-forest-700"
                          : pipelineInfo.overallStatus === "in_progress" ? "bg-teal-100 text-teal-700"
                          : "bg-beige-100 text-beige-600"
                      )}>
                        {pipelineInfo.overallStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}

                  {/* ── Horizontal stepper ── */}
                  <div className="px-6 pt-6 pb-5 border-b border-beige-100">
                    <div className="relative flex items-start justify-between">
                      {/* connecting line behind circles */}
                      <div className="absolute top-5 left-0 right-0 h-px bg-beige-200 z-0" />
                      {displayStages.map((stage, idx) => {
                        // Use real pipeline status when available, else fall back to local index
                        const isApproved = pipelineResolvedStages
                          ? stage.status === "approved"
                          : idx < activeApprovalIdx;
                        const isActive = pipelineResolvedStages
                          ? stage.status === "in_review"
                          : idx === activeApprovalIdx && !isDone;
                        const isRejected = stage.status === "rejected";
                        const meta = STAGE_META[stage.stage] ?? { name: stage.stage, role: "" };
                        const extStage = stage as typeof stage & { slaStatus?: string; slaDueDays?: number };
                        return (
                          <div key={`${stage.stage}-${idx}`} className="relative z-10 flex flex-col items-center gap-1.5 flex-1">
                            <div className={cn(
                              "w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white shrink-0 transition-all",
                              isApproved ? "bg-teal-500 border-teal-500 shadow-md shadow-teal-100" :
                              isActive   ? "border-brown-400 ring-4 ring-brown-100 shadow-sm" :
                              isRejected ? "bg-brown-500 border-brown-500" :
                              "border-beige-300"
                            )}>
                              {isApproved
                                ? <CheckCircle2 className="w-5 h-5 text-white" />
                                : isRejected
                                ? <X className="w-4 h-4 text-white" />
                                : <span className={cn("text-[13px] font-bold",
                                    isActive ? "text-brown-600" : "text-beige-400"
                                  )}>{idx + 1}</span>
                              }
                            </div>
                            <div className="text-center px-1">
                              <p className={cn("text-[11px] font-semibold leading-tight",
                                isApproved ? "text-teal-700" : isActive ? "text-brown-800" : isRejected ? "text-brown-600" : "text-gray-600"
                              )}>{meta.name}</p>
                              <p className={cn("text-[10px] mt-0.5",
                                isApproved ? "text-teal-500" : isActive ? "text-teal-600" : "text-beige-400"
                              )}>{meta.role}</p>
                              {(isActive || isApproved) && extStage.slaDueDays != null && (
                                <span className={cn(
                                  "mt-1 inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                                  extStage.slaStatus === "on_track" ? "bg-teal-50 text-teal-600" :
                                  extStage.slaStatus === "at_risk"  ? "bg-gold-50 text-gold-600" :
                                  "bg-brown-50 text-brown-600"
                                )}>
                                  {isApproved ? "✓ Done" : `${extStage.slaDueDays}d SLA`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Checklist ── */}
                  {!isChangesRequested && !isDone && activeStage && checklist.length > 0 && (
                    <div className="px-6 py-5 border-b border-beige-100">
                      <p className="text-[10px] font-bold text-beige-500 uppercase tracking-widest mb-4">
                        Stage {activeApprovalIdx + 1} Review Checklist
                      </p>
                      <div className="space-y-3">
                        {checklist.map((item, i) => {
                          const key = `${activeApprovalIdx}-${i}`;
                          const checked = !!approvalChecked[key];
                          return (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                              <button
                                type="button"
                                onClick={() => setApprovalChecked(prev => ({ ...prev, [key]: !checked }))}
                                className="w-[18px] h-[18px] rounded-[5px] shrink-0 flex items-center justify-center transition-all duration-150"
                                style={checked ? {
                                  background: "linear-gradient(135deg,#2A6068,#1D4A50)",
                                  border: "none",
                                  boxShadow: "0 2px 6px rgba(42,96,104,0.35)",
                                } : {
                                  background: "#fff",
                                  border: "1.5px solid #D1D5DB",
                                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
                                }}
                                onMouseEnter={e => { if (!checked) e.currentTarget.style.borderColor = "#2A6068"; }}
                                onMouseLeave={e => { if (!checked) e.currentTarget.style.borderColor = "#D1D5DB"; }}
                              >
                                {checked && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                  >
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                  </motion.div>
                                )}
                              </button>
                              <span className={cn("text-[12.5px] transition-colors", checked ? "text-gray-400" : "text-gray-700")}>
                                {item}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── GlimmoraTeam-owned stage notice ── */}
                  {!isChangesRequested && !isDone && isGlimmoraCommercialStage && (
                    <div className="px-6 py-6 border-b border-beige-100 bg-teal-50/40">
                      <div className="flex items-start gap-3 max-w-2xl">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg,#2A6068,#1D4A50)", boxShadow: "0 2px 8px rgba(42,96,104,0.3)" }}
                        >
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-teal-900 mb-1">
                            Awaiting GlimmoraTeam Admin review
                          </p>
                          <p className="text-[12px] text-teal-800 leading-relaxed">
                            Stage 2 — GlimmoraTeam Commercial Review — is signed off by the GlimmoraTeam Admin.
                            No action is required from you. This SOW will automatically advance to{" "}
                            <span className="font-semibold">Stage 3 — Legal / Compliance Review</span>{" "}
                            as soon as the admin approves.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Digital Signature (only first + last stage) ── */}
                  {!isChangesRequested && !isDone && activeStage && !isGlimmoraCommercialStage && signatureRequired && (
                    <div className="px-6 py-3.5 border-b border-beige-100">
                      <p className="text-[9px] font-bold text-beige-500 uppercase tracking-widest mb-1">
                        Digital Signature
                      </p>
                      <p className="text-[11px] text-gray-400 mb-2">
                        Type your full name to sign — constitutes formal approval of Stage {activeApprovalIdx + 1}.
                      </p>
                      <input
                        type="text"
                        value={signatureText}
                        onChange={e => setSignatureText(e.target.value)}
                        placeholder="Your full name"
                        className="w-64 border border-beige-200 rounded-lg px-3 py-1.5 text-[12px] text-gray-800 italic font-medium bg-beige-50/50 focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all"
                      />
                    </div>
                  )}

                  {/* ── Request Changes panel ── */}
                  <AnimatePresence>
                  {showRequestChanges && !isDone && activeStage && (() => {
                    const SECTIONS = ["Section 1 — Business Context", "Section 2 — Delivery Scope", "Section 3 — Deliverables", "Section 4 — Timeline", "Section 5 — Budget"];
                    const MAX = 500;
                    const pct = Math.min((requestChangesNote.length / MAX) * 100, 100);
                    return (
                      <motion.div
                        key="request-changes"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="overflow-hidden border-b border-beige-100"
                      >
                      <div className="bg-white px-5 py-3" style={{ overflow: "visible" }}>
                        {/* constrained width card */}
                        <div className="max-w-sm">

                          {/* ── Header ── */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: "linear-gradient(135deg,#A67763,#8B5E4A)", boxShadow: "0 2px 8px rgba(166,119,99,0.3)" }}>
                                <MessageSquareDiff className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div>
                                <p className="text-[12.5px] font-bold text-gray-800 leading-none">Request changes</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{activeMeta?.name}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-brown-700 border border-brown-200 bg-brown-50 rounded-full px-2.5 py-0.5">
                              Stage {activeApprovalIdx + 1}
                            </span>
                          </div>

                          {/* ── Textarea ── */}
                          <textarea
                            rows={4}
                            maxLength={MAX}
                            value={requestChangesNote}
                            onChange={e => setRequestChangesNote(e.target.value)}
                            className="w-full rounded-xl px-3 py-2.5 text-[12px] text-gray-700 leading-relaxed resize-none focus:outline-none transition-all border border-gray-200 bg-white"
                            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                            onFocus={e => { e.currentTarget.style.borderColor = "rgba(166,119,99,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(166,119,99,0.1)"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                          />

                          {/* ── Section dropdown + char count ── */}
                          <div className="flex items-center justify-between mt-2 mb-3">

                            {/* Custom dropdown — portal to escape overflow:hidden parents */}
                            <div className="relative">
                              <button
                                ref={sectionTriggerRef}
                                type="button"
                                onClick={openSectionDropdown}
                                className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-700 transition-all"
                                style={{
                                  border: "1px solid rgba(166,119,99,0.3)",
                                  background: "linear-gradient(to bottom, #FFFAF7, #FFF3EC)",
                                  boxShadow: "0 1px 4px rgba(166,119,99,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
                                  minWidth: 180,
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#A67763" }} />
                                <span className="flex-1 text-left truncate">{requestSection}</span>
                                <motion.span animate={{ rotate: sectionDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                  <ChevronDown className="w-3 h-3 shrink-0" style={{ color: "#A67763" }} />
                                </motion.span>
                              </button>

                              {typeof document !== "undefined" && createPortal(
                                <AnimatePresence>
                                  {sectionDropdownOpen && (
                                    <motion.div
                                      ref={sectionDropdownRef}
                                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                      transition={{ duration: 0.15, ease: "easeOut" }}
                                      style={{
                                        position: "fixed",
                                        top: dropdownCoords.top,
                                        left: dropdownCoords.left,
                                        width: dropdownCoords.width,
                                        zIndex: 9999,
                                        background: "#fff",
                                        border: "1px solid rgba(166,119,99,0.2)",
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        boxShadow: "0 8px 28px rgba(166,119,99,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                                      }}
                                    >
                                      {SECTIONS.map((s, idx) => {
                                        const isSelected = s === requestSection;
                                        return (
                                          <button
                                            key={s}
                                            type="button"
                                            onClick={() => { setRequestSection(s); setSectionDropdownOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[11.5px] transition-all"
                                            style={{
                                              background: isSelected ? "linear-gradient(to right,#FFF3EC,#FFF8F4)" : "transparent",
                                              color: isSelected ? "#8B5E4A" : "#4B5563",
                                              fontWeight: isSelected ? 600 : 400,
                                              borderBottom: idx < SECTIONS.length - 1 ? "1px solid rgba(166,119,99,0.08)" : "none",
                                            }}
                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#FAFAFA"; }}
                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? "linear-gradient(to right,#FFF3EC,#FFF8F4)" : "transparent"; }}
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isSelected ? "#A67763" : "#D1D5DB" }} />
                                            {s}
                                            {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0" style={{ color: "#A67763" }} />}
                                          </button>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>,
                                document.body
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%`, background: pct > 80 ? "linear-gradient(to right,#A67763,#8B5E4A)" : "linear-gradient(to right,#2A6068,#1D4A50)" }} />
                              </div>
                              <span className="text-[10px] text-gray-400 tabular-nums">{requestChangesNote.length}/{MAX}</span>
                            </div>
                          </div>

                          {/* ── Footer actions ── */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                                <Fingerprint className="w-3 h-3" />
                              </button>
                              <button className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                                <Clock className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowRequestChanges(false)}
                                className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                              >Cancel</button>
                              <button
                                onClick={handleSubmitRequestChanges}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-bold text-white transition-all"
                                style={{ background: "linear-gradient(135deg,#A67763,#8B5E4A)", boxShadow: "0 2px 8px rgba(166,119,99,0.35)" }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(166,119,99,0.5)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(166,119,99,0.35)"; }}
                              >
                                <Send className="w-3 h-3" /> Send feedback
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>{/* end overflow-visible inner */}
                      </motion.div>
                    );
                  })()}
                  </AnimatePresence>

                  {/* ── Action buttons ── */}
                  {!isChangesRequested && !isDone && activeStage && !isGlimmoraCommercialStage && (
                    <div className="px-6 py-4 flex items-center gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={!canApprove}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all",
                          canApprove
                            ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-200"
                            : "bg-gray-300 cursor-not-allowed"
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Stage {activeApprovalIdx + 1}
                      </button>
                      {activeApprovalIdx === 1 && (
                        <button
                          onClick={() => {
                            setShowRequestChanges(v => !v);
                            setRequestChangesNote(PRE_FILLED_NOTES[activeApprovalIdx] ?? "");
                            setRequestCategory("scope");
                            setShowComment(false);
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                          style={{ background: "linear-gradient(135deg, #A67763, #8B5E4A)", boxShadow: "0 3px 10px rgba(166,119,99,0.35)" }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 5px 16px rgba(166,119,99,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 3px 10px rgba(166,119,99,0.35)"; e.currentTarget.style.transform = ""; }}
                        >
                          <Undo2 className="w-4 h-4" />
                          Request Changes
                        </button>
                      )}
                      {activeApprovalIdx !== 1 && (
                        <button
                          onClick={() => { setShowComment(v => !v); setShowRequestChanges(false); }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold border border-beige-200 text-brown-700 bg-beige-50 hover:bg-beige-100 transition-all"
                        >
                          <MessageSquareDiff className="w-4 h-4" />
                          Comment
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── Comment panel ── */}
                  <AnimatePresence>
                    {showComment && !isDone && activeStage && (
                      <motion.div
                        key="comment-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="overflow-hidden border-b border-beige-100"
                      >
                        <div className="bg-white px-6 py-4">
                          <div className="max-w-sm">
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-beige-100">
                                  <MessageSquareDiff className="w-3.5 h-3.5 text-brown-600" />
                                </div>
                                <div>
                                  <p className="text-[12.5px] font-bold text-gray-800 leading-none">Send comment to Glimmora admin</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Stage {activeApprovalIdx + 1} — {activeMeta?.name}</p>
                                </div>
                              </div>
                            </div>
                            <textarea
                              rows={3}
                              maxLength={500}
                              value={commentText}
                              onChange={e => setCommentText(e.target.value)}
                              placeholder="Write your comment..."
                              className="w-full rounded-xl px-3 py-2.5 text-[12px] text-gray-700 leading-relaxed resize-none focus:outline-none transition-all border border-gray-200 bg-white"
                              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                              onFocus={e => { e.currentTarget.style.borderColor = "rgba(42,96,104,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,96,104,0.08)"; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-gray-400">{commentText.length}/500</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setShowComment(false)}
                                  className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                                >Cancel</button>
                                <button
                                  onClick={handleSendComment}
                                  disabled={!commentText.trim() || recordDecision.isPending}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{ background: "linear-gradient(135deg,#2A6068,#1D4A50)", boxShadow: "0 2px 8px rgba(42,96,104,0.35)" }}
                                >
                                  <Send className="w-3 h-3" />
                                  {recordDecision.isPending ? "Sending…" : "Send"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Comments thread from API ── */}
                  {stageDecisions.length > 0 && (
                    <div className="px-6 py-4 border-t border-beige-100 space-y-3">
                      <p className="text-[10px] font-bold text-beige-500 uppercase tracking-widest">
                        Stage {activeApprovalIdx + 1} — Comments &amp; Decisions
                      </p>
                      {stageDecisions.map((d, i) => (
                        <div key={i} className="space-y-2">
                          <div className={cn(
                            "rounded-xl p-3 border text-[12px] leading-relaxed",
                            d.decision === "approve"
                              ? "bg-forest-50 border-forest-100 text-forest-800"
                              : d.decision === "request_changes"
                              ? "bg-gold-50 border-gold-100 text-gold-800"
                              : "bg-beige-50 border-beige-100 text-brown-700"
                          )}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold">
                                {d.decided_by}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={d.decision === "approve" ? "forest" : d.decision === "request_changes" ? "gold" : "beige"}
                                  size="sm"
                                >
                                  {d.decision === "approve" ? "Approved" : d.decision === "request_changes" ? "Changes Requested" : "Comment"}
                                </Badge>
                                {d.decided_at && (
                                  <span className="text-[10px] text-beige-400">
                                    {new Date(d.decided_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                            </div>
                            {d.comments && <p>{d.comments}</p>}
                          </div>
                          {/* Reply from Glimmora admin */}
                          {d.reply && (
                            <div className="ml-6 rounded-xl p-3 border border-teal-100 bg-teal-50 text-[12px] text-teal-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Bot className="w-3.5 h-3.5 text-teal-600" />
                                <span className="text-[11px] font-bold text-teal-700">Glimmora Admin</span>
                              </div>
                              <p>{d.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit for Approval (pre-pipeline) */}
                  {(sow.status === "draft" || sow.status === "review") && isValidated && (
                    <div className="px-6 py-4">
                      <Button variant="gradient-primary" size="sm" onClick={() => setShowSubmitModal(true)}>
                        <Send className="w-3.5 h-3.5" /> Submit for Approval
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 7: Versions (B6 Step 8 + B8)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="versions" className="mt-0">
            <div className="p-5 space-y-3">
              <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">
                Version History
                <span className="ml-2 text-[12px] font-normal text-beige-500">({versions.length} versions)</span>
              </h2>

              <div className="space-y-0">
                {versions.map((ver, idx) => (
                  <div key={ver.version} className="flex gap-4 relative">
                    <div className="flex flex-col items-center w-10 shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                        idx === 0 ? "bg-gradient-to-br from-brown-400 to-brown-500 text-white ring-4 ring-brown-100" : "bg-beige-100 text-beige-600"
                      )}>
                        v{ver.version}
                      </div>
                      {idx < versions.length - 1 && <div className="w-0.5 flex-1 bg-beige-200 mt-1" />}
                    </div>

                    <div className={cn(
                      "flex-1 rounded-2xl border p-4 mb-3",
                      idx === 0 ? "border-brown-200/60 bg-brown-50/30" : "border-beige-200/50 bg-white/70 backdrop-blur-sm"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[13px] font-semibold text-brown-900">Version {ver.version}</span>
                            {idx === 0 && <Badge variant="brown" size="sm">Current</Badge>}
                            <Badge variant={ver.status === "approved" ? "forest" : "beige"} size="sm" dot>
                              {ver.status === "approved" ? "Approved" : "Draft"}
                            </Badge>
                            {/* B8 spec: intake mode indicator per version */}
                            <Badge variant={ver.intakeMode === "ai_generated" ? "teal" : "beige"} size="sm">
                              {ver.intakeMode === "ai_generated" ? (
                                <><Bot className="w-2.5 h-2.5" /> AI</>
                              ) : (
                                <><Upload className="w-2.5 h-2.5" /> Upload</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-[12px] text-beige-600 leading-relaxed">{ver.changes}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-beige-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {ver.changedBy}
                        </div>
                        <span className="w-1 h-1 rounded-full bg-beige-300" />
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDateTime(ver.date)}
                        </div>
                        {idx !== 0 && (
                          <Link
                            href={`/enterprise/sow/${sow.id}/compare`}
                            className="text-[11px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Compare with current
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 8: Audit History (B6 Step 9)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="audit" className="mt-0">
            <div className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">Audit Trail</h2>
                <div className="flex items-center gap-2">
                  {/* Event type filter (B6 spec: filter by type) */}
                  <Select value={auditTypeFilter} onValueChange={setAuditTypeFilter}>
                    <SelectTrigger className="h-8 text-xs w-[140px]">
                      <Filter className="w-3 h-3 mr-1 text-beige-400" />
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="updated">Updated</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="parsed">Parsed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Export button (B6 spec: export audit log) */}
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Download className="w-3.5 h-3.5" /> Export
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-beige-100 bg-beige-50/50 overflow-hidden">
                {filteredAudit.map((event, idx) => {
                  const config = auditActionConfig[event.action] || auditActionConfig.updated;
                  const IconComp = auditActionIcon[event.action] || ClipboardList;
                  return (
                    <div
                      key={event.id}
                      className={cn("flex items-start gap-4 p-4", idx < filteredAudit.length - 1 && "border-b border-beige-100")}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", config.bg)}>
                        <IconComp className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold text-brown-900">{event.actor}</span>
                          <Badge
                            variant={event.action === "approved" ? "forest" : event.action === "created" || event.action === "parsed" ? "teal" : event.action === "submitted" ? "brown" : "gold"}
                            size="sm"
                          >
                            {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-beige-600 leading-relaxed">{event.details}</p>
                        <p className="text-[11px] text-beige-400 mt-1">{formatDateTime(event.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}

                {filteredAudit.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-sm text-beige-500">No audit events match your filter.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 9: Linked Projects (B6 Step 10)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="linked" className="mt-0">
            <div className="p-5 space-y-4">
              <h2 className="text-[14px] font-bold text-brown-800 uppercase tracking-wide">Linked Resources</h2>

              {sow.planId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href={`/enterprise/decomposition/${sow.planId}`} className="block group">
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shrink-0">
                          <GitBranch className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-beige-500 uppercase tracking-wider mb-0.5">Decomposition Plan</p>
                          <p className="text-[14px] font-semibold text-brown-900 group-hover:text-brown-700 transition-colors">
                            {sow.title} -- Plan
                          </p>
                          <p className="text-[12px] text-beige-600 mt-1">Plan ID: {sow.planId}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-beige-400 group-hover:text-teal-500 transition-colors shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>

                  {linkedProject ? (
                    <Link href={`/enterprise/projects/${linkedProject.id}`} className="block group">
                      <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-6 h-6 text-forest-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-beige-500 uppercase tracking-wider mb-0.5">Active Project</p>
                            <p className="text-[14px] font-semibold text-brown-900 group-hover:text-brown-700 transition-colors">{linkedProject.title}</p>
                            <p className="text-[12px] text-beige-600 mt-1">Client: {linkedProject.client}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] text-beige-500">Progress:</span>
                              <Badge variant={linkedProject.health === "on_track" ? "forest" : "gold"} size="sm">
                                {linkedProject.progress}%
                              </Badge>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-beige-400 group-hover:text-forest-500 transition-colors shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-beige-100 to-beige-200 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-6 h-6 text-beige-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-beige-500 uppercase tracking-wider mb-0.5">Project</p>
                          <p className="text-[14px] font-semibold text-brown-900">No project created yet</p>
                          <p className="text-[12px] text-beige-500 mt-1">
                            A project will be created once the plan is approved and a team is assigned.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-beige-100 bg-beige-50/50 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-7 h-7 text-beige-400" />
                  </div>
                  <p className="text-sm font-semibold text-brown-800 mb-1">No linked resources yet</p>
                  <p className="text-xs text-beige-500 max-w-sm mx-auto">
                    Once this SOW is approved and decomposed, linked plans and projects will appear here.
                  </p>
                  {(sow.status === "draft" || sow.status === "review") && isValidated && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowSubmitModal(true)}>
                      <Send className="w-3.5 h-3.5" /> Submit for Approval
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
         SUBMISSION CONFIRMATION MODAL (B7 Step 1)
         ═══════════════════════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-brown-950/30 backdrop-blur-sm"
            onClick={() => !submitSuccess && setShowSubmitModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg mx-4 rounded-2xl border border-beige-200/60 bg-white/95 backdrop-blur-xl shadow-2xl shadow-brown-900/10 p-6"
          >
            {!submitSuccess ? (
              <>
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-brown-600" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-brown-900">Submit SOW for Approval?</h3>
                    <p className="text-[13px] text-beige-600 mt-0.5">
                      This will send the SOW through the 4-stage approval pipeline.
                    </p>
                  </div>
                </div>

                {/* SOW Summary */}
                <div className="rounded-xl bg-beige-50/80 border border-beige-200/50 p-4 mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-beige-500 uppercase">Title</span>
                    <span className="text-[13px] font-medium text-brown-800">{sow.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-beige-500 uppercase">Risk Score</span>
                    <span className={cn(
                      "text-[13px] font-mono font-bold",
                      sow.riskScore.overall <= 25 ? "text-forest-600" : sow.riskScore.overall <= 50 ? "text-gold-600" : "text-brown-700"
                    )}>
                      {sow.riskScore.overall}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-beige-500 uppercase">Completeness</span>
                    <span className="text-[13px] font-medium text-brown-800">
                      {sow.gapAnalysisScore ? `${sow.gapAnalysisScore}%` : `${sow.parsedSections}/${sow.totalSections} sections`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-beige-500 uppercase">Sensitivity</span>
                    <Badge variant={confidentialityVariantMap[sow.confidentiality]} size="sm">
                      {sow.confidentiality.charAt(0).toUpperCase() + sow.confidentiality.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-beige-500 uppercase">Est. Timeline</span>
                    <span className="text-[13px] font-medium text-brown-800">{sow.estimatedDuration}</span>
                  </div>
                </div>

                {/* Approval Stages Preview */}
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-2">Approval Stages</p>
                  <div className="flex items-center gap-2">
                    {["Business", "Legal", "Security", "Final"].map((stage, idx) => (
                      <React.Fragment key={stage}>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-beige-100/80 border border-beige-200/50">
                          <span className="w-4 h-4 rounded-full bg-beige-200 flex items-center justify-center text-[9px] font-bold text-beige-600">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-medium text-brown-700">{stage}</span>
                        </div>
                        {idx < 3 && <div className="w-4 h-px bg-beige-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
                  <Button
                    variant="gradient-primary"
                    size="sm"
                    onClick={handleConfirmSubmit}
                    disabled={confirmAndSubmit.isPending}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {confirmAndSubmit.isPending ? "Submitting..." : "Confirm Submission"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-forest-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-forest-600" />
                </div>
                <h3 className="text-[16px] font-bold text-brown-900 mb-1">SOW Submitted Successfully</h3>
                <p className="text-[13px] text-beige-600">
                  The SOW has been sent to Stage 1: Business Owner Review.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
