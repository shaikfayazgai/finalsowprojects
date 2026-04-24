"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Edit3,
  Send,
  X,
  Download,
  Printer,
  RotateCcw,
  Eye,
  Check,
  Clock,
  BarChart3,
  GitCompare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Button, Badge, Textarea } from "@/components/ui";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useSubmitSOW, useSOWPreview, useHallucinationLayers, useManualSOW } from "@/lib/hooks/use-manual-sow";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type TabKey = "generated" | "comparison" | "verification";

interface SOWSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  isExpanded: boolean;
}

interface QualityMetric {
  label: string;
  value: string;
  subtext: string;
  status: "good" | "warning" | "info";
}

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const SOW_META = {
  id: "sow-upload-001",
  title: "Healthcare Patient Portal",
  client: "MedFirst Health Systems",
  generatedAt: "2026-03-23T14:32:00Z",
  sourceDocument: "MedFirst_Patient_Portal_SOW_2026.pdf",
};

const QUALITY_METRICS: QualityMetric[] = [
  { label: "AI Confidence", value: "89%", subtext: "Above threshold", status: "good" },
  { label: "Completeness", value: "92%", subtext: "10 of 10 sections", status: "good" },
  { label: "Risk Score", value: "24/100", subtext: "Low risk", status: "good" },
  { label: "Flags", value: "3", subtext: "2 resolved, 1 pending", status: "warning" },
];

const SOW_SECTIONS: SOWSection[] = [
  {
    id: "sec-1",
    title: "Executive Summary",
    confidence: 94,
    isExpanded: true,
    content: `This project delivers a secure, HIPAA-compliant patient portal enabling MedFirst Health Systems' 2.4 million active patients to manage appointments, view medical records, communicate with providers, and process payments.

The platform integrates with Epic EHR via FHIR R4 APIs, supports real-time telehealth video, and includes a mobile-responsive Progressive Web App. Target launch is Q3 2026 with phased rollout across 14 regional facilities.`,
  },
  {
    id: "sec-2",
    title: "Project Scope",
    confidence: 91,
    isExpanded: false,
    content: `In-scope:
• Patient registration and identity verification (KYC/KYB)
• Appointment scheduling with provider availability sync
• Secure messaging (asynchronous + real-time)
• Medical records viewer with lab results and imaging
• Prescription refill requests
• Billing and payment processing (Stripe integration)
• Telehealth video consultations (WebRTC)
• Push notifications and reminders
• Multi-language support (English, Spanish, Mandarin)
• Accessibility (WCAG 2.1 AA)

Out-of-scope:
• EMR data migration
• Insurance claim adjudication
• Provider-side administrative tools
• Medical device integrations`,
  },
  {
    id: "sec-3",
    title: "Technical Requirements",
    confidence: 87,
    isExpanded: false,
    content: `Frontend: React 18+ with TypeScript, Next.js App Router, Tailwind CSS.

Backend: Node.js/NestJS microservices, PostgreSQL 16 with row-level security, Redis for session management, S3-compatible storage for documents.

Security: OAuth 2.0 / OIDC with Keycloak, MFA enforcement, AES-256 encryption at rest, TLS 1.3 in transit.

Infrastructure: AWS (us-east-1 primary, us-west-2 DR), Kubernetes (EKS), Terraform IaC, CI/CD via GitHub Actions.

Integrations: Epic FHIR R4, Twilio (SMS/Voice), Stripe (Payments), SendGrid (Email), Vonage (Video).`,
  },
  {
    id: "sec-4",
    title: "Timeline & Milestones",
    confidence: 92,
    isExpanded: false,
    content: `Phase 1 (Weeks 1-6): Core infrastructure, authentication, patient registration.

Phase 2 (Weeks 7-14): Appointment scheduling, medical records viewer, secure messaging.

Phase 3 (Weeks 15-20): Telehealth, billing/payments, prescription management.

Phase 4 (Weeks 21-24): UAT, security audit, performance optimization, staged rollout.

Total duration: 24 weeks.

Key milestones:
• Architecture review (Week 2)
• MVP demo (Week 10)
• Security penetration test (Week 20)
• Go-live (Week 24)`,
  },
  {
    id: "sec-5",
    title: "Budget Breakdown",
    confidence: 82,
    isExpanded: false,
    content: `Total estimated budget: $1,240,000

Engineering (60%): $744,000 — includes 8 senior engineers, 4 mid-level, 2 QA
Design (10%): $124,000 — UX research, UI design, accessibility audit
Infrastructure (15%): $186,000 — AWS hosting, CDN, monitoring, DR setup
Security & Compliance (10%): $124,000 — penetration testing, HIPAA audit, SOC 2 preparation
Project Management (5%): $62,000 — Scrum master, stakeholder coordination

Contingency: 12% buffer included in line items.`,
  },
  {
    id: "sec-6",
    title: "Team Composition",
    confidence: 88,
    isExpanded: false,
    content: `Project Lead: 1 senior technical PM
Architecture: 1 solutions architect (HIPAA-experienced)
Frontend: 3 senior React developers, 2 mid-level
Backend: 3 senior NestJS developers, 2 mid-level
DevOps: 1 senior SRE, 1 cloud engineer
QA: 2 automation engineers (Playwright + API)
Security: 1 dedicated security engineer
UX: 1 senior UX designer, 1 accessibility specialist

Total: 18 team members across delivery.`,
  },
  {
    id: "sec-7",
    title: "Quality Standards & SLAs",
    confidence: 95,
    isExpanded: false,
    content: `Availability: 99.95% uptime (excluding planned maintenance)
Performance: P95 page load < 2s, API response < 200ms
Security: Zero critical/high vulnerabilities at launch, monthly vulnerability scans
Testing: Minimum 85% code coverage, automated E2E for all critical paths
Accessibility: WCAG 2.1 AA compliance verified by independent audit
Data: RPO < 1 hour, RTO < 4 hours
Support: 24/7 for critical issues, 8-hour SLA for high priority`,
  },
  {
    id: "sec-8",
    title: "Security & Compliance",
    confidence: 97,
    isExpanded: false,
    content: `HIPAA BAA with all subprocessors.
PHI encrypted at rest (AES-256) and in transit (TLS 1.3).
Role-based access control with principle of least privilege.
Audit logging for all data access events (immutable, 7-year retention).
Multi-factor authentication mandatory for all users.
Session timeout: 15 minutes idle, 8 hours absolute.
Annual penetration testing by CREST-certified firm.
SOC 2 Type II certification targeted within 12 months of launch.
Data residency: US-only, no cross-border transfers.`,
  },
];

