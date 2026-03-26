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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";
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

function generateVersionHistory(sow: (typeof mockSOWs)[0]) {
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

function generateAuditTrail(sow: (typeof mockSOWs)[0]) {
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

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

export default function SOWDetailPage() {
  const params = useParams();
  const sowId = params.sowId as string;
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];
  const linkedProject = mockProjects.find((p) => p.sowId === sow.id);
  const sections = mockSOWSections.filter((s) => s.sowId === sow.id);
  const clauses = mockSOWClauses.filter((c) => c.sowId === sow.id);
  const versions = generateVersionHistory(sow);
  const auditTrail = generateAuditTrail(sow);
  const ethicsScreening = mockEthicsScreening[sow.id] || [];
  const regulatoryItems = mockRegulatoryAlignment[sow.id] || [];
  const genParams = mockGenerationParams[sow.id];
  const hallucinationLayers = mockHallucinationLayers[sow.id] || [];
  const sensitivityReqs = sensitivityHandlingRequirements[sow.dataSensitivity] || [];

  /* UI state */
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    () => new Set(sections.slice(0, 3).map((s) => s.id))
  );
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [clauseTypeFilter, setClauseTypeFilter] = React.useState("all");
  const [clauseSearch, setClauseSearch] = React.useState("");
  const [auditTypeFilter, setAuditTypeFilter] = React.useState("all");
  const [docSearch, setDocSearch] = React.useState("");

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
    setSubmitSuccess(true);
    setTimeout(() => setShowSubmitModal(false), 2000);
  }

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
          href="/enterprise/sow"
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          SOW Repository
        </Link>
      </motion.div>

      {/* ── Header (B6 Step 1) ── */}
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
              variant={sow.intakeMode === "ai_generated" ? "teal" : "beige"}
              size="sm"
            >
              {sow.intakeMode === "ai_generated" ? (
                <><Bot className="w-3 h-3" /> AI Generated</>
              ) : (
                <><Upload className="w-3 h-3" /> Manual Upload</>
              )}
            </Badge>
            <Badge variant={confidentialityVariantMap[sow.confidentiality]} size="sm">
              <Shield className="w-3 h-3" />
              {sow.confidentiality.charAt(0).toUpperCase() + sow.confidentiality.slice(1)}
            </Badge>
            {sow.riskScore.overall > 0 && (
              <Badge
                variant={sow.riskScore.overall <= 25 ? "forest" : sow.riskScore.overall <= 50 ? "gold" : "brown"}
                size="sm"
              >
                Risk: {sow.riskScore.overall}/100
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-beige-600 flex-wrap">
            <span className="font-mono text-[11px] text-beige-500">{sow.id.toUpperCase()}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>{sow.client}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>v{sow.version}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>{sow.fileSize}</span>
            <span className="w-1 h-1 rounded-full bg-beige-300" />
            <span>Created by {sow.createdBy}</span>
          </div>
        </div>

        {/* Status-aware header actions (B6 Step 1 a-e) */}
        <div className="flex items-center gap-2 shrink-0">
          {(sow.status === "draft" || sow.status === "review") && isValidated && (
            <Button variant="gradient-primary" size="sm" onClick={() => setShowSubmitModal(true)}>
              <Send className="w-3.5 h-3.5" />
              Submit for Approval
            </Button>
          )}
          {sow.status === "draft" && !isValidated && (
            <Link href={sow.intakeMode === "ai_generated" ? "/enterprise/sow/generate" : "/enterprise/sow/upload"}>
              <Button variant="outline" size="sm">
                <Sparkles className="w-3.5 h-3.5" />
                Continue Setup
              </Button>
            </Link>
          )}
          {sow.status === "approval" && (
            <Link href={`/enterprise/sow/${sow.id}/approve`}>
              <Button variant="outline" size="sm">
                <Clock className="w-3.5 h-3.5" />
                View Approval Progress
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
          {sow.status === "approved" && !sow.planId && (
            <Link href={`/enterprise/decomposition?sowId=${sow.id}`}>
              <Button variant="gradient-primary" size="sm">
                <Layers className="w-3.5 h-3.5" />
                Start Decomposition
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── Top Metadata Strip ── */}
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
              <p className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">{label}</p>
              <p className="text-[14px] font-bold text-brown-900 truncate">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
         9-TAB CONTENT (B6 Steps 2-10)
         ══════════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="metadata" className="w-full">
          <TabsList className="mb-2 flex-wrap">
            <TabsTrigger value="metadata" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Metadata
            </TabsTrigger>
            <TabsTrigger value="clauses" className="gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Clauses
              {prohibitedCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-brown-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {prohibitedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Document
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Analysis
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Risk & Compliance
            </TabsTrigger>
            <TabsTrigger value="approval" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approval
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Versions
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <History className="w-3.5 h-3.5" /> Audit
            </TabsTrigger>
            <TabsTrigger value="linked" className="gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Linked
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════
             TAB 1: Metadata (B6 Step 2)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="metadata">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {/* Core Details */}
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
                        <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">{label}</span>
                        <span className="text-[13px] font-medium text-brown-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stakeholders */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                    {sow.aiConfidence >= 90 ? "High confidence -- ready for review"
                      : sow.aiConfidence >= 70 ? "Good confidence -- some sections need attention"
                      : sow.aiConfidence > 0 ? "Needs review -- several sections below threshold"
                      : "Not yet parsed"}
                  </p>
                </div>

                {/* Quick risk summary */}
                {sow.riskScore.overall > 0 && (
                  <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                    <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">Risk Score</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className={cn("w-5 h-5", sow.riskScore.overall <= 30 ? "text-forest-500" : sow.riskScore.overall <= 60 ? "text-gold-500" : "text-brown-600")} />
                      <span className={cn("text-[18px] font-bold", sow.riskScore.overall <= 30 ? "text-forest-600" : sow.riskScore.overall <= 60 ? "text-gold-600" : "text-brown-700")}>
                        {sow.riskScore.overall}/100
                      </span>
                      <Badge variant={sow.riskScore.overall <= 25 ? "forest" : sow.riskScore.overall <= 50 ? "gold" : "brown"} size="sm">
                        {sow.riskScore.overall <= 25 ? "Low" : sow.riskScore.overall <= 50 ? "Medium" : sow.riskScore.overall <= 75 ? "High" : "Critical"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-beige-500">See Risk & Compliance tab for full breakdown.</p>
                  </div>
                )}

                {/* Deliverables summary */}
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
          <TabsContent value="clauses">
            <div className="space-y-4">
              {/* Header + filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-brown-800">
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
                  <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
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
          <TabsContent value="document">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-brown-800">
                  {sow.intakeMode === "ai_generated" ? "Generated Document" : "Uploaded Document"}
                  <span className="ml-2 text-[12px] font-normal text-beige-500">({sections.length} sections)</span>
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
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
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

              {filteredDocSections.length === 0 ? (
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
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
                        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-md transition-all"
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
                            {section.aiSuggestion && <Sparkles className="w-3.5 h-3.5 text-gold-500 shrink-0" />}
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-beige-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-beige-400 shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-beige-100">
                            <p className="text-[13px] text-brown-700 leading-relaxed mt-3">{section.content}</p>
                            {section.aiSuggestion && (
                              <div className="mt-3 rounded-xl bg-gradient-to-r from-gold-50 to-beige-50 border border-gold-200/60 p-3.5">
                                <div className="flex items-start gap-2">
                                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold text-gold-800 uppercase tracking-wider mb-0.5">AI Suggestion</p>
                                    <p className="text-[12px] text-gold-700 leading-relaxed">{section.aiSuggestion}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button variant="secondary" size="sm" className="text-[11px] h-7">
                                        <CheckCircle2 className="w-3 h-3" /> Accept
                                      </Button>
                                      <Button variant="outline" size="sm" className="text-[11px] h-7">
                                        <X className="w-3 h-3" /> Dismiss
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-2">
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
          <TabsContent value="ai-analysis">
            <div className="space-y-5">
              {sow.intakeMode === "ai_generated" ? (
                /* ── AI-Generated SOWs ── */
                <>
                  <h2 className="text-[15px] font-semibold text-brown-800">AI Generation Analysis</h2>

                  {/* Generation Parameters */}
                  {genParams && (
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                  <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                  <h2 className="text-[15px] font-semibold text-brown-800">Parsing & Analysis Results</h2>

                  {/* Completeness Score */}
                  <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                  <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
          <TabsContent value="risk">
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-brown-800">Risk & Compliance</h2>

              {/* Risk Score Breakdown */}
              {sow.riskScore.overall > 0 && (
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider">Risk Score Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={cn("w-5 h-5", sow.riskScore.overall <= 30 ? "text-forest-500" : sow.riskScore.overall <= 60 ? "text-gold-500" : "text-brown-600")} />
                      <span className={cn("text-[20px] font-bold", sow.riskScore.overall <= 30 ? "text-forest-600" : sow.riskScore.overall <= 60 ? "text-gold-600" : "text-brown-700")}>
                        {sow.riskScore.overall}/100
                      </span>
                      <Badge variant={sow.riskScore.overall <= 25 ? "forest" : sow.riskScore.overall <= 50 ? "gold" : "brown"} size="md">
                        {sow.riskScore.overall <= 25 ? "Low Risk" : sow.riskScore.overall <= 50 ? "Medium Risk" : sow.riskScore.overall <= 75 ? "High Risk" : "Critical Risk"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Completeness", value: sow.riskScore.completeness, max: 30, weight: "30%" },
                      { label: "Confidence", value: sow.riskScore.confidence, max: 25, weight: "25%" },
                      { label: "Compliance", value: sow.riskScore.compliance, max: 25, weight: "25%" },
                      { label: "Pattern Match", value: sow.riskScore.patternMatch, max: 20, weight: "20%" },
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
              )}

              {/* Ethics Screening */}
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
          <TabsContent value="approval">
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-brown-800">Approval Pipeline</h2>

              {/* Stage Progress Tracker */}
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
                <h3 className="text-[13px] font-bold text-beige-500 uppercase tracking-wider mb-5">Stage Progress</h3>

                {/* Horizontal progress bar */}
                <div className="flex items-center gap-2 mb-6">
                  {sow.approvalStages.map((stage, idx) => (
                    <React.Fragment key={stage.stage}>
                      <div className="flex-1">
                        <div className={cn(
                          "h-2 rounded-full",
                          stage.status === "approved" ? "bg-forest-500" :
                          stage.status === "in_review" ? "bg-gold-400" :
                          stage.status === "rejected" ? "bg-brown-500" :
                          "bg-beige-200"
                        )} />
                      </div>
                      {idx < sow.approvalStages.length - 1 && <div className="w-1" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Stage cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sow.approvalStages.map((stage, idx) => (
                    <div
                      key={stage.stage}
                      className={cn(
                        "rounded-xl border p-4",
                        stage.status === "approved" ? "border-forest-200/60 bg-forest-50/20" :
                        stage.status === "in_review" ? "border-gold-200/60 bg-gold-50/20" :
                        stage.status === "rejected" ? "border-brown-200/60 bg-brown-50/20" :
                        "border-beige-200/50 bg-beige-50/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          stage.status === "approved" ? "bg-forest-100" :
                          stage.status === "in_review" ? "bg-gold-100" :
                          stage.status === "rejected" ? "bg-brown-100" :
                          "bg-beige-100"
                        )}>
                          {stage.status === "approved" ? (
                            <CheckCircle2 className="w-4 h-4 text-forest-600" />
                          ) : stage.status === "in_review" ? (
                            <Clock className="w-4 h-4 text-gold-600" />
                          ) : stage.status === "rejected" ? (
                            <X className="w-4 h-4 text-brown-600" />
                          ) : (
                            <span className="text-[12px] font-bold text-beige-500">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] font-semibold text-brown-800 capitalize">
                              Stage {idx + 1}: {stage.stage} Review
                            </span>
                            <Badge
                              variant={stage.status === "approved" ? "forest" : stage.status === "in_review" ? "gold" : stage.status === "rejected" ? "brown" : "beige"}
                              size="sm"
                            >
                              {stage.status === "approved" ? "Approved" : stage.status === "in_review" ? "In Review" : stage.status === "rejected" ? "Rejected" : "Pending"}
                            </Badge>
                          </div>
                          {stage.reviewer && (
                            <p className="text-[12px] text-beige-600">
                              Reviewer: <span className="font-medium text-brown-700">{stage.reviewer}</span>
                            </p>
                          )}
                          {stage.reviewedAt && (
                            <p className="text-[11px] text-beige-500 mt-0.5">
                              {formatDateTime(stage.reviewedAt)}
                            </p>
                          )}
                          {stage.comments && (
                            <div className="mt-2 rounded-lg bg-white/80 border border-beige-200/30 p-3">
                              <p className="text-[12px] text-brown-700 italic">&ldquo;{stage.comments}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="mt-4 pt-4 border-t border-beige-200/50 flex items-center gap-3">
                  {(sow.status === "draft" || sow.status === "review") && isValidated && (
                    <Button variant="gradient-primary" size="sm" onClick={() => setShowSubmitModal(true)}>
                      <Send className="w-3.5 h-3.5" /> Submit for Approval
                    </Button>
                  )}
                  {(sow.status === "approval" || sow.status === "approved" || sow.status === "changes_requested" || sow.status === "rejected") && (
                    <Link href={`/enterprise/sow/${sow.id}/approve`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3.5 h-3.5" /> View Full Approval Workflow
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 7: Versions (B6 Step 8 + B8)
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="versions">
            <div className="space-y-3">
              <h2 className="text-[15px] font-semibold text-brown-800">
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
          <TabsContent value="audit">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-brown-800">Audit Trail</h2>
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

              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
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
          <TabsContent value="linked">
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-brown-800">Linked Resources</h2>

              {sow.planId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href={`/enterprise/decomposition/${sow.planId}`} className="block group">
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
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
                      <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
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
                    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
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
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
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
                  <Button variant="gradient-primary" size="sm" onClick={handleConfirmSubmit}>
                    <Send className="w-3.5 h-3.5" /> Confirm Submission
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
