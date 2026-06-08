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
    businessObjectives: "ABSENT",
    painPoints: "ABSENT",
    userContext: "ABSENT",
  },
  sectionsFound: 0,
  aiConfidence: 0,
  gapScore: 0,
  ambiguities: 0,
  sensitiveDataDetected: "none",
  sensitiveDataTypes: [],
  estimatedReviewTime: "",
};

/* ── Mock Extraction Items (FSD 7.6.2) ── */

export const mockExtractionItems: ExtractionItem[] = [];

/* ── Mock Gap Items (FSD 7.6.3) ── */

export const mockGapItems: GapItem[] = [];

/* ── Mock Pre-Populated Commercial Details (for >=85% confidence fields) ── */

export const mockPrePopulatedDetails: Partial<CommercialDetailsForm> = {};

/* ── Mock Pre-Populated Section Statuses ── */

export const mockPrePopulatedSectionStatus: Record<CommercialSectionKey, CommercialSectionStatus> = {
  businessContext: "not_started",
  deliveryScope: "not_started",
  techIntegrations: "not_started",
  timelineTeam: "not_started",
  budgetRisk: "not_started",
  governance: "not_started",
  commercialLegal: "not_started",
};

/* ── Recent Uploads (FSD 7.5 right panel) ── */

export const mockRecentUploads: RecentUploadItem[] = [];

/* ── Mock Preview Quality Metrics ── */

export const mockPreviewMetrics = {
  confidence: 0,
  riskScore: 0,
  hallucinationFlags: 0,
  completeness: 0,
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
  riskScore: 0,
  factors: [] as { factor: string; weight: string; score: number }[],
};

/* ══════════════════════════════════════════════
   Mock — Source Traceability
   ══════════════════════════════════════════════ */

export const mockSourceTraceability: { section: string; source: string }[] = [];

/* ══════════════════════════════════════════════
   Mock — 8-Layer Hallucination Analysis
   ══════════════════════════════════════════════ */

export const mockGenerationHallucinationLayers = [];
