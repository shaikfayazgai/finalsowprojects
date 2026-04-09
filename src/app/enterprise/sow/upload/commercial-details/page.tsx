"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Sparkles,
  Target,
  Layers,
  Server,
  Calendar,
  DollarSign,
  Shield,
  FileSignature,
  ChevronRight,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button, Input, Textarea, Label, ScrollArea } from "@/components/ui";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useCommercialDetails, useSaveCommercialSection } from "@/lib/hooks/use-manual-sow";

/* ────────────────────────────────────────────────────────────
   Section definitions
   ──────────────────────────────────────────────────────────── */
interface WizardSection {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  aiConfidence: number;
  isComplete: boolean;
}

const SECTIONS: WizardSection[] = [
  {
    id: "business-context",
    label: "Business Context & Vision (Part A)",
    shortLabel: "Business Context",
    icon: Target,
    aiConfidence: 94,
    isComplete: false,
  },
  {
    id: "delivery-scope",
    label: "Delivery Scope Boundary",
    shortLabel: "Delivery Scope",
    icon: Layers,
    aiConfidence: 91,
    isComplete: false,
  },
  {
    id: "technical-architecture",
    label: "Technical Architecture & Integrations",
    shortLabel: "Architecture",
    icon: Server,
    aiConfidence: 88,
    isComplete: false,
  },
  {
    id: "timeline-team",
    label: "Timeline, Team & Testing",
    shortLabel: "Timeline & Team",
    icon: Calendar,
    aiConfidence: 86,
    isComplete: false,
  },
  {
    id: "budget-risk",
    label: "Budget & Risk",
    shortLabel: "Budget & Risk",
    icon: DollarSign,
    aiConfidence: 92,
    isComplete: false,
  },
  {
    id: "governance-compliance",
    label: "Governance & Compliance",
    shortLabel: "Governance",
    icon: Shield,
    aiConfidence: 89,
    isComplete: false,
  },
  {
    id: "commercial-legal",
    label: "Commercial & Legal",
    shortLabel: "Commercial",
    icon: FileSignature,
    aiConfidence: 85,
    isComplete: false,
  },
];

/* ────────────────────────────────────────────────────────────
   Section → API key mapping
   ──────────────────────────────────────────────────────────── */
const SECTION_API_KEY: Record<string, string> = {
  "business-context": "businessContext",
  "delivery-scope": "deliveryScope",
  "technical-architecture": "techIntegrations",
  "timeline-team": "timelineTeam",
  "budget-risk": "budgetRisk",
  "governance-compliance": "governance",
  "commercial-legal": "commercialLegal",
};

/** Convert snake_case or kebab-case key to camelCase */
function toCamel(k: string): string {
  return k.replace(/[_-]([a-z])/g, (_, c) => c.toUpperCase());
}

/** Try multiple key names, return first non-null value */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return undefined;
}

