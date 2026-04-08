"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Scale,
  UserCheck,
  DollarSign,
  Pen,
  RotateCcw,
  ChevronDown,
  Layers,
  Bell,
  CheckCheck,
  Send,
  X,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";
import { useSOWPipelineStore, type PipelineSOW, type SLAStatus, type ChangeRequestHistoryEntry } from "@/lib/stores/sow-pipeline-store";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { useManualSOWList } from "@/lib/hooks/use-manual-sow";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface PipelineStage {
  number: number;
  name: string;
  shortName: string;
  icon: LucideIcon;
  slaDescription: string;
  color: string;
  bgColor: string;
}


/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const PIPELINE_STAGES: PipelineStage[] = [
  {
    number: 1,
    name: "Business Owner Review",
    shortName: "Business",
    icon: UserCheck,
    slaDescription: "3 business days",
    color: "#6B7280",
    bgColor: "rgba(107, 114, 128, 0.08)",
  },
  {
    number: 2,
    name: "GlimmoraTeam Commercial Review",
    shortName: "Commercial",
    icon: DollarSign,
    slaDescription: "2 business days standard, auto-escalation after 4",
    color: "#92400E",
    bgColor: "rgba(146, 64, 14, 0.08)",
  },
  {
    number: 3,
    name: "Legal / Compliance Review",
    shortName: "Legal",
    icon: Scale,
    slaDescription: "5 business days",
    color: "#1E40AF",
    bgColor: "rgba(30, 64, 175, 0.08)",
  },
  {
    number: 4,
    name: "Security Review",
    shortName: "Security",
    icon: ShieldCheck,
    slaDescription: "3 business days",
    color: "#065F46",
    bgColor: "rgba(6, 95, 70, 0.08)",
  },
  {
    number: 5,
    name: "Final Sign-off",
    shortName: "Sign-off",
    icon: Pen,
    slaDescription: "2 business days",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.08)",
  },
];



/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function getSLABadgeVariant(status: SLAStatus): "forest" | "gold" | "danger" {
  switch (status) {
    case "on-track":
      return "forest";
    case "at-risk":
      return "gold";
    case "overdue":
      return "danger";
  }
}

function getSLALabel(status: SLAStatus): string {
  switch (status) {
    case "on-track":
      return "On Track";
    case "at-risk":
      return "At Risk";
    case "overdue":
      return "Overdue";
  }
}

function getStageBadgeVariant(stage: number): "beige" | "gold" | "teal" | "forest" | "brown" {
  switch (stage) {
    case 1:
      return "beige";
    case 2:
      return "gold";
    case 3:
      return "teal";
    case 4:
      return "forest";
    case 5:
      return "brown";
    default:
      return "beige";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function countSOWsAtStage(sows: PipelineSOW[], stage: number): number {
  return sows.filter((s) => s.currentStage === stage).length;
}

/* ═══════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════ */

function PipelineProgress({
  totalStages,
  currentStage,
  completedStages,
  stageColor,
}: {
  totalStages: number;
  currentStage: number;
  completedStages: number[];
  stageColor: string;
}) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center">
        {Array.from({ length: totalStages }, (_, i) => {
          const num = i + 1;
          const done = completedStages.includes(num);
          const active = num === currentStage;
          return (
            <React.Fragment key={num}>
              <div
                className="flex items-center justify-center rounded-full text-[0.5rem] font-bold shrink-0"
                style={{
                  width: 18,
                  height: 18,
                  background: done ? "#2D6A4F" : active ? stageColor : "transparent",
                  border: done || active ? "none" : "1.5px solid var(--border-soft)",
                  color: done || active ? "#fff" : "var(--ink-faint)",
                  transition: "all 0.3s ease",
                }}
              >
                {done ? <CheckCircle2 size={10} /> : num}
              </div>
              {num < totalStages && (
                <div
                  className="flex-1 h-[2px] rounded-full"
                  style={{
                    background: done ? "#2D6A4F" : "var(--border-soft)",
                    opacity: done ? 0.7 : 0.35,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[0.62rem]" style={{ color: "var(--ink-faint)" }}>
        {completedStages.length}/{totalStages} stages complete
      </p>
    </div>
  );
}

function PipelineStageCard({ stage, index, sows }: { stage: PipelineStage; index: number; sows: PipelineSOW[] }) {
  const count = countSOWsAtStage(sows, stage.number);
  const Icon = stage.icon;

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border-soft)",
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, background: stage.color, opacity: 0.7 }} />

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Icon + count row */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 38, height: 38, background: stage.bgColor }}
          >
            <Icon size={18} style={{ color: stage.color }} />
          </div>
          <div className="text-right">
            <span
              className="font-heading block"
              style={{ fontSize: "2rem", fontWeight: 700, color: stage.color, lineHeight: 1 }}
            >
              {count}
            </span>
            <span className="text-[0.6rem] font-medium uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>
              SOWs
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-soft)" }} />

        {/* Stage label + name */}
        <div>
          <span
            className="text-[0.6rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: stage.color, opacity: 0.8 }}
          >
            Stage {stage.number}
          </span>
          <h3
            className="font-heading mt-0.5"
            style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.35 }}
          >
            {stage.name}
          </h3>
        </div>

        {/* SLA */}
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mt-auto"
          style={{ background: stage.bgColor }}
        >
          <Clock size={11} style={{ color: stage.color, opacity: 0.8, flexShrink: 0 }} />
          <span className="text-[0.68rem]" style={{ color: stage.color, opacity: 0.9 }}>
            {stage.slaDescription}
          </span>
        </div>

        {/* Auto-escalation badge for stage 2 */}
        {stage.number === 2 && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: "rgba(146,64,14,0.06)", border: "1px solid rgba(146,64,14,0.14)" }}
          >
            <AlertTriangle size={10} style={{ color: "#92400E", flexShrink: 0 }} />
            <span className="text-[0.62rem]" style={{ color: "#92400E" }}>
              Auto-escalates after 4 days
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */

