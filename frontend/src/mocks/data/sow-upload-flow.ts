import type {
  ExtractionIntelligenceReport,
  ExtractionItem,
  GapItem,
  RecentUploadItem,
  CommercialDetailsForm,
  CommercialSectionKey,
  CommercialSectionStatus,
} from "@/types/enterprise";

/* ══════════════════════════════════════════════════════════════
   Mock data for Manual SOW Upload Flow (FSD 7.5–7.6.6)
   ══════════════════════════════════════════════════════════════ */

/* ── "What Happens Next?" 8-Step Guide (FSD 7.5) ── */

export const uploadFlowSteps = [
  { step: 1, label: "Upload Document", description: "Drop your SOW file" },
  { step: 2, label: "Business Owner Review", description: "Approve the scope & budget" },
  { step: 3, label: "Commercial Review", description: "Confirm commercial terms" },
  { step: 4, label: "Legal / Compliance Review", description: "Verify legal & compliance" },
  { step: 5, label: "Security Review", description: "Confirm data & access controls" },
  { step: 6, label: "Final Sign-off", description: "Approve and finalise the SOW" },
  { step: 7, label: "Decompose & Assign", description: "Break into tasks, assign a mentor" },
];

/* ── Highlights shown beside the upload form ── */

export const aiPoweredFeatures = [
  "5-stage manual approval (Business → Commercial → Legal → Security → Final)",
  "Sign each stage with your name",
  "Tracked end-to-end with an audit trail",
  "Decompose approved SOWs into assignable tasks",
];

/* ── File Validation Rules (UPL-001 through UPL-007) ── */

export const fileValidationRules = [
  { rule: "UPL-001", description: "File format must be PDF, DOCX, or DOC", errorMessage: "Unsupported file format. Please upload a PDF, DOCX, or DOC file. XLSX and other formats are not supported." },
  { rule: "UPL-002", description: "Maximum file size: 50MB", errorMessage: "File size exceeds 50MB. Please compress the document or contact support for large document processing." },
  { rule: "UPL-003", description: "File must not be password-protected", errorMessage: "This file is password-protected. Please remove password protection and re-upload." },
  { rule: "UPL-004", description: "Virus / malware scan must pass", errorMessage: "File failed security check. Please verify the file and re-upload." },
  { rule: "UPL-005", description: "Duplicate file detection within 30 days", errorMessage: "This document appears to have been uploaded previously." },
  { rule: "UPL-006", description: "Only one file per upload session", errorMessage: "Only one document per SOW. Please upload files one at a time." },
  { rule: "UPL-007", description: "Upload button requires valid file", errorMessage: "Please select a valid file before uploading." },
];

/* ── Mock Extraction Intelligence Report (FSD 7.6.1) ── */

export const mockExtractionReport: ExtractionIntelligenceReport = {
  contextDetection: {
    businessObjectives: "PRESENT",
    painPoints: "PARTIAL",
    userContext: "ABSENT",
  },
  sectionsFound: 14,
  aiConfidence: 87,
  gapScore: 72,
  ambiguities: 5,
  sensitiveDataDetected: "possible",
  sensitiveDataTypes: ["financial records", "employee PII"],
  estimatedReviewTime: "~25 minutes",
};

/* ── Mock Extraction Items (FSD 7.6.2) ── */

