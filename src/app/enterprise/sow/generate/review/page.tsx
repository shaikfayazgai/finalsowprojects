"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  GitCompare,
  BarChart3,
  RefreshCcw,
  PenLine,
  Send,
  X,
  Lightbulb,
  Eye,
  CircleDot,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Textarea } from "@/components/ui";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useSOWPipelineStore } from "@/lib/stores/sow-pipeline-store";
import { useSowStore, INITIAL_APPROVAL_STAGES } from "@/lib/stores/sow-store";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";
import { NavigationGuardModal } from "@/components/enterprise/sow/NavigationGuardModal";

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */ 

const sowMeta = {
  id: "sow-004",
  title: "Healthcare Patient Portal",
  client: "MedFirst Health Systems",
  generatedAt: "2026-03-07T14:32:00Z",
  overallConfidence: 92,
  riskScore: 18,
  hallucinationFlags: 2,
  completeness: 96,
};

const generatedSections = [
  {
    id: "sec-1",
    title: "Executive Summary",
    confidence: 96,
    content:
      "This project delivers a secure, HIPAA-compliant patient portal enabling MedFirst Health Systems' 2.4 million active patients to manage appointments, view medical records, communicate with providers, and process payments. The platform integrates with Epic EHR via FHIR R4 APIs, supports real-time telehealth video, and includes a mobile-responsive Progressive Web App. Target launch: Q3 2026 with phased rollout across 14 regional facilities.",
  },
  {
    id: "sec-2",
    title: "Project Scope",
    confidence: 94,
    content:
      "In-scope: Patient registration and identity verification (KYC/KYB), appointment scheduling with provider availability sync, secure messaging (asynchronous + real-time), medical records viewer with lab results and imaging, prescription refill requests, billing and payment processing (Stripe integration), telehealth video consultations (WebRTC), push notifications and reminders, multi-language support (English, Spanish, Mandarin), accessibility (WCAG 2.1 AA). Out-of-scope: EMR data migration, insurance claim adjudication, provider-side administrative tools, medical device integrations.",
  },
  {
    id: "sec-3",
    title: "Technical Requirements",
    confidence: 91,
    content:
      "Frontend: React 18+ with TypeScript, Next.js App Router, Tailwind CSS. Backend: Node.js/NestJS microservices, PostgreSQL 16 with row-level security, Redis for session management, S3-compatible storage for documents. Security: OAuth 2.0 / OIDC with Keycloak, MFA enforcement, AES-256 encryption at rest, TLS 1.3 in transit. Infrastructure: AWS (us-east-1 primary, us-west-2 DR), Kubernetes (EKS), Terraform IaC, CI/CD via GitHub Actions. Integrations: Epic FHIR R4, Twilio (SMS/Voice), Stripe (Payments), SendGrid (Email), Vonage (Video).",
  },
  {
    id: "sec-4",
    title: "Timeline & Milestones",
    confidence: 88,
    content:
      "Phase 1 (Weeks 1-6): Core infrastructure, authentication, patient registration. Phase 2 (Weeks 7-14): Appointment scheduling, medical records viewer, secure messaging. Phase 3 (Weeks 15-20): Telehealth, billing/payments, prescription management. Phase 4 (Weeks 21-24): UAT, security audit, performance optimization, staged rollout. Total duration: 24 weeks. Key milestones: Architecture review (Week 2), MVP demo (Week 10), Security penetration test (Week 20), Go-live (Week 24).",
  },
  {
    id: "sec-5",
    title: "Budget Breakdown",
    confidence: 82,
    content:
      "Total estimated budget: $1,240,000. Engineering (60%): $744,000 — includes 8 senior engineers, 4 mid-level, 2 QA. Design (10%): $124,000 — UX research, UI design, accessibility audit. Infrastructure (15%): $186,000 — AWS hosting, CDN, monitoring, DR setup. Security & Compliance (10%): $124,000 — penetration testing, HIPAA audit, SOC 2 preparation. Project Management (5%): $62,000 — Scrum master, stakeholder coordination. Contingency: 12% buffer included in line items.",
  },
  {
    id: "sec-6",
    title: "Team Composition",
    confidence: 93,
    content:
      "Project Lead: 1 senior technical PM. Architecture: 1 solutions architect (HIPAA-experienced). Frontend: 3 senior React developers, 2 mid-level. Backend: 3 senior NestJS developers, 2 mid-level. DevOps: 1 senior SRE, 1 cloud engineer. QA: 2 automation engineers (Playwright + API). Security: 1 dedicated security engineer. UX: 1 senior UX designer, 1 accessibility specialist. Total: 18 team members across delivery.",
  },
  {
    id: "sec-7",
    title: "Quality Standards & SLAs",
    confidence: 95,
    content:
      "Availability: 99.95% uptime (excluding planned maintenance). Performance: P95 page load < 2s, API response < 200ms. Security: Zero critical/high vulnerabilities at launch, monthly vulnerability scans. Testing: Minimum 85% code coverage, automated E2E for all critical paths. Accessibility: WCAG 2.1 AA compliance verified by independent audit. Data: RPO < 1 hour, RTO < 4 hours. Support: 24/7 for critical issues, 8-hour SLA for high priority.",
  },
  {
    id: "sec-8",
    title: "Security & Compliance",
    confidence: 97,
    content:
      "HIPAA BAA with all subprocessors. PHI encrypted at rest (AES-256) and in transit (TLS 1.3). Role-based access control with principle of least privilege. Audit logging for all data access events (immutable, 7-year retention). Multi-factor authentication mandatory for all users. Session timeout: 15 minutes idle, 8 hours absolute. Annual penetration testing by CREST-certified firm. SOC 2 Type II certification targeted within 12 months of launch. Data residency: US-only, no cross-border transfers.",
  },
];

