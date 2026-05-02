"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, AlertTriangle } from "lucide-react";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { SectionNavigator } from "@/components/enterprise/sow/SectionNavigator";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import type { CommercialSectionKey } from "@/types/enterprise";
import { validateSection as validateSectionData } from "@/lib/validations/sow-upload-details";
import {
  useSaveCommercialSection,
  useValidateCommercialSection,
  useMarkSectionComplete,
  useSetApprovalAuthorities,
  useGenerateManualSOW,
} from "@/lib/hooks/use-manual-sow";

/* ── Section content components ── */

import { Section1BusinessContext } from "./components/Section1BusinessContext";
import { Section2DeliveryScope } from "./components/Section2DeliveryScope";
import { Section3TechIntegrations } from "./components/Section3TechIntegrations";
import { Section4TimelineTeam } from "./components/Section4TimelineTeam";
import { Section5BudgetRisk } from "./components/Section5BudgetRisk";
import { Section6GovernanceCompliance } from "./components/Section6GovernanceCompliance";
import { Section7CommercialLegal } from "./components/Section7CommercialLegal";

const SECTION_COMPONENTS: Record<CommercialSectionKey, React.ComponentType<{ onComplete: () => void; onBack?: () => void; loading?: boolean }>> = {
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

/* ── Normalize section data before sending to the API ── */
function toISO(d: unknown): unknown {
  if (typeof d === "string" && d && !d.includes("T")) return `${d}T00:00:00Z`;
  return d;
}

function boolToYesNo(v: unknown): "yes" | "no" {
  if (v === "yes" || v === true) return "yes";
  return "no";
}

function allowedOrUndefined(v: unknown, allowed: string[]): string | undefined {
  const s = String(v ?? "");
  return allowed.includes(s) ? s : undefined;
}

function normalizeSectionData(
  section: CommercialSectionKey,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (section === "timelineTeam") {
    return {
      ...data,
      startDate: toISO(data.startDate),
      targetEndDate: toISO(data.targetEndDate),
      uatSignOffConfirmed: Boolean(data.uatSignOffConfirmed),
    };
  }
  if (section === "governance") {
    return {
      ...data,
      nonDiscriminationConfirmed: data.nonDiscriminationConfirmed === true,
      dataSensitivityLevel: data.dataSensitivityLevel ?? "",
      personalDataInvolved: data.personalDataInvolved === true ? "yes" : (data.personalDataInvolved ?? ""),
    };
  }
  if (section === "commercialLegal") {
    return {
      ...data,
      ipOwnership:           allowedOrUndefined(data.ipOwnership,           ["client_owns_all", "glimmora_retains_framework", "joint", "custom"]),
      sourceCodeOwnership:   allowedOrUndefined(data.sourceCodeOwnership,   ["client_hosts", "glimmora_hosts_transfer", "client_provides_day_one"]),
      thirdPartyCosts:       allowedOrUndefined(data.thirdPartyCosts,       ["client_pays", "glimmora_absorbs", "split"]),
      changeRequestProcess:  allowedOrUndefined(data.changeRequestProcess,  ["formal_cr", "threshold_cr", "time_and_materials"]),
    };
  }
  if (section === "budgetRisk") {
    return {
      ...data,
      budgetMinimum: Number(data.budgetMinimum) || 0,
      budgetMaximum: Number(data.budgetMaximum) || 0,
    };
  }
  return data;
}

/* ═══ PAGE ═══ */

export default function CommercialDetailsPage() {
  const router = useRouter();
  const store = useSOWUploadStore();
  const sowId = store.uploadedSowId;
  const saveSection = useSaveCommercialSection(sowId);
  const validateSection = useValidateCommercialSection(sowId);
  const markSectionComplete = useMarkSectionComplete(sowId);
  const setApprovalAuthorities = useSetApprovalAuthorities(sowId);
  const generateSOW = useGenerateManualSOW(sowId);

  const activeSection = store.activeCommercialSection;
  const setActiveSection = store.setActiveCommercialSection;

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
      const raw = store.commercialDetails[activeSection] as unknown as Record<string, unknown>;
      const sectionData = normalizeSectionData(activeSection, raw);
      saveSection.mutate({ section: activeSection, data: sectionData });
      validateSection.mutate({ section: activeSection, data: sectionData });
      markSectionComplete.mutate(activeSection);
    }

    const idx = SECTION_ORDER.indexOf(activeSection);
    if (idx < SECTION_ORDER.length - 1) {
      setActiveSection(SECTION_ORDER[idx + 1]);
    }
  };

  const completedCount = SECTION_ORDER.filter((k) => store.commercialSectionStatus[k] === "complete").length;

  const [generateError, setGenerateError] = React.useState<string>("");

  const handleGenerate = async () => {
    store.markSectionComplete("commercialLegal");

    if (sowId) {
      const rawLegal = store.commercialDetails.commercialLegal as unknown as Record<string, unknown>;
      const sectionData = normalizeSectionData("commercialLegal", rawLegal);

      // Validate all locally-complete sections before touching the backend.
      // The user may have navigated back and edited a section without re-completing it,
      // leaving invalid data in the store while the section remains "complete" locally.
      const completedSections = SECTION_ORDER.filter(
        (k) => k !== "commercialLegal" && store.commercialSectionStatus[k] === "complete",
      );
      for (const k of completedSections) {
        const raw = store.commercialDetails[k] as unknown as Record<string, unknown>;
        const errs = validateSectionData(k, raw);
        if (Object.keys(errs).length > 0) {
          const sectionLabel: Record<CommercialSectionKey, string> = {
            businessContext: "Business Context",
            deliveryScope: "Delivery Scope",
            techIntegrations: "Tech & Integrations",
            timelineTeam: "Timeline & Team",
            budgetRisk: "Budget & Risk",
            governance: "Governance & Compliance",
            commercialLegal: "Commercial & Legal",
          };
          setGenerateError(
            `Section "${sectionLabel[k]}" has incomplete or invalid data. Please go back and correct it before generating.`,
          );
          store.markSectionInProgress(k);
          setActiveSection(k);
          return;
        }
      }

      // Re-save and re-mark all completed sections to recover from any silent
      // failures during the section-by-section flow.
      for (const k of completedSections) {
        try {
          const raw = store.commercialDetails[k] as unknown as Record<string, unknown>;
          const data = normalizeSectionData(k, raw);
          await saveSection.mutateAsync({ section: k, data });
          await markSectionComplete.mutateAsync(k);
        } catch {
          // Non-fatal per section — backend may already have it marked.
        }
      }

      // Save and mark the last section complete.
      try {
        await saveSection.mutateAsync({ section: "commercialLegal", data: sectionData });
        await markSectionComplete.mutateAsync("commercialLegal");
      } catch {
        setGenerateError("Failed to save section. Please try again.");
        return;
      }

      validateSection.mutate({ section: "commercialLegal", data: sectionData });

      const auth = store.approvalAuthorities;
      try {
        await setApprovalAuthorities.mutateAsync({
          business_owner_approver: auth.businessOwnerApprover,
          final_approver: auth.finalApprover,
          ...(auth.legalComplianceReviewer ? { legal_compliance_reviewer: auth.legalComplianceReviewer } : {}),
          ...(auth.sowSubmitter ? { sow_submitter: auth.sowSubmitter } : {}),
        });
      } catch {
        setGenerateError("Failed to set approval authorities. Please try again.");
        return;
      }

      try {
        await generateSOW.mutateAsync();
      } catch {
        setGenerateError("Failed to generate SOW. Please try again.");
        return;
      }
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
      {generateError && (
        <motion.div variants={fadeUp} className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-red-900">Generation failed</p>
              <p className="text-[12px] text-red-700 mt-1">{generateError}</p>
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
            {...(activeSection === "commercialLegal" ? { loading: generateSOW.isPending } : {})}
          />
        </div>
      </motion.div>

    </motion.div>
  );
}
