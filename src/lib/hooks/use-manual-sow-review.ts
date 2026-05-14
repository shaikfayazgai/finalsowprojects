"use client";

import * as React from "react";
import { useManualSOW, useSOWPreview, useHallucinationLayers, useSOWSections } from "./use-manual-sow";
import {
  mapSowResponseToMetricsAndSections,
  mapManualRiskFromSow,
  mapHallucinationAnalysisResponse,
  mapSowSectionsResponse,
} from "@/components/enterprise/sow/SowReviewPanel/mappers";
import type { SowReviewData } from "@/components/enterprise/sow/SowReviewPanel/types";

const EMPTY_METRICS = { confidence: 0, riskScore: 0, hallucinationFlags: 0, completeness: 0 };
const EMPTY_RISK    = { riskLevel: "", riskScore: 0, factors: [] };

export function useManualSowReview(sowId: string | null): SowReviewData {
  const manualSowQuery       = useManualSOW(sowId);
  const manualPreviewQuery   = useSOWPreview(sowId);
  const hallucinationQuery   = useHallucinationLayers(sowId);
  const sectionsQuery        = useSOWSections(sowId);

  const fetchedReview = React.useMemo(() => {
    const source = manualPreviewQuery.data ?? manualSowQuery.data;
    return source ? mapSowResponseToMetricsAndSections(source) : null;
  }, [manualPreviewQuery.data, manualSowQuery.data]);

  const riskData = React.useMemo(() => {
    const mapped = mapManualRiskFromSow(manualSowQuery.data);
    return mapped
      ? { ...EMPTY_RISK, ...mapped }
      : EMPTY_RISK;
  }, [manualSowQuery.data]);

  const hallucinationLayers = React.useMemo(
    () => mapHallucinationAnalysisResponse(hallucinationQuery.data) ?? [],
    [hallucinationQuery.data],
  );

  const sections = React.useMemo(() => {
    const fromSections = mapSowSectionsResponse(sectionsQuery.data);
    if (fromSections.length > 0) return fromSections;
    return fetchedReview?.sections ?? [];
  }, [sectionsQuery.data, fetchedReview]);

  const metrics = React.useMemo<typeof EMPTY_METRICS>(() => ({
    ...EMPTY_METRICS,
    ...(fetchedReview?.metrics ?? {}),
    // surface the risk score from the dedicated risk object if available
    ...(riskData.riskScore ? { riskScore: riskData.riskScore } : {}),
  }), [fetchedReview, riskData]);

  return {
    sections,
    metrics,
    riskData,
    hallucinationLayers,
    traceability: [],
    sectionsLoading: sectionsQuery.isLoading && manualPreviewQuery.isLoading,
    riskLoading:    manualSowQuery.isLoading,
    isLoading:      manualSowQuery.isLoading && manualPreviewQuery.isLoading,
  };
}