const hallucinationLayers = [
  { id: "layer-1", name: "Input Validation", status: "passed" as const, score: 100, details: "All 23 input fields validated. No schema violations detected." },
  { id: "layer-2", name: "Template Locking", status: "passed" as const, score: 100, details: "All 8 mandatory sections present. Section ordering matches template v3.2." },
  { id: "layer-3", name: "Clause Library Matching", status: "warning" as const, score: 85, details: "42 of 44 clauses matched. 2 clauses generated from context inference." },
  { id: "layer-4", name: "Completeness Checks", status: "passed" as const, score: 96, details: "96% completeness. Minor gap: DR testing frequency not explicitly stated." },
  { id: "layer-5", name: "Confidence Scoring", status: "passed" as const, score: 92, details: "Overall 92% exceeds threshold. Budget section at 82% — flagged for review." },
  { id: "layer-6", name: "Pattern Matching", status: "warning" as const, score: 88, details: "Security budget (10%) is below healthcare median (14%). Flagged for review." },
  { id: "layer-7", name: "Human Approval Gate", status: "pending" as const, score: 0, details: "Awaiting human review and approval." },
  { id: "layer-8", name: "Audit Logging", status: "active" as const, score: 100, details: "All 847 generation steps logged with timestamps and confidence deltas." },
];

const hallucinationFlags = [
  {
    id: "flag-1",
    severity: "medium" as const,
    section: "Budget Breakdown",
    clause: "Contingency: 12% buffer included in line items.",
    reason: "This contingency percentage was not specified in the input parameters. The AI inferred 12% based on project complexity scoring.",
    suggestion: "Verify the 12% contingency rate aligns with MedFirst's procurement policy. Healthcare projects typically range 10-20%.",
    resolved: false,
  },
  {
    id: "flag-2",
    severity: "low" as const,
    section: "Timeline & Milestones",
    clause: "Security penetration test (Week 20)",
    reason: "Penetration test timing was auto-scheduled based on phase completion patterns.",
    suggestion: "Week 20 allows 4 weeks of buffer before go-live. Consider if this aligns with your security team's availability.",
    resolved: false,
  },
  {
    id: "flag-3",
    severity: "high" as const,
    section: "Budget Breakdown",
    clause: "Security & Compliance (10%): $124,000",
    reason: "The security budget allocation (10%) is significantly below the healthcare industry median of 14% for HIPAA-regulated patient portals.",
    suggestion: "Increase security allocation to at least 14% ($173,600). Healthcare breaches average $10.9M per incident.",
    resolved: false,
  },
];

const riskBreakdown = [
  { category: "Completeness", weight: 30, score: 28, maxScore: 30 },
  { category: "Confidence", weight: 25, score: 22, maxScore: 25 },
  { category: "Compliance", weight: 25, score: 23, maxScore: 25 },
  { category: "Pattern Match", weight: 20, score: 18, maxScore: 20 },
];

