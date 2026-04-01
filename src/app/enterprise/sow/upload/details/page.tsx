"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Save } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { SectionNavigator } from "@/components/enterprise/sow/SectionNavigator";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import type { CommercialSectionKey } from "@/types/enterprise";
import { mockPrePopulatedDetails, mockPrePopulatedSectionStatus } from "@/mocks/data/sow-upload-flow";

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

  const [activeSection, setActiveSection] = React.useState<CommercialSectionKey>("businessContext");
  /* Initialize with pre-populated data on first visit */
  React.useEffect(() => {
    if (store.commercialSectionStatus.businessContext === "not_started") {
      /* Apply mock pre-populated data */
      if (mockPrePopulatedDetails.businessContext) {
        store.updateCommercialSection("businessContext", mockPrePopulatedDetails.businessContext);
      }
      if (mockPrePopulatedDetails.techIntegrations) {
        store.updateCommercialSection("techIntegrations", mockPrePopulatedDetails.techIntegrations);
      }
      /* Set section statuses */
      Object.entries(mockPrePopulatedSectionStatus).forEach(([key, status]) => {
        if (status === "pre_populated") {
          store.markSectionInProgress(key as CommercialSectionKey);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const idx = SECTION_ORDER.indexOf(activeSection);
    if (idx < SECTION_ORDER.length - 1) {
      setActiveSection(SECTION_ORDER[idx + 1]);
    }
  };

  const allComplete = SECTION_ORDER.every((k) => store.commercialSectionStatus[k] === "complete");
  const completedCount = SECTION_ORDER.filter((k) => store.commercialSectionStatus[k] === "complete").length;

  const handleGenerate = () => {
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
            onComplete={handleSectionComplete}
            onBack={
              SECTION_ORDER.indexOf(activeSection) > 0
                ? handleSectionBack
                : () => router.push("/enterprise/sow/upload/gaps")
            }
          />
        </div>
      </motion.div>

      {/* Bottom action bar — Generate only (back is handled per-section) */}
      <motion.div variants={fadeUp} className="flex items-center justify-end mt-8 pt-6" style={{ borderTop: "1px solid var(--border-soft)" }}>
        <button onClick={handleGenerate} disabled={!allComplete}
          className={cn(
            "flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all",
            allComplete
              ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
              : "text-gray-400 bg-gray-100 cursor-not-allowed"
          )}>
          Generate Final SOW <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