const HALLUCINATION_FLAGS = [
  {
    id: "flag-1",
    severity: "medium" as const,
    section: "Budget Breakdown",
    clause: "Contingency: 12% buffer included in line items.",
    reason: "Contingency percentage was inferred from project complexity scoring.",
    suggestion: "Verify 12% aligns with MedFirst's procurement policy (typical range: 10-20%).",
    resolved: true,
  },
  {
    id: "flag-2",
    severity: "low" as const,
    section: "Timeline & Milestones",
    clause: "Security penetration test (Week 20)",
    reason: "Penetration test timing was auto-scheduled.",
    suggestion: "4-week buffer before go-live. Verify security team availability.",
    resolved: true,
  },
  {
    id: "flag-3",
    severity: "high" as const,
    section: "Budget Breakdown",
    clause: "Security & Compliance (10%): $124,000",
    reason: "Below healthcare industry median of 14% for HIPAA-regulated portals.",
    suggestion: "Increase to 14% ($173,600). Healthcare breaches average $10.9M.",
    resolved: false,
  },
];

const COMPARISON_SECTIONS = [
  {
    id: "cmp-1",
    label: "Project Duration",
    input: "6 months estimated delivery window",
    generated: "24 weeks (~6 months) with 4 distinct phases",
    match: "high" as const,
  },
  {
    id: "cmp-2",
    label: "Budget",
    input: "~$1.2M total budget, flexible allocation",
    generated: "$1,240,000 allocated across Engineering (60%), Design (10%), Infrastructure (15%), Security (10%), PM (5%)",
    match: "expanded" as const,
  },
  {
    id: "cmp-3",
    label: "Security Requirements",
    input: "HIPAA mandatory, SOC 2 desired, standard encryption",
    generated: "Full HIPAA BAA, AES-256, TLS 1.3, SOC 2 Type II within 12 months, CREST-certified pen testing",
    match: "expanded" as const,
  },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const TABS = [
  { key: "generated", label: "Generated SOW", icon: FileText },
  { key: "comparison", label: "Comparison", icon: GitCompare },
  { key: "verification", label: "Verification", icon: ShieldCheck },
] as const;

function confidenceStyle(c: number) {
  if (c >= 90) return { bg: "bg-[#4D5741]/10", color: "text-[#344028]", gradient: "from-[#4D5741] to-[#949A8D]" };
  if (c >= 85) return { bg: "bg-[#5B9BA2]/10", color: "text-[#3A6368]", gradient: "from-[#5B9BA2] to-[#8FC0C7]" };
  return { bg: "bg-[#D0B060]/10", color: "text-[#7A6030]", gradient: "from-[#D0B060] to-[#E0CC8A]" };
}

function severityStyle(s: "high" | "medium" | "low") {
  if (s === "high") return { bg: "bg-red-50", color: "text-red-700", border: "border-red-200" };
  if (s === "medium") return { bg: "bg-[#D0B060]/10", color: "text-[#7A6030]", border: "border-[#D0B060]/20" };
  return { bg: "bg-[#F5F1ED]", color: "text-[#8B7355]", border: "border-[#E5DDD4]" };
}

/* ═══════════════════════════════════════════════════════════
   PAGE: Preview & Confirm
   ═══════════════════════════════════════════════════════════ */

export default function PreviewConfirmPage() {
  const router = useRouter();
  const uploadStore = useSOWUploadStore();
  const sowId = uploadStore.uploadedSowId;
  const confirmMutation = useSubmitSOW(sowId, "manual");
  const { data: previewRes } = useSOWPreview(sowId);
  const { data: hallucinationRes } = useHallucinationLayers(sowId);
  const { data: sowRes } = useManualSOW(sowId);

  /* Map API preview data → sections */
  const apiSections: SOWSection[] = React.useMemo(() => {
    if (!previewRes) return [];
    const res = previewRes as unknown as Record<string, unknown>;
    const payload = (res.data ?? res) as Record<string, unknown>;
    const list = payload.sections ?? payload.sow_sections ?? payload.generated_sections ?? payload;
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map((raw: unknown, i: number) => {
      const r = raw as Record<string, unknown>;
      return {
        id: String(r.id ?? r._id ?? `sec-${i + 1}`),
        title: String(r.title ?? r.name ?? r.heading ?? `Section ${i + 1}`),
        content: String(r.content ?? r.text ?? r.body ?? ""),
        confidence: Number(r.confidence ?? r.confidence_score ?? 0),
        isExpanded: i === 0,
      };
    });
  }, [previewRes]);

  /* Map API quality metrics */
  const apiMetrics: QualityMetric[] = React.useMemo(() => {
    if (!previewRes) return [];
    const res = previewRes as unknown as Record<string, unknown>;
    const payload = (res.data ?? res) as Record<string, unknown>;
    const m = (payload.quality_metrics ?? payload.qualityMetrics ?? payload.metrics ?? payload) as Record<string, unknown>;
    const confidence = Number(m.confidence ?? m.ai_confidence ?? m.aiConfidence ?? 0);
    const completeness = Number(m.completeness ?? m.completeness_score ?? 0);
    const riskScore = Number(m.risk_score ?? m.riskScore ?? 0);
    const flags = Number(m.hallucination_flags ?? m.hallucinationFlags ?? m.flags ?? 0);
    if (!confidence && !completeness) return [];
    return [
      { label: "AI Confidence", value: `${confidence}%`, subtext: confidence >= 85 ? "Above threshold" : "Below threshold", status: confidence >= 85 ? "good" as const : "warning" as const },
      { label: "Completeness", value: `${completeness}%`, subtext: "Sections complete", status: completeness >= 80 ? "good" as const : "warning" as const },
      { label: "Risk Score", value: `${riskScore}/100`, subtext: riskScore < 40 ? "Low risk" : riskScore < 70 ? "Medium risk" : "High risk", status: riskScore < 40 ? "good" as const : "warning" as const },
      { label: "Flags", value: String(flags), subtext: "Hallucination flags", status: flags > 0 ? "warning" as const : "good" as const },
    ];
  }, [previewRes]);

  /* Map API hallucination layers */
  const apiHallucinationFlags = React.useMemo(() => {
    if (!hallucinationRes) return null;
    const res = hallucinationRes as unknown as Record<string, unknown>;
    const payload = (res.data ?? res) as Record<string, unknown>;
    const list = payload.layers ?? payload.hallucination_layers ?? payload.flags ?? payload;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.map((raw: unknown, i: number) => {
      const r = raw as Record<string, unknown>;
      const sev = String(r.severity ?? r.risk_level ?? "low").toLowerCase() as "high" | "medium" | "low";
      return {
        id: String(r.id ?? r.layer_id ?? `flag-${i + 1}`),
        severity: (sev === "high" || sev === "medium" || sev === "low" ? sev : "low") as "high" | "medium" | "low",
        section: String(r.section ?? r.affected_section ?? ""),
        clause: String(r.clause ?? r.text ?? r.content ?? ""),
        reason: String(r.reason ?? r.description ?? ""),
        suggestion: String(r.suggestion ?? r.recommendation ?? ""),
        resolved: Boolean(r.resolved ?? r.is_resolved ?? false),
      };
    });
  }, [hallucinationRes]);

  /* Map API SOW meta */
  const sowMeta = React.useMemo(() => {
    if (sowRes) {
      const res = sowRes as unknown as Record<string, unknown>;
      const d = (res.data ?? res) as Record<string, unknown>;
      return {
        id: String(d.id ?? d.sow_id ?? sowId ?? ""),
        title: String(d.title ?? d.project_title ?? SOW_META.title),
        client: String(d.client_organisation ?? d.client ?? SOW_META.client),
        generatedAt: String(d.created_at ?? d.generated_at ?? SOW_META.generatedAt),
        sourceDocument: uploadStore.uploadedFile?.name ?? SOW_META.sourceDocument,
      };
    }
    return { ...SOW_META, sourceDocument: uploadStore.uploadedFile?.name ?? SOW_META.sourceDocument };
  }, [sowRes, sowId, uploadStore.uploadedFile]);

  const activeHallucinationFlags = apiHallucinationFlags ?? HALLUCINATION_FLAGS;

  const [activeTab, setActiveTab] = React.useState<TabKey>("generated");
  const [sections, setSections] = React.useState(apiSections.length > 0 ? apiSections : SOW_SECTIONS);

  React.useEffect(() => {
    if (apiSections.length > 0) setSections(apiSections);
  }, [apiSections]);

  const qualityMetrics = apiMetrics.length > 0 ? apiMetrics : QUALITY_METRICS;
  const [resolvedFlags, setResolvedFlags] = React.useState<Set<string>>(
    new Set(activeHallucinationFlags.filter((f) => f.resolved).map((f) => f.id))
  );
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isExpanded: !s.isExpanded } : s))
    );
  };

  const toggleResolveFlag = (id: string) => {
    setResolvedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    const navigateToApprove = (id: string) => router.push(`/enterprise/sow/${id}?tab=approval`);

    if (sowId) {
      confirmMutation.mutate(undefined, {
        onSuccess: () => navigateToApprove(sowId),
        onError: () => {
          /* Fall back to navigating with the stored ID even on API error */
          navigateToApprove(sowId);
        },
      });
    } else {
      setTimeout(() => navigateToApprove(sowMeta.id), 1500);
    }
  };

  const unresolvedCount = activeHallucinationFlags.filter((f) => !resolvedFlags.has(f.id)).length;
  const allFlagsResolved = unresolvedCount === 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pb-24">
      {/* ═══ AI GENERATED DRAFT READY BANNER ═══ */}
      <motion.div
        variants={fadeUp}
        className="mb-6 rounded-xl bg-gradient-to-r from-[#2A6068] to-[#5B9BA2] p-4 text-white shadow-lg shadow-[#2A6068]/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">AI Generated Draft Ready</h2>
            <p className="text-sm text-white/80">
              Your SOW has been generated from <span className="font-medium">{sowMeta.sourceDocument}</span> with{" "}
              {qualityMetrics[0]?.value ?? "N/A"} confidence. Review and confirm to proceed to approval.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-1.5" /> Export
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══ QUALITY METRICS HEADER ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {qualityMetrics.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              "rounded-lg p-4 border",
              metric.status === "good" && "bg-[#4D5741]/5 border-[#4D5741]/15",
              metric.status === "warning" && "bg-[#D0B060]/10 border-[#D0B060]/20",
              metric.status === "info" && "bg-[#5B9BA2]/5 border-[#5B9BA2]/15"
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8B7355]">{metric.label}</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              metric.status === "good" && "text-[#344028]",
              metric.status === "warning" && "text-[#7A6030]",
              metric.status === "info" && "text-[#3A6368]"
            )}>
              {metric.value}
            </p>
            <p className="text-xs text-[#8B7355] mt-0.5">{metric.subtext}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══ TAB BAR ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 border-b border-[#E5DDD4]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
                  isActive
                    ? "text-[#3D3126] border-[#A67763]"
                    : "text-[#8B7355] border-transparent hover:text-[#5B4538]"
                )}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
                {tab.key === "verification" && unresolvedCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#D0B060]/20 text-[#7A6030] text-xs flex items-center justify-center font-bold">
                    {unresolvedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      <motion.div variants={fadeUp}>
        {/* TAB: Generated SOW */}
        {activeTab === "generated" && (
          <div className="space-y-4">
            {sections.map((section, idx) => {
              const cs = confidenceStyle(section.confidence);
              const isLow = section.confidence < 85;

              return (
                <div
                  key={section.id}
                  className="rounded-xl border border-[#E5DDD4] bg-white overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#FAFAF8] transition-colors"
                  >
                    <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", cs.bg, cs.color)}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-medium text-[#3D3126]">{section.title}</span>
                    {isLow && <AlertTriangle className="w-4 h-4 text-[#D0B060]" />}
                    <Badge variant="beige" className={cn(cs.bg, cs.color, "border-0")}>
                      {section.confidence}%
                    </Badge>
                    {section.isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#8B7355]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8B7355]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {section.isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-[#E5DDD4]">
                          <div className="pt-4">
                            <p className="text-sm text-[#5B4538] leading-relaxed whitespace-pre-wrap">
                              {section.content}
                            </p>
                          </div>

                          {/* Confidence bar */}
                          <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs text-[#8B7355] w-16">Confidence</span>
                            <div className="flex-1 h-2 bg-[#E5DDD4] rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r", cs.gradient)}
                                style={{ width: `${section.confidence}%` }}
                              />
                            </div>
                            <span className={cn("text-xs font-semibold w-10 text-right", cs.color)}>
                              {section.confidence}%
                            </span>
                          </div>

                          {isLow && (
                            <div className="mt-4 p-3 bg-[#D0B060]/10 rounded-lg border border-[#D0B060]/20">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-[#D0B060] mt-0.5" />
                                <p className="text-sm text-[#7A6030]">
                                  Below 85% confidence threshold. Review this section carefully against your original requirements.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: Comparison */}
        {activeTab === "comparison" && (
          <div className="space-y-4">
            {COMPARISON_SECTIONS.map((cmp) => {
              const matchStyle =
                cmp.match === "high"
                  ? { bg: "bg-[#4D5741]/10", color: "text-[#344028]", label: "High Match" }
                  : cmp.match === "expanded"
                  ? { bg: "bg-[#5B9BA2]/10", color: "text-[#3A6368]", label: "AI Expanded" }
                  : { bg: "bg-[#D0B060]/10", color: "text-[#7A6030]", label: "Partial Match" };

              return (
                <div key={cmp.id} className="rounded-xl border border-[#E5DDD4] bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5DDD4] bg-[#FAFAF8]">
                    <span className="font-medium text-[#3D3126]">{cmp.label}</span>
                    <Badge className={cn(matchStyle.bg, matchStyle.color, "border-0")}>{matchStyle.label}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-4 border-b md:border-b-0 md:border-r border-[#E5DDD4]">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRight className="w-3 h-3 text-[#8B7355]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B7355]">Your Input</span>
                      </div>
                      <p className="text-sm text-[#5B4538]">{cmp.input}</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3 h-3 text-[#5B9BA2]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3A6368]">AI Generated</span>
                      </div>
                      <p className="text-sm text-[#5B4538]">{cmp.generated}</p>
                    </div>
                  </div>
                  {cmp.match === "expanded" && (
                    <div className="px-4 py-2 bg-[#5B9BA2]/5 flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-[#5B9BA2]" />
                      <span className="text-xs text-[#3A6368]">AI expanded this section beyond your input. Review for accuracy.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: Verification */}
        {activeTab === "verification" && (
          <div className="space-y-6">
            {/* Hallucination Flags */}
            <div className="rounded-xl border border-[#E5DDD4] bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5DDD4] bg-[#FAFAF8]">
                <h3 className="font-medium text-[#3D3126]">Verification Flags</h3>
                {allFlagsResolved ? (
                  <Badge className="bg-[#4D5741]/10 text-[#344028] border-[#4D5741]/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> All Resolved
                  </Badge>
                ) : (
                  <span className="text-xs text-[#8B7355]">
                    {unresolvedCount} of {activeHallucinationFlags.length} unresolved
                  </span>
                )}
              </div>
              <div className="divide-y divide-[#E5DDD4]">
                {activeHallucinationFlags.map((flag) => {
                  const ss = severityStyle(flag.severity);
                  const isResolved = resolvedFlags.has(flag.id);

                  return (
                    <div
                      key={flag.id}
                      className={cn("p-4 transition-opacity", isResolved && "opacity-50")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn("w-2 h-2 rounded-full", flag.severity === "high" ? "bg-red-500" : flag.severity === "medium" ? "bg-[#D0B060]" : "bg-[#8B7355]")}
                          />
                          <span className={cn("text-xs font-semibold uppercase", ss.color)}>{flag.severity}</span>
                          <span className="text-xs text-[#8B7355]">·</span>
                          <span className="text-xs text-[#8B7355]">{flag.section}</span>
                        </div>
                        <Button
                          variant={isResolved ? "outline" : "primary"}
                          size="sm"
                          onClick={() => toggleResolveFlag(flag.id)}
                          className={cn(
                            "h-7 text-xs",
                            isResolved && "border-[#4D5741] text-[#4D5741]"
                          )}
                        >
                          {isResolved ? (
                            <><RotateCcw className="w-3 h-3 mr-1" /> Undo</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Resolve</>
                          )}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm italic text-[#3D3126]">&ldquo;{flag.clause}&rdquo;</p>
                      <p className="mt-1 text-xs text-[#8B7355]">{flag.reason}</p>
                      <div className="mt-2 p-2 bg-[#5B9BA2]/5 rounded border border-[#5B9BA2]/10">
                        <p className="text-xs text-[#3A6368]">{flag.suggestion}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ BOTTOM ACTION BAR ═══ */}
      <motion.div
        variants={fadeUp}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5DDD4] shadow-lg shadow-black/5 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/enterprise/sow/upload/extraction-report">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Review
              </Button>
            </Link>
            <Button variant="outline">
              <Edit3 className="w-4 h-4 mr-1.5" /> Edit SOW
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {!allFlagsResolved && (
              <p className="hidden md:block text-xs text-[#8B7355]">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-[#D0B060]" />
                {unresolvedCount} verification flags need attention
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              disabled={!allFlagsResolved || isSubmitting}
              onClick={handleConfirm}
              className={cn(
                "gap-2",
                (!allFlagsResolved || isSubmitting) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <><Check className="w-4 h-4" /> Confirming...</>
              ) : (
                <><Send className="w-4 h-4" /> Confirm & Submit</>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
