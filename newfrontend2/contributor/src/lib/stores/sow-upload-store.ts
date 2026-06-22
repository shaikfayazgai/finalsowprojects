import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UploadProcessingState,
  UploadedFileInfo,
  ExtractionIntelligenceReport,
  ExtractionItem,
  ExtractionReviewState,
  GapItem,
  CommercialDetailsForm,
  CommercialSectionKey,
  CommercialSectionStatus,
  PreviewConfirmState,
  ApprovalAuthorities,
} from "@/types/enterprise";

/* ── File Object URL (module-level, not serialized to localStorage) ──
   Object URLs created via URL.createObjectURL() are valid only within the
   current browser session. They cannot be persisted to localStorage, so
   we store them outside the Zustand persist middleware. */
let _fileObjectUrl: string | null = null;

export function setFileObjectUrl(url: string) {
  if (_fileObjectUrl) URL.revokeObjectURL(_fileObjectUrl);
  _fileObjectUrl = url;
}
export function getFileObjectUrl(): string | null {
  return _fileObjectUrl;
}
export function clearFileObjectUrl() {
  if (_fileObjectUrl) URL.revokeObjectURL(_fileObjectUrl);
  _fileObjectUrl = null;
}

/* ── Default form shape ── */

const emptyCommercialDetails: CommercialDetailsForm = {
  businessContext: {
    projectVision: "", businessObjectives: [], painPoints: [],
    businessCriticality: "", currentState: "", desiredFutureState: "",
    endUserProfiles: [], successMetrics: [], definitionOfSuccess: "",
  },
  deliveryScope: {
    developmentScope: [], uiuxDesignScope: "", uiuxDetails: [],
    deploymentScope: "", cloudProvider: "", goLiveScope: "",
    hypercareDuration: "", dataMigrationScope: "", dataMigrationDetails: "",
  },
  techIntegrations: {
    technologyStack: "", scalabilityRequirements: "",
    thirdPartyIntegrations: [], userManagementScope: "", ssoRequired: false,
  },
  timelineTeam: {
    startDate: "", targetEndDate: "", phasingStrategy: "",
    milestones: [], estimatedTeamSize: "", workModel: "",
    requiredRoles: [], uatOwnership: "", uatDuration: "",
    uatSignOffAuthority: "", uatSignOffConfirmed: false,
  },
  budgetRisk: {
    budgetMinimum: 0, budgetMaximum: 0, currency: "USD",
    pricingModel: "", knownRisks: [], contingencyPercent: "",
  },
  governance: {
    nonDiscriminationConfirmed: false, dataSensitivityLevel: "",
    personalDataInvolved: "", applicablePrivacyLaw: [],
    dpaRequired: "", regulatoryFrameworks: [], dataResidency: "",
  },
  commercialLegal: {
    ipOwnership: "", sourceCodeOwnership: "", portfolioReferenceRights: "",
    thirdPartyCosts: "", warrantyPeriod: "", changeRequestProcess: "",
    changeRequestApprover: "",
  },
};

const defaultSectionStatus: Record<CommercialSectionKey, CommercialSectionStatus> = {
  businessContext: "not_started",
  deliveryScope: "not_started",
  techIntegrations: "not_started",
  timelineTeam: "not_started",
  budgetRisk: "not_started",
  governance: "not_started",
  commercialLegal: "not_started",
};

/* ── Store shape ── */

interface SOWUploadState {
  /* Flow position */
  currentFlowStep: number; // 1=Upload 2=Report 3=Review 4=Gaps 5=Details 6=Generate 7=Preview
  setFlowStep: (step: number) => void;

  /* Last section the user was on inside the Commercial Details page */
  activeCommercialSection: CommercialSectionKey;
  setActiveCommercialSection: (key: CommercialSectionKey) => void;

  /* Upload */
  uploadedFile: UploadedFileInfo | null;
  projectTitle: string;
  clientOrganisation: string;
  linkedSowId: string | null;
  uploadedSowId: string | null;
  processingState: UploadProcessingState;
  setFile: (f: UploadedFileInfo) => void;
  clearFile: () => void;
  setProjectTitle: (v: string) => void;
  setClientOrganisation: (v: string) => void;
  setLinkedSowId: (v: string | null) => void;
  setUploadedSowId: (v: string | null) => void;
  setProcessingState: (s: UploadProcessingState) => void;

  /* Extraction Intelligence Report */
  extractionReport: ExtractionIntelligenceReport | null;
  setExtractionReport: (r: ExtractionIntelligenceReport) => void;

  /* Parsed SOW Review */
  extractionItems: ExtractionItem[];
  setExtractionItems: (items: ExtractionItem[]) => void;
  updateExtractionReviewState: (id: string, state: ExtractionReviewState, editedText?: string) => void;
  acceptAllPending: () => void;

  /* Gap Analysis */
  gapItems: GapItem[];
  setGapItems: (items: GapItem[]) => void;
  resolveGap: (id: string) => void;
  acknowledgeGap: (id: string) => void;
  dismissGap: (id: string) => void;
  setGapRemediation: (id: string, suggestions: string[]) => void;

  /* Commercial & Project Details */
  commercialDetails: CommercialDetailsForm;
  commercialSectionStatus: Record<CommercialSectionKey, CommercialSectionStatus>;
  approvalAuthorities: ApprovalAuthorities;
  updateCommercialSection: <K extends CommercialSectionKey>(key: K, data: Partial<CommercialDetailsForm[K]>) => void;
  markSectionComplete: (key: CommercialSectionKey) => void;
  markSectionInProgress: (key: CommercialSectionKey) => void;
  setApprovalAuthorities: (a: Partial<ApprovalAuthorities>) => void;

