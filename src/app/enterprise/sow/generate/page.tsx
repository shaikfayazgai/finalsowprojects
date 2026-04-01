"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, FileText, Target, Code2,
  Calendar, DollarSign, Users, ShieldCheck, Lock, AlertTriangle,
  ClipboardCheck, Plus, X, Zap, Check, Loader2, SkipForward, Circle, Lightbulb,
  Link2, Scale, Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { validateStep, validateField, type StepErrors } from "@/lib/validations/sow-generate";
import {
  Button, Input, Textarea, Label, Select, SelectTrigger, SelectContent,
  SelectItem, SelectValue,
} from "@/components/ui";

/* ══════════════════════════════════════════ Steps ══════════════════════════════════════════ */

const STEPS = [
  { label: "Project Overview",       icon: FileText,      short: "Overview",  skippable: false, mandatory: true  },
  { label: "Scope Definition",       icon: Target,        short: "Scope",     skippable: false, mandatory: true  },
  { label: "Technical Requirements", icon: Code2,         short: "Technical", skippable: false, mandatory: true  },
  { label: "Integrations",           icon: Link2,         short: "Integrations", skippable: true, mandatory: false },
  { label: "Timeline & Team",        icon: Calendar,      short: "Timeline",  skippable: true,  mandatory: false },
  { label: "Budget & Risk",          icon: DollarSign,    short: "Budget",    skippable: false, mandatory: true  },
  { label: "Quality Standards",      icon: ShieldCheck,   short: "Quality",   skippable: true,  mandatory: false },
  { label: "Governance",             icon: Gavel,         short: "Governance",skippable: false, mandatory: true  },
  { label: "Commercial & Legal",     icon: Scale,         short: "Commercial",skippable: false, mandatory: true  },
  { label: "Review & Generate",      icon: ClipboardCheck,short: "Review",    skippable: false, mandatory: true  },
] as const;

const HALLUCINATION_LAYERS = [
  "Input Validation", "Template Locking", "Clause Library", "Completeness Checks",
  "Confidence Scoring", "Pattern Matching", "Human Approval", "Audit Logging",
];

const GENERATION_STAGES = [
  "Applying template", "Anchoring to business context", "Generating clauses",
  "Hallucination checks", "Risk scoring", "Finalising",
];

/* ══════════════════════════════════════════ Form data ══════════════════════════════════════════ */

interface FormData {
  // Section 1: Strategic Context & Vision
  projectVision: string;
  businessObjectives: string[];
  painPoints: string[];
  businessCriticality: string;
  strategicContext: string;
  currentState: string;
  currentStateType: string;
  desiredFutureState: string;
  previousAttempts: string;
  endUserProfiles: string[];
  languageRequirements: string[];
  customLanguages: string[];
  userExpectations: string[];
  successMetrics: string[];
  enterpriseExpectations: string;
  definitionOfSuccess: string;

  // Section 2: Project Identity & Scope
  title: string;
  client: string;
  industry: string;
  projectCategory: string;
  platformType: string;
  existingTechLandscape: string;
  featureModules: string[];
  userRoles: string[];
  businessWorkflows: string[];
  estimatedScreenCount: string;
  criticalBusinessRules: string[];
  outOfScope: string[];
  assumptions: string[];
  constraints: string[];
  dataMigrationScope: string;
  dataMigrationDetails: string;

  // Section 3: Delivery Scope & Technical Architecture
  developmentScope: string[];
  uiuxDesignScope: string;
  uiuxDesignDetails: string;
  deploymentScope: string;
  deploymentDetails: string;
  goLiveScope: string;
  goLiveDetails: string;
  techStack: string;
  scalabilityRequirements: string;
  etlApproach: string;
  transformationComplexity: string;
  dataValidationMethod: string;
  integrations: string[];
  ssoRequired: string;
  ssoDetails: string;
  userRegistrationModel: string;
  passwordPolicy: string;
  passwordPolicyDetails: string;
  auditLogging: string;
  approvalWorkflows: string;
  notifications: string;
  scheduledJobs: string[];

  // Section 4: Timeline, Team & Budget
  startDate: string;
  endDate: string;
  phasingStrategy: string;
  milestones: string[];
  clientDependencies: string[];
  teamSize: string;
  workModel: string;
  roles: string[];
  skillPriorities: string;
  knowledgeTransfer: string;

  // Section 5: Quality Assurance & Testing
  sitScope: string;
  uatOwnership: string;
  uatDuration: string;
  uatSignoffAuthority: string;
  preProductionTesting: string;
  performanceTesting: string;
  securityTesting: string;
  defectSLA: string;

  // Section 6: Budget & Risk
  budgetMin: string;
  budgetMax: string;
  currency: string;
  pricingModel: string;
  breakdownPreference: string;
  knownRisks: string[];
  projectConstraints: string;
  contingencyBudget: string;
  escalationProcess: string;

  // Section 7: Acceptance & SLA
  acceptanceCriteria: string;
  slaUptime: string;
  codeReviewPolicy: string;
  documentationRequirements: string[];
  browserCompatibility: string[];
  deviceCompatibility: string[];
  reportingScope: string;
  offlineSupport: string;
  localisation: string;

  // Section 8: Governance & Ethics
  nonDiscriminationConfirm: boolean;
  labourStandards: string;
  accessibilityRequirements: string;
  prohibitedCategories: string[];
  personalDataInvolved: string;
  privacyLaws: string[];
  dpaRequired: string;
  privacyImpactStatus: string;
  dataSensitivity: string;
  encryptionRequirements: string;
  regulatoryFrameworks: string[];
  dataResidency: string;
  accessControl: string;

  // Section 9: Commercial & IP
  ipOwnership: string;
  sourceCodeOwnership: string;
  referenceRights: string;
  openSourcePolicy: string;
  thirdPartyCosts: string;
  warrantyPeriod: string;
  postWarrantySupport: string;
  changeRequestProcess: string;
  changeRequestApprover: string;
  environmentCosts: string;

  // Section 10: Sign-off
  businessOwnerApprover: string;
  finalApprover: string;
  legalReviewer: string;
  securityReviewer: string;
}

const initialFormData: FormData = {
  // Section 1: Strategic Context & Vision
  projectVision: "",
  businessObjectives: [""],
  painPoints: [""],
  businessCriticality: "",
  strategicContext: "",
  currentState: "",
  currentStateType: "",
  desiredFutureState: "",
  previousAttempts: "",
  endUserProfiles: [""],
  languageRequirements: [""],
  customLanguages: [],
  userExpectations: [""],
  successMetrics: [""],
  enterpriseExpectations: "",
  definitionOfSuccess: "",

  // Section 2: Project Identity & Scope
  title: "",
  client: "",
  industry: "",
  projectCategory: "",
  platformType: "",
  existingTechLandscape: "",
  featureModules: [""],
  userRoles: [""],
  businessWorkflows: [""],
  estimatedScreenCount: "",
  criticalBusinessRules: [""],
  outOfScope: [""],
  assumptions: [""],
  constraints: [""],
  dataMigrationScope: "",
  dataMigrationDetails: "",

  // Section 3: Delivery Scope & Technical Architecture
  developmentScope: [""],
  uiuxDesignScope: "",
  uiuxDesignDetails: "",
  deploymentScope: "",
  deploymentDetails: "",
  goLiveScope: "",
  goLiveDetails: "",
  techStack: "",
  scalabilityRequirements: "",
  etlApproach: "",
  transformationComplexity: "",
  dataValidationMethod: "",
  integrations: [""],
  ssoRequired: "",
  ssoDetails: "",
  userRegistrationModel: "",
  passwordPolicy: "",
  passwordPolicyDetails: "",
  auditLogging: "",
  approvalWorkflows: "",
  notifications: "",
  scheduledJobs: [""],

  // Section 4: Timeline, Team & Budget
  startDate: "",
  endDate: "",
  phasingStrategy: "",
  milestones: [""],
  clientDependencies: [""],
  teamSize: "",
  workModel: "",
  roles: [""],
  skillPriorities: "",
  knowledgeTransfer: "",

  // Section 5: Quality Assurance & Testing
  sitScope: "",
  uatOwnership: "",
  uatDuration: "",
  uatSignoffAuthority: "",
  preProductionTesting: "",
  performanceTesting: "",
  securityTesting: "",
  defectSLA: "",

  // Section 6: Budget & Risk
  budgetMin: "",
  budgetMax: "",
  currency: "USD",
  pricingModel: "",
  breakdownPreference: "",
  knownRisks: [""],
  projectConstraints: "",
  contingencyBudget: "",
  escalationProcess: "",

  // Section 7: Acceptance & SLA
  acceptanceCriteria: "",
  slaUptime: "",
  codeReviewPolicy: "",
  documentationRequirements: [""],
  browserCompatibility: [""],
  deviceCompatibility: [""],
  reportingScope: "",
  offlineSupport: "",
  localisation: "",

  // Section 8: Governance & Ethics
  nonDiscriminationConfirm: false,
  labourStandards: "",
  accessibilityRequirements: "",
  prohibitedCategories: [""],
  personalDataInvolved: "",
  privacyLaws: [""],
  dpaRequired: "",
  privacyImpactStatus: "",
  dataSensitivity: "",
  encryptionRequirements: "",
  regulatoryFrameworks: [""],
  dataResidency: "",
  accessControl: "",

  // Section 9: Commercial & IP
  ipOwnership: "",
  sourceCodeOwnership: "",
  referenceRights: "",
  openSourcePolicy: "",
  thirdPartyCosts: "",
  warrantyPeriod: "",
  postWarrantySupport: "",
  changeRequestProcess: "",
  changeRequestApprover: "",
  environmentCosts: "",

  // Section 10: Sign-off
  businessOwnerApprover: "",
  finalApprover: "",
  legalReviewer: "",
  securityReviewer: "",
};

/* ══════════════════════════════════════════ Step transition ══════════════════════════════════════════ */

const stepTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