export const mockExtractionItems: ExtractionItem[] = [
  // Business Objectives
  { id: "ext-01", category: "business_objectives", text: "Modernize the enterprise resource planning system to reduce operational costs by 30% within 18 months of deployment.", sourcePageNumber: 3, sourceHighlight: "reduce operational costs by 30%", reviewState: "pending", confidence: 94 },
  { id: "ext-02", category: "business_objectives", text: "Enable real-time reporting and analytics for executive decision-making across all business units.", sourcePageNumber: 3, sourceHighlight: "real-time reporting and analytics", reviewState: "pending", confidence: 91 },

  // User Context
  { id: "ext-03", category: "user_context", text: "Primary users include finance controllers (200+), department managers (50+), and C-suite executives (12).", sourcePageNumber: 5, sourceHighlight: "finance controllers (200+)", reviewState: "pending", confidence: 78 },

  // Features
  { id: "ext-04", category: "features", text: "General Ledger module with multi-currency support and automated reconciliation.", sourcePageNumber: 8, sourceHighlight: "General Ledger module", reviewState: "pending", confidence: 96 },
  { id: "ext-05", category: "features", text: "Accounts Payable automation with three-way matching and approval workflows.", sourcePageNumber: 9, sourceHighlight: "Accounts Payable automation", reviewState: "pending", confidence: 93 },
  { id: "ext-06", category: "features", text: "Real-time financial dashboards with drill-down capability per business unit.", sourcePageNumber: 10, sourceHighlight: "Real-time financial dashboards", reviewState: "pending", confidence: 89 },
  { id: "ext-07", category: "features", text: "Budget planning and forecasting module with variance analysis.", sourcePageNumber: 11, sourceHighlight: "Budget planning and forecasting", reviewState: "pending", confidence: 87 },

  // Timeline
  { id: "ext-08", category: "timeline", text: "Phase 1 (Foundation): Months 1-3 — Core GL and AP modules.", sourcePageNumber: 14, sourceHighlight: "Phase 1 (Foundation): Months 1-3", reviewState: "pending", confidence: 85 },
  { id: "ext-09", category: "timeline", text: "Phase 2 (Analytics): Months 4-5 — Dashboards and reporting.", sourcePageNumber: 14, sourceHighlight: "Phase 2 (Analytics): Months 4-5", reviewState: "pending", confidence: 82 },

  // Budget
  { id: "ext-10", category: "budget", text: "Total project budget range: $280,000 – $350,000 USD.", sourcePageNumber: 16, sourceHighlight: "$280,000 – $350,000", reviewState: "pending", confidence: 90 },
  { id: "ext-11", category: "budget", text: "Payment structure: milestone-based with 30/35/35 split.", sourcePageNumber: 16, sourceHighlight: "30/35/35 split", reviewState: "pending", confidence: 88 },

  // Compliance
  { id: "ext-12", category: "compliance", text: "Must comply with SOX (Sarbanes-Oxley) requirements for financial reporting.", sourcePageNumber: 18, sourceHighlight: "SOX (Sarbanes-Oxley)", reviewState: "pending", confidence: 95 },
  { id: "ext-13", category: "compliance", text: "Data residency: All financial data must be stored within India (PDPB compliance).", sourcePageNumber: 19, sourceHighlight: "stored within India", reviewState: "pending", confidence: 92 },

  // Assumptions
  { id: "ext-14", category: "assumptions", text: "Client will provide access to existing ERP system within 2 weeks of project kick-off.", sourcePageNumber: 21, sourceHighlight: "access to existing ERP system", reviewState: "pending", confidence: 86 },
  { id: "ext-15", category: "assumptions", text: "Chart of accounts structure will be finalized by the client before development begins.", sourcePageNumber: 21, sourceHighlight: "Chart of accounts structure", reviewState: "pending", confidence: 84 },

  // Technical
  { id: "ext-16", category: "technical", text: "Technology stack: React 19 + Node.js + PostgreSQL. Deployed on AWS (ap-south-1).", sourcePageNumber: 23, sourceHighlight: "React 19 + Node.js + PostgreSQL", reviewState: "pending", confidence: 97 },
  { id: "ext-17", category: "technical", text: "Integration with SAP S/4HANA via REST APIs for master data sync.", sourcePageNumber: 24, sourceHighlight: "SAP S/4HANA via REST APIs", reviewState: "pending", confidence: 91 },

  // Risk
  { id: "ext-18", category: "risk", text: "Data migration from legacy Oracle Financials carries high risk due to 15 years of accumulated custom logic.", sourcePageNumber: 26, sourceHighlight: "legacy Oracle Financials", reviewState: "pending", confidence: 88 },
];

/* ── Mock Gap Items (FSD 7.6.3) ── */

export const mockGapItems: GapItem[] = [
  // Critical — hard block
  { id: "gap-01", severity: "critical", title: "Missing Acceptance Criteria", description: "No formal acceptance criteria defined for any deliverable. Required for evidence pack quality gates.", section: "Functional Requirements", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },
  { id: "gap-02", severity: "critical", title: "No Data Sensitivity Classification", description: "Document does not specify data sensitivity level (Public/Internal/Confidential/Restricted). Required for governance.", section: "Governance & Compliance", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },

  // Important — acknowledgement required
  { id: "gap-03", severity: "important", title: "Missing Risk Register", description: "No structured risk register with likelihood and impact ratings. Platform defaults will be applied.", section: "Risk Management", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },
  { id: "gap-04", severity: "important", title: "No Escalation Process Defined", description: "Document does not define an escalation path for unresolved issues.", section: "Governance", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },
  { id: "gap-05", severity: "important", title: "Missing Browser Compatibility Matrix", description: "No browser or device compatibility requirements specified.", section: "Quality Standards", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },

  // Optional — dismissible
  { id: "gap-06", severity: "optional", title: "No Knowledge Transfer Plan", description: "KT sessions and documentation handover not specified.", section: "Team Requirements", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },
  { id: "gap-07", severity: "optional", title: "Missing Offline Support Requirements", description: "No mention of offline or low-connectivity support.", section: "Quality Standards", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },
  { id: "gap-08", severity: "optional", title: "No Multi-Language Requirements", description: "Localisation requirements not addressed.", section: "Quality Standards", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },
  { id: "gap-09", severity: "optional", title: "Missing Post-Warranty Support Model", description: "No post-warranty support arrangement defined.", section: "Commercial & Legal", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: false },

  // Prohibited clause
  { id: "gap-10", severity: "critical", title: "Prohibited Clause Detected: Unlimited Liability", description: "Section 12.3 contains an unlimited liability clause which is prohibited on the GlimmoraTeam platform.", section: "Legal Terms", isResolved: false, isAcknowledged: false, isDismissed: false, isProhibited: true, prohibitedReason: "Unlimited liability clauses expose GlimmoraTeam to uncapped financial risk and are not permitted." },
];

