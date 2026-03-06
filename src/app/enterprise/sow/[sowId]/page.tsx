"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";

const statusVariantMap: Record<string, "beige" | "forest"> = {
  draft: "beige",
  approved: "forest",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
};

const confidentialityVariantMap: Record<string, "teal" | "beige" | "gold" | "brown"> = {
  public: "teal",
  internal: "beige",
  confidential: "gold",
  restricted: "brown",
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

// Mock version history
function generateVersionHistory(sow: (typeof mockSOWs)[0]) {
  const versions = [];
  for (let v = sow.version; v >= 1; v--) {
    const daysAgo = (sow.version - v) * 7 + 2;
    const date = new Date(sow.createdAt);
    date.setDate(date.getDate() + (v - 1) * 5);
    versions.push({
      version: v,
      date: date.toISOString(),
      status: v === sow.version ? sow.status : v === 1 ? "draft" : "draft",
      changedBy: v === 1 ? sow.createdBy : sow.approvedBy || sow.createdBy,
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

// Mock audit trail
type AuditEvent = {
  id: string;
  action: "created" | "updated" | "approved";
  actor: string;
  timestamp: string;
  details: string;
};

function generateAuditTrail(sow: (typeof mockSOWs)[0]) {
  const events: AuditEvent[] = [
    {
      id: "audit-1",
      action: "created",
      actor: sow.createdBy,
      timestamp: sow.createdAt,
      details: `SOW "${sow.title}" uploaded and created`,
    },
  ];
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
};

export default function SOWDetailPage() {
  const params = useParams();
  const sowId = params.sowId as string;
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];
  const sections = mockSOWSections.filter((s) => s.sowId === sow.id);
  const versions = generateVersionHistory(sow);
  const auditTrail = generateAuditTrail(sow);

  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    () => new Set(sections.slice(0, 3).map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-5"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          SOW Repository
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-brown-900 tracking-tight font-heading">
              {sow.title}
            </h1>
            <Badge variant={statusVariantMap[sow.status]} size="md" dot>
              {statusLabel[sow.status]}
            </Badge>
            <Badge
              variant={confidentialityVariantMap[sow.confidentiality]}
              size="sm"
            >
              <Shield className="w-3 h-3" />
              {sow.confidentiality.charAt(0).toUpperCase() + sow.confidentiality.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-beige-600 flex-wrap">
            <span>{sow.client}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>Version {sow.version}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>{sow.fileSize}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>Created by {sow.createdBy}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sow.status === "draft" && (
            <Link href={`/enterprise/sow/${sow.id}/approve`}>
              <Button variant="gradient-primary" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve SOW
              </Button>
            </Link>
          )}
          {sow.status === "approved" && sow.planId && (
            <Link href={`/enterprise/decomposition/${sow.planId}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3.5 h-3.5" />
                View Plan
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Top Metadata Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: BookOpen, label: "Pages", value: `${sow.pages}` },
          { icon: Layers, label: "Sections", value: `${sow.parsedSections}/${sow.totalSections}` },
          { icon: DollarSign, label: "Est. Budget", value: sow.estimatedBudget > 0 ? `$${(sow.estimatedBudget / 1000).toFixed(0)}K` : "TBD" },
          { icon: Clock, label: "Duration", value: sow.estimatedDuration },
          { icon: Users, label: "Stakeholders", value: `${sow.stakeholders.length}` },
          { icon: Calendar, label: "Updated", value: formatDate(sow.updatedAt) },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm p-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-beige-100/80 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-beige-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
                {label}
              </p>
              <p className="text-[14px] font-bold text-brown-900 truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabbed Content */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="overview" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sections" className="gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <History className="w-3.5 h-3.5" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="linked" className="gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Linked
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: Overview ===== */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: Key Information */}
              <div className="lg:col-span-2 space-y-4">
                {/* SOW Details Card */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                      { label: "Estimated Budget", value: sow.estimatedBudget > 0 ? `$${sow.estimatedBudget.toLocaleString()}` : "TBD" },
                      { label: "Estimated Duration", value: sow.estimatedDuration },
                      { label: "Version", value: `v${sow.version}` },
                      { label: "Approved By", value: sow.approvedBy || "--" },
                      { label: "SLA Compliance", value: sow.slaCompliance ? `${sow.slaCompliance}%` : "--" },
                      { label: "Confidentiality", value: sow.confidentiality.charAt(0).toUpperCase() + sow.confidentiality.slice(1) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="text-[13px] font-medium text-brown-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stakeholders */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-3">
                    Stakeholders
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sow.stakeholders.map((name) => (
                      <div
                        key={name}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-beige-50 border border-beige-200/50"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brown-200 to-beige-200 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-brown-600" />
                        </div>
                        <span className="text-[13px] font-medium text-brown-800">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                  <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sow.tags.map((tag) => (
                      <Badge key={tag} variant="beige" size="md">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: AI Confidence */}
              <div className="space-y-4">
                {/* AI Confidence Card */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 text-center">
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
                    {sow.aiConfidence >= 90
                      ? "High confidence -- ready for review"
                      : sow.aiConfidence >= 70
                      ? "Good confidence -- some sections need attention"
                      : sow.aiConfidence > 0
                      ? "Needs review -- several sections below threshold"
                      : "Not yet parsed"}
                  </p>
                </div>

                {/* Document Info */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                  <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
                    Document Info
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: FileText, label: "File Size", value: sow.fileSize },
                      { icon: BookOpen, label: "Pages", value: `${sow.pages} pages` },
                      { icon: Layers, label: "Sections", value: `${sow.parsedSections}/${sow.totalSections} parsed` },
                      { icon: DollarSign, label: "Est. Budget", value: sow.estimatedBudget > 0 ? `$${sow.estimatedBudget.toLocaleString()}` : "TBD" },
                      { icon: Clock, label: "Duration", value: sow.estimatedDuration },
                      { icon: Calendar, label: "Created", value: formatDate(sow.createdAt) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-beige-400" />
                          <span className="text-[12px] text-beige-600">{label}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-brown-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB: Sections ===== */}
          <TabsContent value="sections">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-brown-800">
                  AI-Extracted Sections
                  <span className="ml-2 text-[12px] font-normal text-beige-500">
                    ({sections.length} sections)
                  </span>
                </h2>
                <button
                  onClick={() => {
                    if (expandedSections.size === sections.length) {
                      setExpandedSections(new Set());
                    } else {
                      setExpandedSections(new Set(sections.map((s) => s.id)));
                    }
                  }}
                  className="text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  {expandedSections.size === sections.length
                    ? "Collapse all"
                    : "Expand all"}
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-7 h-7 text-beige-400" />
                  </div>
                  <p className="text-sm font-semibold text-brown-800 mb-1">
                    No sections parsed yet
                  </p>
                  <p className="text-xs text-beige-500">
                    Sections will appear here once the AI finishes parsing the document.
                  </p>
                </div>
              ) : (
                sections.map((section, idx) => {
                  const isExpanded = expandedSections.has(section.id);
                  return (
                    <div
                      key={section.id}
                      className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-md transition-all"
                    >
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-beige-50/40 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-beige-100 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-beige-600">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-brown-900 truncate">
                            {section.title}
                          </h3>
                          {!isExpanded && (
                            <p className="text-[11px] text-beige-500 truncate mt-0.5">
                              {section.content.substring(0, 80)}...
                            </p>
                          )}
                        </div>
                        {/* Confidence mini-bar */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-beige-100 overflow-hidden hidden sm:block">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                section.confidence >= 90
                                  ? "bg-forest-500"
                                  : section.confidence >= 75
                                  ? "bg-teal-500"
                                  : "bg-gold-500"
                              )}
                              style={{ width: `${section.confidence}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-beige-600 w-8 text-right">
                            {section.confidence}%
                          </span>
                          {section.aiSuggestion && (
                            <Sparkles className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-beige-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-beige-400 shrink-0" />
                        )}
                      </button>

                      {/* Section Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-beige-100">
                          <p className="text-[13px] text-brown-700 leading-relaxed mt-3">
                            {section.content}
                          </p>

                          {/* AI Suggestion Callout */}
                          {section.aiSuggestion && (
                            <div className="mt-3 rounded-xl bg-gradient-to-r from-gold-50 to-beige-50 border border-gold-200/60 p-3.5">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0 mt-0.5">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-gold-800 uppercase tracking-wider mb-0.5">
                                    AI Suggestion
                                  </p>
                                  <p className="text-[12px] text-gold-700 leading-relaxed">
                                    {section.aiSuggestion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Confidence bar */}
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
                              Confidence
                            </span>
                            <div className="flex-1">
                              <Progress
                                value={section.confidence}
                                size="sm"
                                variant={confidenceVariant(section.confidence)}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-brown-700">
                              {section.confidence}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ===== TAB: Versions ===== */}
          <TabsContent value="versions">
            <div className="space-y-3">
              <h2 className="text-[15px] font-semibold text-brown-800">
                Version History
                <span className="ml-2 text-[12px] font-normal text-beige-500">
                  ({versions.length} versions)
                </span>
              </h2>

              <div className="space-y-0">
                {versions.map((ver, idx) => (
                  <div
                    key={ver.version}
                    className="flex gap-4 relative"
                  >
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center w-10 shrink-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                          idx === 0
                            ? "bg-gradient-to-br from-brown-400 to-brown-500 text-white ring-4 ring-brown-100"
                            : "bg-beige-100 text-beige-600"
                        )}
                      >
                        v{ver.version}
                      </div>
                      {idx < versions.length - 1 && (
                        <div className="w-0.5 flex-1 bg-beige-200 mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={cn(
                        "flex-1 rounded-2xl border p-4 mb-3",
                        idx === 0
                          ? "border-brown-200/60 bg-brown-50/30"
                          : "border-beige-200/50 bg-white/70 backdrop-blur-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-brown-900">
                              Version {ver.version}
                            </span>
                            {idx === 0 && (
                              <Badge variant="brown" size="sm">
                                Current
                              </Badge>
                            )}
                            <Badge
                              variant={ver.status === "approved" ? "forest" : "beige"}
                              size="sm"
                              dot
                            >
                              {ver.status === "approved" ? "Approved" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-[12px] text-beige-600 leading-relaxed">
                            {ver.changes}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-beige-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ver.changedBy}
                        </div>
                        <span className="w-1 h-1 rounded-full bg-beige-300" />
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(ver.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB: Audit ===== */}
          <TabsContent value="audit">
            <div className="space-y-3">
              <h2 className="text-[15px] font-semibold text-brown-800">
                Audit Trail
              </h2>

              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
                {auditTrail.map((event, idx) => {
                  const config = auditActionConfig[event.action] || auditActionConfig.updated;
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-start gap-4 p-4",
                        idx < auditTrail.length - 1 && "border-b border-beige-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          config.bg
                        )}
                      >
                        {event.action === "created" && (
                          <FileText className={cn("w-4 h-4", config.color)} />
                        )}
                        {event.action === "updated" && (
                          <ClipboardList className={cn("w-4 h-4", config.color)} />
                        )}
                        {event.action === "approved" && (
                          <CheckCircle2 className={cn("w-4 h-4", config.color)} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold text-brown-900">
                            {event.actor}
                          </span>
                          <Badge
                            variant={
                              event.action === "approved"
                                ? "forest"
                                : event.action === "created"
                                ? "teal"
                                : "gold"
                            }
                            size="sm"
                          >
                            {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-beige-600 leading-relaxed">
                          {event.details}
                        </p>
                        <p className="text-[11px] text-beige-400 mt-1">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {auditTrail.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-sm text-beige-500">No audit events recorded.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB: Linked ===== */}
          <TabsContent value="linked">
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-brown-800">
                Linked Resources
              </h2>

              {sow.planId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Decomposition Plan */}
                  <Link
                    href={`/enterprise/decomposition/${sow.planId}`}
                    className="block group"
                  >
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shrink-0">
                          <GitBranch className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-beige-500 uppercase tracking-wider mb-0.5">
                            Decomposition Plan
                          </p>
                          <p className="text-[14px] font-semibold text-brown-900 group-hover:text-brown-700 transition-colors">
                            {sow.title} -- Plan
                          </p>
                          <p className="text-[12px] text-beige-600 mt-1">
                            Plan ID: {sow.planId}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-beige-400 group-hover:text-teal-500 transition-colors shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>

                  {/* Project Link */}
                  <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-6 h-6 text-forest-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-beige-500 uppercase tracking-wider mb-0.5">
                          Active Project
                        </p>
                        <p className="text-[14px] font-semibold text-brown-900">
                          {sow.title}
                        </p>
                        <p className="text-[12px] text-beige-600 mt-1">
                          Client: {sow.client}
                        </p>
                        {sow.slaCompliance && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-beige-500">SLA Compliance:</span>
                            <Badge variant={sow.slaCompliance >= 90 ? "forest" : "gold"} size="sm">
                              {sow.slaCompliance}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-7 h-7 text-beige-400" />
                  </div>
                  <p className="text-sm font-semibold text-brown-800 mb-1">
                    No linked resources yet
                  </p>
                  <p className="text-xs text-beige-500 max-w-sm mx-auto">
                    Once this SOW is approved and decomposed, linked plans and projects will appear here.
                  </p>
                  {sow.status === "draft" && (
                    <Link href={`/enterprise/sow/${sow.id}/approve`}>
                      <Button variant="outline" size="sm" className="mt-4">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve to begin decomposition
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