const comparisonSections = [
  { id: "cmp-1", label: "Project Duration", input: "6 months estimated delivery window with phased rollout", generated: "24 weeks (approximately 6 months) with 4 distinct phases", match: "high" as const },
  { id: "cmp-2", label: "Budget", input: "Approximately $1.2M total budget, flexible on allocation", generated: "$1,240,000 allocated across Engineering (60%), Design (10%), Infrastructure (15%), Security (10%), PM (5%)", match: "high" as const },
  { id: "cmp-3", label: "Security Requirements", input: "HIPAA compliance mandatory, SOC 2 desired, standard encryption", generated: "Full HIPAA BAA, AES-256, TLS 1.3, SOC 2 Type II within 12 months, CREST-certified pen testing", match: "expanded" as const },
  { id: "cmp-4", label: "Team Size", input: "15-20 team members across disciplines", generated: "18 team members: 1 PM, 1 Architect, 5 Frontend, 5 Backend, 2 DevOps, 2 QA, 1 Security, 2 UX", match: "high" as const },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const TABS = [
  { key: "generated", label: "Generated SOW", icon: FileText },
  { key: "hallucination", label: "Verification", icon: ShieldCheck },
  { key: "risk", label: "Risk Assessment", icon: BarChart3 },
  { key: "comparison", label: "Comparison", icon: GitCompare },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function severityStyle(s: "high" | "medium" | "low") {
  if (s === "high") return { bg: "rgba(192,68,68,0.08)", color: "#983030", border: "rgba(192,68,68,0.20)" };
  if (s === "medium") return { bg: "rgba(208,176,96,0.10)", color: "#7A6030", border: "rgba(208,176,96,0.25)" };
  return { bg: "rgba(166,119,99,0.06)", color: "var(--ink-muted)", border: "var(--border-soft)" };
}

function confidenceStyle(c: number) {
  if (c >= 90) return { bg: "rgba(77,87,65,0.08)", color: "#344028", gradient: "linear-gradient(90deg, #4D5741, #949A8D)" };
  if (c >= 85) return { bg: "rgba(91,155,162,0.08)", color: "#3A6368", gradient: "linear-gradient(90deg, #5B9BA2, #8FC0C7)" };
  return { bg: "rgba(208,176,96,0.10)", color: "#7A6030", gradient: "linear-gradient(90deg, #D0B060, #E0CC8A)" };
}

function layerStatusStyle(s: "passed" | "warning" | "pending" | "active") {
  if (s === "passed") return { bg: "rgba(77,87,65,0.08)", color: "#344028", border: "rgba(77,87,65,0.18)", icon: CheckCircle2, label: "Passed" };
  if (s === "warning") return { bg: "rgba(208,176,96,0.10)", color: "#7A6030", border: "rgba(208,176,96,0.22)", icon: AlertTriangle, label: "Warning" };
  if (s === "pending") return { bg: "rgba(166,119,99,0.06)", color: "var(--ink-muted)", border: "var(--border-soft)", icon: Clock, label: "Pending" };
  return { bg: "rgba(91,155,162,0.08)", color: "#3A6368", border: "rgba(91,155,162,0.20)", icon: CircleDot, label: "Active" };
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function SOWAIDraftReviewPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isCollapsed } = useSidebarStore();
  const { projectTitle, clientOrganisation, approvalAuthorities, commercialDetails } = useSOWUploadStore();
  const addSOW = useSOWPipelineStore((s) => s.addSOW);
  const addSow = useSowStore((s) => s.addSow);
  const [activeTab, setActiveTab] = React.useState<TabKey>("generated");
  const [resolvedFlags, setResolvedFlags] = React.useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(["sec-1", "sec-2"]));
  const [submitted, setSubmitted] = React.useState(false);
  const [showChangesDialog, setShowChangesDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [changesFeedback, setChangesFeedback] = React.useState("");

  const toggleResolve = (id: string) => {
    setResolvedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unresolvedCount = hallucinationFlags.filter((f) => !resolvedFlags.has(f.id)).length;

  // Track presence on this page so the SOW Repository banner can offer to resume
  React.useEffect(() => {
    sessionStorage.setItem("sow-ai-review-active", "true");
    return () => { /* keep flag alive on unmount so banner can detect it */ };
  }, []);
  React.useEffect(() => {
    if (submitted) sessionStorage.removeItem("sow-ai-review-active");
  }, [submitted]);

  const navGuard = useNavigationGuard({
    isActive: !submitted && Boolean(projectTitle),
    allowedPathPrefixes: ["/enterprise/sow/generate/review"],
  });

  return (
    <>
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ paddingBottom: 80 }}>

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="relative" style={{ marginBottom: 24 }}>
        <div className="absolute pointer-events-none" style={{
          top: -60, left: -80, width: 500, height: 300,
          background: 'radial-gradient(ellipse at 20% 40%, rgba(208,176,96,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(91,155,162,0.06) 0%, transparent 45%)',
          filter: 'blur(40px)',
        }} />
        <div className="relative">
          <h1
            className="font-heading leading-[1.15]"
            style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            AI Draft Review
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-muted)', fontWeight: 400, lineHeight: 1.55 }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-mid)' }}>{sowMeta.title}</span> for {sowMeta.client} · Generated {new Date(sowMeta.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Confidence", value: `${sowMeta.overallConfidence}%`, sub: "Above threshold", style: confidenceStyle(sowMeta.overallConfidence) },
          { label: "Risk Score", value: `${sowMeta.riskScore}/100`, sub: "Low risk", style: { bg: "rgba(77,87,65,0.06)", color: "#344028", fill: "#4D5741" } },
          { label: "Flags", value: `${unresolvedCount}`, sub: unresolvedCount === 0 ? "All resolved" : `of ${hallucinationFlags.length} unresolved`, style: { bg: unresolvedCount > 0 ? "rgba(208,176,96,0.08)" : "rgba(77,87,65,0.06)", color: unresolvedCount > 0 ? "#7A6030" : "#344028", fill: "" } },
          { label: "Completeness", value: `${sowMeta.completeness}%`, sub: "8 sections", style: { bg: "rgba(91,155,162,0.06)", color: "#3A6368", fill: "" } },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg" style={{
            padding: '14px 16px',
            background: kpi.style.bg,
            border: `1px solid ${kpi.style.color}22`,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{kpi.label}</div>
            <div className="num-display" style={{ fontSize: '1.4rem', color: '#000000', marginTop: 2 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: kpi.style.color, fontWeight: 500, marginTop: 1 }}>{kpi.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* ═══ TAB BAR ═══ */}
      <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--border-hair)', paddingBottom: 0 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 transition-all duration-200"
                style={{
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                  borderBottom: `2px solid ${isActive ? '#A67763' : 'transparent'}`,
                  marginBottom: -1,
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              >
                <TabIcon style={{ width: 13, height: 13 }} />
                {tab.label}
                {tab.key === "hallucination" && unresolvedCount > 0 && (
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'rgba(208,176,96,0.20)', color: '#7A6030',
                    fontSize: 9, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unresolvedCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}

      {/* TAB: Generated SOW */}
      {activeTab === "generated" && (
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {generatedSections.map((section, idx) => {
            const isLow = section.confidence < 85;
            const cs = confidenceStyle(section.confidence);
            const isOpen = expandedSections.has(section.id);

            return (
              <div key={section.id} className="card-parchment" style={{ overflow: 'hidden' }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 text-left transition-all"
                  style={{ padding: '14px 20px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isLow ? 'rgba(208,176,96,0.12)' : 'rgba(166,119,99,0.06)',
                    fontSize: 10, fontWeight: 700, color: isLow ? '#7A6030' : 'var(--ink-muted)',
                  }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {section.title}
                  </span>
                  {isLow && <AlertTriangle style={{ width: 13, height: 13, color: '#D0B060', flexShrink: 0 }} />}
                  <span className="badge-parchment" style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.color}33` }}>
                    {section.confidence}%
                  </span>
                  {isOpen
                    ? <ChevronDown style={{ width: 14, height: 14, color: 'var(--ink-faint)', flexShrink: 0 }} />
                    : <ChevronRight style={{ width: 14, height: 14, color: 'var(--ink-faint)', flexShrink: 0 }} />
                  }
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <p style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.7, marginBottom: 12 }}>
                      {section.content}
                    </p>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' as const, width: 70, flexShrink: 0 }}>Confidence</span>
                      <div className="prog-track flex-1">
                        <div className="prog-fill" style={{ width: `${section.confidence}%`, background: cs.gradient }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cs.color, width: 32, textAlign: 'right' as const }}>{section.confidence}%</span>
                    </div>
                    {isLow && (
                      <div style={{
                        marginTop: 10, padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(208,176,96,0.06)', border: '1px solid rgba(208,176,96,0.18)',
                      }}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle style={{ width: 12, height: 12, color: '#D0B060', marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#7A6030', lineHeight: 1.5 }}>
                            Below 85% confidence threshold. Review this section carefully against your original requirements.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* TAB: Verification */}
      {activeTab === "hallucination" && (
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Verification Layers */}
          <div className="card-parchment">
            <div className="section-header-parchment">
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Verification Layers
              </div>
            </div>
            <div style={{ padding: '6px 20px 14px' }}>
              {hallucinationLayers.map((layer, idx, arr) => {
                const ls = layerStatusStyle(layer.status);
                const StatusIcon = ls.icon;
                const iconContainerStyle = layer.status === "passed"
                  ? { bg: 'linear-gradient(135deg, rgba(77,87,65,0.14), rgba(91,155,162,0.05))', border: 'rgba(77,87,65,0.22)' }
                  : layer.status === "warning"
                    ? { bg: 'linear-gradient(135deg, rgba(208,176,96,0.16), rgba(166,119,99,0.05))', border: 'rgba(208,176,96,0.25)' }
                    : layer.status === "active"
                      ? { bg: 'linear-gradient(135deg, rgba(91,155,162,0.14), rgba(77,87,65,0.05))', border: 'rgba(91,155,162,0.22)' }
                      : { bg: 'linear-gradient(135deg, rgba(166,119,99,0.08), rgba(166,119,99,0.03))', border: 'var(--border-soft)' };

                return (
                  <div
                    key={layer.id}
                    className="flex items-center gap-[14px]"
                    style={{
                      padding: '13px 0',
                      borderBottom: idx < arr.length - 1 ? '1px solid var(--border-hair)' : 'none',
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: iconContainerStyle.bg,
                        border: `1px solid ${iconContainerStyle.border}`,
                      }}
                    >
                      <StatusIcon style={{ width: 15, height: 15, color: ls.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)' }}>{layer.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{layer.details}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {layer.status !== "pending" && (
                        <div style={{ width: 80 }}>
                          <div className="prog-track">
                            <div className="prog-fill" style={{
                              width: `${layer.score}%`,
                              background: layer.score >= 95
                                ? 'linear-gradient(90deg, #4D5741, #949A8D)'
                                : layer.score >= 85
                                  ? 'linear-gradient(90deg, #5B9BA2, #8FC0C7)'
                                  : 'linear-gradient(90deg, #D0B060, #E0CC8A)',
                            }} />
                          </div>
                        </div>
                      )}
                      <span
                        className="badge-parchment"
                        style={{ background: ls.bg, color: ls.color, border: `1px solid ${ls.border}` }}
                      >
                        {layer.status !== "pending" ? `${layer.score}%` : ls.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flagged Clauses */}
          <div className="card-parchment">
            <div className="section-header-parchment">
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Flagged Clauses
              </div>
              {unresolvedCount === 0 ? (
                <span className="badge-parchment flex items-center gap-1" style={{ background: 'rgba(77,87,65,0.08)', color: '#344028', border: '1px solid rgba(77,87,65,0.18)' }}>
                  <CheckCircle2 style={{ width: 9, height: 9 }} /> All Resolved
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{unresolvedCount} of {hallucinationFlags.length} unresolved</span>
              )}
            </div>
            <div style={{ padding: '6px 20px 14px' }}>
              {hallucinationFlags.map((flag, idx, arr) => {
                const ss = severityStyle(flag.severity);
                const isResolved = resolvedFlags.has(flag.id);
                return (
                  <div
                    key={flag.id}
                    style={{
                      padding: '16px 0',
                      borderBottom: idx < arr.length - 1 ? '1px solid var(--border-hair)' : 'none',
                      opacity: isResolved ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {/* Row 1: severity + section + resolve */}
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: flag.severity === "high" ? '#c44' : flag.severity === "medium" ? '#D0B060' : 'var(--ink-faint)',
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: ss.color }}>
                          {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{flag.section}</span>
                      </div>
                      <button
                        onClick={() => toggleResolve(flag.id)}
                        className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                        style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          background: isResolved ? 'transparent' : 'linear-gradient(135deg, #4D5741, #6B7A5E)',
                          color: isResolved ? 'var(--ink-mid)' : '#FFFFFF',
                          border: `1px solid ${isResolved ? 'var(--border-soft)' : 'rgba(77,87,65,0.35)'}`,
                          boxShadow: isResolved ? 'none' : '0 1px 4px rgba(77,87,65,0.15)',
                        }}
                        onMouseEnter={(e) => { if (!isResolved) { e.currentTarget.style.boxShadow = '0 3px 10px rgba(77,87,65,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                        onMouseLeave={(e) => { if (!isResolved) { e.currentTarget.style.boxShadow = '0 1px 4px rgba(77,87,65,0.15)'; e.currentTarget.style.transform = ''; } }}
                      >
                        {isResolved
                          ? <><RefreshCcw style={{ width: 11, height: 11 }} /> Undo</>
                          : <><CheckCircle2 style={{ width: 11, height: 11 }} /> Resolve</>
                        }
                      </button>
                    </div>

                    {/* Row 2: clause quote */}
                    <p style={{ fontSize: 13, color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>
                      &ldquo;{flag.clause}&rdquo;
                    </p>

                    {/* Row 3: reason */}
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 8 }}>
                      {flag.reason}
                    </p>

                    {/* Row 4: suggestion */}
                    <div className="flex items-start gap-2" style={{
                      padding: '9px 12px', borderRadius: 7,
                      background: 'rgba(91,155,162,0.04)', border: '1px solid rgba(91,155,162,0.12)',
                    }}>
                      <Lightbulb style={{ width: 12, height: 12, color: '#5B9BA2', marginTop: 1, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: '#3A6368', lineHeight: 1.55 }}>{flag.suggestion}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: Risk Assessment */}
      {activeTab === "risk" && (
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Risk score summary */}
          <div className="flex items-center justify-between rounded-lg" style={{
            padding: '14px 20px',
            background: 'rgba(77,87,65,0.05)', border: '1px solid rgba(77,87,65,0.14)',
          }}>
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>Overall Risk Score</span>
              <div className="num-display" style={{ fontSize: '1.8rem', color: '#000000' }}>18<span style={{ fontSize: 14, color: 'var(--ink-faint)', fontWeight: 400 }}>/100</span></div>
            </div>
            <span className="badge-parchment flex items-center gap-1" style={{ background: 'rgba(77,87,65,0.10)', color: '#344028', border: '1px solid rgba(77,87,65,0.22)' }}>
              <CheckCircle2 style={{ width: 10, height: 10 }} /> Low Risk
            </span>
          </div>

          {/* Breakdown */}
          <div className="card-parchment">
            <div className="section-header-parchment">
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Score Breakdown
              </div>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {riskBreakdown.map((item) => {
                const pct = Math.round((item.score / item.maxScore) * 100);
                const gradient = pct >= 90 ? 'linear-gradient(90deg, #4D5741, #949A8D)' : pct >= 75 ? 'linear-gradient(90deg, #5B9BA2, #8FC0C7)' : 'linear-gradient(90deg, #D0B060, #E0CC8A)';
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{item.category}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Weight: {item.weight}%</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                        {item.score}<span style={{ color: 'var(--ink-faint)' }}>/{item.maxScore}</span>
                      </span>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${pct}%`, background: gradient }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-hair)' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Total Points Lost</span>
                  <span className="num-display" style={{ fontSize: '1.1rem', color: '#000000' }}>
                    {riskBreakdown.reduce((a, r) => a + (r.maxScore - r.score), 0)}
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 400 }}> / 100</span>
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 4 }}>
                  Lower score = lower risk. This SOW scores 36% better than the healthcare industry median.
                </p>
              </div>
            </div>
          </div>

          {/* Risk factors */}
          <div className="card-parchment">
            <div className="section-header-parchment">
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Risk Factors
              </div>
            </div>
            <div style={{ padding: '14px 20px' }}>
              {[
                { label: "HIPAA Compliance", value: "Verified", ok: true },
                { label: "Data Encryption", value: "AES-256", ok: true },
                { label: "Budget Alignment", value: "82% match", ok: false },
                { label: "Timeline Feasibility", value: "Achievable", ok: true },
                { label: "Team Sizing", value: "Optimal", ok: true },
              ].map((f, i, arr) => (
                <div key={f.label} className="flex items-center justify-between" style={{
                  padding: '10px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-hair)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: f.ok ? '#344028' : '#7A6030' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: Comparison */}
      {activeTab === "comparison" && (
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comparisonSections.map((cmp) => {
            const matchStyle = cmp.match === "high"
              ? { bg: "rgba(77,87,65,0.08)", color: "#344028", label: "High Match" }
              : cmp.match === "expanded"
                ? { bg: "rgba(91,155,162,0.08)", color: "#3A6368", label: "AI Expanded" }
                : { bg: "rgba(208,176,96,0.10)", color: "#7A6030", label: "Partial Match" };

            return (
              <div key={cmp.id} className="card-parchment" style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div className="flex items-center justify-between" style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-hair)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{cmp.label}</span>
                  <span className="badge-parchment" style={{ background: matchStyle.bg, color: matchStyle.color, border: `1px solid ${matchStyle.color}33` }}>
                    {matchStyle.label}
                  </span>
                </div>

                {/* Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderBottom: cmp.match === "expanded" ? '1px solid var(--border-hair)' : 'none' }}>
                  <div style={{ padding: '14px 20px', borderRight: '1px solid var(--border-hair)' }}>
                    <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                      <ArrowRight style={{ width: 10, height: 10, color: 'var(--ink-faint)' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>Your Input</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--ink-mid)', lineHeight: 1.6 }}>{cmp.input}</p>
                  </div>
                  <div style={{ padding: '14px 20px' }}>
                    <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                      <Sparkles style={{ width: 10, height: 10, color: '#5B9BA2' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#3A6368', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>AI Generated</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--ink-mid)', lineHeight: 1.6 }}>{cmp.generated}</p>
                  </div>
                </div>

                {cmp.match === "expanded" && (
                  <div className="flex items-center gap-2" style={{
                    padding: '8px 20px',
                    background: 'rgba(91,155,162,0.04)',
                  }}>
                    <Eye style={{ width: 11, height: 11, color: '#5B9BA2' }} />
                    <span style={{ fontSize: 11, color: '#3A6368' }}>AI expanded this section beyond your input. Review for accuracy.</span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ═══ REQUEST CHANGES DIALOG ═══ */}
      {showChangesDialog && (
        <div className="fixed inset-0" style={{ zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }} onClick={() => setShowChangesDialog(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', zIndex: 10, width: '100%', maxWidth: 480, margin: '0 16px',
              borderRadius: 12, background: '#FFFFFF', border: '1px solid var(--border-soft)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.12)', padding: 24,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>Request Changes</div>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>Provide feedback for the AI to revise the draft</p>
              </div>
              <button onClick={() => setShowChangesDialog(false)} style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--ink-faint)',
              }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <Textarea
              placeholder="Describe changes — e.g. 'Expand the security section to include HIPAA details'..."
              value={changesFeedback}
              onChange={(e) => setChangesFeedback(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <div className="flex items-center justify-end gap-2" style={{ marginTop: 14 }}>
              <button
                onClick={() => setShowChangesDialog(false)}
                className="rounded-md transition-all"
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink-mid)', background: 'transparent', border: '1px solid var(--border-soft)', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => { setShowChangesDialog(false); setChangesFeedback(""); }}
                disabled={!changesFeedback.trim()}
                className="flex items-center gap-1.5 rounded-md transition-all"
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: changesFeedback.trim() ? 'pointer' : 'not-allowed',
                  background: changesFeedback.trim() ? 'linear-gradient(135deg, #A67763, #886151)' : 'rgba(166,119,99,0.10)',
                  color: changesFeedback.trim() ? '#FFFFFF' : 'var(--ink-faint)',
                  border: '1px solid rgba(166,119,99,0.30)',
                  opacity: changesFeedback.trim() ? 1 : 0.5,
                }}
              ><Send style={{ width: 11, height: 11 }} /> Submit</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ REJECT DIALOG ═══ */}
      {showRejectDialog && (
        <div className="fixed inset-0" style={{ zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRejectDialog(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, margin: '0 16px',
              borderRadius: 12, background: '#FFFFFF', border: '1px solid var(--border-soft)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.12)', padding: 24,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Reject & Re-generate</div>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              This will <span style={{ fontWeight: 600, color: '#c44' }}>discard the current draft</span> and start a new AI generation. All review progress will be lost.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="rounded-md"
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink-mid)', background: 'transparent', border: '1px solid var(--border-soft)', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => { setShowRejectDialog(false); router.push("/enterprise/sow/generate"); }}
                className="flex items-center gap-1.5 rounded-md"
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#c44', color: '#FFFFFF', border: '1px solid rgba(192,68,68,0.40)' }}
              ><RefreshCcw style={{ width: 11, height: 11 }} /> Re-generate</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ BOTTOM ACTION BAR (fixed) ═══ */}
      <motion.div variants={fadeUp} className="card-parchment" style={{ position: 'fixed', bottom: 0, left: isCollapsed ? 68 : 228, right: 0, zIndex: 40, borderRadius: '12px 12px 0 0', background: '#FFFFFF', backdropFilter: 'none' }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 20px', maxWidth: 1400 - 88 }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRejectDialog(true)}
              className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
              style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink-mid)', background: 'transparent', border: '1px solid var(--border-soft)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(166,119,99,0.25)'; e.currentTarget.style.background = 'rgba(166,119,99,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = 'transparent'; }}
            ><RefreshCcw style={{ width: 12, height: 12 }} /> Reject</button>
            <button
              onClick={() => setShowChangesDialog(true)}
              className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
              style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink-mid)', background: 'transparent', border: '1px solid var(--border-soft)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(166,119,99,0.25)'; e.currentTarget.style.background = 'rgba(166,119,99,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = 'transparent'; }}
            ><PenLine style={{ width: 12, height: 12 }} /> Request Changes</button>
          </div>

          <div className="flex items-center gap-3">
            <p className="hidden md:block" style={{ fontSize: 11, color: 'var(--ink-faint)', maxWidth: 260, textAlign: 'right' as const }}>
              Routes to 4-stage approval: Business → Legal → Security → Final
            </p>
            <button
              disabled={submitted}
              onClick={() => {
                const { budgetMaximum, budgetMinimum, currency } = commercialDetails.budgetRisk;
                const budgetValue = budgetMaximum || budgetMinimum;
                const totalValue = budgetValue
                  ? `${currency === "USD" ? "$" : currency}${budgetValue.toLocaleString()}`
                  : "TBD";
                const newId = `sow-${Date.now()}`;
                const now = new Date().toISOString();
                addSOW({
                  id: newId,
                  title: projectTitle || sowMeta.title,
                  client: clientOrganisation || sowMeta.client,
                  currentStage: 1,
                  stageApprover: approvalAuthorities.businessOwnerApprover || "Pending Assignment",
                  slaStatus: "on-track",
                  submittedDate: now.split("T")[0],
                  totalValue,
                  completedStages: [],
                  submittedBy: session?.user?.name || "Unknown",
                });
                addSow({
                  id: newId,
                  title: projectTitle || sowMeta.title,
                  client: clientOrganisation || sowMeta.client,
                  status: "approval",
                  intakeMode: "ai_generated",
                  confidentiality: "confidential",
                  dataSensitivity: "confidential",
                  version: 1,
                  createdAt: now,
                  updatedAt: now,
                  createdBy: session?.user?.name || "Unknown",
                  fileSize: "—",
                  pages: 0,
                  parsedSections: 0,
                  totalSections: 0,
                  aiConfidence: sowMeta.overallConfidence,
                  riskScore: { completeness: 28, confidence: 22, compliance: 23, patternMatch: 18, overall: sowMeta.riskScore },
                  tags: [],
                  estimatedBudget: commercialDetails.budgetRisk.budgetMaximum || commercialDetails.budgetRisk.budgetMinimum || 0,
                  estimatedDuration: commercialDetails.timelineTeam.targetEndDate
                    ? `Until ${commercialDetails.timelineTeam.targetEndDate}`
                    : "TBD",
                  stakeholders: approvalAuthorities.businessOwnerApprover
                    ? [session?.user?.name || "Unknown", approvalAuthorities.businessOwnerApprover]
                    : [session?.user?.name || "Unknown"],
                  approvalStages: INITIAL_APPROVAL_STAGES,
                });
                setSubmitted(true);
                setTimeout(() => router.push(`/enterprise/sow/${newId}?tab=approval`), 600);
              }}
              className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
              style={{
                padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: submitted ? 'default' : 'pointer',
                background: submitted ? 'rgba(77,87,65,0.12)' : 'linear-gradient(135deg, #A67763, #886151)',
                color: submitted ? '#344028' : '#FFFFFF',
                border: `1px solid ${submitted ? 'rgba(77,87,65,0.22)' : 'rgba(166,119,99,0.30)'}`,
                boxShadow: submitted ? 'none' : '0 1px 6px rgba(166,119,99,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onMouseEnter={(e) => { if (!submitted) { e.currentTarget.style.boxShadow = '0 3px 12px rgba(166,119,99,0.30), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { if (!submitted) { e.currentTarget.style.boxShadow = '0 1px 6px rgba(166,119,99,0.20), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; } }}
            >
              {submitted
                ? <><CheckCircle2 style={{ width: 13, height: 13 }} /> Submitted</>
                : <><Send style={{ width: 12, height: 12 }} /> Submit for Approval</>
              }
            </button>
          </div>
        </div>
      </motion.div>

    </motion.div>

    <NavigationGuardModal
      open={navGuard.showModal}
      onStay={navGuard.onStay}
      onSaveAndLeave={navGuard.onConfirmLeave}
      onDiscardAndLeave={navGuard.onConfirmLeave}
      flowLabel="the SOW Draft Review"
    />
    </>
  );
}
