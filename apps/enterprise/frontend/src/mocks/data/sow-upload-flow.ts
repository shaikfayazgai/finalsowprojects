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

export const uploadFlowSteps = [];

/* ── AI-Powered Features Info (FSD 7.5) ── */

export const aiPoweredFeatures = [];

/* ── File Validation Rules (UPL-001 through UPL-007) ── */

export const fileValidationRules = [];

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

export const mockExtractionItems: ExtractionItem[] = [];

/* ── Mock Gap Items (FSD 7.6.3) ── */

export const mockGapItems: GapItem[] = [];

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

export const mockRecentUploads: RecentUploadItem[] = [];

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

export const mockGeneratedSowSections: { title: string; body: string }[] = [];

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

export const mockSourceTraceability: { section: string; source: string }[] = [];

/* ══════════════════════════════════════════════
   Mock — 8-Layer Hallucination Analysis
   ══════════════════════════════════════════════ */

export const mockGenerationHallucinationLayers = [];
