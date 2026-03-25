"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Input } from "@/components/ui";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

type SLAStatus = "on-track" | "at-risk" | "overdue";

interface PipelineStage {
  number: number;
  name: string;
  shortName: string;
  icon: LucideIcon;
  slaDescription: string;
  color: string;
  bgColor: string;
}

interface PipelineSOW {
  id: string;
  title: string;
  client: string;
  currentStage: number;
  stageApprover: string;
  slaStatus: SLAStatus;
  submittedDate: string;
  totalValue: string;
  completedStages: number[];
}

interface RevisionItem {
  sowId: string;
  title: string;
  client: string;
  revisedStage: number;
  reason: string;
  requestedBy: string;
  date: string;
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

const MOCK_SOWS: PipelineSOW[] = [
  {
    id: "sow-001",
    title: "Cloud Migration Platform - Phase II",
    client: "Meridian Financial Group",
    currentStage: 3,
    stageApprover: "Sarah Chen (Legal Counsel)",
    slaStatus: "on-track",
    submittedDate: "2026-03-18",
    totalValue: "$485,000",
    completedStages: [1, 2],
  },
  {
    id: "sow-002",
    title: "AI-Powered Analytics Dashboard",
    client: "Vertex Health Systems",
    currentStage: 1,
    stageApprover: "James Morton (VP Engineering)",
    slaStatus: "on-track",
    submittedDate: "2026-03-21",
    totalValue: "$210,000",
    completedStages: [],
  },
  {
    id: "sow-003",
    title: "Enterprise Data Lake Architecture",
    client: "Cascade Logistics Inc.",
    currentStage: 2,
    stageApprover: "Emily Park (Commercial Lead)",
    slaStatus: "at-risk",
    submittedDate: "2026-03-14",
    totalValue: "$720,000",
    completedStages: [1],
  },
  {
    id: "sow-004",
    title: "Mobile App Redesign & Backend Overhaul",
    client: "NovaTech Solutions",
    currentStage: 4,
    stageApprover: "Dr. Alan Reeves (CISO)",
    slaStatus: "on-track",
    submittedDate: "2026-03-10",
    totalValue: "$340,000",
    completedStages: [1, 2, 3],
  },
  {
    id: "sow-005",
    title: "Payment Gateway Integration v3",
    client: "Lumina Retail Group",
    currentStage: 5,
    stageApprover: "Catherine Hayes (CEO)",
    slaStatus: "overdue",
    submittedDate: "2026-03-05",
    totalValue: "$560,000",
    completedStages: [1, 2, 3, 4],
  },
  {
    id: "sow-006",
    title: "DevOps Pipeline Modernization",
    client: "Ironclad Manufacturing",
    currentStage: 2,
    stageApprover: "Emily Park (Commercial Lead)",
    slaStatus: "on-track",
    submittedDate: "2026-03-19",
    totalValue: "$175,000",
    completedStages: [1],
  },
];

const REVISION_HISTORY: RevisionItem[] = [
  {
    sowId: "sow-007",
    title: "Legacy System Decommissioning",
    client: "Bridgewater Corp",
    revisedStage: 3,
    reason: "Missing data-processing addendum for GDPR compliance. Clause 14.2 needs amendment.",
    requestedBy: "Sarah Chen (Legal Counsel)",
    date: "2026-03-16",
  },
  {
    sowId: "sow-008",
    title: "Customer Portal v2 Enhancement",
    client: "Apex Dynamics",
    revisedStage: 1,
    reason: "Budget allocation exceeds quarterly cap by 12%. Needs re-scoping or phased rollout.",
    requestedBy: "James Morton (VP Engineering)",
    date: "2026-03-12",
  },
  {
    sowId: "sow-009",
    title: "Infrastructure Monitoring Suite",
    client: "Helix BioSciences",
    revisedStage: 4,
    reason: "Security audit flagged PII handling in logging module. Requires data masking strategy.",
    requestedBy: "Dr. Alan Reeves (CISO)",
    date: "2026-03-09",
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

function countSOWsAtStage(stage: number): number {
  return MOCK_SOWS.filter((s) => s.currentStage === stage).length;
}

/* ═══════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════ */

function StageIndicator({
  totalStages,
  currentStage,
  completedStages,
}: {
  totalStages: number;
  currentStage: number;
  completedStages: number[];
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalStages }, (_, i) => {
        const stageNum = i + 1;
        const isCompleted = completedStages.includes(stageNum);
        const isCurrent = stageNum === currentStage;

        return (
          <React.Fragment key={stageNum}>
            <div
              className="flex items-center justify-center rounded-full text-[0.55rem] font-bold"
              style={{
                width: 20,
                height: 20,
                ...(isCompleted
                  ? {
                      background: "var(--forest-500, #2D6A4F)",
                      color: "#fff",
                    }
                  : isCurrent
                  ? {
                      background: "var(--gold-500, #D4A017)",
                      color: "#fff",
                    }
                  : {
                      background: "transparent",
                      border: "1.5px solid var(--border-soft)",
                      color: "var(--ink-faint)",
                    }),
              }}
            >
              {isCompleted ? (
                <CheckCircle2 size={12} />
              ) : (
                stageNum
              )}
            </div>
            {stageNum < totalStages && (
              <div
                style={{
                  width: 10,
                  height: 2,
                  borderRadius: 1,
                  background: isCompleted
                    ? "var(--forest-400, #52B788)"
                    : "var(--border-soft)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PipelineStageCard({ stage, index }: { stage: PipelineStage; index: number }) {
  const count = countSOWsAtStage(stage.number);
  const Icon = stage.icon;

  return (
    <motion.div
      variants={fadeUp}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border-soft)",
        borderRadius: 12,
        padding: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Stage accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: stage.color,
          opacity: 0.6,
        }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            background: stage.bgColor,
          }}
        >
          <Icon size={20} style={{ color: stage.color }} />
        </div>
        <span
          className="font-heading"
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: stage.color,
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      </div>

      <div className="mb-1">
        <span
          className="text-[0.65rem] font-semibold uppercase tracking-wider"
          style={{ color: "var(--ink-faint)" }}
        >
          Stage {stage.number}
        </span>
      </div>
      <h3
        className="font-heading"
        style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}
      >
        {stage.name}
      </h3>

      <div className="mt-3 flex items-center gap-1.5">
        <Clock size={12} style={{ color: "var(--ink-faint)" }} />
        <span className="text-[0.7rem]" style={{ color: "var(--ink-muted)" }}>
          SLA: {stage.slaDescription}
        </span>
      </div>

      {stage.number === 2 && (
        <div
          className="mt-2 rounded-md px-2 py-1.5"
          style={{
            background: "rgba(146, 64, 14, 0.05)",
            border: "1px solid rgba(146, 64, 14, 0.12)",
          }}
        >
          <span className="text-[0.65rem]" style={{ color: "var(--ink-muted)" }}>
            Auto-escalation enabled after 4 business days
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */

export default function SOWApprovalPipelinePage() {
  const [stageFilter, setStageFilter] = React.useState<number | null>(null);
  const [slaFilter, setSLAFilter] = React.useState<SLAStatus | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredSOWs = React.useMemo(() => {
    return MOCK_SOWS.filter((sow) => {
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
  }, [stageFilter, slaFilter, searchQuery]);

  const totalInPipeline = MOCK_SOWS.length;
  const onTrackCount = MOCK_SOWS.filter((s) => s.slaStatus === "on-track").length;
  const atRiskCount = MOCK_SOWS.filter((s) => s.slaStatus === "at-risk").length;
  const overdueCount = MOCK_SOWS.filter((s) => s.slaStatus === "overdue").length;

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
            <PipelineStageCard key={stage.number} stage={stage} index={i} />
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
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-soft)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Table Header */}
        <div
          className="grid items-center gap-4 px-5 py-3"
          style={{
            gridTemplateColumns: "2fr 1.2fr 1.2fr 1.5fr 0.9fr 0.9fr 0.7fr",
            borderBottom: "1px solid var(--border-soft)",
            background: "var(--page-bg)",
          }}
        >
          {["SOW Title", "Client", "Current Stage", "Stage Approver", "SLA Status", "Submitted", ""].map(
            (header) => (
              <span
                key={header || "actions"}
                className="text-[0.65rem] font-semibold uppercase tracking-wider"
                style={{ color: "var(--ink-faint)" }}
              >
                {header}
              </span>
            )
          )}
        </div>

        {/* Table Rows */}
        {filteredSOWs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Layers size={32} style={{ color: "var(--ink-faint)", opacity: 0.5 }} />
            <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
              No SOWs match the current filters.
            </p>
          </div>
        ) : (
          filteredSOWs.map((sow, idx) => (
            <motion.div
              key={sow.id}
              variants={slideInRight}
              className="grid items-center gap-4 px-5 py-3.5 transition-colors"
              style={{
                gridTemplateColumns: "2fr 1.2fr 1.2fr 1.5fr 0.9fr 0.9fr 0.7fr",
                borderBottom:
                  idx < filteredSOWs.length - 1
                    ? "1px solid var(--border-soft)"
                    : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--page-bg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Title */}
              <div>
                <p
                  className="text-sm font-medium leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {sow.title}
                </p>
                <span className="text-[0.7rem]" style={{ color: "var(--ink-faint)" }}>
                  {sow.totalValue}
                </span>
              </div>

              {/* Client */}
              <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
                {sow.client}
              </span>

              {/* Current Stage */}
              <div className="flex flex-col gap-1.5">
                <Badge variant={getStageBadgeVariant(sow.currentStage)} size="sm">
                  Stage {sow.currentStage}: {PIPELINE_STAGES[sow.currentStage - 1].shortName}
                </Badge>
                <StageIndicator
                  totalStages={5}
                  currentStage={sow.currentStage}
                  completedStages={sow.completedStages}
                />
              </div>

              {/* Approver */}
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {sow.stageApprover}
              </span>

              {/* SLA Status */}
              <Badge variant={getSLABadgeVariant(sow.slaStatus)} size="sm" dot>
                {getSLALabel(sow.slaStatus)}
              </Badge>

              {/* Submitted */}
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {formatDate(sow.submittedDate)}
              </span>

              {/* Actions */}
              <div className="flex justify-end">
                <Link href={`/enterprise/sow/${sow.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Eye size={14} />
                    <span className="text-xs">View</span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ── Revision History ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw size={18} style={{ color: "var(--ink-muted)" }} />
          <h2
            className="font-heading"
            style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Revision History
          </h2>
          <Badge variant="gold" size="sm">
            {REVISION_HISTORY.length} revisions
          </Badge>
        </div>

        <div className="space-y-3">
          {REVISION_HISTORY.map((item) => (
            <motion.div
              key={item.sowId}
              variants={scaleIn}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
                borderRadius: 12,
                padding: "1rem 1.25rem",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className="text-sm font-medium"
                      style={{ color: "var(--ink)" }}
                    >
                      {item.title}
                    </h4>
                    <Badge variant="gold" size="sm">
                      Changes Requested
                    </Badge>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
                    {item.client} &middot; Returned at Stage {item.revisedStage} (
                    {PIPELINE_STAGES[item.revisedStage - 1].name})
                  </p>
                  <div
                    className="rounded-lg px-3 py-2"
                    style={{
                      background: "var(--page-bg)",
                      border: "1px solid var(--border-soft)",
                    }}
                  >
                    <p className="text-xs italic" style={{ color: "var(--ink-muted)" }}>
                      &ldquo;{item.reason}&rdquo;
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[0.7rem]" style={{ color: "var(--ink-faint)" }}>
                    {formatDate(item.date)}
                  </p>
                  <p className="text-[0.7rem] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    by {item.requestedBy}
                  </p>
                  <Link href={`/enterprise/sow/${item.sowId}`}>
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      <span className="text-xs">Review</span>
                      <ChevronRight size={12} />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
