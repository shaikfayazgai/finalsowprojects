"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, AlertTriangle } from "lucide-react";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { SectionNavigator } from "@/components/enterprise/sow/SectionNavigator";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import type { CommercialSectionKey } from "@/types/enterprise";
import {
  useCommercialDetails,
  useSaveCommercialSection,
  useValidateCommercialSection,
  useMarkSectionComplete,
  useSetApprovalAuthorities,
} from "@/lib/hooks/use-manual-sow";

/* ── Section content components ── */

import { Section1BusinessContext } from "./components/Section1BusinessContext";
import { Section2DeliveryScope } from "./components/Section2DeliveryScope";
import { Section3TechIntegrations } from "./components/Section3TechIntegrations";
import { Section4TimelineTeam } from "./components/Section4TimelineTeam";
import { Section5BudgetRisk } from "./components/Section5BudgetRisk";
import { Section6GovernanceCompliance } from "./components/Section6GovernanceCompliance";
import { Section7CommercialLegal } from "./components/Section7CommercialLegal";

const SECTION_COMPONENTS: Record<CommercialSectionKey, React.ComponentType<{ onComplete: () => void; onBack?: () => void }>> = {
  businessContext: Section1BusinessContext,
  deliveryScope: Section2DeliveryScope,
  techIntegrations: Section3TechIntegrations,
  timelineTeam: Section4TimelineTeam,
  budgetRisk: Section5BudgetRisk,
  governance: Section6GovernanceCompliance,
  commercialLegal: Section7CommercialLegal,
};

const SECTION_ORDER: CommercialSectionKey[] = [
  "businessContext", "deliveryScope", "techIntegrations", "timelineTeam",
  "budgetRisk", "governance", "commercialLegal",
];

/* ═══ PAGE ═══ */

export default function CommercialDetailsPage() {
  const router = useRouter();
  const store = useSOWUploadStore();
  const sowId = store.uploadedSowId;
  const { data: commercialRes } = useCommercialDetails(sowId);
  const saveSection = useSaveCommercialSection(sowId);
  const validateSection = useValidateCommercialSection(sowId);
  const markSectionComplete = useMarkSectionComplete(sowId);
  const setApprovalAuthorities = useSetApprovalAuthorities(sowId);

  const activeSection = store.activeCommercialSection;
  const setActiveSection = store.setActiveCommercialSection;
  /* Initialize with API data on first visit */
  const [dataLoadError, setDataLoadError] = React.useState<string>("");
  React.useEffect(() => {
    if (store.commercialSectionStatus.businessContext === "not_started") {
      const res = commercialRes as unknown as Record<string, unknown> | null | undefined;
      const payload = (res?.data !== undefined && res?.data !== null ? res.data : res) as Record<string, unknown> | null;
      // API may nest details under .details, .commercial_details, .sections, or directly
      const apiDetails = (
        payload?.details ?? payload?.commercial_details ?? payload?.sections ?? payload
      ) as Record<string, unknown> | null;

      // Check if it has at least one section key
      const hasApiData = apiDetails && SECTION_ORDER.some((k) => {
        const snakeKey = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        return apiDetails[k] || apiDetails[snakeKey];
      });

      if (hasApiData && apiDetails) {
        /* Merge API sections into the store */
        SECTION_ORDER.forEach((key) => {
          const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
          const sectionData = apiDetails[key] ?? apiDetails[snakeKey];
          if (sectionData && typeof sectionData === "object") {
            store.updateCommercialSection(key, sectionData as never);
            store.markSectionInProgress(key);
          }
        });
        setDataLoadError("");
      } else {
        /* Show error message instead of falling back to mocks */
        setDataLoadError("Unable to load details. Please try refreshing the page or contact support if the problem persists.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!commercialRes]);

  /* Auto-save every 30 seconds */
  React.useEffect(() => {
    const interval = setInterval(() => {
      store.setLastAutoSaved(new Date().toISOString());
    }, 30000);
    return () => clearInterval(interval);
  }, [store]);

  const handleSectionClick = (key: CommercialSectionKey) => {
    setActiveSection(key);
  };

  const handleSectionBack = () => {
    const idx = SECTION_ORDER.indexOf(activeSection);
    if (idx > 0) {
      setActiveSection(SECTION_ORDER[idx - 1]);
    }
  };

  const handleSectionComplete = () => {
    store.markSectionComplete(activeSection);

    /* Persist section data to API */
    if (sowId) {
      const sectionData = store.commercialDetails[activeSection];
      if (sectionData && typeof sectionData === "object") {
        saveSection.mutate({ section: activeSection, data: sectionData as unknown as Record<string, unknown> });
      }
      validateSection.mutate(activeSection);
      markSectionComplete.mutate(activeSection);
    }

    const idx = SECTION_ORDER.indexOf(activeSection);
    if (idx < SECTION_ORDER.length - 1) {
      setActiveSection(SECTION_ORDER[idx + 1]);
    }
  };

  const allComplete = SECTION_ORDER.every((k) => store.commercialSectionStatus[k] === "complete");
  const completedCount = SECTION_ORDER.filter((k) => store.commercialSectionStatus[k] === "complete").length;

  const handleGenerate = () => {
    store.markSectionComplete("commercialLegal");

    /* Persist commercialLegal section + approval authorities to API */
    if (sowId) {
      const sectionData = store.commercialDetails.commercialLegal;
      if (sectionData && typeof sectionData === "object") {
        saveSection.mutate({ section: "commercialLegal", data: sectionData as unknown as Record<string, unknown> });
      }
      validateSection.mutate("commercialLegal");
      markSectionComplete.mutate("commercialLegal");

      const auth = store.approvalAuthorities;
      setApprovalAuthorities.mutate({
        business_owner_approver: auth.businessOwnerApprover,
        final_approver: auth.finalApprover,
        ...(auth.sowSubmitter ? { legal_compliance_reviewer: auth.sowSubmitter } : {}),
      });
    }

    store.setFlowStep(6);
    router.push("/enterprise/sow/upload/generate");
  };

  const ActiveSectionComponent = SECTION_COMPONENTS[activeSection];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Flow step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={5} />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Commercial & Project Details</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Complete all 7 sections to generate your final SOW document. Fields pre-populated by AI are marked.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {store.lastAutoSaved && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Save className="w-3 h-3" /> Saved {new Date(store.lastAutoSaved).toLocaleTimeString()}
            </span>
          )}
          <span className="text-[11px] font-medium text-gray-500">{completedCount}/7 complete</span>
        </div>
      </motion.div>

      {/* Error banner */}
      {dataLoadError && (
        <motion.div variants={fadeUp} className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-amber-900">Unable to load document details</p>
              <p className="text-[12px] text-amber-700 mt-1">{dataLoadError}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Two-column layout */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Left: Section Navigator */}
        <SectionNavigator
          activeSection={activeSection}
          sectionStatus={store.commercialSectionStatus}
          onSectionClick={handleSectionClick}
          className="lg:sticky lg:top-24 lg:self-start"
        />

        {/* Right: Section Content */}
        <div className="card-parchment overflow-hidden">
          <ActiveSectionComponent
            onComplete={activeSection === "commercialLegal" ? handleGenerate : handleSectionComplete}
            onBack={
              SECTION_ORDER.indexOf(activeSection) > 0
                ? handleSectionBack
                : () => router.push("/enterprise/sow/upload/gaps")
            }
          />
        </div>
      </motion.div>

    </motion.div>
  );
}
