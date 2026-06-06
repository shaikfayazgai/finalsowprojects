"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  Download,
  Archive,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  Sparkles,
  Upload,
  Clock,
  ChevronRight,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";

/* ═══════════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════════ */

type ArchiveReason = "completed" | "rejected" | "expired" | "superseded" | "cancelled";

interface ArchivedSOW {
  id: string;
  title: string;
  client: string;
  archivedAt: string;
  originalStatus: "approved" | "rejected";
  archiveReason: ArchiveReason;
  intakeMode: "ai_generated" | "manual_upload";
  version: number;
  contractedValue: number;
  duration: string;
  aiConfidence: number;
  createdBy: string;
  archivedBy: string;
  industry: string;
  dataSensitivity: "public" | "internal" | "confidential" | "restricted";
}

const ARCHIVED_SOWS: ArchivedSOW[] = [
  {
    id: "sow-arch-001",
    title: "Legacy CRM Migration to Salesforce",
    client: "Pinnacle Financial",
    archivedAt: "2026-01-15T10:00:00Z",
    originalStatus: "approved",
    archiveReason: "completed",
    intakeMode: "ai_generated",
    version: 4,
    contractedValue: 420000,
    duration: "8 months",
    aiConfidence: 96,
    createdBy: "Priya Nair",
    archivedBy: "System",
    industry: "Finance",
    dataSensitivity: "confidential",
  },
  {
    id: "sow-arch-002",
    title: "Warehouse Automation Control System",
    client: "Atlas Logistics",
    archivedAt: "2026-02-01T14:30:00Z",
    originalStatus: "rejected",
    archiveReason: "rejected",
    intakeMode: "manual_upload",
    version: 2,
    contractedValue: 0,
    duration: "6 months",
    aiConfidence: 72,
    createdBy: "Vikram Shah",
    archivedBy: "System",
    industry: "Logistics",
    dataSensitivity: "internal",
  },
  {
    id: "sow-arch-003",
    title: "Customer Self-Service Portal v1",
    client: "TechVista Solutions",
    archivedAt: "2026-02-10T09:15:00Z",
    originalStatus: "approved",
    archiveReason: "superseded",
    intakeMode: "ai_generated",
    version: 3,
    contractedValue: 185000,
    duration: "4 months",
    aiConfidence: 91,
    createdBy: "Priya Nair",
    archivedBy: "Priya Nair",
    industry: "Technology",
    dataSensitivity: "internal",
  },
  {
    id: "sow-arch-004",
    title: "Compliance Reporting Engine",
    client: "Meridian Healthcare",
    archivedAt: "2025-12-20T16:00:00Z",
    originalStatus: "approved",
    archiveReason: "completed",
    intakeMode: "manual_upload",
    version: 5,
    contractedValue: 310000,
    duration: "5 months",
    aiConfidence: 88,
    createdBy: "Anita Desai",
    archivedBy: "System",
    industry: "Healthcare",
    dataSensitivity: "restricted",
  },
  {
    id: "sow-arch-005",
    title: "Internal Training Platform MVP",
    client: "GreenLeaf Education",
    archivedAt: "2026-01-28T11:45:00Z",
    originalStatus: "rejected",
    archiveReason: "expired",
    intakeMode: "ai_generated",
    version: 1,
    contractedValue: 0,
    duration: "3 months",
    aiConfidence: 65,
    createdBy: "Vikram Shah",
    archivedBy: "System",
    industry: "Education",
    dataSensitivity: "public",
  },
  {
    id: "sow-arch-006",
    title: "Fleet Management Dashboard",
    client: "Atlas Logistics",
    archivedAt: "2025-11-30T13:00:00Z",
    originalStatus: "approved",
    archiveReason: "completed",
    intakeMode: "ai_generated",
    version: 3,
    contractedValue: 245000,
    duration: "5 months",
    aiConfidence: 93,
    createdBy: "Priya Nair",
    archivedBy: "System",
    industry: "Logistics",
    dataSensitivity: "internal",
  },
  {
    id: "sow-arch-007",
    title: "Vendor Portal & Procurement System",
    client: "Ironclad Manufacturing",
    archivedAt: "2026-03-01T09:00:00Z",
    originalStatus: "approved",
    archiveReason: "cancelled",
    intakeMode: "manual_upload",
    version: 2,
    contractedValue: 550000,
    duration: "10 months",
    aiConfidence: 85,
    createdBy: "Anita Desai",
    archivedBy: "Rajesh Kumar",
    industry: "Manufacturing",
    dataSensitivity: "confidential",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

const reasonConfig: Record<ArchiveReason, { label: string; variant: "forest" | "brown" | "gold" | "beige" | "teal" }> = {
  completed: { label: "Completed", variant: "forest" },
  rejected: { label: "Rejected", variant: "brown" },
  expired: { label: "Expired", variant: "beige" },
  superseded: { label: "Superseded", variant: "teal" },
  cancelled: { label: "Cancelled", variant: "gold" },
};

const sensitivityConfig: Record<string, { label: string; variant: "teal" | "beige" | "gold" | "brown" }> = {
  public: { label: "Public", variant: "teal" },
  internal: { label: "Internal", variant: "beige" },
  confidential: { label: "Confidential", variant: "gold" },
  restricted: { label: "Restricted", variant: "brown" },
};

function formatCurrency(amount: number): string {
  if (amount === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */

export default function SOWArchivePage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [reasonFilter, setReasonFilter] = React.useState<ArchiveReason | null>(null);
  const [intakeFilter, setIntakeFilter] = React.useState<"ai_generated" | "manual_upload" | null>(null);

  const filteredSOWs = React.useMemo(() => {
    return ARCHIVED_SOWS.filter((sow) => {
      if (reasonFilter && sow.archiveReason !== reasonFilter) return false;
      if (intakeFilter && sow.intakeMode !== intakeFilter) return false;
      if (
        searchQuery &&
        !sow.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !sow.client.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [searchQuery, reasonFilter, intakeFilter]);

  const completedCount = ARCHIVED_SOWS.filter((s) => s.archiveReason === "completed").length;
  const rejectedCount = ARCHIVED_SOWS.filter((s) => s.archiveReason === "rejected").length;
  const otherCount = ARCHIVED_SOWS.filter((s) => !["completed", "rejected"].includes(s.archiveReason)).length;
  const totalValue = ARCHIVED_SOWS.filter((s) => s.archiveReason === "completed")
    .reduce((sum, s) => sum + s.contractedValue, 0);

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
              All SOWs Archive
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
              All data is preserved for reference and audit purposes.
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
              <Archive size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {ARCHIVED_SOWS.length} Archived
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Summary Stats ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Completed Projects", value: completedCount, icon: CheckCircle2, color: "#2D6A4F", bg: "rgba(45,106,79,0.08)" },
          { label: "Rejected SOWs", value: rejectedCount, icon: XCircle, color: "#92400E", bg: "rgba(146,64,14,0.08)" },
          { label: "Other (Expired/Superseded)", value: otherCount, icon: Clock, color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
          { label: "Total Completed Value", value: formatCurrency(totalValue), icon: DollarSign, color: "#6A4C3F", bg: "rgba(106,76,63,0.08)" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: stat.bg }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xl font-bold font-heading" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                {stat.label}
              </p>
            </div>
          );
        })}
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

        {/* Reason filter */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReasonFilter(null)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: reasonFilter === null ? "var(--ink)" : "transparent",
              color: reasonFilter === null ? "var(--page-bg)" : "var(--ink-muted)",
              border: reasonFilter === null ? "none" : "1px solid var(--border-soft)",
            }}
          >
            All
          </button>
          {(Object.keys(reasonConfig) as ArchiveReason[]).map((reason) => (
            <button
              key={reason}
              onClick={() => setReasonFilter(reasonFilter === reason ? null : reason)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize"
              style={{
                background: reasonFilter === reason ? "var(--ink)" : "transparent",
                color: reasonFilter === reason ? "var(--page-bg)" : "var(--ink-muted)",
                border: reasonFilter === reason ? "none" : "1px solid var(--border-soft)",
              }}
            >
              {reasonConfig[reason].label}
            </button>
          ))}
        </div>

        {/* Intake mode filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider mr-1" style={{ color: "var(--ink-faint)" }}>
            Intake
          </span>
          {[
            { key: "ai_generated" as const, label: "AI", icon: Sparkles },
            { key: "manual_upload" as const, label: "Upload", icon: Upload },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setIntakeFilter(intakeFilter === mode.key ? null : mode.key)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: intakeFilter === mode.key ? "var(--ink)" : "transparent",
                color: intakeFilter === mode.key ? "var(--page-bg)" : "var(--ink-muted)",
                border: intakeFilter === mode.key ? "none" : "1px solid var(--border-soft)",
              }}
            >
              <mode.icon size={12} />
              {mode.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Archive Table ── */}
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
            gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.6fr",
            borderBottom: "1px solid var(--border-soft)",
            background: "var(--page-bg)",
          }}
        >
          {["SOW Title", "Client", "Archive Reason", "Value", "Sensitivity", "Archived", ""].map(
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
            <Archive size={32} style={{ color: "var(--ink-faint)", opacity: 0.5 }} />
            <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
              No archived SOWs match the current filters.
            </p>
          </div>
        ) : (
          filteredSOWs.map((sow, idx) => (
            <motion.div
              key={sow.id}
              variants={slideInRight}
              className="grid items-center gap-4 px-5 py-3.5 transition-colors"
              style={{
                gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.6fr",
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
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant={sow.intakeMode === "ai_generated" ? "teal" : "beige"}
                    size="sm"
                    className="gap-1"
                  >
                    {sow.intakeMode === "ai_generated" ? (
                      <Sparkles size={10} />
                    ) : (
                      <Upload size={10} />
                    )}
                    {sow.intakeMode === "ai_generated" ? "AI" : "Upload"}
                  </Badge>
                  <span className="text-[0.7rem]" style={{ color: "var(--ink-faint)" }}>
                    v{sow.version}
                  </span>
                </div>
              </div>

              {/* Client */}
              <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
                {sow.client}
              </span>

              {/* Archive Reason */}
              <Badge variant={reasonConfig[sow.archiveReason].variant} size="sm">
                {reasonConfig[sow.archiveReason].label}
              </Badge>

              {/* Value */}
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {formatCurrency(sow.contractedValue)}
              </span>

              {/* Sensitivity */}
              <Badge variant={sensitivityConfig[sow.dataSensitivity].variant} size="sm">
                {sensitivityConfig[sow.dataSensitivity].label}
              </Badge>

              {/* Archived Date */}
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {formatDate(sow.archivedAt)}
              </span>

              {/* Actions */}
              <div className="flex justify-end gap-1">
                <Link href={`/enterprise/sow/${sow.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Eye size={14} />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Download size={14} />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ── Archive Info Notice ── */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--page-bg)",
            border: "1px solid var(--border-soft)",
          }}
        >
          <div className="flex items-start gap-3">
            <Archive size={18} style={{ color: "var(--ink-faint)" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--ink-muted)" }}>
                Archive Policy
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--ink-faint)" }}>
                Archived SOWs are preserved for reference and audit purposes. All data including approval history,
                version history, and audit trails remain accessible in read-only mode. Archived documents cannot be
                edited or resubmitted — create a new SOW if needed.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