function mapApiToFormData(payload: Record<string, unknown>): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  /* ── Business Context — explicit + generic pass ── */
  const bc = pick(payload, "businessContext", "business_context") as Record<string, unknown> | undefined;
  if (bc) {
    const fields: Record<string, string> = {};

    // Explicit string fields (many key variants)
    const strField = (formKey: string, ...apiKeys: string[]) => {
      const v = pick(bc, ...apiKeys);
      if (v != null && !Array.isArray(v) && typeof v !== "object") fields[formKey] = String(v);
    };
    strField("projectVision", "project_vision", "projectVision", "vision", "project_vision_statement");
    strField("businessCriticality", "business_criticality", "businessCriticality", "criticality", "priority");
    strField("currentState", "current_state", "currentState", "current_situation", "as_is");
    strField("desiredFutureState", "desired_future_state", "desiredFutureState", "future_state", "target_state", "to_be");
    strField("projectSuccessDefinition", "definitionOfSuccess", "definition_of_success", "project_success_definition", "projectSuccessDefinition", "success_definition", "definition_of_done");

    // Array fields → numbered form keys
    const arrField = (formBase: string, ...apiKeys: string[]) => {
      const v = pick(bc, ...apiKeys);
      if (Array.isArray(v)) v.forEach((item, i) => { fields[`${formBase}${i + 1}`] = String(item ?? ""); });
    };
    arrField("businessObjective", "business_objectives", "businessObjectives", "objectives", "keyObjectives", "key_objectives");
    arrField("painPoint", "pain_points", "painPoints", "challenges", "problems", "painPoints");
    arrField("endUserProfile", "end_user_profiles", "endUserProfiles", "user_profiles", "userProfiles", "users", "stakeholders");
    arrField("successMetric", "success_metrics", "successMetrics", "kpis", "key_metrics", "metrics", "successCriteria", "success_criteria");

    // Known API aliases that were already mapped to a different form key above —
    // skip so the generic pass doesn't create orphan entries under the wrong name.
    const ALIASED = new Set(["definitionOfSuccess", "definition_of_success",
      "keyObjectives", "key_objectives", "problems", "stakeholders",
      "successCriteria", "success_criteria", "metrics"]);

    // Generic pass — catches flat numbered keys (businessObjective1, painPoint1…)
    // and any other fields the API returns that weren't explicitly handled above
    for (const [k, v] of Object.entries(bc)) {
      const camel = toCamel(k);
      if (ALIASED.has(k) || ALIASED.has(camel)) continue;
      if (fields[camel] != null || fields[k] != null) continue; // already mapped
      if (Array.isArray(v)) {
        v.forEach((item, i) => { fields[`${camel}${i + 1}`] = String(item ?? ""); });
      } else if (v != null && typeof v !== "object") {
        fields[camel] = String(v);
      }
    }

    if (Object.keys(fields).length > 0) result["business-context"] = fields;
  }

  /* ── Other sections — generic flat mapping ── */
  const flatSection = (apiKey: string, formId: string) => {
    const snakeKey = apiKey.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
    const sec = (payload[apiKey] ?? payload[snakeKey]) as Record<string, unknown> | undefined;
    if (!sec || typeof sec !== "object") return;
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(sec)) {
      const camel = toCamel(k);
      if (Array.isArray(v)) { v.forEach((item, i) => { fields[`${camel}${i + 1}`] = String(item ?? ""); }); }
      else if (v != null && typeof v !== "object") { fields[camel] = String(v); }
    }
    if (Object.keys(fields).length > 0) result[formId] = fields;
  };
  flatSection("deliveryScope", "delivery-scope");
  flatSection("techIntegrations", "technical-architecture");
  flatSection("timelineTeam", "timeline-team");
  flatSection("budgetRisk", "budget-risk");
  flatSection("governance", "governance-compliance");
  flatSection("commercialLegal", "commercial-legal");

  return result;
}

/* ────────────────────────────────────────────────────────────
   Default form data (fallback when API has no data)
   ──────────────────────────────────────────────────────────── */
const PREPOPULATED_DATA: Record<string, Record<string, string>> = {
  "business-context": {
    projectVision:
      "Build a digital-first customer onboarding platform that reduces manual processing by 40% and improves customer satisfaction scores by 25% within the first year of deployment.",
    businessObjective1:
      "Reduce customer onboarding time from 14 days to under 3 days through digital workflow automation.",
    businessObjective2:
      "Achieve 40% reduction in manual data entry across all departments by Q4 2026.",
    businessObjective3:
      "Integrate with existing SAP ERP system and Salesforce CRM for unified data flow.",
    painPoint1:
      "Current paper-based onboarding process leads to 30% error rate and frequent customer complaints.",
    painPoint2:
      "Siloed data across 3 legacy systems causes duplicate entries and reconciliation overhead.",
    businessCriticality: "High",
    currentState:
      "Manual, paper-based workflows with fragmented data stored across SAP, Salesforce, and a legacy in-house portal built in 2012.",
    desiredFutureState:
      "Unified digital platform with automated workflows, real-time data sync, and self-service capabilities for both internal teams and external customers.",
    endUserProfile1:
      "Operations managers (50+ users) - primary workflow configurators and approval chain managers.",
    endUserProfile2:
      "Field technicians (200+ users) - mobile-first users accessing forms and checklists on-site.",
    endUserProfile3:
      "Executive leadership - dashboard consumers tracking KPIs and operational metrics.",
    successMetric1: "Onboarding cycle time reduced from 14 days to < 3 days",
    successMetric2: "Manual data entry reduced by 40%",
    successMetric3: "Customer satisfaction (NPS) improved by 25 points",
    projectSuccessDefinition:
      "Successful go-live with 80% user adoption within 60 days, meeting all performance SLAs and passing UAT sign-off from all stakeholder groups.",
  },
};

/* ────────────────────────────────────────────────────────────
   Progress circle component
   ──────────────────────────────────────────────────────────── */
