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
  { step: 1, label: "Upload Document", description: "Drop your SOW file for AI processing" },
  { step: 2, label: "AI Parsing", description: "OCR, NLP, and section detection" },
  { step: 3, label: "Review Extractions", description: "Verify AI-extracted clauses and sections" },
  { step: 4, label: "Resolve Gaps", description: "Address missing or ambiguous sections" },
  { step: 5, label: "Commercial & Project Details", description: "Declare budget, timeline, governance" },
  { step: 6, label: "Generate Final SOW", description: "Platform assembles structured SOW" },
  { step: 7, label: "Preview & Confirm", description: "Review quality metrics and submit" },
  { step: 8, label: "5-Stage Approval Pipeline", description: "Business → Commercial → Legal → Security → Final" },
];

/* ── AI-Powered Features Info (FSD 7.5) ── */

export const aiPoweredFeatures = [
  "Smart section detection with 94%+ accuracy",
  "Automated risk & ambiguity flagging",
  "Business context gap detection",
  "8-layer hallucination prevention",
  "Prohibited clause identification",
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
