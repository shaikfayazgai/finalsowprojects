export interface SowReviewMetrics {
  confidence: number;
  riskScore: number;
  hallucinationFlags: number;
  completeness: number;
}

export interface SowReviewSection {
  title: string;
  body: string;
}

export interface SowRiskFactor {
  factor: string;
  weight: string;
  score: number;
}

export interface SowRiskData {
  riskLevel: string;
  riskScore: number;
  factors: SowRiskFactor[];
}

export interface SowHallucinationLayer {
  layer?: number | string;
  name?: string;
  status?: string;
  details?: string;
}

export interface SowTraceability {
  section: string;
  source: string;
}

/** Unified data shape returned by both useManualSowReview and useAiSowReview */
export interface SowReviewData {
  sections: SowReviewSection[];
  metrics: SowReviewMetrics;
  riskData: SowRiskData;
  hallucinationLayers: SowHallucinationLayer[];
  traceability: SowTraceability[];
  sectionsLoading: boolean;
  riskLoading: boolean;
  isLoading: boolean;
}