/* ══════════════════════════════════════════ Date picker ══════════════════════════════════════════ */

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DateInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = React.useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(parsed?.getMonth() ?? today.getMonth());

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4 + window.scrollY, left: rect.left + window.scrollX });
    }
  }, [open]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDisplay = (v: string) => {
    if (!v) return '';
    const d = new Date(v + 'T00:00:00');
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const days: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const selectDay = (day: number) => { onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`); setOpen(false); };
  const isSelected = (day: number) => parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  const isToday = (day: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div className="relative w-full">
      <button ref={triggerRef} type="button" onClick={() => setOpen(o => !o)}
        className={cn("flex h-10 w-full items-center rounded-xl border bg-white px-3.5 py-2 text-[13px] transition-all duration-200",
          open ? "border-brown-300 ring-2 ring-brown-100" : "border-gray-200 hover:border-gray-300",
          value ? "text-gray-900" : "text-gray-400"
        )}>
        {formatDisplay(value) || placeholder || 'Select date'}
      </button>
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

      {open && ReactDOM.createPortal(
        <div ref={dropdownRef} className="fixed rounded-xl bg-white border border-gray-200 p-4 z-[9999]"
          style={{ top: pos.top, left: pos.left, width: 280, boxShadow: "0 8px 24px var(--border-hair), 0 2px 6px var(--border-hair)" }}>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[13px] font-semibold text-gray-900">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0 mb-1">
            {DAY_LABELS.map(d => <div key={d} className="flex items-center justify-center h-7 text-[10px] font-semibold text-gray-400">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, i) => (
              <div key={i} className="flex items-center justify-center h-8">
                {day && (
                  <button type="button" onClick={() => selectDay(day)}
                    className={cn("w-7 h-7 rounded-md text-[12px] flex items-center justify-center transition-all",
                      isSelected(day) ? "bg-gradient-to-r from-brown-400 to-brown-600 text-white font-semibold" :
                      isToday(day) ? "border border-brown-300 text-brown-600 font-medium" :
                      "text-gray-700 hover:bg-gray-50"
                    )}>
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}



/* ════════════════════════════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════════════════════════════ */

interface StepListProps {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  addListItem: (key: keyof FormData) => void;
  removeListItem: (key: keyof FormData, idx: number) => void;
  updateListItem: (key: keyof FormData, idx: number, value: string) => void;
  errors?: StepErrors;
  blurField?: (field: string) => void;
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>{error}</p>;
}

const tipVariants = {
  teal: { bg: "bg-teal-50", text: "text-teal-700", icon: "text-teal-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", icon: "text-brown-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", icon: "text-gold-500" },
  forest: { bg: "bg-forest-50", text: "text-forest-700", icon: "text-forest-500" },
};

function TipBox({ icon: Icon, variant, title, children }: { icon: React.ElementType; variant: keyof typeof tipVariants; title: string; children: React.ReactNode }) {
  const v = tipVariants[variant];
  return (
    <div className={cn("rounded-xl px-4 py-3.5", v.bg)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", v.icon)} />
        <p className={cn("text-[12px] leading-relaxed", v.text)}>
          <span className="font-semibold">{title}</span> {children}
        </p>
      </div>
    </div>
  );
}

function ListField({ label, items, fieldKey, placeholder, addListItem, removeListItem, updateListItem, addLabel = "Add", icon: Icon, numbered, prefix, error, onBlur }: {
  label: string; items: string[]; fieldKey: keyof FormData; placeholder: string;
  addListItem: (key: keyof FormData) => void; removeListItem: (key: keyof FormData, idx: number) => void;
  updateListItem: (key: keyof FormData, idx: number, value: string) => void;
  addLabel?: string; icon?: React.ElementType; numbered?: boolean; prefix?: string; error?: string; onBlur?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[13px] font-semibold text-gray-800">{label}</label>
        <button onClick={() => addListItem(fieldKey)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
              {Icon ? <Icon className="w-3 h-3 text-gray-400" /> : (
                <span className="text-[10px] font-bold text-gray-400">{prefix ? `${prefix}${idx + 1}` : idx + 1}</span>
              )}
            </div>
            <Input placeholder={placeholder} value={item} onChange={(e) => updateListItem(fieldKey, idx, e.target.value)} onBlur={onBlur} />
            {items.length > 1 && (
              <button onClick={() => removeListItem(fieldKey, idx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <FieldError error={error} />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#A67763', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 4 }}>
      {children}
    </h3>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mid)' }}>
      {children}{required && " *"}
    </label>
  );
}

function OtherLanguageTagInput({ languages, onChange }: { languages: string[]; onChange: (v: string[]) => void }) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addLanguage = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !languages.includes(trimmed)) {
      onChange([...languages, trimmed]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addLanguage(); }
    if (e.key === "Backspace" && !inputValue && languages.length > 0) {
      onChange(languages.slice(0, -1));
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Custom Languages</label>
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 cursor-text transition-all duration-200 focus-within:border-brown-300 focus-within:ring-2 focus-within:ring-brown-100"
        style={{ minHeight: 40 }}
      >
        {languages.filter(l => l.trim()).map((lang, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium"
            style={{ background: 'rgba(77,87,65,0.10)', color: '#4D5741' }}
          >
            {lang}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(languages.filter((_, i) => i !== idx)); }}
              className="hover:text-red-500 transition-colors"
              style={{ lineHeight: 0 }}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addLanguage}
          placeholder={languages.filter(l => l.trim()).length === 0 ? "Type a language and press Enter..." : ""}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400"
          style={{ padding: 0 }}
        />
      </div>
    </div>
  );
}

function RadioGroup({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="rounded-lg transition-all duration-200"
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: value === opt.value ? 600 : 400,
            color: value === opt.value ? '#FFFFFF' : 'var(--ink-mid)',
            background: value === opt.value ? 'linear-gradient(135deg, #A67763, #886151)' : 'rgba(166,119,99,0.04)',
            border: `1px solid ${value === opt.value ? 'rgba(166,119,99,0.40)' : 'var(--border-soft)'}`,
            cursor: 'pointer',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({ values, onChange, options }: {
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter(x => x !== v));
    else onChange([...values, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className="rounded-lg transition-all duration-200"
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              color: active ? '#FFFFFF' : 'var(--ink-mid)',
              background: active ? 'linear-gradient(135deg, #4D5741, #3F4735)' : 'rgba(166,119,99,0.04)',
              border: `1px solid ${active ? 'rgba(77,87,65,0.40)' : 'var(--border-soft)'}`,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}


/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */
const SOW_STORAGE_KEY = "sow-generator-draft";

function loadDraft(): { formData: FormData; currentStep: number; skippedSteps: number[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SOW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(formData: FormData, currentStep: number, skippedSteps: Set<number>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SOW_STORAGE_KEY, JSON.stringify({
      formData,
      currentStep,
      skippedSteps: [...skippedSteps],
    }));
  } catch { /* storage full — ignore */ }
}

export default function SOWGenerateWizardPage() {
  const router = useRouter();
  const draft = React.useRef(loadDraft());
  const [currentStep, setCurrentStep] = React.useState(draft.current?.currentStep ?? 0);
  const [formData, setFormData] = React.useState<FormData>(draft.current?.formData ?? initialFormData);
  const [skippedSteps, setSkippedSteps] = React.useState<Set<number>>(new Set(draft.current?.skippedSteps ?? []));
  const [generating, setGenerating] = React.useState(false);
  const [genStage, setGenStage] = React.useState(0);
  const [stepErrors, setStepErrors] = React.useState<StepErrors>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Persist draft to sessionStorage on every change
  React.useEffect(() => {
    saveDraft(formData, currentStep, skippedSteps);
  }, [formData, currentStep, skippedSteps]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // Re-validate on change if field was already touched
      if (touchedFields.has(key as string)) {
        const err = validateField(currentStep, key as string, next);
        setStepErrors((prev) => {
          const updated = { ...prev };
          if (err) updated[key as string] = err;
          else delete updated[key as string];
          return updated;
        });
      }
      return next;
    });
  };

  const blurField = (field: string) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    const err = validateField(currentStep, field, formData);
    if (err) {
      setStepErrors((prev) => ({ ...prev, [field]: err }));
    } else {
      setStepErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };
  const addListItem = (key: keyof FormData) => {
    setFormData((prev) => ({ ...prev, [key]: [...(prev[key] as string[]), ""] }));
  };
  const removeListItem = (key: keyof FormData, idx: number) => {
    setFormData((prev) => ({ ...prev, [key]: (prev[key] as string[]).filter((_: string, i: number) => i !== idx) }));
  };
  const updateListItem = (key: keyof FormData, idx: number, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: (prev[key] as string[]).map((item: string, i: number) => (i === idx ? value : item)) }));
  };

  /* ── Confidence calculation ── */
  const calculateConfidence = React.useCallback(() => {
    const checks: boolean[] = [
      /* Step 0 */
      formData.projectVision.trim().length >= 50,
      formData.businessObjectives.some(x => x.trim().length > 0),
      formData.painPoints.some(x => x.trim().length > 0),
      formData.businessCriticality.length > 0,
      formData.desiredFutureState.trim().length >= 30,
      formData.endUserProfiles.some(x => x.trim().length > 0),
      formData.successMetrics.some(x => x.trim().length > 0),
      formData.definitionOfSuccess.trim().length >= 30,
      /* Step 1 */
      formData.title.trim().length >= 3,
      formData.client.trim().length >= 2,
      formData.industry.length > 0,
      formData.projectCategory.length > 0,
      formData.platformType.length > 0,
      formData.featureModules.filter(x => x.trim().length > 0).length >= 2,
      formData.userRoles.some(x => x.trim().length > 0),
      formData.businessWorkflows.some(x => x.trim().length > 0),
      formData.outOfScope.some(x => x.trim().length > 0),
      /* Step 2 */
      formData.developmentScope.length > 0,
      formData.uiuxDesignScope.length > 0,
      formData.deploymentScope.length > 0,
      formData.goLiveScope.length > 0,
      formData.techStack.trim().length >= 10,
      /* Step 5 */
      parseFloat(formData.budgetMin) > 0,
      parseFloat(formData.budgetMax) >= parseFloat(formData.budgetMin),
      formData.pricingModel.length > 0,
      formData.knownRisks.some(x => x.trim().length > 0),
      /* Step 7 */
      formData.nonDiscriminationConfirm === true,
      formData.dataSensitivity.length > 0,
      formData.labourStandards.length > 0,
      /* Step 8 */
      formData.ipOwnership.length > 0,
      formData.sourceCodeOwnership.length > 0,
      formData.warrantyPeriod.length > 0,
      formData.changeRequestProcess.length > 0,
      /* Step 9 */
      formData.businessOwnerApprover.trim().length > 0,
      formData.finalApprover.trim().length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData]);

  const aiConfidence = calculateConfidence();

  /* ── Step completion ── */
  const isStepComplete = React.useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return formData.projectVision.trim().length >= 50
            && formData.businessObjectives.some(x => x.trim().length > 0)
            && formData.painPoints.some(x => x.trim().length > 0)
            && formData.businessCriticality.length > 0
            && formData.desiredFutureState.trim().length >= 30
            && formData.endUserProfiles.some(x => x.trim().length > 0)
            && formData.successMetrics.some(x => x.trim().length > 0)
            && formData.definitionOfSuccess.trim().length >= 30;
        case 1:
          return formData.title.trim().length >= 3
            && formData.client.trim().length >= 2
            && formData.industry.length > 0
            && formData.projectCategory.length > 0
            && formData.platformType.length > 0
            && formData.featureModules.filter(x => x.trim().length > 0).length >= 2
            && formData.userRoles.some(x => x.trim().length > 0)
            && formData.businessWorkflows.some(x => x.trim().length > 0)
            && formData.outOfScope.some(x => x.trim().length > 0);
        case 2:
          return formData.developmentScope.length > 0
            && formData.uiuxDesignScope.length > 0
            && formData.deploymentScope.length > 0
            && formData.goLiveScope.length > 0
            && formData.techStack.trim().length >= 10;
        case 3: // Integrations — skippable, complete if user has set at least one value
          return formData.ssoRequired.length > 0 || formData.integrations.some(x => x.trim().length > 0);
        case 4: // Timeline & Team — skippable, complete if dates are set
          return formData.startDate.length > 0 && formData.endDate.length > 0 && formData.teamSize.length > 0;
        case 5:
          return parseFloat(formData.budgetMin) > 0
            && parseFloat(formData.budgetMax) >= parseFloat(formData.budgetMin)
            && formData.pricingModel.length > 0
            && formData.knownRisks.some(x => x.trim().length > 0);
        case 6: // Quality — skippable, complete if at least acceptance criteria is set
          return formData.acceptanceCriteria.trim().length > 0 || formData.sitScope.length > 0;
        case 7:
          return formData.nonDiscriminationConfirm === true
            && formData.dataSensitivity.length > 0
            && formData.labourStandards.length > 0;
        case 8:
          return formData.ipOwnership.length > 0
            && formData.sourceCodeOwnership.length > 0
            && formData.referenceRights.length > 0
            && formData.thirdPartyCosts.length > 0
            && formData.warrantyPeriod.length > 0
            && formData.changeRequestProcess.length > 0;
        case 9:
          return aiConfidence >= 60
            && formData.businessOwnerApprover.trim().length > 0
            && formData.finalApprover.trim().length > 0;
        default: return false;
      }
    },
    [formData, aiConfidence]
  );

  /* ── canAdvance: must complete current step before moving forward ── */
  const canAdvance = React.useCallback(
    (step: number): boolean => {
      return isStepComplete(step);
    },
    [isStepComplete]
  );

  /* ── canGenerate: all mandatory complete + approvers ── */
  const canGenerate = React.useCallback((): boolean => {
    const mandatoryIndices = [0, 1, 2, 5, 7, 8];
    const allMandatoryComplete = mandatoryIndices.every(i => isStepComplete(i));
    return allMandatoryComplete
      && formData.nonDiscriminationConfirm
      && formData.businessOwnerApprover.trim().length > 0
      && formData.finalApprover.trim().length > 0;
  }, [isStepComplete, formData]);

  /* ── Hallucination layer status ── */
  const hallucinationLayerActive = React.useCallback((idx: number): boolean => {
    switch (idx) {
      case 0: return isStepComplete(1); // Scope boundary
      case 1: return parseFloat(formData.budgetMin) > 0 && formData.startDate.length > 0; // Budget-timeline
      case 2: return formData.nonDiscriminationConfirm && formData.dataSensitivity.length > 0; // Regulatory
      case 3: return formData.techStack.trim().length >= 10 && formData.developmentScope.length > 0; // Tech stack
      case 4: return formData.knownRisks.some(x => x.trim().length > 0); // Risk-mitigation
      case 5: return formData.roles.some(x => x.trim().length > 0) && formData.featureModules.some(x => x.trim().length > 0); // Role-deliverable
      case 6: return formData.acceptanceCriteria.trim().length > 0 || formData.slaUptime.length > 0; // SLA-quality
      case 7: return formData.ipOwnership.length > 0 && formData.sourceCodeOwnership.length > 0; // IP & commercial
      default: return false;
    }
  }, [formData, isStepComplete]);

  /* ── Skip handler ── */
  const handleSkip = () => {
    if (STEPS[currentStep].skippable) {
      setSkippedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(s => Math.min(STEPS.length - 1, s + 1));
    }
  };

  /* ── Generate handler ── */
  const handleGenerate = () => {
    if (!canGenerate()) return;
    setGenerating(true);
    setGenStage(0);
    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage >= GENERATION_STAGES.length) {
        clearInterval(interval);
        setTimeout(() => {
          router.push("/enterprise/sow/generate/review");
        }, 800);
      } else {
        setGenStage(stage);
      }
    }, 1200);
  };

  /* ── Next handler with validation ── */
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const errors = validateStep(currentStep, formData);
      setStepErrors(errors);
      if (Object.keys(errors).length > 0) return;
      setTouchedFields(new Set());
      setCurrentStep(s => s + 1);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══════════════════════════════════
          BACK LINK
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
        <Link href="/enterprise/sow/intake" className="inline-flex items-center gap-1.5 transition-colors" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Back to SOW Intake
        </Link>
      </motion.div>

      {/* ═══════════════════════════════════
          HERO HEADER
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="relative" style={{ marginBottom: 24 }}>
        <div className="absolute pointer-events-none" style={{
          top: -60, left: -80, width: 500, height: 300,
          background: 'radial-gradient(ellipse at 20% 40%, rgba(208,176,96,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(91,155,162,0.06) 0%, transparent 45%)',
          filter: 'blur(40px)',
        }} />
        <div className="relative flex items-center justify-between">
          <div>
            <h1
              className="font-heading leading-[1.15]"
              style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}
            >
              AI SOW Generator
            </h1>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-muted)', fontWeight: 400, lineHeight: 1.55 }}>
              Walk through 10 structured steps — our AI crafts a verified Statement of Work from your parameters.
            </p>
          </div>
          <div className="shrink-0 rounded-lg" style={{
            padding: '6px 14px',
            background: 'rgba(166,119,99,0.06)',
            border: '1px solid rgba(166,119,99,0.12)',
            fontSize: 12, fontWeight: 600, color: '#A67763',
          }}>
            Step {currentStep + 1} of {STEPS.length}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          STEP TIMELINE
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
        <div className="flex items-start">
          {STEPS.map((step, idx, arr) => {
            const isActive = idx === currentStep;
            const isDone = isStepComplete(idx) && idx !== currentStep;
            const isSkipped = skippedSteps.has(idx) && !isDone;
            const isReachable = idx <= currentStep || isStepComplete(idx - 1);
            const StepIcon = step.icon;

            return (
              <React.Fragment key={idx}>
                {/* Step node — fixed width so connectors get the remaining space */}
                <button
                  onClick={() => { if (isReachable) { setStepErrors({}); setTouchedFields(new Set()); setCurrentStep(idx); } }}
                  spellCheck={false}
                  className="flex flex-col items-center transition-all duration-200"
                  style={{ width: 52, flexShrink: 0, cursor: isReachable ? 'pointer' : 'default', gap: 6, padding: 0 }}
                >
                  {/* Dot */}
                  <div
                    className="flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{
                      width: isActive ? 32 : 26,
                      height: isActive ? 32 : 26,
                      borderRadius: '50%',
                      background: isActive
                        ? 'linear-gradient(135deg, #A67763, #C4956E)'
                        : isDone
                          ? 'rgba(77,87,65,0.12)'
                          : isSkipped
                            ? 'rgba(208,176,96,0.12)'
                            : 'rgba(166,119,99,0.06)',
                      border: `1.5px solid ${
                        isActive
                          ? 'rgba(166,119,99,0.40)'
                          : isDone
                            ? 'rgba(77,87,65,0.25)'
                            : isSkipped
                              ? 'rgba(208,176,96,0.30)'
                              : 'rgba(166,119,99,0.18)'
                      }`,
                      boxShadow: isActive ? '0 2px 10px rgba(166,119,99,0.25)' : 'none',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 style={{ width: 12, height: 12, color: '#4D5741' }} />
                    ) : isSkipped ? (
                      <SkipForward style={{ width: 11, height: 11, color: '#C4A24E' }} />
                    ) : (
                      <StepIcon style={{
                        width: isActive ? 14 : 11,
                        height: isActive ? 14 : 11,
                        color: isActive ? '#FFFFFF' : 'var(--ink-faint)',
                      }} />
                    )}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: isActive ? 10 : 9,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--ink)' : isDone ? 'var(--ink-muted)' : 'var(--ink-faint)',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    {step.short}
                  </span>
                </button>

                {/* Connector line — flex:1 so it fills all remaining space */}
                {idx < arr.length - 1 && (
                  <div style={{ flex: 1, paddingTop: 13, minWidth: 8 }}>
                    <div style={{
                      height: 2,
                      borderRadius: 2,
                      background: idx < currentStep
                        ? 'linear-gradient(90deg, rgba(166,119,99,0.55), rgba(166,119,99,0.30))'
                        : idx === currentStep
                          ? 'linear-gradient(90deg, rgba(166,119,99,0.30), rgba(166,119,99,0.10))'
                          : 'rgba(166,119,99,0.12)',
                    }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          GRID: FORM CARD + SIDEBAR
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 280px' }}>

          {/* LEFT — Form Card */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} variants={stepTransition} initial="initial" animate="animate" exit="exit">
                <div className="card-parchment">
                  <div className="section-header-parchment">
                    <div className="flex items-center justify-between">
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                        {STEPS[currentStep].label}
                      </div>
                      <span className="rounded-md" style={{
                        padding: '3px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
                        background: STEPS[currentStep].mandatory ? 'rgba(166,119,99,0.08)' : 'rgba(208,176,96,0.08)',
                        color: STEPS[currentStep].mandatory ? '#A67763' : '#86713D',
                        border: `1px solid ${STEPS[currentStep].mandatory ? 'rgba(166,119,99,0.14)' : 'rgba(208,176,96,0.14)'}`,
                      }}>
                        {STEPS[currentStep].mandatory ? 'REQUIRED' : 'OPTIONAL'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '28px 26px' }}>
                    {currentStep === 0 && <Step0ContextDiscovery formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 1 && <Step1ProjectScope formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 2 && <Step2DeliveryTechnical formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 3 && <Step3IntegrationsUserMgmt formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 4 && <Step4TimelineTeamTesting formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 5 && <Step5BudgetRisk formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 6 && <Step6QualityStandards formData={formData} updateField={updateField} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 7 && <Step7GovernanceCompliance formData={formData} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 8 && <Step8CommercialLegal formData={formData} updateField={updateField} errors={stepErrors} blurField={blurField} />}
                    {currentStep === 9 && <Step9ReviewGenerate formData={formData} updateField={updateField} aiConfidence={aiConfidence} isStepComplete={isStepComplete} skippedSteps={skippedSteps} setCurrentStep={setCurrentStep} errors={stepErrors} blurField={blurField} />}
                  </div>

                  {/* Navigation footer */}
                  <div style={{ padding: '16px 26px 20px', borderTop: '1px solid var(--border-hair)' }}>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setStepErrors({}); setTouchedFields(new Set()); setCurrentStep((s) => Math.max(0, s - 1)); }}
                        disabled={currentStep === 0}
                        className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                        style={{
                          padding: '7px 16px', fontSize: 12, fontWeight: 500,
                          color: currentStep === 0 ? 'var(--ink-faint)' : 'var(--ink-mid)',
                          background: 'transparent',
                          border: `1px solid ${currentStep === 0 ? 'var(--border-hair)' : 'var(--border-soft)'}`,
                          cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                          opacity: currentStep === 0 ? 0.5 : 1,
                        }}
                      >
                        <ArrowLeft style={{ width: 12, height: 12 }} /> Back
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Skip button for skippable steps */}
                        {STEPS[currentStep].skippable && currentStep < STEPS.length - 1 && (
                          <button
                            onClick={handleSkip}
                            className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                            style={{
                              padding: '7px 16px', fontSize: 12, fontWeight: 500,
                              color: '#86713D',
                              background: 'rgba(208,176,96,0.06)',
                              border: '1px solid rgba(208,176,96,0.18)',
                              cursor: 'pointer',
                            }}
                          >
                            <SkipForward style={{ width: 12, height: 12 }} /> Skip
                          </button>
                        )}

                        {currentStep < STEPS.length - 1 ? (
                          <button
                            onClick={handleNext}
                            disabled={!canAdvance(currentStep)}
                            className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                            style={{
                              padding: '7px 16px',
                              background: canAdvance(currentStep) ? 'linear-gradient(135deg, #A67763, #886151)' : 'rgba(166,119,99,0.15)',
                              color: canAdvance(currentStep) ? '#FFFFFF' : 'var(--ink-faint)',
                              fontSize: 12, fontWeight: 500,
                              border: `1px solid ${canAdvance(currentStep) ? 'rgba(166,119,99,0.30)' : 'var(--border-soft)'}`,
                              boxShadow: canAdvance(currentStep) ? '0 1px 6px rgba(166,119,99,0.20), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                              cursor: canAdvance(currentStep) ? 'pointer' : 'not-allowed',
                              opacity: canAdvance(currentStep) ? 1 : 0.6,
                            }}
                            onMouseEnter={(e) => { if (canAdvance(currentStep)) { e.currentTarget.style.boxShadow = '0 3px 12px rgba(166,119,99,0.30), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (canAdvance(currentStep)) { e.currentTarget.style.boxShadow = '0 1px 6px rgba(166,119,99,0.20), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; } }}
                          >
                            Next <ArrowRight style={{ width: 12, height: 12 }} />
                          </button>
                        ) : (
                          <button
                            onClick={handleGenerate}
                            disabled={!canGenerate()}
                            className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                            style={{
                              padding: '8px 20px',
                              background: canGenerate() ? 'linear-gradient(135deg, #A67763, #886151)' : 'rgba(166,119,99,0.15)',
                              color: canGenerate() ? '#FFFFFF' : 'var(--ink-faint)',
                              fontSize: 12, fontWeight: 600,
                              border: `1px solid ${canGenerate() ? 'rgba(166,119,99,0.30)' : 'var(--border-soft)'}`,
                              boxShadow: canGenerate() ? '0 2px 10px rgba(166,119,99,0.25), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                              cursor: canGenerate() ? 'pointer' : 'not-allowed',
                              opacity: canGenerate() ? 1 : 0.6,
                            }}
                            onMouseEnter={(e) => { if (canGenerate()) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(166,119,99,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (canGenerate()) { e.currentTarget.style.boxShadow = '0 2px 10px rgba(166,119,99,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; } }}
                          >
                            <Sparkles style={{ width: 13, height: 13 }} /> Generate SOW with AI
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — Sticky Sidebar */}
          <div className="space-y-4" style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>

            {/* AI Confidence Ring */}
            <div className="card-parchment" style={{ padding: 20 }}>
              <div className="flex flex-col items-center" style={{ gap: 12 }}>
                <div className="relative" style={{ width: 96, height: 96 }}>
                  <svg viewBox="0 0 96 96" style={{ width: 96, height: 96, transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border-hair)" strokeWidth="6" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      stroke={aiConfidence >= 70 ? '#4D5741' : aiConfidence >= 40 ? '#C4A24E' : '#A67763'}
                      strokeDasharray={`${(aiConfidence / 100) * 251.3} 251.3`}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{ fontSize: 20, fontWeight: 700, color: aiConfidence >= 70 ? '#4D5741' : aiConfidence >= 40 ? '#86713D' : '#A67763' }}>
                      {aiConfidence}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 14, fontWeight: 700, color: aiConfidence >= 70 ? '#4D5741' : aiConfidence >= 40 ? '#86713D' : '#A67763' }}>
                    {aiConfidence >= 70 ? 'High' : aiConfidence >= 40 ? 'Moderate' : 'Low'} Confidence
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>AI generation quality</div>
                </div>
              </div>
            </div>

            {/* Hallucination Prevention */}
            <div className="card-parchment" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 10 }}>
                Hallucination Prevention
              </div>
              <div className="space-y-2.5">
                {HALLUCINATION_LAYERS.map((layer, idx) => {
                  const active = hallucinationLayerActive(idx);
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: active ? '#4D5741' : 'var(--border-soft)',
                        boxShadow: active ? '0 0 4px rgba(77,87,65,0.30)' : 'none',
                        transition: 'all 0.3s ease',
                      }} />
                      <span style={{ fontSize: 12, color: active ? 'var(--ink-mid)' : 'var(--ink-faint)', fontWeight: active ? 500 : 400 }}>
                        {layer}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Steps Progress */}
            <div className="card-parchment" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 10 }}>
                Steps Progress
              </div>
              <div className="space-y-1.5">
                {STEPS.map((step, idx) => {
                  const complete = isStepComplete(idx);
                  const skipped = skippedSteps.has(idx) && !complete;
                  const active = idx === currentStep;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className="flex items-center gap-2 w-full rounded-md transition-all duration-150"
                      style={{
                        padding: '5px 8px',
                        background: active ? 'rgba(166,119,99,0.06)' : 'transparent',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      {complete ? (
                        <CheckCircle2 style={{ width: 12, height: 12, color: '#4D5741', flexShrink: 0 }} />
                      ) : skipped ? (
                        <SkipForward style={{ width: 12, height: 12, color: '#C4A24E', flexShrink: 0 }} />
                      ) : (
                        <Circle style={{ width: 12, height: 12, color: 'var(--border-soft)', flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--ink)' : complete ? 'var(--ink-mid)' : 'var(--ink-faint)',
                        flex: 1,
                        textAlign: 'left',
                      }}>
                        {step.short}
                      </span>
                      {step.mandatory && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, color: '#A67763', letterSpacing: '0.05em',
                          padding: '1px 4px', borderRadius: 3,
                          background: 'rgba(166,119,99,0.06)',
                        }}>
                          REQ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          GENERATION OVERLAY
          ═══════════════════════════════════ */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(249,245,241,0.95)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex flex-col items-center" style={{ gap: 32 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                Generating SOW
              </div>
              <div className="space-y-4" style={{ width: 320 }}>
                {GENERATION_STAGES.map((stage, idx) => {
                  const done = idx < genStage;
                  const active = idx === genStage;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="shrink-0" style={{ width: 24, height: 24 }}>
                        {done ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(77,87,65,0.12)' }}>
                            <Check style={{ width: 12, height: 12, color: '#4D5741' }} />
                          </div>
                        ) : active ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(166,119,99,0.10)' }}>
                            <Loader2 className="animate-spin" style={{ width: 12, height: 12, color: '#A67763' }} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full" style={{ border: '1.5px solid var(--border-soft)' }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        color: done ? '#4D5741' : active ? 'var(--ink)' : 'var(--ink-faint)',
                      }}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-full" style={{
                width: 240, height: 4, background: 'var(--border-hair)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: 'linear-gradient(135deg, #A67763, #886151)',
                  width: `${((genStage + 1) / GENERATION_STAGES.length) * 100}%`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}


/* ================================================================
   STEP 0 — Context & Discovery
   ================================================================ */
function Step0ContextDiscovery({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Start by providing the strategic context and discovery details. This grounds the AI and prevents
        generic boilerplate in the generated SOW.
      </p>

      {/* Project Vision */}
      <div>
        <FieldLabel required>Project Vision</FieldLabel>
        <Textarea
          placeholder="Describe the overarching vision for this project (min 50 characters)..."
          value={formData.projectVision}
          onChange={(e) => updateField("projectVision", e.target.value)}
          onBlur={onBlur("projectVision")}
          className="min-h-[100px]"
        />
        <FieldError error={errors.projectVision} />
      </div>

      {/* Business Objectives */}
      <ListField label="Business Objectives *" items={formData.businessObjectives} fieldKey="businessObjectives" placeholder="e.g., Increase user retention by 30%" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Objective" icon={Target} error={errors.businessObjectives} onBlur={onBlur("businessObjectives")} />

      {/* Pain Points */}
      <ListField label="Pain Points *" items={formData.painPoints} fieldKey="painPoints" placeholder="e.g., Current onboarding takes 14 days" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Pain Point" icon={AlertTriangle} error={errors.painPoints} onBlur={onBlur("painPoints")} />

      {/* Strategic Context & Business Criticality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Strategic Context</FieldLabel>
          <Select value={formData.strategicContext} onValueChange={(v) => updateField("strategicContext", v)}>
            <SelectTrigger><SelectValue placeholder="Select context" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="digital_transformation">Digital Transformation</SelectItem>
              <SelectItem value="cost_reduction">Cost Reduction</SelectItem>
              <SelectItem value="revenue_growth">Revenue Growth</SelectItem>
              <SelectItem value="compliance_mandate">Compliance Mandate</SelectItem>
              <SelectItem value="competitive_response">Competitive Response</SelectItem>
              <SelectItem value="innovation">Innovation Initiative</SelectItem>
              <SelectItem value="operational_excellence">Operational Excellence</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel required>Business Criticality</FieldLabel>
          <Select value={formData.businessCriticality} onValueChange={(v) => updateField("businessCriticality", v)}>
            <SelectTrigger><SelectValue placeholder="Select criticality" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mission_critical">Mission Critical</SelectItem>
              <SelectItem value="business_critical">Business Critical</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="nice_to_have">Nice to Have</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.businessCriticality} />
        </div>
      </div>

      {/* Current State */}
      <div>
        <FieldLabel required>Current State Description</FieldLabel>
        <Textarea
          placeholder="Describe the current state of the system/process (min 30 chars)..."
          value={formData.currentState}
          onChange={(e) => updateField("currentState", e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Current State Type */}
      <div>
        <FieldLabel>Current State Type</FieldLabel>
        <RadioGroup
          value={formData.currentStateType}
          onChange={(v) => updateField("currentStateType", v)}
          options={[
            { value: "greenfield", label: "Greenfield (No existing system)" },
            { value: "existing", label: "Existing System" },
          ]}
        />
      </div>

      {/* Desired Future State */}
      <div>
        <FieldLabel required>Desired Future State</FieldLabel>
        <Textarea
          placeholder="Describe the desired end state after project completion (min 30, max 1000 chars)..."
          value={formData.desiredFutureState}
          onChange={(e) => updateField("desiredFutureState", e.target.value)}
          onBlur={onBlur("desiredFutureState")}
          className="min-h-[80px]"
        />
        <FieldError error={errors.desiredFutureState} />
      </div>

      {/* Previous Attempts */}
      <div>
        <FieldLabel>Previous Attempts</FieldLabel>
        <Textarea
          placeholder="Describe any previous attempts to solve this problem (optional)..."
          value={formData.previousAttempts}
          onChange={(e) => updateField("previousAttempts", e.target.value)}
          className="min-h-[70px]"
        />
      </div>

      {/* End User Profiles */}
      <ListField label="End User Profiles *" items={formData.endUserProfiles} fieldKey="endUserProfiles" placeholder="e.g., Enterprise admin, Field technician, End customer" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Profile" error={errors.endUserProfiles} onBlur={onBlur("endUserProfiles")} />

      {/* Language Requirements */}
      <div>
        <FieldLabel>Language Requirements</FieldLabel>
        <CheckboxGroup
          values={formData.languageRequirements}
          onChange={(v) => {
            updateField("languageRequirements", v);
            if (v.includes("other") && !formData.languageRequirements.includes("other")) {
              updateField("customLanguages", []);
            }
            if (!v.includes("other")) updateField("customLanguages", []);
          }}
          options={[
            { value: "english", label: "English" },
            { value: "hindi", label: "Hindi" },
            { value: "tamil", label: "Tamil" },
            { value: "telugu", label: "Telugu" },
            { value: "bengali", label: "Bengali" },
            { value: "arabic", label: "Arabic" },
            { value: "french", label: "French" },
            { value: "other", label: "Other" },
          ]}
        />
        {formData.languageRequirements.includes("other") && (
          <OtherLanguageTagInput
            languages={formData.customLanguages}
            onChange={(v) => updateField("customLanguages", v)}
          />
        )}
      </div>

      {/* User Expectations */}
      <ListField label="User Expectations" items={formData.userExpectations} fieldKey="userExpectations" placeholder="e.g., Sub-second page load times" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Expectation" />

      {/* Success Metrics */}
      <ListField label="Success Metrics *" items={formData.successMetrics} fieldKey="successMetrics" placeholder="e.g., 99.9% uptime, <2s response time" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Metric" error={errors.successMetrics} onBlur={onBlur("successMetrics")} />

      {/* Enterprise Expectations */}
      <div>
        <FieldLabel>Enterprise Expectations</FieldLabel>
        <Textarea
          placeholder="Any additional enterprise-level expectations (optional)..."
          value={formData.enterpriseExpectations}
          onChange={(e) => updateField("enterpriseExpectations", e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      {/* Definition of Success */}
      <div>
        <FieldLabel required>Definition of Success</FieldLabel>
        <Textarea
          placeholder="How will you measure if this project is successful? (min 30, max 500 chars)"
          value={formData.definitionOfSuccess}
          onChange={(e) => updateField("definitionOfSuccess", e.target.value)}
          onBlur={onBlur("definitionOfSuccess")}
          className="min-h-[80px]"
        />
        <FieldError error={errors.definitionOfSuccess} />
      </div>

      <TipBox icon={Lightbulb} variant="teal" title="Why this matters:">
        Specifying strategic context and business criticality enables the AI to prioritize deliverables, calibrate timelines, and apply domain-specific compliance requirements.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 1 — Project & Scope
   ================================================================ */
function Step1ProjectScope({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define the project identity, scope boundaries, and key deliverables. Clear scope definition prevents scope creep in the generated SOW.
      </p>

      {/* Title + Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Project Title</FieldLabel>
          <Input placeholder="e.g., Enterprise Resource Planning Platform v2.0" value={formData.title} onChange={(e) => updateField("title", e.target.value)} onBlur={onBlur("title")} />
          <FieldError error={errors.title} />
        </div>
        <div>
          <FieldLabel required>Client / Organization</FieldLabel>
          <Input placeholder="e.g., TechVista Solutions" value={formData.client} onChange={(e) => updateField("client", e.target.value)} onBlur={onBlur("client")} />
          <FieldError error={errors.client} />
        </div>
      </div>

      {/* Industry, Project Category, Platform Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel required>Industry</FieldLabel>
          <Select value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance & Banking</SelectItem>
              <SelectItem value="retail">Retail & E-Commerce</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.industry} />
        </div>
        <div>
          <FieldLabel required>Project Category</FieldLabel>
          <Select value={formData.projectCategory} onValueChange={(v) => updateField("projectCategory", v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new_build">New Build</SelectItem>
              <SelectItem value="enhancement">Enhancement</SelectItem>
              <SelectItem value="migration">Migration</SelectItem>
              <SelectItem value="integration_only">Integration-only</SelectItem>
              <SelectItem value="uiux_redesign">UI/UX Redesign</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.projectCategory} />
        </div>
        <div>
          <FieldLabel required>Platform Type</FieldLabel>
          <Select value={formData.platformType} onValueChange={(v) => updateField("platformType", v)}>
            <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="web">Web Application</SelectItem>
              <SelectItem value="mobile_ios">Mobile - iOS</SelectItem>
              <SelectItem value="mobile_android">Mobile - Android</SelectItem>
              <SelectItem value="mobile_hybrid">Mobile - Hybrid</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="api_backend">API / Backend only</SelectItem>
              <SelectItem value="data_platform">Data Platform</SelectItem>
              <SelectItem value="full_stack">Full-Stack</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.platformType} />
        </div>
      </div>

      {/* Existing Tech Landscape */}
      <div>
        <FieldLabel>Existing Tech Landscape</FieldLabel>
        <Textarea placeholder="Describe any existing systems, tools, or tech the project must work with (optional)..." value={formData.existingTechLandscape} onChange={(e) => updateField("existingTechLandscape", e.target.value)} className="min-h-[70px]" />
      </div>

      {/* Feature Modules */}
      <ListField label="Feature Modules * (min 2)" items={formData.featureModules} fieldKey="featureModules" placeholder="e.g., User authentication, Dashboard analytics, Reporting engine" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Module" icon={Target} error={errors.featureModules} onBlur={onBlur("featureModules")} />

      {/* User Roles */}
      <ListField label="User Roles *" items={formData.userRoles} fieldKey="userRoles" placeholder="e.g., Admin, Manager, Viewer, API Consumer" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Role" error={errors.userRoles} onBlur={onBlur("userRoles")} />

      {/* Business Workflows */}
      <ListField label="Business Workflows *" items={formData.businessWorkflows} fieldKey="businessWorkflows" placeholder="e.g., Order-to-fulfillment, Approval chain, Onboarding flow" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Workflow" error={errors.businessWorkflows} onBlur={onBlur("businessWorkflows")} />

      {/* Estimated Screen Count */}
      <div>
        <FieldLabel>Estimated Screen Count</FieldLabel>
        <Input type="number" placeholder="e.g., 25" value={formData.estimatedScreenCount} onChange={(e) => updateField("estimatedScreenCount", e.target.value)} />
      </div>

      {/* Critical Business Rules */}
      <ListField label="Critical Business Rules" items={formData.criticalBusinessRules} fieldKey="criticalBusinessRules" placeholder="e.g., Orders above $10k require manager approval" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Rule" />

      {/* Out of Scope */}
      <ListField label="Out of Scope *" items={formData.outOfScope} fieldKey="outOfScope" placeholder="e.g., Legacy data migration, Mobile app, Ongoing maintenance" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Item" error={errors.outOfScope} onBlur={onBlur("outOfScope")} />

      {/* Assumptions */}
      <ListField label="Assumptions" items={formData.assumptions} fieldKey="assumptions" placeholder="e.g., Client will provide API documentation by Week 2" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Assumption" />

      {/* Constraints */}
      <ListField label="Constraints" items={formData.constraints} fieldKey="constraints" placeholder="e.g., Must use client's existing AWS account" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Constraint" />

      {/* Data Migration Scope */}
      <div>
        <FieldLabel>Data Migration Scope</FieldLabel>
        <RadioGroup
          value={formData.dataMigrationScope}
          onChange={(v) => updateField("dataMigrationScope", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "in_scope", label: "In Scope" },
          ]}
        />
      </div>
      {formData.dataMigrationScope === "in_scope" && (
        <div>
          <FieldLabel>Data Migration Details</FieldLabel>
          <Textarea placeholder="Describe the data migration requirements..." value={formData.dataMigrationDetails} onChange={(e) => updateField("dataMigrationDetails", e.target.value)} className="min-h-[70px]" />
        </div>
      )}

      <TipBox icon={Sparkles} variant="teal" title="Why this matters:">
        Specifying industry, platform type, and clear scope boundaries enables the AI to apply domain-specific templates and prevent scope creep.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 2 — Delivery & Technical
   ================================================================ */
function Step2DeliveryTechnical({ formData, updateField, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Specify delivery scope, technical architecture, and deployment approach. This ensures the AI generates technically viable deliverables.
      </p>

      {/* Development Scope */}
      <div>
        <FieldLabel required>Development Scope</FieldLabel>
        <CheckboxGroup
          values={formData.developmentScope}
          onChange={(v) => updateField("developmentScope", v)}
          options={[
            { value: "frontend", label: "Frontend" },
            { value: "backend", label: "Backend" },
            { value: "database", label: "Database" },
            { value: "integration", label: "Integration" },
            { value: "cicd", label: "CI/CD" },
          ]}
        />
        <FieldError error={errors.developmentScope} />
      </div>

      {/* UI/UX Design Scope */}
      <div>
        <FieldLabel required>UI/UX Design Scope</FieldLabel>
        <RadioGroup
          value={formData.uiuxDesignScope}
          onChange={(v) => updateField("uiuxDesignScope", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "in_scope", label: "In Scope" },
            { value: "client_provides", label: "Client Provides" },
          ]}
        />
        <FieldError error={errors.uiuxDesignScope} />
      </div>
      {formData.uiuxDesignScope === "in_scope" && (
        <div>
          <FieldLabel>UI/UX Design Details</FieldLabel>
          <Textarea placeholder="Describe UI/UX design requirements..." value={formData.uiuxDesignDetails} onChange={(e) => updateField("uiuxDesignDetails", e.target.value)} className="min-h-[70px]" />
        </div>
      )}

      {/* Deployment Scope */}
      <div>
        <FieldLabel required>Deployment Scope</FieldLabel>
        <RadioGroup
          value={formData.deploymentScope}
          onChange={(v) => updateField("deploymentScope", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "cloud", label: "Cloud" },
            { value: "on_premise", label: "On-Premise" },
            { value: "both", label: "Both" },
          ]}
        />
        <FieldError error={errors.deploymentScope} />
      </div>
      {(formData.deploymentScope === "cloud" || formData.deploymentScope === "on_premise" || formData.deploymentScope === "both") && (
        <div>
          <FieldLabel>Deployment Details</FieldLabel>
          <Textarea placeholder="Describe deployment requirements, environments, etc." value={formData.deploymentDetails} onChange={(e) => updateField("deploymentDetails", e.target.value)} className="min-h-[70px]" />
        </div>
      )}

      {/* Go-Live Scope */}
      <div>
        <FieldLabel required>Go-Live Scope</FieldLabel>
        <RadioGroup
          value={formData.goLiveScope}
          onChange={(v) => updateField("goLiveScope", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "go_live", label: "Go-Live Support" },
            { value: "go_live_hypercare", label: "Go-Live + Hypercare" },
          ]}
        />
        <FieldError error={errors.goLiveScope} />
      </div>
      {(formData.goLiveScope === "go_live" || formData.goLiveScope === "go_live_hypercare") && (
        <div>
          <FieldLabel>Go-Live Details</FieldLabel>
          <Textarea placeholder="Describe go-live and hypercare requirements..." value={formData.goLiveDetails} onChange={(e) => updateField("goLiveDetails", e.target.value)} className="min-h-[70px]" />
        </div>
      )}

      {/* Tech Stack */}
      <div>
        <FieldLabel required>Technology Stack</FieldLabel>
        <Textarea placeholder="e.g., React + TypeScript frontend, Node.js/NestJS backend, PostgreSQL, Redis, Docker/K8s" value={formData.techStack} onChange={(e) => updateField("techStack", e.target.value)} onBlur={onBlur("techStack")} className="min-h-[80px]" />
        <FieldError error={errors.techStack} />
      </div>

      {/* Scalability Requirements */}
      <div>
        <FieldLabel>Scalability Requirements</FieldLabel>
        <Textarea placeholder="e.g., Must support 10,000 concurrent users, auto-scaling enabled" value={formData.scalabilityRequirements} onChange={(e) => updateField("scalabilityRequirements", e.target.value)} className="min-h-[60px]" />
      </div>

      {/* Conditional: ETL/Migration fields */}
      {formData.dataMigrationScope === "in_scope" && (
        <>
          <SectionHeading>Data Migration Details</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>ETL Approach</FieldLabel>
              <Select value={formData.etlApproach} onValueChange={(v) => updateField("etlApproach", v)}>
                <SelectTrigger><SelectValue placeholder="Select ETL approach" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch">Batch Processing</SelectItem>
                  <SelectItem value="streaming">Real-time Streaming</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Batch + Stream)</SelectItem>
                  <SelectItem value="manual">Manual Migration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Transformation Complexity</FieldLabel>
              <Select value={formData.transformationComplexity} onValueChange={(v) => updateField("transformationComplexity", v)}>
                <SelectTrigger><SelectValue placeholder="Select complexity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Simple mapping)</SelectItem>
                  <SelectItem value="medium">Medium (Some transformations)</SelectItem>
                  <SelectItem value="high">High (Complex transformations)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel>Data Validation Method</FieldLabel>
            <RadioGroup
              value={formData.dataValidationMethod}
              onChange={(v) => updateField("dataValidationMethod", v)}
              options={[
                { value: "automated", label: "Automated" },
                { value: "manual", label: "Manual" },
                { value: "hybrid", label: "Hybrid" },
              ]}
            />
          </div>
        </>
      )}

      <TipBox icon={Code2} variant="brown" title="AI Hint:">
        Specifying your tech stack and deployment approach helps the AI generate accurate task breakdowns, skill requirements, and realistic effort estimates.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 3 — Integrations & User Management (SKIPPABLE)
   ================================================================ */
function Step3IntegrationsUserMgmt({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define third-party integrations, authentication, and user management requirements. This step is optional but improves SOW accuracy.
      </p>

      {/* Integrations */}
      <ListField label="Third-Party Integrations" items={formData.integrations} fieldKey="integrations" placeholder="e.g., Stripe Payments API, Salesforce CRM, SendGrid" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} icon={Zap} addLabel="Add Integration" />

      {/* SSO */}
      <div>
        <FieldLabel>SSO Required</FieldLabel>
        <RadioGroup
          value={formData.ssoRequired}
          onChange={(v) => updateField("ssoRequired", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
      </div>
      {formData.ssoRequired === "yes" && (
        <div>
          <FieldLabel>SSO Details</FieldLabel>
          <Textarea placeholder="e.g., SAML 2.0 with Azure AD, Google Workspace" value={formData.ssoDetails} onChange={(e) => updateField("ssoDetails", e.target.value)} className="min-h-[60px]" />
        </div>
      )}

      {/* User Registration Model */}
      <div>
        <FieldLabel>User Registration Model</FieldLabel>
        <Select value={formData.userRegistrationModel} onValueChange={(v) => updateField("userRegistrationModel", v)}>
          <SelectTrigger><SelectValue placeholder="Select registration model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="self_registration">Self Registration</SelectItem>
            <SelectItem value="admin_invite">Admin Invite Only</SelectItem>
            <SelectItem value="sso_only">SSO Only</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Password Policy */}
      <div>
        <FieldLabel>Password Policy</FieldLabel>
        <RadioGroup
          value={formData.passwordPolicy}
          onChange={(v) => updateField("passwordPolicy", v)}
          options={[
            { value: "platform_defaults", label: "Platform Defaults" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </div>
      {formData.passwordPolicy === "custom" && (
        <div>
          <FieldLabel>Password Policy Details</FieldLabel>
          <Textarea placeholder="Describe custom password requirements..." value={formData.passwordPolicyDetails} onChange={(e) => updateField("passwordPolicyDetails", e.target.value)} className="min-h-[60px]" />
        </div>
      )}

      {/* Audit Logging */}
      <div>
        <FieldLabel>Audit Logging</FieldLabel>
        <RadioGroup
          value={formData.auditLogging}
          onChange={(v) => updateField("auditLogging", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
      </div>

      {/* Approval Workflows */}
      <div>
        <FieldLabel>Approval Workflows</FieldLabel>
        <RadioGroup
          value={formData.approvalWorkflows}
          onChange={(v) => updateField("approvalWorkflows", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "in_scope", label: "In Scope" },
          ]}
        />
      </div>

      {/* Notifications */}
      <div>
        <FieldLabel>Notifications</FieldLabel>
        <RadioGroup
          value={formData.notifications}
          onChange={(v) => updateField("notifications", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "in_scope", label: "In Scope" },
          ]}
        />
      </div>

      {/* Scheduled Jobs */}
      {(formData.notifications === "in_scope" || formData.approvalWorkflows === "in_scope") && (
        <ListField label="Scheduled Jobs" items={formData.scheduledJobs} fieldKey="scheduledJobs" placeholder="e.g., Daily report generation at 6am UTC" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Job" />
      )}

      <TipBox icon={Link2} variant="teal" title="Integration tip:">
        Even if you skip this step, the AI will still generate basic integration placeholders. Completing it produces more accurate API-level deliverables.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 4 — Timeline, Team & Testing (SKIPPABLE)
   ================================================================ */
function Step4TimelineTeamTesting({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Set the project timeline, team structure, and testing strategy. The AI uses this to validate feasibility and structure phased delivery.
      </p>

      <SectionHeading>Timeline</SectionHeading>

      {/* Start / End Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Start Date</FieldLabel>
          <DateInput value={formData.startDate} onChange={(v) => updateField("startDate", v)} placeholder="Select start date" />
        </div>
        <div>
          <FieldLabel>Target End Date</FieldLabel>
          <DateInput value={formData.endDate} onChange={(v) => updateField("endDate", v)} placeholder="Select end date" />
        </div>
      </div>

      {/* Phasing Strategy */}
      <div>
        <FieldLabel>Phasing Strategy</FieldLabel>
        <Select value={formData.phasingStrategy} onValueChange={(v) => updateField("phasingStrategy", v)}>
          <SelectTrigger><SelectValue placeholder="Select phasing approach" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="waterfall">Waterfall (Sequential)</SelectItem>
            <SelectItem value="agile_sprints_2w">Agile Sprints (2-week)</SelectItem>
            <SelectItem value="agile_sprints_3w">Agile Sprints (3-week)</SelectItem>
            <SelectItem value="kanban">Kanban (Continuous Flow)</SelectItem>
            <SelectItem value="hybrid">Hybrid (Phases + Sprints)</SelectItem>
            <SelectItem value="milestone">Milestone-Driven</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Milestones */}
      <ListField label="Key Milestones" items={formData.milestones} fieldKey="milestones" placeholder="e.g., Phase 1 Complete - Core API & Auth" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} numbered prefix="M" />

      {/* Client Dependencies */}
      <ListField label="Client Dependencies" items={formData.clientDependencies} fieldKey="clientDependencies" placeholder="e.g., API documentation, Design assets by Week 2" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Dependency" />

      <SectionHeading>Team</SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Estimated Team Size</FieldLabel>
          <Select value={formData.teamSize} onValueChange={(v) => updateField("teamSize", v)}>
            <SelectTrigger><SelectValue placeholder="Select team size" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-3">Micro (1-3 contributors)</SelectItem>
              <SelectItem value="4-8">Small (4-8 contributors)</SelectItem>
              <SelectItem value="9-15">Medium (9-15 contributors)</SelectItem>
              <SelectItem value="16-30">Large (16-30 contributors)</SelectItem>
              <SelectItem value="30+">Enterprise (30+ contributors)</SelectItem>
              <SelectItem value="auto">Auto (AI Recommended)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Work Model</FieldLabel>
          <Select value={formData.workModel} onValueChange={(v) => updateField("workModel", v)}>
            <SelectTrigger><SelectValue placeholder="Select work model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fully_remote">Fully Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="on_site">On-Site</SelectItem>
              <SelectItem value="flexible">Flexible / Async</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Roles */}
      <ListField label="Required Roles *" items={formData.roles} fieldKey="roles" placeholder="e.g., Senior React Developer, DevOps Engineer" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Role" />

      {/* Skill Priorities */}
      <div>
        <FieldLabel>Skill Priorities & Preferences</FieldLabel>
        <Textarea placeholder="e.g., Must have TypeScript expertise, prefer contributors with fintech experience" value={formData.skillPriorities} onChange={(e) => updateField("skillPriorities", e.target.value)} className="min-h-[70px]" />
      </div>

      {/* Knowledge Transfer */}
      <div>
        <FieldLabel>Knowledge Transfer</FieldLabel>
        <RadioGroup
          value={formData.knowledgeTransfer}
          onChange={(v) => updateField("knowledgeTransfer", v)}
          options={[
            { value: "not_required", label: "Not Required" },
            { value: "basic", label: "Basic Documentation" },
            { value: "comprehensive", label: "Comprehensive (Sessions + Docs)" },
          ]}
        />
      </div>

      <SectionHeading>Testing</SectionHeading>

      {/* SIT Scope */}
      <div>
        <FieldLabel>System Integration Testing (SIT)</FieldLabel>
        <RadioGroup
          value={formData.sitScope}
          onChange={(v) => updateField("sitScope", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            { value: "in_scope", label: "In Scope" },
          ]}
        />
      </div>

      {/* UAT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>UAT Ownership</FieldLabel>
          <Input value={formData.uatOwnership} disabled className="bg-gray-50" />
        </div>
        <div>
          <FieldLabel>UAT Duration</FieldLabel>
          <Input placeholder="e.g., 2 weeks" value={formData.uatDuration} onChange={(e) => updateField("uatDuration", e.target.value)} />
        </div>
        <div>
          <FieldLabel>UAT Sign-off Authority</FieldLabel>
          <Input placeholder="e.g., Product Owner" value={formData.uatSignoffAuthority} onChange={(e) => updateField("uatSignoffAuthority", e.target.value)} />
        </div>
      </div>

      {/* Pre-production, Performance, Security testing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Pre-Production Testing</FieldLabel>
          <RadioGroup
            value={formData.preProductionTesting}
            onChange={(v) => updateField("preProductionTesting", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Performance Testing</FieldLabel>
          <RadioGroup
            value={formData.performanceTesting}
            onChange={(v) => updateField("performanceTesting", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Security Testing</FieldLabel>
          <RadioGroup
            value={formData.securityTesting}
            onChange={(v) => updateField("securityTesting", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
      </div>

      {/* Defect SLA */}
      <div>
        <FieldLabel>Defect SLA</FieldLabel>
        <Input placeholder="e.g., Critical: 4hrs, High: 24hrs, Medium: 3 days" value={formData.defectSLA} onChange={(e) => updateField("defectSLA", e.target.value)} />
      </div>
    </div>
  );
}


/* ================================================================
   STEP 5 — Budget & Risk (MANDATORY)
   ================================================================ */
function Step5BudgetRisk({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define budget range, pricing model, and risk profile. This calibrates the AI to generate appropriately scoped deliverables within your constraints.
      </p>

      <SectionHeading>Budget</SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel required>Budget Minimum</FieldLabel>
          <Input
            type="number"
            min="0"
            placeholder="e.g., 50000"
            value={formData.budgetMin}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || Number(val) >= 0) updateField("budgetMin", val);
            }}
            onBlur={onBlur("budgetMin")}
            style={formData.budgetMin && Number(formData.budgetMin) < 0 ? { borderColor: "rgba(192,68,68,0.5)" } : {}}
          />
          {formData.budgetMin && Number(formData.budgetMin) < 0 && (
            <p style={{ fontSize: 11, color: "#983030", marginTop: 4 }}>Budget cannot be negative</p>
          )}
          <FieldError error={errors.budgetMin} />
        </div>
        <div>
          <FieldLabel required>Budget Maximum</FieldLabel>
          <Input
            type="number"
            min="0"
            placeholder="e.g., 150000"
            value={formData.budgetMax}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || Number(val) >= 0) updateField("budgetMax", val);
            }}
            onBlur={onBlur("budgetMax")}
            style={
              (formData.budgetMax && Number(formData.budgetMax) < 0) ||
              (formData.budgetMin && formData.budgetMax && Number(formData.budgetMin) >= 0 && Number(formData.budgetMax) >= 0 && Number(formData.budgetMax) < Number(formData.budgetMin))
                ? { borderColor: "rgba(192,68,68,0.5)" }
                : {}
            }
          />
          {formData.budgetMax && Number(formData.budgetMax) < 0 && (
            <p style={{ fontSize: 11, color: "#983030", marginTop: 4 }}>Budget cannot be negative</p>
          )}
          {formData.budgetMin && formData.budgetMax && Number(formData.budgetMin) >= 0 && Number(formData.budgetMax) >= 0 && Number(formData.budgetMax) < Number(formData.budgetMin) && (
            <p style={{ fontSize: 11, color: "#983030", marginTop: 4 }}>Maximum must be greater than or equal to minimum</p>
          )}
          <FieldError error={errors.budgetMax} />
        </div>
        <div>
          <FieldLabel>Currency</FieldLabel>
          <Select value={formData.currency} onValueChange={(v) => updateField("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (&#8364;)</SelectItem>
              <SelectItem value="GBP">GBP (&#163;)</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="INR">INR (&#8377;)</SelectItem>
              <SelectItem value="PKR">PKR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Model */}
      <div>
        <FieldLabel required>Pricing Model</FieldLabel>
        <RadioGroup
          value={formData.pricingModel}
          onChange={(v) => updateField("pricingModel", v)}
          options={[
            { value: "fixed_price", label: "Fixed Price" },
            { value: "t_and_m", label: "T&M" },
            { value: "outcome_based", label: "Outcome-Based" },
            { value: "hybrid", label: "Hybrid" },
          ]}
        />
        <FieldError error={errors.pricingModel} />
      </div>

      {/* Breakdown Preference */}
      <div>
        <FieldLabel>Breakdown Preference</FieldLabel>
        <Select value={formData.breakdownPreference} onValueChange={(v) => updateField("breakdownPreference", v)}>
          <SelectTrigger><SelectValue placeholder="How should budget be broken down?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="by_phase">By Phase / Milestone</SelectItem>
            <SelectItem value="by_team">By Team / Role</SelectItem>
            <SelectItem value="by_deliverable">By Deliverable</SelectItem>
            <SelectItem value="fixed_monthly">Fixed Monthly Allocation</SelectItem>
            <SelectItem value="time_materials">Time & Materials</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SectionHeading>Risk</SectionHeading>

      {/* Known Risks */}
      <ListField label="Known Risks *" items={formData.knownRisks} fieldKey="knownRisks" placeholder="e.g., Third-party API dependency may have rate limits" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Risk" icon={AlertTriangle} error={errors.knownRisks} onBlur={onBlur("knownRisks")} />

      {/* Project Constraints */}
      <div>
        <FieldLabel>Project Constraints</FieldLabel>
        <Textarea placeholder="e.g., Must not exceed 6-month timeline, limited to approved vendor list" value={formData.projectConstraints} onChange={(e) => updateField("projectConstraints", e.target.value)} className="min-h-[70px]" />
      </div>

      {/* Contingency & Escalation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Contingency Budget</FieldLabel>
          <Select value={formData.contingencyBudget} onValueChange={(v) => updateField("contingencyBudget", v)}>
            <SelectTrigger><SelectValue placeholder="Select contingency %" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5% of total budget</SelectItem>
              <SelectItem value="10">10% of total budget</SelectItem>
              <SelectItem value="15">15% of total budget</SelectItem>
              <SelectItem value="20">20% of total budget</SelectItem>
              <SelectItem value="custom">Custom Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Escalation Process</FieldLabel>
          <Select value={formData.escalationProcess} onValueChange={(v) => updateField("escalationProcess", v)}>
            <SelectTrigger><SelectValue placeholder="Select escalation model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tiered">{"Tiered (L1 \u2192 L2 \u2192 L3)"}</SelectItem>
              <SelectItem value="direct">Direct to Stakeholder</SelectItem>
              <SelectItem value="committee">Steering Committee</SelectItem>
              <SelectItem value="apg_governed">APG-Governed Auto-Escalation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TipBox icon={DollarSign} variant="gold" title="Budget AI:">
        Providing a range instead of a fixed number allows the AI to optimize scope across high/medium/low priority deliverables and flag budget-risk items.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 6 — Quality Standards (SKIPPABLE)
   ================================================================ */
function Step6QualityStandards({ formData, updateField, errors = {}, blurField }: { formData: FormData; updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void; errors?: StepErrors; blurField?: (field: string) => void }) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define acceptance criteria, SLA targets, and quality gates. These become enforceable checkpoints in the generated SOW and feed into APG governance.
      </p>

      {/* Acceptance Criteria */}
      <div>
        <FieldLabel required>Acceptance Criteria</FieldLabel>
        <Textarea placeholder="Describe what constitutes acceptable delivery. e.g., code coverage > 80%, WCAG 2.1 AA (min 30, max 3000 chars)" value={formData.acceptanceCriteria} onChange={(e) => updateField("acceptanceCriteria", e.target.value)} className="min-h-[100px]" />
      </div>

      {/* SLA & Code Review */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>SLA / Uptime Target</FieldLabel>
          <Select value={formData.slaUptime} onValueChange={(v) => updateField("slaUptime", v)}>
            <SelectTrigger><SelectValue placeholder="Select SLA target" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="99.9">99.9% (Three Nines)</SelectItem>
              <SelectItem value="99.95">99.95%</SelectItem>
              <SelectItem value="99.99">99.99% (Four Nines)</SelectItem>
              <SelectItem value="best_effort">Best Effort</SelectItem>
              <SelectItem value="na">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Code Review Policy</FieldLabel>
          <Select value={formData.codeReviewPolicy} onValueChange={(v) => updateField("codeReviewPolicy", v)}>
            <SelectTrigger><SelectValue placeholder="Select code review approach" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="peer">Peer Review (1 reviewer)</SelectItem>
              <SelectItem value="senior">Senior Review Required</SelectItem>
              <SelectItem value="two_reviewers">Two Reviewers Required</SelectItem>
              <SelectItem value="mentor_review">Mentor-Guided Review</SelectItem>
              <SelectItem value="ai_assisted">AI-Assisted + Human Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documentation Requirements */}
      <div>
        <FieldLabel>Documentation Requirements</FieldLabel>
        <CheckboxGroup
          values={formData.documentationRequirements}
          onChange={(v) => updateField("documentationRequirements", v)}
          options={[
            { value: "technical", label: "Technical Docs" },
            { value: "user", label: "User Guide" },
            { value: "deployment", label: "Deployment Guide" },
            { value: "none", label: "None" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </div>

      {/* Browser Compatibility */}
      <div>
        <FieldLabel>Browser Compatibility</FieldLabel>
        <CheckboxGroup
          values={formData.browserCompatibility}
          onChange={(v) => updateField("browserCompatibility", v)}
          options={[
            { value: "chrome", label: "Chrome" },
            { value: "firefox", label: "Firefox" },
            { value: "safari", label: "Safari" },
            { value: "edge", label: "Edge" },
          ]}
        />
      </div>

      {/* Device Compatibility */}
      <div>
        <FieldLabel>Device Compatibility</FieldLabel>
        <CheckboxGroup
          values={formData.deviceCompatibility}
          onChange={(v) => updateField("deviceCompatibility", v)}
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "tablet", label: "Tablet" },
            { value: "mobile", label: "Mobile" },
          ]}
        />
      </div>

      {/* Reporting, Offline, Localisation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Reporting Scope</FieldLabel>
          <RadioGroup
            value={formData.reportingScope}
            onChange={(v) => updateField("reportingScope", v)}
            options={[
              { value: "not_in_scope", label: "Not in Scope" },
              { value: "in_scope", label: "In Scope" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Offline Support</FieldLabel>
          <RadioGroup
            value={formData.offlineSupport}
            onChange={(v) => updateField("offlineSupport", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Localisation</FieldLabel>
          <RadioGroup
            value={formData.localisation}
            onChange={(v) => updateField("localisation", v)}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
      </div>

      <TipBox icon={ShieldCheck} variant="forest" title="Quality Gates:">
        These criteria will be embedded as automated quality gates in the APG, ensuring every deliverable meets your standards before acceptance.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 7 — Governance & Compliance (MANDATORY)
   ================================================================ */
function Step7GovernanceCompliance({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Specify governance framework, compliance requirements, and data protection standards. The AI will embed compliance clauses into the generated SOW.
      </p>

      {/* Non-Discrimination Confirm — HARD BLOCK */}
      <div className="rounded-xl" style={{
        padding: 16,
        background: formData.nonDiscriminationConfirm ? 'rgba(77,87,65,0.04)' : 'rgba(166,119,99,0.04)',
        border: `1px solid ${formData.nonDiscriminationConfirm ? 'rgba(77,87,65,0.18)' : 'rgba(166,119,99,0.18)'}`,
      }}>
        <div className="flex items-start gap-3">
          <div style={{ marginTop: 2 }}>
            <button
              type="button"
              onClick={() => updateField("nonDiscriminationConfirm", !formData.nonDiscriminationConfirm)}
              className="flex items-center justify-center rounded-md transition-all"
              style={{
                width: 20, height: 20,
                border: `2px solid ${formData.nonDiscriminationConfirm ? '#4D5741' : '#A67763'}`,
                background: formData.nonDiscriminationConfirm ? '#4D5741' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {formData.nonDiscriminationConfirm && <Check style={{ width: 12, height: 12, color: '#FFFFFF' }} />}
            </button>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
              Non-Discrimination Confirmation *
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              I confirm that this project complies with all applicable non-discrimination laws and will not discriminate based on race, gender, religion, disability, or any other protected characteristic.
            </p>
            {!formData.nonDiscriminationConfirm && (
              <p style={{ fontSize: 10, color: '#A67763', fontWeight: 600, marginTop: 6 }}>
                This confirmation is mandatory to proceed with SOW generation.
              </p>
            )}
            <FieldError error={errors.nonDiscriminationConfirm} />
          </div>
        </div>
      </div>

      {/* Labour Standards */}
      <div>
        <FieldLabel required>Labour Standards</FieldLabel>
        <Select value={formData.labourStandards} onValueChange={(v) => updateField("labourStandards", v)}>
          <SelectTrigger><SelectValue placeholder="Select labour standards" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ilo_compliant">ILO Compliant</SelectItem>
            <SelectItem value="local_law">Local Law Only</SelectItem>
            <SelectItem value="enhanced">Enhanced Standards</SelectItem>
            <SelectItem value="fair_trade">Fair Trade Certified</SelectItem>
          </SelectContent>
        </Select>
        <FieldError error={errors.labourStandards} />
      </div>

      {/* Accessibility */}
      <div>
        <FieldLabel>Accessibility Requirements</FieldLabel>
        <Select value={formData.accessibilityRequirements} onValueChange={(v) => updateField("accessibilityRequirements", v)}>
          <SelectTrigger><SelectValue placeholder="Select accessibility level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="wcag_aa">WCAG 2.1 AA</SelectItem>
            <SelectItem value="wcag_aaa">WCAG 2.1 AAA</SelectItem>
            <SelectItem value="section_508">Section 508</SelectItem>
            <SelectItem value="basic">Basic Accessibility</SelectItem>
            <SelectItem value="none">None Required</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prohibited Categories */}
      <div>
        <FieldLabel>Prohibited Categories</FieldLabel>
        <CheckboxGroup
          values={formData.prohibitedCategories}
          onChange={(v) => updateField("prohibitedCategories", v)}
          options={[
            { value: "weapons", label: "Weapons" },
            { value: "gambling", label: "Gambling" },
            { value: "tobacco", label: "Tobacco" },
            { value: "adult_content", label: "Adult Content" },
            { value: "surveillance", label: "Surveillance" },
            { value: "cryptocurrency", label: "Cryptocurrency" },
          ]}
        />
      </div>

      <SectionHeading>Data Privacy</SectionHeading>

      {/* Personal Data Involved */}
      <div>
        <FieldLabel required>Personal Data Involved</FieldLabel>
        <RadioGroup
          value={formData.personalDataInvolved}
          onChange={(v) => updateField("personalDataInvolved", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
      </div>

      {/* Conditional: Privacy Laws */}
      {formData.personalDataInvolved === "yes" && (
        <>
          <div>
            <FieldLabel>Applicable Privacy Laws</FieldLabel>
            <CheckboxGroup
              values={formData.privacyLaws}
              onChange={(v) => updateField("privacyLaws", v)}
              options={[
                { value: "gdpr", label: "GDPR" },
                { value: "ccpa", label: "CCPA" },
                { value: "hipaa", label: "HIPAA" },
                { value: "pdpa", label: "PDPA" },
                { value: "lgpd", label: "LGPD" },
                { value: "popia", label: "POPIA" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>DPA Required</FieldLabel>
            <RadioGroup
              value={formData.dpaRequired}
              onChange={(v) => updateField("dpaRequired", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </div>
        </>
      )}

      {/* Privacy Impact Status */}
      <div>
        <FieldLabel>Privacy Impact Assessment Status</FieldLabel>
        <Select value={formData.privacyImpactStatus} onValueChange={(v) => updateField("privacyImpactStatus", v)}>
          <SelectTrigger><SelectValue placeholder="Select PIA status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not_required">Not Required</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SectionHeading>Data Security</SectionHeading>

      {/* Data Sensitivity */}
      <div>
        <FieldLabel required>Data Sensitivity Level</FieldLabel>
        <Select value={formData.dataSensitivity} onValueChange={(v) => updateField("dataSensitivity", v)}>
          <SelectTrigger><SelectValue placeholder="Select sensitivity level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public Data</SelectItem>
            <SelectItem value="internal">Internal / Confidential</SelectItem>
            <SelectItem value="sensitive">Sensitive (PII/PHI)</SelectItem>
            <SelectItem value="restricted">Restricted / Top Secret</SelectItem>
            <SelectItem value="regulated">Regulated Industry Data</SelectItem>
          </SelectContent>
        </Select>
        <FieldError error={errors.dataSensitivity} />
      </div>

      {/* Encryption */}
      <div>
        <FieldLabel>Encryption Requirements</FieldLabel>
        <Select value={formData.encryptionRequirements} onValueChange={(v) => updateField("encryptionRequirements", v)}>
          <SelectTrigger><SelectValue placeholder="Select encryption level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (TLS 1.2+)</SelectItem>
            <SelectItem value="enhanced">Enhanced (TLS 1.3 + AES-256)</SelectItem>
            <SelectItem value="e2e">End-to-End Encryption</SelectItem>
            <SelectItem value="fips">FIPS 140-2 Compliant</SelectItem>
            <SelectItem value="custom">Custom Requirements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Regulatory Frameworks */}
      <ListField label="Regulatory Frameworks" items={formData.regulatoryFrameworks} fieldKey="regulatoryFrameworks" placeholder="e.g., SOC 2 Type II, PCI-DSS, ISO 27001" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} icon={ShieldCheck} addLabel="Add Framework" />

      {/* Data Residency */}
      <div>
        <FieldLabel>Data Residency</FieldLabel>
        <Select value={formData.dataResidency} onValueChange={(v) => updateField("dataResidency", v)}>
          <SelectTrigger><SelectValue placeholder="Select data residency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="eu">European Union</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="india">India</SelectItem>
            <SelectItem value="uae">UAE</SelectItem>
            <SelectItem value="multi_region">Multi-Region</SelectItem>
            <SelectItem value="no_restriction">No Restriction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Access Control */}
      <div>
        <FieldLabel>Access Control Model</FieldLabel>
        <Select value={formData.accessControl} onValueChange={(v) => updateField("accessControl", v)}>
          <SelectTrigger><SelectValue placeholder="Select access control approach" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rbac">Role-Based (RBAC)</SelectItem>
            <SelectItem value="abac">Attribute-Based (ABAC)</SelectItem>
            <SelectItem value="zero_trust">Zero Trust Architecture</SelectItem>
            <SelectItem value="mfa_required">MFA Required for All Users</SelectItem>
            <SelectItem value="sso">SSO / Federated Identity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TipBox icon={Scale} variant="forest" title="Compliance:">
        The non-discrimination confirmation is a hard gate. SOW generation cannot proceed without it. All governance fields are embedded as compliance clauses.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 8 — Commercial & Legal (MANDATORY)
   ================================================================ */
function Step8CommercialLegal({ formData, updateField, errors = {}, blurField }: { formData: FormData; updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void; errors?: StepErrors; blurField?: (field: string) => void }) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define intellectual property, commercial terms, and legal provisions. These clauses are critical for the generated SOW&apos;s enforceability.
      </p>

      <SectionHeading>Intellectual Property</SectionHeading>

      {/* IP Ownership */}
      <div>
        <FieldLabel required>IP Ownership</FieldLabel>
        <RadioGroup
          value={formData.ipOwnership}
          onChange={(v) => updateField("ipOwnership", v)}
          options={[
            { value: "client", label: "Client Owns All IP" },
            { value: "vendor", label: "Vendor Retains IP" },
            { value: "shared", label: "Shared / Joint IP" },
            { value: "license", label: "License to Client" },
          ]}
        />
        <FieldError error={errors.ipOwnership} />
      </div>

      {/* Source Code Ownership */}
      <div>
        <FieldLabel required>Source Code Ownership</FieldLabel>
        <RadioGroup
          value={formData.sourceCodeOwnership}
          onChange={(v) => updateField("sourceCodeOwnership", v)}
          options={[
            { value: "client", label: "Client" },
            { value: "vendor", label: "Vendor" },
            { value: "escrow", label: "Escrow" },
          ]}
        />
        <FieldError error={errors.sourceCodeOwnership} />
      </div>

      {/* Reference Rights */}
      <div>
        <FieldLabel required>Reference Rights</FieldLabel>
        <RadioGroup
          value={formData.referenceRights}
          onChange={(v) => updateField("referenceRights", v)}
          options={[
            { value: "allowed", label: "Allowed" },
            { value: "with_approval", label: "With Approval" },
            { value: "not_allowed", label: "Not Allowed" },
          ]}
        />
        <FieldError error={errors.referenceRights} />
      </div>

      {/* Open Source Policy */}
      <div>
        <FieldLabel>Open Source Policy</FieldLabel>
        <RadioGroup
          value={formData.openSourcePolicy}
          onChange={(v) => updateField("openSourcePolicy", v)}
          options={[
            { value: "permissive_only", label: "Permissive Only (MIT/Apache)" },
            { value: "copyleft_allowed", label: "Copyleft Allowed" },
            { value: "no_open_source", label: "No Open Source" },
            { value: "case_by_case", label: "Case by Case" },
          ]}
        />
      </div>

      <SectionHeading>Commercial Terms</SectionHeading>

      {/* Third Party Costs */}
      <div>
        <FieldLabel required>Third-Party Costs</FieldLabel>
        <RadioGroup
          value={formData.thirdPartyCosts}
          onChange={(v) => updateField("thirdPartyCosts", v)}
          options={[
            { value: "included", label: "Included in Budget" },
            { value: "client_pays", label: "Client Pays Directly" },
            { value: "pass_through", label: "Pass-Through" },
            { value: "not_applicable", label: "Not Applicable" },
          ]}
        />
        <FieldError error={errors.thirdPartyCosts} />
      </div>

      {/* Warranty Period */}
      <div>
        <FieldLabel required>Warranty Period</FieldLabel>
        <Select value={formData.warrantyPeriod} onValueChange={(v) => updateField("warrantyPeriod", v)}>
          <SelectTrigger><SelectValue placeholder="Select warranty period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30_days">30 Days</SelectItem>
            <SelectItem value="60_days">60 Days</SelectItem>
            <SelectItem value="90_days">90 Days</SelectItem>
            <SelectItem value="6_months">6 Months</SelectItem>
            <SelectItem value="12_months">12 Months</SelectItem>
            <SelectItem value="none">No Warranty</SelectItem>
          </SelectContent>
        </Select>
        <FieldError error={errors.warrantyPeriod} />
      </div>

      {/* Post-Warranty Support */}
      <div>
        <FieldLabel>Post-Warranty Support</FieldLabel>
        <RadioGroup
          value={formData.postWarrantySupport}
          onChange={(v) => updateField("postWarrantySupport", v)}
          options={[
            { value: "not_required", label: "Not Required" },
            { value: "optional", label: "Optional (Separate Contract)" },
            { value: "included", label: "Included" },
          ]}
        />
      </div>

      <SectionHeading>Change Management</SectionHeading>

      {/* Change Request Process */}
      <div>
        <FieldLabel required>Change Request Process</FieldLabel>
        <RadioGroup
          value={formData.changeRequestProcess}
          onChange={(v) => updateField("changeRequestProcess", v)}
          options={[
            { value: "formal_cr", label: "Formal CR Process" },
            { value: "agile_backlog", label: "Agile Backlog Adjustment" },
            { value: "steering_committee", label: "Steering Committee Approval" },
          ]}
        />
        <FieldError error={errors.changeRequestProcess} />
      </div>

      {/* Conditional: Change Request Approver */}
      {formData.changeRequestProcess && (
        <div>
          <FieldLabel>Change Request Approver</FieldLabel>
          <Input placeholder="e.g., Project Director, CTO" value={formData.changeRequestApprover} onChange={(e) => updateField("changeRequestApprover", e.target.value)} />
        </div>
      )}

      {/* Environment Costs */}
      <div>
        <FieldLabel>Environment Costs</FieldLabel>
        <RadioGroup
          value={formData.environmentCosts}
          onChange={(v) => updateField("environmentCosts", v)}
          options={[
            { value: "included", label: "Included" },
            { value: "client_pays", label: "Client Pays" },
            { value: "shared", label: "Shared" },
          ]}
        />
      </div>

      <TipBox icon={Gavel} variant="brown" title="Legal note:">
        IP ownership and change request clauses are critical for contract enforceability. The AI will structure these as formal contract sections.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 9 — Review & Generate
   ================================================================ */
function Step9ReviewGenerate({ formData, updateField, aiConfidence, isStepComplete, skippedSteps, setCurrentStep, errors = {}, blurField }: {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  aiConfidence: number;
  isStepComplete: (step: number) => boolean;
  skippedSteps: Set<number>;
  setCurrentStep: (step: number) => void;
  errors?: StepErrors;
  blurField?: (field: string) => void;
}) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Review your inputs, assign approvers, and generate the SOW. All mandatory steps must be complete before generation.
      </p>

      {/* Approvers */}
      <SectionHeading>Approvers</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Business Owner / Approver</FieldLabel>
          <Input placeholder="e.g., John Smith, VP Engineering" value={formData.businessOwnerApprover} onChange={(e) => updateField("businessOwnerApprover", e.target.value)} onBlur={onBlur("businessOwnerApprover")} />
          <FieldError error={errors.businessOwnerApprover} />
        </div>
        <div>
          <FieldLabel required>Final Approver</FieldLabel>
          <Input placeholder="e.g., Jane Doe, CTO" value={formData.finalApprover} onChange={(e) => updateField("finalApprover", e.target.value)} onBlur={onBlur("finalApprover")} />
          <FieldError error={errors.finalApprover} />
        </div>
        <div>
          <FieldLabel>Legal Reviewer</FieldLabel>
          <Input placeholder="e.g., Legal Department (optional)" value={formData.legalReviewer} onChange={(e) => updateField("legalReviewer", e.target.value)} />
        </div>
        <div>
          <FieldLabel>Security Reviewer</FieldLabel>
          <Input placeholder="e.g., CISO / Security Team (optional)" value={formData.securityReviewer} onChange={(e) => updateField("securityReviewer", e.target.value)} />
        </div>
      </div>

      {/* AI Confidence line */}
      <div className="flex items-center justify-between" style={{
        padding: '10px 16px', borderRadius: 8,
        background: aiConfidence >= 70 ? 'rgba(77,87,65,0.05)' : aiConfidence >= 40 ? 'rgba(208,176,96,0.05)' : 'rgba(166,119,99,0.04)',
        border: `1px solid ${aiConfidence >= 70 ? 'rgba(77,87,65,0.14)' : aiConfidence >= 40 ? 'rgba(208,176,96,0.18)' : 'rgba(166,119,99,0.14)'}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: aiConfidence >= 70 ? '#344028' : aiConfidence >= 40 ? '#7A6030' : '#6A4C3F' }}>
          {aiConfidence >= 70 ? "High Confidence" : aiConfidence >= 40 ? "Moderate Confidence" : "Low Confidence"}
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          AI Confidence: {aiConfidence}%
        </span>
      </div>

      {/* Step completion indicators */}
      <SectionHeading>Step Completion</SectionHeading>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
        {STEPS.map((step, idx) => {
          const complete = isStepComplete(idx);
          const skipped = skippedSteps.has(idx) && !complete;
          const isMandatory = step.mandatory;
          const incomplete = !complete && !skipped;
          const statusColor = complete ? '#4D5741' : skipped ? '#C4A24E' : isMandatory ? '#A67763' : 'var(--ink-faint)';
          const statusLabel = complete ? 'Complete' : skipped ? 'Skipped' : (isMandatory && incomplete) ? 'Incomplete' : 'Not filled';

          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className="flex items-center w-full transition-colors"
              style={{
                padding: '9px 16px',
                background: idx % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(249,245,241,0.25)',
                borderBottom: idx < STEPS.length - 1 ? '1px solid var(--border-hair)' : 'none',
                gap: 10,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {/* Status dot */}
              <div className="shrink-0" style={{
                width: 10, height: 10, borderRadius: '50%',
                background: statusColor,
              }} />
              {/* Step label */}
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mid)', width: 180, flexShrink: 0, textAlign: 'left' }}>
                {step.label}
              </span>
              {/* Status */}
              <span className="truncate" style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>
                {statusLabel}
              </span>
              {/* Mandatory badge */}
              {isMandatory && (
                <span style={{
                  marginLeft: 'auto', fontSize: 8, fontWeight: 700, color: '#A67763',
                  padding: '1px 5px', borderRadius: 3, background: 'rgba(166,119,99,0.06)',
                  letterSpacing: '0.04em',
                }}>
                  REQ
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary rows */}
      <SectionHeading>Quick Summary</SectionHeading>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
        {[
          { label: "Project", value: formData.title || "\u2014", filled: formData.title.trim().length >= 3 },
          { label: "Client", value: formData.client || "\u2014", filled: formData.client.trim().length >= 2 },
          { label: "Industry", value: formData.industry ? formData.industry.charAt(0).toUpperCase() + formData.industry.slice(1) : "\u2014", filled: formData.industry.length > 0 },
          { label: "Platform", value: formData.platformType ? formData.platformType.replace(/_/g, ' ') : "\u2014", filled: formData.platformType.length > 0 },
          { label: "Vision", value: formData.projectVision ? formData.projectVision.slice(0, 60) + (formData.projectVision.length > 60 ? "\u2026" : "") : "\u2014", filled: formData.projectVision.trim().length >= 50 },
          { label: "Tech Stack", value: formData.techStack ? formData.techStack.slice(0, 60) + (formData.techStack.length > 60 ? "\u2026" : "") : "\u2014", filled: formData.techStack.trim().length >= 10 },
          { label: "Budget", value: formData.budgetMin || formData.budgetMax ? `${formData.currency} ${formData.budgetMin || "?"} \u2013 ${formData.budgetMax || "?"}` : "\u2014", filled: parseFloat(formData.budgetMin) > 0 },
          { label: "Pricing", value: formData.pricingModel ? formData.pricingModel.replace(/_/g, ' ') : "\u2014", filled: formData.pricingModel.length > 0 },
          { label: "Governance", value: formData.nonDiscriminationConfirm ? "Confirmed" : "Not confirmed", filled: formData.nonDiscriminationConfirm },
          { label: "IP", value: formData.ipOwnership ? formData.ipOwnership.charAt(0).toUpperCase() + formData.ipOwnership.slice(1) : "\u2014", filled: formData.ipOwnership.length > 0 },
          { label: "Approver", value: formData.businessOwnerApprover || "\u2014", filled: formData.businessOwnerApprover.trim().length > 0 },
        ].map((row, idx, arr) => (
          <div key={row.label} className="flex items-center" style={{
            padding: '9px 16px',
            background: idx % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(249,245,241,0.25)',
            borderBottom: idx < arr.length - 1 ? '1px solid var(--border-hair)' : 'none',
            gap: 10,
          }}>
            {row.filled
              ? <CheckCircle2 className="shrink-0" style={{ width: 13, height: 13, color: '#4D5741' }} />
              : <div className="shrink-0" style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid var(--border-soft)' }} />
            }
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mid)', width: 88, flexShrink: 0 }}>{row.label}</span>
            <span className="truncate" style={{ fontSize: 12, color: row.filled ? 'var(--ink)' : 'var(--ink-faint)' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