function ProgressCircle({
  step,
  state,
}: {
  step: number;
  state: "completed" | "active" | "upcoming";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all",
          state === "completed" &&
            "bg-gradient-to-br from-forest-500 to-teal-500 text-white",
          state === "active" &&
            "bg-gradient-to-br from-brown-600 to-brown-700 text-white ring-4 ring-brown-100",
          state === "upcoming" && "bg-beige-200 text-beige-500"
        )}
      >
        {state === "completed" ? (
          <CheckCircle2 className="w-4.5 h-4.5" />
        ) : (
          step
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page component
   ──────────────────────────────────────────────────────────── */
export default function CommercialDetailsPage() {
  const store = useSOWUploadStore();
  const sowId = store.uploadedSowId;
  const { data: detailsRes } = useCommercialDetails(sowId);
  const saveMutation = useSaveCommercialSection(sowId);

  const [activeSection, setActiveSection] = React.useState(0);
  const [completedSections, setCompletedSections] = React.useState<Set<number>>(new Set());
  const [formData, setFormData] = React.useState<Record<string, Record<string, string>>>(
    PREPOPULATED_DATA
  );

  /* Populate form from API response */
  React.useEffect(() => {
    if (!detailsRes) return;
    const res = detailsRes as unknown as Record<string, unknown>;
    // Handle { success, data: {...} } wrapper or bare payload
    const inner = res.data as Record<string, unknown> | null;
    const payload = (inner && typeof inner === "object" ? inner : res) as Record<string, unknown>;
    if (process.env.NODE_ENV === "development") {
      console.log("[commercial-details] API payload:", JSON.stringify(payload, null, 2));
    }
    const mapped = mapApiToFormData(payload);
    if (Object.keys(mapped).length > 0) {
      setFormData((prev) => ({ ...prev, ...mapped }));
    }
  }, [detailsRes]);

  const currentSection = SECTIONS[activeSection];
  const isPrePopulated = currentSection.aiConfidence >= 85;

  const markComplete = (idx: number) => {
    setCompletedSections((prev) => new Set([...prev, idx]));
    /* Save section to API */
    if (sowId) {
      const sec = SECTIONS[idx];
      const apiKey = SECTION_API_KEY[sec.id];
      if (apiKey) saveMutation.mutate({ section: apiKey, data: formData[sec.id] ?? {} });
    }
  };

  const goToNext = () => {
    markComplete(activeSection);
    if (activeSection < SECTIONS.length - 1) {
      setActiveSection(activeSection + 1);
    }
  };

  const allSectionsComplete = completedSections.size === SECTIONS.length;

  const getFieldValue = (field: string) => {
    return formData[currentSection.id]?.[field] || "";
  };

  const setFieldValue = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [currentSection.id]: {
        ...(prev[currentSection.id] || {}),
        [field]: value,
      },
    }));
  };

  /* ── Flow progress steps ── */
  const flowSteps = [
    { label: "Upload", completed: true },
    { label: "Extract", completed: true },
    { label: "Gap Analysis", completed: true },
    { label: "Details", active: true },
    { label: "Preview", upcoming: true },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1300px] mx-auto space-y-5"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/sow/upload/gap-analysis"
          className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-colors group"
          style={{ color: "var(--ink-muted)" }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Gap Analysis
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-heading"
            style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Commercial & Project Details
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            Complete all 7 sections. AI has pre-populated fields where confidence is high.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-muted)" }}>
          <Save className="w-3.5 h-3.5" />
          <span>Auto-saving...</span>
        </div>
      </motion.div>

      {/* 5-Circle Progress Bar */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl px-6 py-4"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
          }}
        >
          <div className="flex items-center justify-between max-w-[500px] mx-auto">
            {flowSteps.map((step, idx) => {
              const state = step.completed
                ? "completed"
                : step.active
                ? "active"
                : "upcoming";
              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-1">
                    <ProgressCircle step={idx + 1} state={state as "completed" | "active" | "upcoming"} />
                    <span
                      className="text-[10px] font-semibold"
                      style={{
                        color:
                          state === "upcoming"
                            ? "var(--ink-faint)"
                            : "var(--ink-muted)",
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < flowSteps.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-2 rounded-full -mt-4"
                      style={{
                        background:
                          idx < 3
                            ? "linear-gradient(to right, var(--forest-500, #2e7d32), var(--teal-500, #00897b))"
                            : "var(--border-soft)",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main Layout: Left Nav + Right Form */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT: Section Navigator */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl overflow-hidden sticky top-6"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
                borderRadius: 12,
              }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid var(--border-soft)" }}
              >
                <p
                  className="text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--ink-muted)" }}
                >
                  Sections
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                  {completedSections.size} of {SECTIONS.length} complete
                </p>
              </div>
              <div className="py-2">
                {SECTIONS.map((section, idx) => {
                  const isActive = idx === activeSection;
                  const isComplete = completedSections.has(idx);
                  const Icon = section.icon;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition-all",
                        isActive && "bg-forest-50/60"
                      )}
                      style={{
                        borderLeft: isActive
                          ? "3px solid var(--forest-500, #2e7d32)"
                          : "3px solid transparent",
                      }}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          isComplete
                            ? "bg-gradient-to-br from-forest-500 to-teal-500 text-white"
                            : isActive
                            ? "bg-forest-100 text-forest-600"
                            : "bg-beige-100 text-beige-500"
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-[12px] font-semibold truncate",
                            isActive
                              ? "text-forest-700"
                              : isComplete
                              ? "text-forest-600"
                              : ""
                          )}
                          style={{
                            color: !isActive && !isComplete ? "var(--ink)" : undefined,
                          }}
                        >
                          {section.shortLabel}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                          AI: {section.aiConfidence}%
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight
                          className="w-3.5 h-3.5 shrink-0 text-forest-500"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Form Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: 12,
                  }}
                >
                  {/* Section Header */}
                  <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{ borderBottom: "1px solid var(--border-soft)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center">
                        <currentSection.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h2
                          className="text-[15px] font-heading font-semibold"
                          style={{ color: "var(--ink)" }}
                        >
                          {currentSection.label}
                        </h2>
                        <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                          Section {activeSection + 1} of {SECTIONS.length}
                        </p>
                      </div>
                    </div>
                    {isPrePopulated && (
                      <Badge variant="forest" size="md" className="gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        SECTION PRE-POPULATED
                      </Badge>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="p-6 space-y-5">
                    {activeSection === 0 && (
                      <>
                        {/* Project Vision */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Project Vision
                          </Label>
                          <Textarea
                            value={getFieldValue("projectVision")}
                            onChange={(e) => setFieldValue("projectVision", e.target.value)}
                            placeholder="Describe the overarching vision for this project..."
                            className="min-h-[100px]"
                          />
                        </div>

                        {/* Business Objectives */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Business Objectives
                          </Label>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-mono shrink-0 w-5 text-center"
                                style={{ color: "var(--ink-faint)" }}
                              >
                                {i}.
                              </span>
                              <Input
                                value={getFieldValue(`businessObjective${i}`)}
                                onChange={(e) =>
                                  setFieldValue(`businessObjective${i}`, e.target.value)
                                }
                                placeholder={`Business objective ${i}...`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Pain Points */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Pain Points
                          </Label>
                          {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-mono shrink-0 w-5 text-center"
                                style={{ color: "var(--ink-faint)" }}
                              >
                                {i}.
                              </span>
                              <Input
                                value={getFieldValue(`painPoint${i}`)}
                                onChange={(e) =>
                                  setFieldValue(`painPoint${i}`, e.target.value)
                                }
                                placeholder={`Pain point ${i}...`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Business Criticality */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Business Criticality
                          </Label>
                          <select
                            value={getFieldValue("businessCriticality")}
                            onChange={(e) =>
                              setFieldValue("businessCriticality", e.target.value)
                            }
                            className="w-full rounded-xl px-4 py-2.5 text-sm"
                            style={{
                              background: "var(--page-bg)",
                              border: "1px solid var(--border-soft)",
                              color: "var(--ink)",
                            }}
                          >
                            <option value="">Select criticality...</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>

                        {/* Current State */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Current State
                          </Label>
                          <Textarea
                            value={getFieldValue("currentState")}
                            onChange={(e) => setFieldValue("currentState", e.target.value)}
                            placeholder="Describe the current state of systems/processes..."
                            className="min-h-[80px]"
                          />
                        </div>

                        {/* Desired Future State */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Desired Future State
                          </Label>
                          <Textarea
                            value={getFieldValue("desiredFutureState")}
                            onChange={(e) =>
                              setFieldValue("desiredFutureState", e.target.value)
                            }
                            placeholder="Describe the desired future state..."
                            className="min-h-[80px]"
                          />
                        </div>

                        {/* End User Profiles */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            End User Profiles
                          </Label>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-mono shrink-0 w-5 text-center"
                                style={{ color: "var(--ink-faint)" }}
                              >
                                {i}.
                              </span>
                              <Input
                                value={getFieldValue(`endUserProfile${i}`)}
                                onChange={(e) =>
                                  setFieldValue(`endUserProfile${i}`, e.target.value)
                                }
                                placeholder={`User profile ${i}...`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Success Metrics */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Success Metrics
                          </Label>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-mono shrink-0 w-5 text-center"
                                style={{ color: "var(--ink-faint)" }}
                              >
                                {i}.
                              </span>
                              <Input
                                value={getFieldValue(`successMetric${i}`)}
                                onChange={(e) =>
                                  setFieldValue(`successMetric${i}`, e.target.value)
                                }
                                placeholder={`Success metric ${i}...`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Definition of Project Success */}
                        <div className="space-y-2">
                          <Label
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--ink)" }}
                          >
                            Definition of Project Success
                          </Label>
                          <Textarea
                            value={getFieldValue("projectSuccessDefinition")}
                            onChange={(e) =>
                              setFieldValue("projectSuccessDefinition", e.target.value)
                            }
                            placeholder="Define what constitutes project success..."
                            className="min-h-[80px]"
                          />
                        </div>
                      </>
                    )}

                    {/* Sections 2-7: Show pre-populated summary */}
                    {activeSection > 0 && (
                      <div className="space-y-4">
                        {isPrePopulated && (
                          <div
                            className="rounded-xl p-5 text-center"
                            style={{
                              background: "var(--page-bg)",
                              border: "1px dashed var(--border-soft)",
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-teal-100 flex items-center justify-center mx-auto mb-3">
                              <Sparkles className="w-6 h-6 text-forest-500" />
                            </div>
                            <h3
                              className="text-[15px] font-heading font-semibold mb-1"
                              style={{ color: "var(--ink)" }}
                            >
                              Section Pre-Populated by AI
                            </h3>
                            <p className="text-[12px] mb-4" style={{ color: "var(--ink-muted)" }}>
                              AI confidence: {currentSection.aiConfidence}%. Fields have been filled
                              based on extracted data.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                              <Button variant="outline" size="sm">
                                <Eye className="w-3.5 h-3.5" />
                                Review Fields
                              </Button>
                              <Button variant="secondary" size="sm" onClick={goToNext}>
                                Continue
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Placeholder fields for other sections */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                              <div
                                className="h-3 rounded-full"
                                style={{
                                  background: "var(--border-soft)",
                                  width: `${50 + i * 10}%`,
                                }}
                              />
                              <div
                                className="rounded-xl h-10"
                                style={{
                                  background: "var(--page-bg)",
                                  border: "1px solid var(--border-soft)",
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {activeSection > 0 && (
                          <div className="space-y-2">
                            <div
                              className="h-3 rounded-full"
                              style={{
                                background: "var(--border-soft)",
                                width: "35%",
                              }}
                            />
                            <div
                              className="rounded-xl h-24"
                              style={{
                                background: "var(--page-bg)",
                                border: "1px solid var(--border-soft)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section Footer */}
                  <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{ borderTop: "1px solid var(--border-soft)" }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={activeSection === 0}
                      onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {!completedSections.has(activeSection) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markComplete(activeSection)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Complete
                        </Button>
                      )}
                      {activeSection < SECTIONS.length - 1 ? (
                        <Button variant="secondary" size="sm" onClick={goToNext}>
                          Continue
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => markComplete(activeSection)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Finish Section
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl px-6 py-5 flex items-center justify-between"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
          }}
        >
          <div>
            <p
              className="text-[13px] font-semibold"
              style={{ color: allSectionsComplete ? "var(--forest-700, #2e7d32)" : "var(--ink)" }}
            >
              {allSectionsComplete
                ? "All sections complete! Ready to generate."
                : `${SECTIONS.length - completedSections.size} section${
                    SECTIONS.length - completedSections.size !== 1 ? "s" : ""
                  } remaining`}
            </p>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              {allSectionsComplete
                ? "Click Generate Final SOW to create your draft."
                : "Complete all sections to enable SOW generation."}
            </p>
          </div>
          <Link
            href={allSectionsComplete ? "/enterprise/sow/upload/preview-confirm" : "#"}
            className={cn(!allSectionsComplete && "pointer-events-none")}
          >
            <Button
              variant="gradient-forest"
              size="lg"
              disabled={!allSectionsComplete}
            >
              <Sparkles className="w-4 h-4" />
              Generate Final SOW
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