/* ── Mock Pre-Populated Commercial Details (for >=85% confidence fields) ── */

export const mockPrePopulatedDetails: Partial<CommercialDetailsForm> = {
  businessContext: {
    projectVision: "Modernize enterprise resource planning to reduce operational costs by 30% and enable real-time executive reporting.",
    businessObjectives: [
      { objective: "Reduce operational costs", measurableTarget: "30% reduction", timeline: "18 months post-deployment" },
      { objective: "Enable real-time reporting", measurableTarget: "< 5 second dashboard load", timeline: "6 months" },
    ],
    painPoints: [
      { problem: "Legacy Oracle system is slow and unmaintainable", whoExperiences: "Finance team, IT operations" },
    ],
    businessCriticality: "business_important",
    currentState: "Running Oracle Financials (15 years, heavily customized). Manual reconciliation processes take 3 days per month-end close.",
    desiredFutureState: "Automated, cloud-native ERP with real-time dashboards, automated reconciliation, and sub-day month-end close.",
    endUserProfiles: [
      { roleName: "Finance Controller", count: "200+", techLiteracy: "High", primaryDevice: "Desktop" },
      { roleName: "Department Manager", count: "50+", techLiteracy: "Medium", primaryDevice: "Desktop" },
    ],
    successMetrics: [
      { metricName: "Month-end close time", baseline: "3 days", target: "< 4 hours", method: "System logs" },
    ],
    definitionOfSuccess: "All financial operations running on the new platform with zero critical defects for 30 consecutive days.",
  },
  techIntegrations: {
    technologyStack: "React 19 + Node.js + PostgreSQL. Deployed on AWS (ap-south-1).",
    scalabilityRequirements: "Support 500 concurrent users with < 500ms p95 response time.",
    thirdPartyIntegrations: [
      { name: "SAP S/4HANA", direction: "Bidirectional", protocol: "REST API" },
    ],
    userManagementScope: "SSO via Azure AD with RBAC",
    ssoRequired: true,
  },
};

/* ── Mock Pre-Populated Section Statuses ── */

export const mockPrePopulatedSectionStatus: Record<CommercialSectionKey, CommercialSectionStatus> = {
  businessContext: "pre_populated",
  deliveryScope: "not_started",
  techIntegrations: "pre_populated",
  timelineTeam: "not_started",
  budgetRisk: "not_started",
  governance: "not_started",
  commercialLegal: "not_started",
};

/* ── Recent Uploads (FSD 7.5 right panel) ── */

export const mockRecentUploads: RecentUploadItem[] = [
  { id: "sow-001", fileName: "ERP_Platform_SOW_v3.pdf", client: "Meridian Corp", fileSize: "2.4 MB", aiConfidence: 94, status: "approved", uploadedAt: "2026-03-18T10:30:00Z" },
  { id: "sow-002", fileName: "Mobile_Banking_Requirements.docx", client: "FinServe Ltd", fileSize: "1.8 MB", aiConfidence: 89, status: "approval", uploadedAt: "2026-03-15T14:20:00Z" },
  { id: "sow-004", fileName: "Healthcare_Portal_Draft.pdf", client: "MedTech Solutions", fileSize: "3.1 MB", aiConfidence: 76, status: "draft", uploadedAt: "2026-03-12T09:45:00Z" },
];

/* ── Mock Preview Quality Metrics ── */

export const mockPreviewMetrics = {
  confidence: 89,
  riskScore: 34,
  hallucinationFlags: 0,
  completeness: 92,
};

/* ══════════════════════════════════════════════
   Mock — Generated SOW Sections (10 sections)
   ══════════════════════════════════════════════ */

