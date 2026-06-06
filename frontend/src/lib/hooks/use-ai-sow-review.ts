"use client";

import * as React from "react";
import { useSow, useHallucinationAnalysis, useRiskAssessment } from "./use-sow-wizard";
import {
  mapSowResponseToMetricsAndSections,
  mapRiskAssessmentResponse,
  mapHallucinationAnalysisResponse,
} from "@/components/enterprise/sow/SowReviewPanel/mappers";
import type { SowReviewData } from "@/components/enterprise/sow/SowReviewPanel/types";

const EMPTY_METRICS = { confidence: 0, riskScore: 0, hallucinationFlags: 0, completeness: 0 };
const EMPTY_RISK    = { riskLevel: "", riskScore: 0, factors: [] };

export function useAiSowReview(sowId: string | null): SowReviewData {
  const sowQuery            = useSow(sowId);
  const hallucinationQuery  = useHallucinationAnalysis(sowId);
  const riskQuery           = useRiskAssessment(sowId);

  const fetchedReview = React.useMemo(
    () => (sowQuery.data ? mapSowResponseToMetricsAndSections(sowQuery.data) : null),
    [sowQuery.data],
  );

  const riskData = React.useMemo(() => {
    const mapped = riskQuery.data ? mapRiskAssessmentResponse(riskQuery.data) : null;
    return mapped ? { ...EMPTY_RISK, ...mapped } : EMPTY_RISK;
  }, [riskQuery.data]);

  const hallucinationLayers = React.useMemo(
    () => mapHallucinationAnalysisResponse(hallucinationQuery.data) ?? [],
    [hallucinationQuery.data],
  );

  const metrics = React.useMemo<typeof EMPTY_METRICS>(() => ({
    ...EMPTY_METRICS,
    ...(fetchedReview?.metrics ?? {}),
    ...(riskData.riskScore ? { riskScore: riskData.riskScore } : {}),
  }), [fetchedReview, riskData]);

  return {
    sections:          fetchedReview?.sections ?? [],
    metrics,
    riskData,
    hallucinationLayers,
    traceability:      [],
    sectionsLoading:   sowQuery.isLoading,
    riskLoading:       riskQuery.isLoading,
    isLoading:         sowQuery.isLoading,
  };
}
