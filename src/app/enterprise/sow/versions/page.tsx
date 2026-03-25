"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  Download,
  GitBranch,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Upload,
  GitCompare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";

/* ═══════════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════════ */

interface SOWVersion {
  id: string;
  sowId: string;
  sowTitle: string;
  client: string;
  version: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "superseded";
  date: string;
  author: string;
  changeSummary: string;
  intakeMode: "ai_generated" | "manual_upload";
}

const MOCK_VERSIONS: SOWVersion[] = [
  {
    id: "ver-001",
    sowId: "sow-001",
    sowTitle: "Enterprise Resource Planning Platform",
    client: "TechVista Solutions",
    version: 3,
    status: "approved",
    date: "2026-03-01T14:22:00Z",
    author: "Priya Nair",
    changeSummary: "Final approval and sign-off. Budget confirmed at $285,000.",
    intakeMode: "manual_upload",
  },
  {
    id: "ver-002",
    sowId: "sow-001",
    sowTitle: "Enterprise Resource Planning Platform",
    client: "TechVista Solutions",
    version: 2,
    status: "superseded",
    date: "2026-02-22T10:00:00Z",
    author: "Priya Nair",
    changeSummary: "Revised scope and timeline based on Stage 2 commercial review feedback.",
    intakeMode: "manual_upload",
  },
  {
    id: "ver-003",
    sowId: "sow-001",
    sowTitle: "Enterprise Resource Planning Platform",
    client: "TechVista Solutions",
    version: 1,
    status: "superseded",
    date: "2026-02-15T10:30:00Z",
    author: "Priya Nair",
    changeSummary: "Initial document upload and AI extraction.",
    intakeMode: "manual_upload",
  },
  {
    id: "ver-004",
    sowId: "sow-002",
    sowTitle: "Mobile Banking App Redesign",
    client: "FinServe Global",
    version: 2,
    status: "approved",
    date: "2026-02-28T16:45:00Z",
    author: "Priya Nair",
    changeSummary: "Updated compliance section per legal review. PCI DSS requirements clarified.",
    intakeMode: "ai_generated",
  },
  {
    id: "ver-005",
    sowId: "sow-002",
    sowTitle: "Mobile Banking App Redesign",
    client: "FinServe Global",
    version: 1,
    status: "superseded",
    date: "2026-02-20T09:15:00Z",
    author: "Priya Nair",
    changeSummary: "Initial AI-generated SOW from wizard.",
    intakeMode: "ai_generated",
  },
  {
    id: "ver-006",
    sowId: "sow-003",
    sowTitle: "Supply Chain Analytics Dashboard",
    client: "Global Freight Corp",
    version: 1,
    status: "draft",
    date: "2026-03-05T11:00:00Z",
    author: "Vikram Shah",
    changeSummary: "Initial draft — pending review.",
    intakeMode: "ai_generated",
  },
  {
    id: "ver-007",
    sowId: "sow-005",
    sowTitle: "E-Commerce Platform Migration",
    client: "ShopNow Digital",
    version: 3,
    status: "approved",
    date: "2026-02-25T09:00:00Z",
    author: "Anita Desai",
    changeSummary: "Migration strategy revised with parallel-run approach. Budget increased to $490K.",
    intakeMode: "manual_upload",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; variant: "forest" | "gold" | "beige" | "brown" | "teal" }> = {
  draft: { label: "Draft", variant: "beige" },
  submitted: { label: "Submitted", variant: "teal" },
  approved: { label: "Approved", variant: "forest" },
  rejected: { label: "Rejected", variant: "brown" },
  superseded: { label: "Superseded", variant: "gold" },
};

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

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */

export default function VersionHistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  const filteredVersions = React.useMemo(() => {
    return MOCK_VERSIONS.filter((v) => {
      if (statusFilter && v.status !== statusFilter) return false;
      if (
        searchQuery &&
        !v.sowTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.client.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

  // Group by SOW
  const groupedVersions = React.useMemo(() => {
    const groups: Record<string, SOWVersion[]> = {};
    filteredVersions.forEach((v) => {
      if (!groups[v.sowId]) groups[v.sowId] = [];
      groups[v.sowId].push(v);
    });
    return Object.entries(groups);
  }, [filteredVersions]);

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
              Version History
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
              Track changes and compare versions of SOW documents across all projects.
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
              <GitBranch size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {MOCK_VERSIONS.length} Versions
              </span>
            </div>
          </div>
        </div>
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

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter(null)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: statusFilter === null ? "var(--ink)" : "transparent",
              color: statusFilter === null ? "var(--page-bg)" : "var(--ink-muted)",
              border: statusFilter === null ? "none" : "1px solid var(--border-soft)",
            }}
          >
            All
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: statusFilter === key ? "var(--ink)" : "transparent",
                color: statusFilter === key ? "var(--page-bg)" : "var(--ink-muted)",
                border: statusFilter === key ? "none" : "1px solid var(--border-soft)",
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Grouped Version List ── */}
      {groupedVersions.length === 0 ? (
        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-16">
          <GitBranch size={40} style={{ color: "var(--ink-faint)", opacity: 0.4 }} />
          <p className="mt-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No versions match the current filters.
          </p>
        </motion.div>
      ) : (
        groupedVersions.map(([sowId, versions]) => (
          <motion.div key={sowId} variants={fadeUp}>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {/* SOW Header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  background: "var(--page-bg)",
                  borderBottom: "1px solid var(--border-soft)",
                }}
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} style={{ color: "var(--ink-muted)" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                      {versions[0].sowTitle}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                      {versions[0].client} &middot; {versions.length} version{versions.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {versions.length >= 2 && (
                    <Link href={`/enterprise/sow/${sowId}/compare`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <GitCompare size={14} />
                        <span className="text-xs">Compare</span>
                      </Button>
                    </Link>
                  )}
                  <Link href={`/enterprise/sow/${sowId}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Eye size={14} />
                      <span className="text-xs">View</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Version Rows */}
              {versions.map((v, idx) => (
                <div
                  key={v.id}
                  className="flex items-center gap-4 px-5 py-3 transition-colors"
                  style={{
                    borderBottom:
                      idx < versions.length - 1
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
                  {/* Version number */}
                  <div className="flex items-center gap-2 shrink-0 w-16">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold",
                        v.status === "approved"
                          ? "bg-forest-500 text-white"
                          : v.status === "superseded"
                          ? "bg-beige-200 text-beige-600"
                          : "bg-gold-100 text-gold-700"
                      )}
                    >
                      v{v.version}
                    </div>
                  </div>

                  {/* Change summary */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px]" style={{ color: "var(--ink)" }}>
                      {v.changeSummary}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        {v.author}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        &middot;
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        {formatDateTime(v.date)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <Badge variant={statusConfig[v.status].variant} size="sm">
                    {statusConfig[v.status].label}
                  </Badge>

                  {/* Intake mode */}
                  <Badge
                    variant={v.intakeMode === "ai_generated" ? "teal" : "beige"}
                    size="sm"
                    className="gap-1"
                  >
                    {v.intakeMode === "ai_generated" ? (
                      <Sparkles size={10} />
                    ) : (
                      <Upload size={10} />
                    )}
                    {v.intakeMode === "ai_generated" ? "AI" : "Upload"}
                  </Badge>

                  {/* Download */}
                  <Button variant="ghost" size="sm">
                    <Download size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