export const mockGeneratedSowSections: { title: string; body: string }[] = [
  {
    title: "1. Project Overview",
    body: "This Statement of Work defines the scope, deliverables, and commercial terms for the modernisation of the enterprise resource planning system. The project aims to reduce operational costs by 30% within 18 months of deployment through automated financial workflows and real-time analytics.",
  },
  {
    title: "2. Functional Requirements",
    body: "Core modules include General Ledger with multi-currency support, Accounts Payable automation with three-way matching, real-time financial dashboards, budget planning with variance analysis, and cross-entity consolidation.",
  },
  {
    title: "3. Delivery Scope",
    body: "Full-stack development including frontend, backend, and database layers. Cloud deployment on AWS (ap-south-1). Go-live support included with 30-day hypercare followed by T&M support.",
  },
  {
    title: "4. Technical Architecture",
    body: "Microservices deployed on AWS EKS with PostgreSQL (Aurora), Redis for caching, and S3 for document storage. Event-driven workflows via EventBridge. CI/CD via GitHub Actions with blue/green deployments.",
  },
  {
    title: "5. Timeline & Milestones",
    body: "M1 — Discovery & design (6 weeks). M2 — Core module build (14 weeks). M3 — Integration, UAT and hypercare (6 weeks). Total engagement: 26 weeks from kick-off.",
  },
  {
    title: "6. Team Composition",
    body: "1 Engagement Lead, 1 Solution Architect, 4 Senior Engineers, 2 QA Engineers, 1 DevOps Engineer, and 1 Business Analyst. Rate card applied per role as per Annexure A.",
  },
  {
    title: "7. Budget & Payment Terms",
    body: "Fixed price engagement at ₹2,40,00,000. Payment schedule: 35% on kick-off (M1), 35% on development completion (M2), 30% on UAT sign-off (M3). Net-15 payment terms via Razorpay.",
  },
  {
    title: "8. Governance & Compliance",
    body: "Bi-weekly steering committee meetings. Monthly executive reviews. ISO 27001 and SOC 2 Type II compliance maintained throughout. Full audit trail for every AI-assisted decision.",
  },
  {
    title: "9. Risk & Change Management",
    body: "Change requests follow a threshold-based CR process — minor changes within 5% contingency, larger changes require formal CR with impact assessment. All risks tracked in a shared RAID log.",
  },
  {
    title: "10. Commercial & Legal",
    body: "Client owns all custom IP and source code. GlimmoraTeam retains framework-level utilities under a non-exclusive license. Governing law: India. Arbitration venue: Mumbai. 90-day warranty post go-live.",
  },
];

/* ══════════════════════════════════════════════
   Mock — Risk Assessment Factors
   ══════════════════════════════════════════════ */

export const mockRiskAssessment = {
  riskLevel: "Low",
  riskScore: 22,
  factors: [
    { factor: "Completeness",   weight: "30%", score: 92 },
    { factor: "Confidence",     weight: "25%", score: 89 },
    { factor: "Compliance",     weight: "25%", score: 95 },
    { factor: "Pattern Match",  weight: "20%", score: 88 },
  ],
};

/* ══════════════════════════════════════════════
   Mock — Source Traceability
   ══════════════════════════════════════════════ */

export const mockSourceTraceability: { section: string; source: string }[] = [
  { section: "Project Overview",        source: "Extracted (p.3)" },
  { section: "Functional Requirements", source: "Extracted (p.8)" },
  { section: "Delivery Scope",          source: "Extracted (p.13)" },
  { section: "Technical Architecture",  source: "Commercial Details §3" },
  { section: "Timeline & Milestones",   source: "Commercial Details §4" },
  { section: "Team Composition",        source: "Commercial Details §4" },
  { section: "Budget & Payment Terms",  source: "Commercial Details §5" },
  { section: "Governance & Compliance", source: "Commercial Details §6" },
  { section: "Risk & Change Management",source: "Commercial Details §5" },
  { section: "Commercial & Legal",      source: "Commercial Details §7" },
];

/* ══════════════════════════════════════════════
   Mock — 8-Layer Hallucination Analysis
   ══════════════════════════════════════════════ */

export const mockGenerationHallucinationLayers = [
  { layer: 1, name: "Input Validation",    status: "passed",  details: "All 10 wizard parameters validated against schema." },
  { layer: 2, name: "Template Locking",    status: "passed",  details: "Enterprise template clauses locked — no structural deviation." },
  { layer: 3, name: "Clause Library",      status: "passed",  details: "14 clauses sourced from vetted library. 1 custom clause flagged for review." },
  { layer: 4, name: "Completeness Checks", status: "passed",  details: "All 10 required sections present and populated." },
  { layer: 5, name: "Confidence Scoring",  status: "passed",  details: "All sections above 85% threshold. Lowest: 87% (Technical Architecture)." },
  { layer: 6, name: "Pattern Matching",    status: "passed",  details: "SOW structure matches 94% of enterprise baseline patterns." },
  { layer: 7, name: "Human Approval",      status: "warning", details: "Pending human review gate before finalisation." },
  { layer: 8, name: "Audit Logging",       status: "passed",  details: "47 AI decisions logged with full provenance chain." },
];