  /* Generate & Preview */
  generationState: "idle" | "generating" | "complete";
  previewState: PreviewConfirmState | null;
  setGenerationState: (s: "idle" | "generating" | "complete") => void;
  setPreviewState: (p: PreviewConfirmState | null) => void;
  markDocumentStale: () => void;

  /* Auto-save */
  lastAutoSaved: string | null;
  setLastAutoSaved: (ts: string) => void;

  /* Full reset */
  reset: () => void;
}

export const useSOWUploadStore = create<SOWUploadState>()(
  persist(
    (set) => ({
      /* Flow */
      currentFlowStep: 1,
      setFlowStep: (step) => set({ currentFlowStep: step }),

      /* Active section within Commercial Details */
      activeCommercialSection: "businessContext",
      setActiveCommercialSection: (key) => set({ activeCommercialSection: key }),

      /* Upload */
      uploadedFile: null,
      projectTitle: "",
      clientOrganisation: "",
      linkedSowId: null,
      processingState: "idle",
      uploadedSowId: null,
      setFile: (f) => set({ uploadedFile: f }),
      clearFile: () => set({ uploadedFile: null, processingState: "idle" }),
      setProjectTitle: (v) => set({ projectTitle: v }),
      setClientOrganisation: (v) => set({ clientOrganisation: v }),
      setLinkedSowId: (v) => set({ linkedSowId: v }),
      setUploadedSowId: (v) => set({ uploadedSowId: v }),
      setProcessingState: (s) => set({ processingState: s }),

      /* Extraction Report */
      extractionReport: null,
      setExtractionReport: (r) => set({ extractionReport: r }),

      /* Parsed SOW Review */
      extractionItems: [],
      setExtractionItems: (items) => set({ extractionItems: items }),
      updateExtractionReviewState: (id, state, editedText) =>
        set((s) => ({
          extractionItems: s.extractionItems.map((item) =>
            item.id === id ? { ...item, reviewState: state, ...(editedText !== undefined ? { editedText } : {}) } : item
          ),
        })),
      acceptAllPending: () =>
        set((s) => ({
          extractionItems: s.extractionItems.map((item) =>
            item.reviewState === "pending" ? { ...item, reviewState: "accepted" } : item
          ),
        })),

      /* Gap Analysis */
      gapItems: [],
      setGapItems: (items) => set({ gapItems: items }),
      resolveGap: (id) =>
        set((s) => ({ gapItems: s.gapItems.map((g) => (g.id === id ? { ...g, isResolved: true } : g)) })),
      acknowledgeGap: (id) =>
        set((s) => ({ gapItems: s.gapItems.map((g) => (g.id === id ? { ...g, isAcknowledged: true } : g)) })),
      dismissGap: (id) =>
        set((s) => ({ gapItems: s.gapItems.map((g) => (g.id === id ? { ...g, isDismissed: true } : g)) })),
      setGapRemediation: (id, suggestions) =>
        set((s) => ({ gapItems: s.gapItems.map((g) => (g.id === id ? { ...g, remediationSuggestions: suggestions } : g)) })),

      /* Commercial Details */
      commercialDetails: emptyCommercialDetails,
      commercialSectionStatus: { ...defaultSectionStatus },
      approvalAuthorities: { businessOwnerApprover: "", finalApprover: "", legalComplianceReviewer: "" },
      updateCommercialSection: (key, data) =>
        set((s) => ({
          commercialDetails: {
            ...s.commercialDetails,
            [key]: { ...s.commercialDetails[key], ...data },
          },
          commercialSectionStatus: {
            ...s.commercialSectionStatus,
            [key]: s.commercialSectionStatus[key] === "not_started" ? "in_progress" : s.commercialSectionStatus[key],
          },
        })),
      markSectionComplete: (key) =>
        set((s) => ({ commercialSectionStatus: { ...s.commercialSectionStatus, [key]: "complete" } })),
      markSectionInProgress: (key) =>
        set((s) => ({ commercialSectionStatus: { ...s.commercialSectionStatus, [key]: "in_progress" } })),
      setApprovalAuthorities: (a) =>
        set((s) => ({ approvalAuthorities: { ...s.approvalAuthorities, ...a } })),

      /* Generate & Preview */
      generationState: "idle",
      previewState: null,
      setGenerationState: (s) => set({ generationState: s }),
      setPreviewState: (p) => set({ previewState: p }),
      markDocumentStale: () =>
        set((s) => ({
          previewState: s.previewState ? { ...s.previewState, isStaleDocument: true } : null,
        })),

      /* Auto-save */
      lastAutoSaved: null,
      setLastAutoSaved: (ts) => set({ lastAutoSaved: ts }),

      /* Reset */
      reset: () => {
        clearFileObjectUrl();
        return set({
          currentFlowStep: 1,
          activeCommercialSection: "businessContext",
          uploadedFile: null,
          projectTitle: "",
          clientOrganisation: "",
          linkedSowId: null,
          uploadedSowId: null,
          processingState: "idle",
          extractionReport: null,
          extractionItems: [],
          gapItems: [],
          commercialDetails: emptyCommercialDetails,
          commercialSectionStatus: { ...defaultSectionStatus },
          approvalAuthorities: { businessOwnerApprover: "", finalApprover: "", legalComplianceReviewer: "" },
          generationState: "idle",
          previewState: null,
          lastAutoSaved: null,
        });
      },
    }),
    { name: "gt-sow-upload" }
  )
);