function deriveStageFromApprovalStages(stages: Record<string, unknown>[] | undefined): { currentStage: number; completedStages: number[] } {
  if (!stages || !Array.isArray(stages)) return { currentStage: 1, completedStages: [] };
  const completed: number[] = [];
  let current = 1;
  // API returns stages with `stage` as a number (1-5) and `status` as a string
  for (let i = 1; i <= 5; i++) {
    const match = stages.find((s) => (s.stage as number) === i);
    if (match && match.status === "approved") {
      completed.push(i);
      current = i + 1;
    } else {
      break;
    }
  }
  return { currentStage: Math.min(current, 5), completedStages: completed };
}

function deriveSLAStatus(submittedAt: string | undefined): SLAStatus {
  if (!submittedAt) return "on-track";
  const days = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days > 10) return "overdue";
  if (days > 5) return "at-risk";
  return "on-track";
}

export default function SOWApprovalPipelinePage() {
  const localSows = useSOWPipelineStore((s) => s.sows);
  const updateSOW = useSOWPipelineStore((s) => s.updateSOW);

  // Fetch real SOWs from API (status: approval)
  const { data: apiRes, isLoading } = useManualSOWList({ status: "approval" });
  const apiItems = ((apiRes?.data ?? apiRes) as Record<string, unknown>[] | undefined);

  // Merge API SOWs into PipelineSOW shape, deduplicating with local store
  const sows: PipelineSOW[] = React.useMemo(() => {
    const apiPipelineSows: PipelineSOW[] = (Array.isArray(apiItems) ? apiItems : []).map((item) => {
      const id = (item.id ?? item._id ?? "") as string;
      const approvalStages = (item.approval_stages ?? item.approvalStages) as Record<string, unknown>[] | undefined;
      const { currentStage, completedStages } = deriveStageFromApprovalStages(approvalStages);
      const submittedAt = (item.submitted_at ?? item.submittedAt ?? item.created_at ?? item.createdAt) as string | undefined;
      // If the local store has extra state (changesRequested, etc.), merge it
      const local = localSows.find((s) => s.id === id);
      return {
        id,
        title: (item.title ?? item.projectTitle ?? item.project_title ?? "Untitled") as string,
        client: (item.client ?? item.clientOrganisation ?? item.client_organisation ?? "") as string,
        currentStage,
        stageApprover: (item.stageApprover ?? local?.stageApprover ?? "Assigned Reviewer") as string,
        slaStatus: deriveSLAStatus(submittedAt),
        submittedDate: submittedAt ?? new Date().toISOString(),
        totalValue: (item.totalValue ?? item.total_value ?? local?.totalValue ?? "$0") as string,
        completedStages,
        submittedBy: (item.submittedBy ?? item.submitted_by ?? item.created_by) as string | undefined,
        changesRequested: local?.changesRequested,
        changeRequestReason: local?.changeRequestReason,
        changeRequestedAt: local?.changeRequestedAt,
        changeRequestedBy: local?.changeRequestedBy,
        changeRequestHistory: local?.changeRequestHistory,
      };
    });

    // Include local-only SOWs (not from API) as fallback
    const apiIds = new Set(apiPipelineSows.map((s) => s.id));
    const localOnly = localSows.filter((s) => !apiIds.has(s.id));
    return [...apiPipelineSows, ...localOnly];
  }, [apiItems, localSows]);
  const pushNotification = useNotificationStore((s) => s.push);
  const [stageFilter, setStageFilter] = React.useState<number | null>(null);
  const [slaFilter, setSLAFilter] = React.useState<SLAStatus | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = React.useState<Set<string>>(new Set());
  const [resolvePanel, setResolvePanel] = React.useState<Record<string, boolean>>({});
  const [resolveMessages, setResolveMessages] = React.useState<Record<string, string>>({});

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openResolvePanel(id: string) {
    setResolvePanel((prev) => ({ ...prev, [id]: true }));
    setExpandedIds((prev) => { const n = new Set(prev); n.add(id); return n; });
  }

  function handleAIResolve(sow: PipelineSOW) {
    const now = new Date().toISOString();
    const aiMessage = `This change request has been reviewed and resolved automatically. The SOW "${sow.title}" has been assessed against the requested revisions. All noted concerns have been addressed and the document is ready to proceed to the next approval stage.`;

    const historyEntry: ChangeRequestHistoryEntry = {
      reason: sow.changeRequestReason ?? "",
      requestedBy: sow.changeRequestedBy ?? "Unknown",
      requestedAt: sow.changeRequestedAt ?? now,
      resolvedAt: now,
      resolveMessage: aiMessage,
      stageAtRequest: sow.currentStage,
    };

    updateSOW(sow.id, {
      changesRequested: false,
      changeRequestReason: undefined,
      changeRequestedBy: undefined,
      changeRequestedAt: undefined,
      changeRequestHistory: [...(sow.changeRequestHistory ?? []), historyEntry],
    });
    pushNotification({
      title: "AI Resolved Change Request",
      body: `"${sow.title}" was automatically resolved by AI. The document is ready to proceed.`,
      severity: "low",
      href: `/enterprise/sow/${sow.id}/approve`,
    });
    setExpandedIds((prev) => { const n = new Set(prev); n.delete(sow.id); return n; });
    setResolvePanel((prev) => { const n = { ...prev }; delete n[sow.id]; return n; });
    setResolveMessages((prev) => { const n = { ...prev }; delete n[sow.id]; return n; });
  }

  function handleResolve(sow: PipelineSOW) {
    const message = resolveMessages[sow.id]?.trim();
    const now = new Date().toISOString();

    const historyEntry: ChangeRequestHistoryEntry = {
      reason: sow.changeRequestReason ?? "",
      requestedBy: sow.changeRequestedBy ?? "Unknown",
      requestedAt: sow.changeRequestedAt ?? now,
      resolvedAt: now,
      resolveMessage: message || undefined,
      stageAtRequest: sow.currentStage,
    };

    updateSOW(sow.id, {
      changesRequested: false,
      changeRequestReason: undefined,
      changeRequestedBy: undefined,
      changeRequestedAt: undefined,
      changeRequestHistory: [...(sow.changeRequestHistory ?? []), historyEntry],
    });
    pushNotification({
      title: "Change Request Resolved",
      body: message
        ? `"${sow.title}" resolved. Message: "${message}"`
        : `"${sow.title}" has been marked as resolved. Please resume your review.`,
      severity: "low",
      href: `/enterprise/sow/${sow.id}/approve`,
    });
    setExpandedIds((prev) => { const n = new Set(prev); n.delete(sow.id); return n; });
    setResolvePanel((prev) => { const n = { ...prev }; delete n[sow.id]; return n; });
    setResolveMessages((prev) => { const n = { ...prev }; delete n[sow.id]; return n; });
  }

  const changesRequestedSOWs = React.useMemo(
    () => sows.filter((s) => s.changesRequested),
    [sows]
  );

  const filteredSOWs = React.useMemo(() => {
    const filtered = sows.filter((sow) => {
      if (stageFilter !== null && sow.currentStage !== stageFilter) return false;
      if (slaFilter !== null && sow.slaStatus !== slaFilter) return false;
      if (
        searchQuery &&
        !sow.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !sow.client.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
    // Changes-requested SOWs always float to the top
    return [...filtered].sort((a, b) => {
      if (a.changesRequested && !b.changesRequested) return -1;
      if (!a.changesRequested && b.changesRequested) return 1;
      return 0;
    });
  }, [sows, stageFilter, slaFilter, searchQuery]);

  const totalInPipeline = sows.length;
  const onTrackCount = sows.filter((s) => s.slaStatus === "on-track").length;
  const atRiskCount = sows.filter((s) => s.slaStatus === "at-risk").length;
  const overdueCount = sows.filter((s) => s.slaStatus === "overdue").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Loading approval pipeline…
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8 lg:px-8"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-heading"
              style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--ink)" }}
            >
              Approval Pipeline
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
              Track and manage SOW approvals across the five-stage pipeline.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <Layers size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {totalInPipeline} SOWs in Pipeline
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Changes Requested Notification Banner ── */}
      {changesRequestedSOWs.length > 0 && (
        <motion.div variants={fadeUp} className="max-w-xl">
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(166, 119, 99, 0.25)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                style={{ width: 32, height: 32, background: "rgba(166, 119, 99, 0.12)" }}
              >
                <AlertTriangle size={15} style={{ color: "#A67763" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#6A4C3F" }}>
                  {changesRequestedSOWs.length} SOW{changesRequestedSOWs.length > 1 ? "s require" : " requires"} attention
                </p>
                <div className="mt-2 space-y-2">
                  <AnimatePresence initial={false}>
                  {changesRequestedSOWs.map((sow) => {
                    const isExpanded = expandedIds.has(sow.id);
                    return (
                      <motion.div
                        key={sow.id}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
                        transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
                        className="rounded-lg"
                        style={{ border: "1px solid rgba(166,119,99,0.22)", background: "rgba(166,119,99,0.04)" }}
                      >
                        {/* Header row — clickable to expand */}
                        <button
                          onClick={() => toggleExpand(sow.id)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors"
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(166,119,99,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold truncate" style={{ color: "#6A4C3F" }}>
                              {sow.title}
                            </span>
                            {sow.changeRequestedBy && (
                              <span className="text-[0.65rem] shrink-0" style={{ color: "#A67763" }}>
                                — {sow.changeRequestedBy}
                              </span>
                            )}
                          </div>
                          <ChevronDown
                            size={13}
                            style={{
                              color: "#A67763",
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                              flexShrink: 0,
                            }}
                          />
                        </button>

                        {/* Expanded content — animated */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="expanded"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div
                                className="px-3 pb-3 pt-2 space-y-2.5"
                                style={{ borderTop: "1px solid rgba(166,119,99,0.15)" }}
                              >
                                {sow.changeRequestReason && (
                                  <div
                                    className="rounded-md px-3 py-2"
                                    style={{ background: "rgba(166,119,99,0.08)" }}
                                  >
                                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1" style={{ color: "#A67763" }}>
                                      Change Request Message
                                    </p>
                                    <p className="text-xs leading-relaxed" style={{ color: "#6A4C3F" }}>
                                      {sow.changeRequestReason}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  {sow.changeRequestedAt && (
                                    <span className="text-[0.65rem]" style={{ color: "#A67763", opacity: 0.7 }}>
                                      {new Date(sow.changeRequestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                  )}
                                  {!resolvePanel[sow.id] && (
                                    <div className="ml-auto flex items-center gap-2">
                                      <button
                                        onClick={() => handleAIResolve(sow)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                        style={{ background: "linear-gradient(135deg, #A67763, #8B5E4A)", color: "#fff" }}
                                      >
                                        <Sparkles size={12} />
                                        Resolve with AI
                                      </button>
                                      <button
                                        onClick={() => openResolvePanel(sow.id)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                        style={{ background: "#1E293B", color: "#fff" }}
                                      >
                                        Acknowledge & Resolve
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Resolve comment panel — animated */}
                                <AnimatePresence initial={false}>
                                  {resolvePanel[sow.id] && (
                                    <motion.div
                                      key="resolve-panel"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                                      className="overflow-hidden"
                                    >
                                      <div
                                        className="rounded-lg p-3 space-y-2"
                                        style={{ background: "rgba(166,119,99,0.06)", border: "1px solid rgba(166,119,99,0.18)" }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <p className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "#A67763" }}>
                                            Message to Approver
                                          </p>
                                          <button
                                            onClick={() => setResolvePanel((p) => ({ ...p, [sow.id]: false }))}
                                            className="p-0.5 rounded hover:opacity-60 transition-opacity"
                                          >
                                            <X size={12} style={{ color: "#A67763" }} />
                                          </button>
                                        </div>
                                        <textarea
                                          rows={3}
                                          placeholder="Explain what was resolved or any follow-up steps..."
                                          value={resolveMessages[sow.id] ?? ""}
                                          onChange={(e) => setResolveMessages((p) => ({ ...p, [sow.id]: e.target.value }))}
                                          className="w-full resize-none rounded-md px-3 py-2 text-xs outline-none transition-all"
                                          style={{
                                            background: "var(--page-bg, #fff)",
                                            border: "1px solid rgba(166,119,99,0.25)",
                                            color: "var(--ink, #1a1a1a)",
                                          }}
                                        />
                                        <div className="flex justify-end">
                                          <button
                                            onClick={() => handleResolve(sow)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                            style={{ background: "#2D6A4F", color: "#fff" }}
                                          >
                                            <Send size={12} />
                                            Send & Resolve
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Summary Stats Row ── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(6, 95, 70, 0.08)" }}>
          <CheckCircle2 size={14} style={{ color: "#2D6A4F" }} />
          <span className="text-xs font-medium" style={{ color: "#2D6A4F" }}>{onTrackCount} On Track</span>
        </div>
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(146, 64, 14, 0.08)" }}>
          <AlertTriangle size={14} style={{ color: "#92400E" }} />
          <span className="text-xs font-medium" style={{ color: "#92400E" }}>{atRiskCount} At Risk</span>
        </div>
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(185, 28, 28, 0.08)" }}>
          <Clock size={14} style={{ color: "#B91C1C" }} />
          <span className="text-xs font-medium" style={{ color: "#B91C1C" }}>{overdueCount} Overdue</span>
        </div>
      </motion.div>

      {/* ── Pipeline Stage Overview Cards ── */}
      <motion.div variants={fadeUp}>
        <h2
          className="font-heading mb-4"
          style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Pipeline Stages
        </h2>
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {PIPELINE_STAGES.map((stage, i) => (
            <PipelineStageCard key={stage.number} stage={stage} index={i} sows={sows} />
          ))}
        </motion.div>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap items-center gap-3"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-soft)",
          borderRadius: 12,
          padding: "1rem 1.25rem",
        }}
      >
        <div className="flex items-center gap-2 mr-2">
          <Filter size={16} style={{ color: "var(--ink-muted)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
            Filters
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--ink-faint)" }}
          />
          <input
            type="text"
            placeholder="Search by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none"
            style={{
              background: "var(--page-bg)",
              border: "1px solid var(--border-soft)",
              color: "var(--ink)",
            }}
          />
        </div>

        {/* Stage filter buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStageFilter(null)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            )}
            style={{
              background: stageFilter === null ? "var(--ink)" : "transparent",
              color: stageFilter === null ? "var(--page-bg)" : "var(--ink-muted)",
              border: stageFilter === null ? "none" : "1px solid var(--border-soft)",
            }}
          >
            All
          </button>
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage.number}
              onClick={() => setStageFilter(stageFilter === stage.number ? null : stage.number)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  stageFilter === stage.number ? stage.color : "transparent",
                color:
                  stageFilter === stage.number ? "#fff" : "var(--ink-muted)",
                border:
                  stageFilter === stage.number
                    ? "none"
                    : "1px solid var(--border-soft)",
              }}
            >
              S{stage.number}
            </button>
          ))}
        </div>

        {/* SLA filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider mr-1" style={{ color: "var(--ink-faint)" }}>
            SLA
          </span>
          {(["on-track", "at-risk", "overdue"] as SLAStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setSLAFilter(slaFilter === status ? null : status)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  slaFilter === status
                    ? status === "on-track"
                      ? "#2D6A4F"
                      : status === "at-risk"
                      ? "#92400E"
                      : "#B91C1C"
                    : "transparent",
                color:
                  slaFilter === status ? "#fff" : "var(--ink-muted)",
                border:
                  slaFilter === status ? "none" : "1px solid var(--border-soft)",
              }}
            >
              {getSLALabel(status)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── SOW Pipeline Table ── */}
      <motion.div
        variants={fadeUp}
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}
      >
        {/* Header */}
        <div
          className="grid items-center px-6 py-3 gap-5"
          style={{
            gridTemplateColumns: "2fr 0.9fr 1.6fr 1.4fr 0.85fr 0.6fr",
            background: "var(--page-bg)",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          {["SOW", "Client", "Pipeline Progress", "Approver", "SLA", ""].map((h) => (
            <span key={h || "a"} className="text-[0.62rem] font-bold uppercase tracking-[0.13em]" style={{ color: "var(--ink-faint)" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Empty */}
        {filteredSOWs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Layers size={28} style={{ color: "var(--ink-faint)", opacity: 0.35 }} />
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>No SOWs match the current filters.</p>
          </div>
        ) : filteredSOWs.map((sow, idx) => {
          const stage = PIPELINE_STAGES[sow.currentStage - 1];
          const initials = sow.stageApprover.replace(/\(.*?\)/g, "").trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

          return (
            <motion.div
              key={sow.id}
              variants={slideInRight}
              className="grid items-center px-6 py-4 gap-5 transition-colors"
              style={{
                gridTemplateColumns: "2fr 0.9fr 1.6fr 1.4fr 0.85fr 0.6fr",
                borderBottom: idx < filteredSOWs.length - 1 ? "1px solid var(--border-soft)" : "none",
                borderLeft: sow.changesRequested ? `3px solid ${stage.color}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* SOW */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[0.83rem] font-semibold leading-tight truncate" style={{ color: "var(--ink)" }}>
                    {sow.title}
                  </p>
                  {sow.changesRequested && (
                    <span className="inline-flex items-center gap-1 shrink-0 text-[0.58rem] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
                      style={{ background: stage.bgColor, color: stage.color }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: stage.color }} />
                      Revision
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.68rem] font-semibold" style={{ color: "var(--ink-faint)" }}>{sow.totalValue}</span>
                  {sow.submittedBy && (
                    <span className="text-[0.68rem]" style={{ color: "var(--ink-faint)" }}>· {sow.submittedBy}</span>
                  )}
                </div>
              </div>

              {/* Client */}
              <span className="text-[0.78rem] min-w-0 block" style={{ color: "var(--ink-muted)", wordBreak: "break-word" }}>
                {sow.client}
              </span>

              {/* Pipeline Progress */}
              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-[18px] h-[18px] rounded flex items-center justify-center shrink-0" style={{ background: stage.bgColor }}>
                      {React.createElement(stage.icon, { size: 10, style: { color: stage.color } })}
                    </div>
                    <span className="text-[0.7rem] font-semibold" style={{ color: stage.color }}>{stage.name}</span>
                  </div>
                  <span className="text-[0.62rem] font-medium" style={{ color: "var(--ink-faint)" }}>
                    {sow.completedStages.length}/{5}
                  </span>
                </div>
                <PipelineProgress
                  totalStages={5}
                  currentStage={sow.currentStage}
                  completedStages={sow.completedStages}
                  stageColor={stage.color}
                />
              </div>

              {/* Approver */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[0.6rem] font-bold text-white"
                  style={{ background: `${stage.color}cc` }}>
                  {initials}
                </div>
                <div>
                  <p className="text-[0.73rem] font-medium leading-tight" style={{ color: "var(--ink)" }}>
                    {sow.stageApprover.replace(/\(.*?\)/, "").trim()}
                  </p>
                  {/\((.+?)\)/.test(sow.stageApprover) && (
                    <p className="text-[0.62rem]" style={{ color: "var(--ink-faint)" }}>
                      {sow.stageApprover.match(/\((.+?)\)/)?.[1]}
                    </p>
                  )}
                </div>
              </div>

              {/* SLA + date */}
              <div className="space-y-1">
                <Badge variant={getSLABadgeVariant(sow.slaStatus)} size="sm" dot>
                  {getSLALabel(sow.slaStatus)}
                </Badge>
                <p className="text-[0.62rem]" style={{ color: "var(--ink-faint)" }}>{formatDate(sow.submittedDate)}</p>
              </div>

              {/* Action */}
              <div className="flex justify-end">
                <Link href={`/enterprise/sow/${sow.id}`}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.72rem] font-semibold transition-all hover:opacity-80"
                    style={{ background: stage.bgColor, color: stage.color }}>
                    <Eye size={12} />
                    View
                  </button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Change Request History Table ── */}
      {(() => {
        const allHistory = sows.flatMap((sow) =>
          (sow.changeRequestHistory ?? []).map((h) => ({ ...h, sowId: sow.id, sowTitle: sow.title, client: sow.client }))
        ).sort((a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime());

        return (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw size={18} style={{ color: "var(--ink-muted)" }} />
              <h2 className="font-heading" style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)" }}>
                Change Request History
              </h2>
              {allHistory.length > 0 && (
                <Badge variant="gold" size="sm">{allHistory.length} resolved</Badge>
              )}
            </div>

            <div
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <div
                className="grid items-center gap-4 px-5 py-3 text-[0.62rem] font-bold uppercase tracking-[0.13em]"
                style={{
                  gridTemplateColumns: "1.6fr 0.9fr 1.2fr 1.4fr 0.8fr",
                  borderBottom: "1px solid var(--border-soft)",
                  background: "var(--page-bg)",
                  color: "var(--ink-faint)",
                }}
              >
                <span>SOW Title</span>
                <span>Client</span>
                <span>Requested By</span>
                <span>Resolve Message</span>
                <span>Resolved</span>
              </div>

              {allHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <RotateCcw size={28} style={{ color: "var(--ink-faint)", opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: "var(--ink-muted)" }}>No resolved change requests yet.</p>
                  <p className="text-xs" style={{ color: "var(--ink-faint)" }}>Resolved requests will appear here.</p>
                </div>
              ) : (
                allHistory.map((entry, idx) => {

                  return (
                    <motion.div
                      key={`${entry.sowId}-${entry.resolvedAt}`}
                      variants={slideInRight}
                      className="grid items-center gap-4 px-5 py-4"
                      style={{
                        gridTemplateColumns: "1.6fr 0.9fr 1.2fr 1.4fr 0.8fr",
                        borderBottom: idx < allHistory.length - 1 ? "1px solid var(--border-soft)" : "none",
                      }}
                    >
                      {/* SOW Title */}
                      <div>
                        <p className="text-[0.82rem] font-semibold leading-snug" style={{ color: "var(--ink)" }}>{entry.sowTitle}</p>
                        <Link href={`/enterprise/sow/${entry.sowId}`} className="text-[0.65rem] hover:underline" style={{ color: "var(--ink-faint)" }}>
                          View SOW →
                        </Link>
                      </div>

                      {/* Client */}
                      <span className="text-[0.78rem]" style={{ color: "var(--ink-muted)" }}>{entry.client}</span>

                      {/* Requested By */}
                      <span className="text-[0.75rem]" style={{ color: "var(--ink-muted)" }}>{entry.requestedBy}</span>

                      {/* Resolve Message */}
                      {entry.resolveMessage ? (
                        <button
                          onClick={() => setExpandedMessages((prev) => {
                            const next = new Set(prev);
                            const key = `${entry.sowId}-${entry.resolvedAt}`;
                            next.has(key) ? next.delete(key) : next.add(key);
                            return next;
                          })}
                          className="text-left w-full"
                        >
                          <p
                            className="text-[0.75rem] leading-snug"
                            style={{ color: "var(--ink-muted)" }}
                          >
                            {expandedMessages.has(`${entry.sowId}-${entry.resolvedAt}`)
                              ? entry.resolveMessage
                              : entry.resolveMessage.length > 80
                                ? entry.resolveMessage.slice(0, 80) + "…"
                                : entry.resolveMessage}
                          </p>
                          {entry.resolveMessage.length > 80 && (
                            <span className="text-[0.62rem] font-medium mt-0.5 block" style={{ color: "var(--ink-faint)" }}>
                              {expandedMessages.has(`${entry.sowId}-${entry.resolvedAt}`) ? "Show less" : "Show more"}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-[0.75rem] italic" style={{ color: "var(--ink-faint)" }}>No message</span>
                      )}

                      {/* Resolved date */}
                      <div>
                        <p className="text-[0.75rem]" style={{ color: "var(--ink-muted)" }}>{formatDate(entry.resolvedAt)}</p>
                        <p className="text-[0.62rem]" style={{ color: "var(--ink-faint)" }}>
                          {formatDate(entry.requestedAt)} requested
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })()}
    </motion.div>
  );
}
