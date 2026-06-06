"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, FileText, Target, Code2,
  Calendar, DollarSign, Users, ShieldCheck, Lock, AlertTriangle,
  ClipboardCheck, Plus, X, Zap, Check, Loader2, SkipForward, Circle, Lightbulb, Info,
  Link2, Scale, Gavel, Upload, Eye, Pencil, Trash2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { isValidLanguageName, canonicalLanguageName, suggestLanguages } from "@/lib/utils/language-validation";
import { GeneratePreviewContent as SOWAIDraftReviewPage } from "@/components/enterprise/sow/GeneratePreviewContent";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { validateStep, validateField, type StepErrors } from "@/lib/validations/sow-generate";
import {
  Button, Input, Textarea, Label, Select, SelectTrigger, SelectContent,
  SelectItem, SelectValue,
} from "@/components/ui";
import { useCreateWizard, useSaveStep, useSkipStep, useGenerateSOW, useReviewSummary, useWizard } from "@/lib/hooks/use-sow-wizard";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";
import { NavigationGuardModal } from "@/components/enterprise/sow/NavigationGuardModal";

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


/* ── AI wizard formData → ReadOnlyDetailsPreview shape ──
   SOWAIDraftReviewPage's preview is keyed by the manual-flow commercialDetails
   shape (businessContext, deliveryScope, etc.). This adapter projects the
   wizard's flat FormData into that nested shape so the "generating" screen
   shows the user's actual wizard inputs, not the manual flow's state. */
function wizardFormDataToDetails(fd: Record<string, any>): Record<string, any> {
  const budget = {
    budgetMinimum: fd.budgetMin,
    budgetMaximum: fd.budgetMax,
    currency: fd.currency,
  };
  return {
    businessContext: {
      projectVision: fd.projectVision,
      businessCriticality: fd.businessCriticality,
      currentState: fd.currentState,
      desiredFutureState: fd.desiredFutureState,
      definitionOfSuccess: fd.definitionOfSuccess,
    },
    deliveryScope: {
      developmentScope: Array.isArray(fd.developmentScope) ? fd.developmentScope.join(", ") : fd.developmentScope,
      uiuxDesignScope: fd.uiuxDesignScope,
      deploymentScope: fd.deploymentScope,
      goLiveScope: fd.goLiveScope,
      dataMigrationScope: fd.dataMigrationScope,
    },
    techIntegrations: {
      technologyStack: fd.techStack,
      scalabilityRequirements: fd.scalabilityRequirements,
      userManagementScope: fd.userRegistrationModel,
      ssoRequired: fd.ssoRequired === "required" || fd.ssoRequired === "yes",
    },
    timelineTeam: {
      startDate: fd.startDate,
      targetEndDate: fd.endDate,
      estimatedTeamSize: fd.teamSize,
      workModel: fd.workModel,
      uatSignOffAuthority: fd.businessOwnerApprover,
    },
    budgetRisk: {
      ...budget,
      pricingModel: fd.pricingModel,
      contingencyPercent: fd.contingencyBudget,
    },
    governance: {
      nonDiscriminationConfirmed: true,
      dataSensitivityLevel: "Confidential",
      personalDataInvolved: fd.dpaRequired ? "Yes" : "No",
      dataResidency: fd.dataRetentionPolicy,
      regulatoryFrameworks: Array.isArray(fd.complianceStandards) ? fd.complianceStandards.join(", ") : fd.complianceStandards,
    },
    commercialLegal: {
      ipOwnership: fd.ipOwnership,
      sourceCodeOwnership: fd.ipOwnership,
      thirdPartyCosts: fd.expensesPolicy,
      changeRequestProcess: fd.changeManagementProcess,
    },
  };
}

/* ══════════════════════════════════════════ Form data ══════════════════════════════════════════ */

interface FormData {
  // Section 1: Strategic Context & Vision (FSD §7.3.2)
  projectVision: string;
  businessObjectives: { objective: string; measurableTarget: string; timeline: string }[];
  painPoints: { problemDescription: string; whoExperiences: string }[];
  businessCriticality: string;
  strategicContext: string;
  currentState: string;
  currentStateType: string;
  desiredFutureState: string;
  previousAttempts: string;
  endUserProfiles: { roleName: string; count: string; ageRange: string; techLiteracy: string; primaryDevice: string; geography: string; accessibilityNeeds: string }[];
  languageRequirements: string[];
  customLanguages: string[];
  userExpectations: string[];
  successMetrics: { metricName: string; baseline: string; target: string; measurementMethod: string; timeframe: string }[];
  enterpriseExpectations: string;
  definitionOfSuccess: string;

  // Section 2: Project Identity & Scope (FSD §7.3.3)
  title: string;
  client: string;
  industry: string;
  projectCategory: string;
  platformType: string[];
  existingTechLandscape: string;
  featureModules: { moduleName: string; description: string; priority: string }[];
  userRoles: { roleName: string; primaryActions: string }[];
  businessWorkflows: { name: string; steps: string; outcome: string }[];
  estimatedScreenCount: string;
  criticalBusinessRules: string[];
  outOfScope: string[];
  assumptions: string[];
  constraints: string[];
  dataMigrationScope: string;
  dataMigrationSource: string;
  dataMigrationVolume: string;
  dataMigrationApproach: string;
  dataMigrationExtractOwnership: string;
  dataMigrationValidation: string;
  dataMigrationRollback: string;

  // Section 3: Delivery Scope & Technical Architecture
  developmentScope: string[];
  uiuxDesignScope: string;
  uiuxDesignDeliverables: string[];
  clientDesignAssets: { type: "file" | "url"; value: string }[];
  deploymentScope: string;
  deploymentProvider: string;
  deploymentServices: string[];
  deploymentContainerisation: boolean;
  deploymentEnvironments: string[];
  onPremiseServices: string[];
  goLiveScope: string;
  hypercareDuration: string;
  hypercareSupport: string;
  techStack: string;
  scalabilityRequirements: string;
  etlApproach: string;
  transformationComplexity: string;
  dataValidationMethod: string;
  integrationPoints: { name: string; direction: string; protocol: string; authentication: string; dataFormat: string; sandboxCredentials: string; testingResponsibility: string; errorHandlingSLA: string }[];
  ssoRequired: string;
  ssoProviderName: string;
  ssoProtocol: string;
  userRegistrationModel: string;
  passwordPolicy: string;
  passwordMinLength: string;
  passwordComplexity: string;
  passwordExpiry: string;
  sessionTimeout: string;
  lockoutAttempts: string;
  auditLogging: string;
  auditLogEvents: string[];
  approvalWorkflows: string;
  notifications: string;
  notificationEvents: { trigger: string; channel: string[] }[];
  scheduledJobsScope: string;
  scheduledJobItems: { jobName: string; frequency: string; triggerCondition: string }[];

  // Section 4: Timeline, Team & Budget (FSD §7.3.6)
  startDate: string;
  endDate: string;
  phasingStrategy: string;
  milestones: { name: string; targetDate: string; acceptanceCriteria: string }[];
  clientDependencies: string[];
  teamSize: string;
  workModel: string;
  roles: { roleName: string; seniority: string }[];
  skillPriorities: string;
  knowledgeTransfer: string;

  // Section 5: Quality Assurance & Testing
  testingTypes: string[];
  targetEnvironments: string[];
  testingToolsPreference: string;
  testingAcceptanceCriteria: string;
  uatPeriod: string;
  bugSeverityDefinitions: string;
  travelRequirements: string;
  onboardingProcess: string;
  teamLocation: string;
  workingHoursTimezone: string;
  testDataProvisioning: string;

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

  // Section 7: Quality Assurance Standards
  codingStandards: string;
  documentationLevel: string;
  testCoverageTarget: string;
  securityTestingRequirements: string;
  codeReviewProcess: string;
  performanceKpis: string;
  browserDeviceSupport: string[];
  accessibilityStandard: string;
  qaResponsibility: string;
  defectManagementTool: string;
  postLaunchSupportPeriod: string;
  maintenanceScope: string;

  // Section 8: Governance & Compliance
  reportingFrequency: string;
  communicationChannels: string;
  steeringCommitteeFrequency: string;
  changeManagementProcess: string;
  projectMethodology: string;
  dataRetentionPolicy: string;
  complianceStandards: string[];
  customComplianceStandards: string[];
  auditFrequency: string;
  securityAuditFrequency: string;
  dataPrivacyOfficer: string;
  dpaRequired: boolean;
  slaUptimeCommitment: string;

  // Section 9: Commercial & Legal
  paymentTerms: string;
  invoicingSchedule: string;
  ipOwnership: string;
  terminationNoticePeriod: string;
  liabilityCap: string;
  governingLaw: string;
  disputeResolution: string;
  nonSolicitationPeriod: string;
  insuranceRequirements: string;
  confidentialityTerms: string;
  expensesPolicy: string;

  // Section 10: Sign-off
  businessOwnerApprover: string;
  finalApprover: string;
  legalReviewer: string;
  securityReviewer: string;
}

const initialFormData: FormData = {
  // Section 1: Strategic Context & Vision (FSD §7.3.2)
  projectVision: "",
  businessObjectives: [{ objective: "", measurableTarget: "", timeline: "" }],
  painPoints: [{ problemDescription: "", whoExperiences: "" }],
  businessCriticality: "",
  strategicContext: "",
  currentState: "",
  currentStateType: "",
  desiredFutureState: "",
  previousAttempts: "",
  endUserProfiles: [{ roleName: "", count: "", ageRange: "", techLiteracy: "", primaryDevice: "", geography: "", accessibilityNeeds: "" }],
  languageRequirements: [""],
  customLanguages: [],
  userExpectations: [""],
  successMetrics: [{ metricName: "", baseline: "", target: "", measurementMethod: "", timeframe: "" }],
  enterpriseExpectations: "",
  definitionOfSuccess: "",

  // Section 2: Project Identity & Scope (FSD §7.3.3)
  title: "",
  client: "",
  industry: "",
  projectCategory: "",
  platformType: [],
  existingTechLandscape: "",
  featureModules: [{ moduleName: "", description: "", priority: "" }],
  userRoles: [{ roleName: "", primaryActions: "" }],
  businessWorkflows: [{ name: "", steps: "", outcome: "" }],
  estimatedScreenCount: "",
  criticalBusinessRules: [""],
  outOfScope: [""],
  assumptions: [""],
  constraints: [""],
  dataMigrationScope: "",
  dataMigrationSource: "",
  dataMigrationVolume: "",
  dataMigrationApproach: "",
  dataMigrationExtractOwnership: "",
  dataMigrationValidation: "",
  dataMigrationRollback: "",

  // Section 3: Delivery Scope & Technical Architecture
  developmentScope: [""],
  uiuxDesignScope: "",
  uiuxDesignDeliverables: [],
  clientDesignAssets: [],
  deploymentScope: "",
  deploymentProvider: "",
  deploymentServices: [],
  deploymentContainerisation: false,
  deploymentEnvironments: [],
  onPremiseServices: [],
  goLiveScope: "",
  hypercareDuration: "",
  hypercareSupport: "",
  techStack: "",
  scalabilityRequirements: "",
  etlApproach: "",
  transformationComplexity: "",
  dataValidationMethod: "",
  integrationPoints: [{ name: "", direction: "", protocol: "", authentication: "", dataFormat: "", sandboxCredentials: "", testingResponsibility: "", errorHandlingSLA: "" }],
  ssoRequired: "",
  ssoProviderName: "",
  ssoProtocol: "",
  userRegistrationModel: "",
  passwordPolicy: "",
  passwordMinLength: "8",
  passwordComplexity: "Standard",
  passwordExpiry: "90",
  sessionTimeout: "30",
  lockoutAttempts: "5",
  auditLogging: "",
  auditLogEvents: [],
  approvalWorkflows: "",
  notifications: "",
  notificationEvents: [{ trigger: "", channel: ["Email"] }],
  scheduledJobsScope: "",
  scheduledJobItems: [{ jobName: "", frequency: "", triggerCondition: "" }],

  // Section 4: Timeline, Team & Budget
  startDate: "",
  endDate: "",
  phasingStrategy: "",
  milestones: [
    { name: "M1: SOW Onboarding", targetDate: "", acceptanceCriteria: "" },
    { name: "M2: Dev Milestone", targetDate: "", acceptanceCriteria: "" },
    { name: "M3: UAT Sign-off", targetDate: "", acceptanceCriteria: "" },
  ],
  clientDependencies: [""],
  teamSize: "",
  workModel: "",
  roles: [{ roleName: "", seniority: "" }],
  skillPriorities: "",
  knowledgeTransfer: "",

  // Section 5: Quality Assurance & Testing
  testingTypes: [],
  targetEnvironments: [],
  testingToolsPreference: "",
  testingAcceptanceCriteria: "",
  uatPeriod: "",
  bugSeverityDefinitions: "",
  travelRequirements: "",
  onboardingProcess: "",
  teamLocation: "",
  workingHoursTimezone: "",
  testDataProvisioning: "",

  // Section 6: Budget & Risk
  budgetMin: "",
  budgetMax: "",
  currency: "USD",
  pricingModel: "fixed_price",
  breakdownPreference: "milestone",
  knownRisks: [""],
  projectConstraints: "",
  contingencyBudget: "",
  escalationProcess: "",

  // Section 7: Quality Assurance Standards
  codingStandards: "",
  documentationLevel: "",
  testCoverageTarget: "",
  securityTestingRequirements: "",
  codeReviewProcess: "",
  performanceKpis: "",
  browserDeviceSupport: [],
  accessibilityStandard: "",
  qaResponsibility: "",
  defectManagementTool: "",
  postLaunchSupportPeriod: "",
  maintenanceScope: "",

  // Section 8: Governance & Compliance
  reportingFrequency: "",
  communicationChannels: "",
  steeringCommitteeFrequency: "",
  changeManagementProcess: "",
  projectMethodology: "",
  dataRetentionPolicy: "",
  complianceStandards: [],
  customComplianceStandards: [],
  auditFrequency: "",
  securityAuditFrequency: "",
  dataPrivacyOfficer: "",
  dpaRequired: false,
  slaUptimeCommitment: "",

  // Section 9: Commercial & Legal
  paymentTerms: "immediately",
  invoicingSchedule: "",
  ipOwnership: "",
  terminationNoticePeriod: "",
  liabilityCap: "",
  governingLaw: "",
  disputeResolution: "",
  nonSolicitationPeriod: "",
  insuranceRequirements: "",
  confidentialityTerms: "",
  expensesPolicy: "",

  // Section 10: Sign-off
  businessOwnerApprover: "",
  finalApprover: "",
  legalReviewer: "",
  securityReviewer: "",
};

/* ══════════════════════════════════════════ Dummy data (dev helper) ══════════════════════════════════════════ */

const DUMMY_FORM_DATA: FormData = {
  // Section 1: Strategic Context & Vision
  projectVision:
    "Build a unified customer experience platform that consolidates our fragmented tooling into a single pane of glass, enabling support agents to resolve tickets 40% faster while giving leadership real-time visibility into SLA performance.",
  businessObjectives: [
    { objective: "Reduce average ticket resolution time", measurableTarget: "From 26h to 15h", timeline: "Q4 2026" },
    { objective: "Increase CSAT for digital support", measurableTarget: "From 78% to 90%", timeline: "Q2 2027" },
  ],
  painPoints: [
    { problemDescription: "Agents toggle between 5 tools to resolve a single ticket", whoExperiences: "Tier 1 & Tier 2 support agents" },
    { problemDescription: "Leadership has no real-time SLA visibility across regions", whoExperiences: "VP of Support, Regional Directors" },
  ],
  businessCriticality: "business_important",
  strategicContext: "digital_transformation",
  currentStateType: "existing",
  currentState: "We run a patchwork of legacy ticketing, chat, and knowledge-base tools deployed region by region over the last decade.",
  desiredFutureState: "A single cloud-native workspace where every customer interaction, SLA signal, and knowledge asset lives together with AI-assisted routing.",
  previousAttempts: "One consolidation attempt was paused in 2024 due to data-migration risk and lack of executive sponsorship.",
  endUserProfiles: [
    { roleName: "Support Agent", count: "450", ageRange: "25-35", techLiteracy: "medium", primaryDevice: "desktop", geography: "Global (NA, EU, APAC)", accessibilityNeeds: "yes" },
    { roleName: "Team Lead", count: "60", ageRange: "35-45", techLiteracy: "high", primaryDevice: "both", geography: "NA, EU", accessibilityNeeds: "no" },
  ],
  languageRequirements: ["english", "french", "other"],
  customLanguages: ["Spanish", "German"],
  userExpectations: [
    "Single login across all surfaces",
    "Context-aware AI suggestions during ticket handling",
    "Mobile-responsive interface for on-call leads",
  ],
  successMetrics: [
    { metricName: "Average Resolution Time", baseline: "26h", target: "15h", measurementMethod: "Platform analytics, weekly rollup", timeframe: "12 months post go-live" },
    { metricName: "CSAT score", baseline: "78%", target: "90%", measurementMethod: "Post-ticket survey, NPS tool", timeframe: "6 months post go-live" },
  ],
  enterpriseExpectations:
    "A production-ready platform with 99.95% uptime, WCAG 2.1 AA compliance, and a clear migration path off our three legacy ticketing tools.",
  definitionOfSuccess:
    "All 450 agents migrated, legacy systems decommissioned, CSAT above 85%, and a documented runbook for ongoing operations.",

  // Section 2: Project Identity & Scope
  title: "Unified Customer Experience Platform",
  client: "Northwind Global Services",
  industry: "technology",
  projectCategory: "new_build",
  platformType: ["web", "mobile_hybrid", "api_backend"],
  existingTechLandscape:
    "Salesforce Service Cloud (legacy), Zendesk (APAC), custom in-house ticketing (EU). Identity via Okta. Data warehouse on Snowflake.",
  featureModules: [
    { moduleName: "Unified Ticket Inbox", description: "Cross-channel ticket view with AI triage", priority: "must_have" },
    { moduleName: "SLA Dashboard", description: "Real-time SLA health by region/team", priority: "must_have" },
    { moduleName: "Knowledge Base Search", description: "Semantic search across articles and past resolutions", priority: "should_have" },
  ],
  userRoles: [
    { roleName: "Support Agent", primaryActions: "View, respond to, and resolve tickets; browse knowledge base" },
    { roleName: "Team Lead", primaryActions: "Assign tickets, monitor SLA health, run reports" },
    { roleName: "Admin", primaryActions: "Manage users, configure routing rules, audit logs" },
  ],
  businessWorkflows: [
    { name: "Ticket Intake to Resolution", steps: "Channel capture → AI triage → Agent assignment → Resolution → Customer confirmation", outcome: "Ticket closed with CSAT captured" },
    { name: "Escalation to Tier 2", steps: "Tier 1 flags → Lead review → Tier 2 reassignment → Resolution", outcome: "Escalated ticket resolved with SLA metadata" },
  ],
  estimatedScreenCount: "45",
  criticalBusinessRules: [
    "Tickets older than 48h must auto-escalate to team lead",
    "PII fields must be masked in all non-agent views",
  ],
  outOfScope: ["Telephony / voice channel integration", "Customer-facing self-service portal"],
  assumptions: [
    "Client provides cleaned data extracts from legacy systems",
    "Okta SSO is already configured and available for integration",
  ],
  constraints: [
    "Must go live before the APAC peak-support season (October)",
    "Total headcount of implementation team capped at 14",
  ],
  dataMigrationScope: "in_scope",
  dataMigrationSource: "Salesforce Service Cloud, Zendesk, in-house MySQL DB",
  dataMigrationVolume: "1M–100M rows",
  dataMigrationApproach: "Incremental",
  dataMigrationExtractOwnership: "Client",
  dataMigrationValidation: "Both",
  dataMigrationRollback: "yes",

  // Section 3: Delivery Scope & Technical Architecture
  developmentScope: ["Frontend web app", "Mobile hybrid app", "Backend services & APIs", "Admin console"],
  uiuxDesignScope: "in_scope",
  uiuxDesignDeliverables: ["wireframes", "high_fidelity", "design_system", "prototype"],
  clientDesignAssets: [],
  deploymentScope: "cloud",
  deploymentProvider: "AWS",
  deploymentServices: ["EC2/ECS/EKS", "RDS/Aurora", "S3", "CloudFront"],
  deploymentContainerisation: true,
  deploymentEnvironments: ["Dev", "Staging", "Production"],
  onPremiseServices: [],
  goLiveScope: "go_live_hypercare",
  hypercareDuration: "1_month",
  hypercareSupport: "24x5 coverage during hypercare with on-call rotation for Sev-1 incidents",
  techStack: "React + Next.js (web), React Native (mobile), Node.js + NestJS (API), PostgreSQL, Redis, OpenSearch",
  scalabilityRequirements: "Must support 10k concurrent agents and 200 req/sec sustained on ticket endpoints",
  etlApproach: "custom_scripts",
  transformationComplexity: "complex_business_logic",
  dataValidationMethod: "Automated row-count + checksum reconciliation, plus spot-check sampling by client SME",
  integrationPoints: [
    { name: "Okta SSO", direction: "Inbound", protocol: "REST", authentication: "OAuth 2.0", dataFormat: "JSON", sandboxCredentials: "Client", testingResponsibility: "Both", errorHandlingSLA: "Same-day" },
    { name: "Snowflake Analytics Export", direction: "Outbound", protocol: "REST", authentication: "API Key", dataFormat: "JSON", sandboxCredentials: "Client", testingResponsibility: "GlimmoraTeam", errorHandlingSLA: "4-hour" },
  ],
  ssoRequired: "required",
  ssoProviderName: "Okta",
  ssoProtocol: "SAML 2.0",
  userRegistrationModel: "sso_only",
  passwordPolicy: "custom",
  passwordMinLength: "12",
  passwordComplexity: "Strong",
  passwordExpiry: "90",
  sessionTimeout: "30",
  lockoutAttempts: "5",
  auditLogging: "yes",
  auditLogEvents: ["login_logout", "data_access", "record_modifications", "configuration_changes"],
  approvalWorkflows: "Required for role changes and bulk data exports; two-person approval for admin escalation",
  notifications: "in_scope",
  notificationEvents: [
    { trigger: "Ticket assigned", channel: ["Email", "In-app"] },
    { trigger: "SLA breach warning", channel: ["Email", "Slack"] },
  ],
  scheduledJobsScope: "in_scope",
  scheduledJobItems: [
    { jobName: "Nightly SLA rollup", frequency: "Daily 02:00 UTC", triggerCondition: "After ingest completion" },
    { jobName: "Weekly leadership report", frequency: "Monday 07:00 local", triggerCondition: "End of business week" },
  ],

  // Section 4: Timeline, Team & Budget
  startDate: "2026-06-01",
  endDate: "2027-03-31",
  phasingStrategy: "sprint_based",
  milestones: [
    { name: "Discovery & Architecture Sign-off", targetDate: "2026-07-15", acceptanceCriteria: "Architecture doc signed by client CTO; validated data model" },
    { name: "MVP Release (Ticket Inbox + SLA Dashboard)", targetDate: "2026-11-30", acceptanceCriteria: "All must-have features passing UAT in staging" },
    { name: "Global Go-Live", targetDate: "2027-03-15", acceptanceCriteria: "All regions migrated; legacy read-only; hypercare handoff complete" },
  ],
  clientDependencies: [
    "Access to Okta tenant and service account within 2 weeks of kickoff",
    "Dedicated product owner available 20 hours/week",
    "Data extracts from legacy systems by end of Sprint 2",
  ],
  teamSize: "9-15",
  workModel: "hybrid",
  roles: [
    { roleName: "Tech Lead", seniority: "lead" },
    { roleName: "Backend Engineer", seniority: "senior" },
    { roleName: "Frontend Engineer", seniority: "mid" },
    { roleName: "QA Engineer", seniority: "senior" },
  ],
  skillPriorities:
    "Deep expertise in Next.js, NestJS, AWS infrastructure, and prior experience migrating large-scale ticketing systems.",
  knowledgeTransfer:
    "Weekly KT sessions during hypercare, full architecture walkthrough at go-live, and recorded runbooks for client ops team.",

  // Section 5: QA & Testing
  testingTypes: ["unit_testing", "integration_testing", "uat_testing", "security_testing", "performance_testing"],
  targetEnvironments: ["dev", "staging", "uat", "prod"],
  testingToolsPreference: "Jest, Playwright, k6 for load testing, OWASP ZAP for security scans.",
  testingAcceptanceCriteria:
    "All P0/P1 bugs resolved pre-release. >85% unit test coverage. UAT sign-off from client QA lead.",
  uatPeriod: "2 weeks prior to each major milestone; 3 weeks before global go-live.",
  bugSeverityDefinitions: "standard_p0_p4",
  travelRequirements: "occasional",
  onboardingProcess: "standard_access",
  teamLocation: "remote",
  workingHoursTimezone: "overlap_us",
  testDataProvisioning: "shared",

  // Section 6: Budget & Risk
  budgetMin: "850000",
  budgetMax: "1200000",
  currency: "USD",
  pricingModel: "fixed_price",
  breakdownPreference: "milestone",
  knownRisks: [
    "Scope expansion from additional integrations surfaced post-kickoff",
    "Delays in client data extracts impacting migration timeline",
  ],
  projectConstraints:
    "Go-live must precede APAC peak season (October). Budget fixed at approved ceiling with change-request governance.",
  contingencyBudget: "10",
  escalationProcess: "joint_committee",

  // Section 7: QA Standards
  codingStandards: "clean_code_solid",
  documentationLevel: "high_technical_user",
  testCoverageTarget: "85",
  securityTestingRequirements: "owasp_top10",
  codeReviewProcess:
    "All PRs require 2 approvals including 1 senior engineer; automated lint + security scan gates must pass before merge.",
  performanceKpis: "core_web_vitals",
  browserDeviceSupport: ["chrome_latest", "safari_latest", "firefox_latest", "edge_latest", "ios_safari", "android_chrome"],
  accessibilityStandard: "wcag_21_aa",
  qaResponsibility: "shared",
  defectManagementTool: "jira",
  postLaunchSupportPeriod: "90_days",
  maintenanceScope:
    "Bug fixes, minor enhancements (up to 20 hrs/month), security patching, and monthly availability review.",

  // Section 8: Governance & Compliance
  reportingFrequency: "weekly",
  communicationChannels: "slack_email",
  steeringCommitteeFrequency: "bi_weekly",
  changeManagementProcess:
    "All scope changes routed through a joint change-control board; documented CR with impact and sign-off before execution.",
  projectMethodology: "agile_scrum",
  dataRetentionPolicy: "7_years",
  complianceStandards: ["gdpr", "soc2", "iso_27001"],
  customComplianceStandards: [],
  auditFrequency: "quarterly",
  securityAuditFrequency: "bi_annually",
  dataPrivacyOfficer: "Priya Rao — privacy@northwindglobal.example",
  dpaRequired: true,
  slaUptimeCommitment: "99.95",

  // Section 9: Commercial & Legal
  paymentTerms: "net_30",
  invoicingSchedule: "Invoices issued at milestone completion, payable Net 30.",
  ipOwnership: "client",
  terminationNoticePeriod: "30_days",
  liabilityCap: "100_percent_fees",
  governingLaw: "delaware_usa",
  disputeResolution: "mediation_then_arbitration",
  nonSolicitationPeriod: "12_months",
  insuranceRequirements: "enhanced_pi",
  confidentialityTerms: "mutual_nda",
  expensesPolicy: "Pre-approved travel and tooling reimbursed at cost with itemised receipts.",

  // Section 10: Sign-off
  businessOwnerApprover: "Maya Chen — VP Customer Support, Northwind Global Services",
  finalApprover: "David Mueller — CTO, Northwind Global Services",
  legalReviewer: "Alicia Brown — General Counsel, Northwind Global Services",
  securityReviewer: "Jordan Patel — CISO, Northwind Global Services",
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

function DateInput({ value, onChange, placeholder, minDate }: { value: string; onChange: (v: string) => void; placeholder?: string; minDate?: string }) {
  const [yearOpen, setYearOpen] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const minParsed = minDate ? new Date(minDate + 'T00:00:00') : null;
  const [viewYear, setViewYear] = React.useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(parsed?.getMonth() ?? today.getMonth());

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };

    const scrollHandler = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', scrollHandler, true);
    return () => {
      document.removeEventListener('mousedown', handler);

      window.removeEventListener('scroll', scrollHandler, true); 
    };
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
  const isDisabled = (day: number) => {
    if (!minParsed) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < minParsed;
  };
  const selectDay = (day: number) => { if (isDisabled(day)) return; onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`); setOpen(false); };
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
          style={{ 
            top: pos.top + 280 > window.innerHeight ? pos.top - 300 : pos.top, 
            left: pos.left, 
            width: 280, 
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
          }}>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="flex items-center gap-1">
            <span className="text-[13px] font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]}
            </span>
            
            <div className="relative">
              <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setYearOpen(o => !o); }}
                  style={{
                  fontSize: 13, fontWeight: 600, color: '#1a1a1a',
                  background: 'white', border: '1px solid rgba(166,119,99,0.3)',
                  borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
                }}
              >
                {viewYear} ▾
              </button>
              {yearOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 99999,
                  background: 'white', border: '1px solid rgba(166,119,99,0.3)',
                  borderRadius: 8, overflow: 'auto', maxHeight: 180, width: 80,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                    <div
                      key={year}
                      onClick={(e) => { e.stopPropagation(); setViewYear(year); setYearOpen(false); }}
                      style={{
                        padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                        fontWeight: year === viewYear ? 700 : 400,
                        background: year === viewYear ? 'rgba(166,119,99,0.1)' : 'transparent',
                        color: year === viewYear ? '#A67763' : '#1a1a1a',
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </span>
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
                  <button type="button" onClick={() => selectDay(day)} disabled={isDisabled(day)}
                    className={cn("w-7 h-7 rounded-md text-[12px] flex items-center justify-center transition-all",
                      isDisabled(day) ? "text-gray-300 cursor-not-allowed" :
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

function FieldError({ error, field }: { error?: string; field?: string }) {
  if (!error) return null;
  return <p data-field-error={field} style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>{error}</p>;
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
    <div data-field={fieldKey}>
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
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addLanguage = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) { setError(null); return; }

    if (!isValidLanguageName(trimmed)) {
      const suggestions = suggestLanguages(trimmed);
      setError(
        suggestions.length > 0
          ? `"${trimmed}" is not a recognised language. Did you mean ${suggestions.join(", ")}?`
          : `"${trimmed}" is not a recognised language. Try English, Spanish, Mandarin, etc.`,
      );
      return;
    }

    const canonical = canonicalLanguageName(trimmed);
    if (languages.some((l) => l.toLowerCase() === canonical.toLowerCase())) {
      setError(`${canonical} is already added.`);
      return;
    }

    onChange([...languages, canonical]);
    setInputValue("");
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addLanguage(); }
    if (e.key === "Backspace" && !inputValue && languages.length > 0) {
      onChange(languages.slice(0, -1));
      setError(null);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Custom Languages</label>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-xl border bg-white px-3 py-2 cursor-text transition-all duration-200",
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100"
            : "border-gray-200 focus-within:border-brown-300 focus-within:ring-2 focus-within:ring-brown-100",
        )}
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
              onClick={(e) => { e.stopPropagation(); onChange(languages.filter((_, i) => i !== idx)); setError(null); }}
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
          onChange={(e) => { setInputValue(e.target.value); if (error) setError(null); }}
          onKeyDown={handleKeyDown}
          onBlur={addLanguage}
          placeholder={languages.filter(l => l.trim()).length === 0 ? "Type a language and press Enter..." : ""}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400"
          style={{ padding: 0 }}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}

function CustomStandardTagInput({ standards, onChange }: { standards: string[]; onChange: (v: string[]) => void }) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addStandard = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (standards.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...standards, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addStandard(); }
    if (e.key === "Backspace" && !inputValue && standards.length > 0) {
      onChange(standards.slice(0, -1));
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Custom Standards</label>
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 cursor-text transition-all duration-200 focus-within:border-[#A67763] focus-within:ring-2 focus-within:ring-[rgba(166,119,99,0.15)]"
        style={{ minHeight: 40 }}
      >
        {standards.map((s, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium"
            style={{ background: 'rgba(166,119,99,0.10)', color: '#A67763' }}
          >
            {s}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(standards.filter((_, i) => i !== idx)); }}
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
          onBlur={addStandard}
          placeholder={standards.length === 0 ? "Type a standard and press Enter..." : ""}
          className="flex-1 min-w-[160px] border-none outline-none bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400"
          style={{ padding: 0 }}
        />
      </div>
    </div>
  );
}

const EMPTY_INTEGRATION = { name: "", direction: "", protocol: "", authentication: "", dataFormat: "", sandboxCredentials: "", testingResponsibility: "", errorHandlingSLA: "" };
type IntegrationPoint = typeof EMPTY_INTEGRATION;

function IntegrationForm({ draft, onChange, onSave, onCancel, canSave, isEdit }: {
  draft: IntegrationPoint;
  onChange: (v: IntegrationPoint) => void;
  onSave: () => void;
  onCancel: () => void;
  canSave: boolean;
  isEdit: boolean;
}) {
  const set = (key: keyof IntegrationPoint, value: string) => onChange({ ...draft, [key]: value });
  return (
    <div className="p-4 space-y-4 border-t border-gray-100">
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#A67763' }}>
        {isEdit ? "Edit Integration" : "New Integration"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Integration Name</FieldLabel>
          <Input placeholder="e.g. Stripe Payment Gateway" value={draft.name} onChange={(e) => set("name", e.target.value.slice(0, 100))} />
        </div>
        <div>
          <FieldLabel required>Direction</FieldLabel>
          <Select value={draft.direction} onValueChange={(v) => set("direction", v)}>
            <SelectTrigger><SelectValue placeholder="Select direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Inbound">Inbound</SelectItem>
              <SelectItem value="Outbound">Outbound</SelectItem>
              <SelectItem value="Bidirectional">Bidirectional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel required>Protocol</FieldLabel>
          <Select value={draft.protocol} onValueChange={(v) => set("protocol", v)}>
            <SelectTrigger><SelectValue placeholder="Select protocol" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="REST">REST</SelectItem>
              <SelectItem value="GraphQL">GraphQL</SelectItem>
              <SelectItem value="SOAP">SOAP</SelectItem>
              <SelectItem value="gRPC">gRPC</SelectItem>
              <SelectItem value="Webhook">Webhook</SelectItem>
              <SelectItem value="SFTP">SFTP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel required>Authentication</FieldLabel>
          <Select value={draft.authentication} onValueChange={(v) => set("authentication", v)}>
            <SelectTrigger><SelectValue placeholder="Select authentication" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OAuth 2.0">OAuth 2.0</SelectItem>
              <SelectItem value="API Key">API Key</SelectItem>
              <SelectItem value="Basic Auth">Basic Auth</SelectItem>
              <SelectItem value="JWT">JWT</SelectItem>
              <SelectItem value="HMAC">HMAC</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Data Format</FieldLabel>
          <Select value={draft.dataFormat} onValueChange={(v) => set("dataFormat", v)}>
            <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="JSON">JSON</SelectItem>
              <SelectItem value="XML">XML</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="Binary">Binary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Sandbox Credentials Provided By</FieldLabel>
          <Select value={draft.sandboxCredentials} onValueChange={(v) => set("sandboxCredentials", v)}>
            <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="GlimmoraTeam">GlimmoraTeam</SelectItem>
              <SelectItem value="Not Required">Not Required</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Testing Responsibility</FieldLabel>
          <Select value={draft.testingResponsibility} onValueChange={(v) => set("testingResponsibility", v)}>
            <SelectTrigger><SelectValue placeholder="Select responsibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="GlimmoraTeam">GlimmoraTeam</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
              <SelectItem value="Third-party">Third-party</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Error Handling SLA</FieldLabel>
          <Select value={draft.errorHandlingSLA} onValueChange={(v) => set("errorHandlingSLA", v)}>
            <SelectTrigger><SelectValue placeholder="Select SLA" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Same-day">Same-day</SelectItem>
              <SelectItem value="4-hour">4-hour</SelectItem>
              <SelectItem value="1-hour">1-hour</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg text-[12px] font-semibold text-gray-600 hover:bg-gray-100 transition-all">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={!canSave}
          className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-all"
          style={{ background: canSave ? '#A67763' : '#d1d5db', cursor: canSave ? 'pointer' : 'not-allowed' }}>
          {isEdit ? "Save Changes" : "Add Integration"}
        </button>
      </div>
    </div>
  );
}

function IntegrationTableSection({ integrations, onChange }: {
  integrations: IntegrationPoint[];
  onChange: (v: IntegrationPoint[]) => void;
}) {
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<IntegrationPoint>({ ...EMPTY_INTEGRATION });

  const startAdd = () => { setDraft({ ...EMPTY_INTEGRATION }); setIsAdding(true); setEditingIdx(null); setExpandedIdx(null); };
  const startEdit = (idx: number) => { setDraft({ ...integrations[idx] }); setEditingIdx(idx); setIsAdding(false); setExpandedIdx(null); };
  const cancelForm = () => { setIsAdding(false); setEditingIdx(null); };
  const canSave = !!(draft.name.trim() && draft.direction && draft.protocol && draft.authentication);

  const saveForm = () => {
    if (!canSave) return;
    if (editingIdx !== null) {
      onChange(integrations.map((item, i) => i === editingIdx ? draft : item));
      setEditingIdx(null);
    } else {
      onChange([...integrations, draft]);
      setIsAdding(false);
    }
    setDraft({ ...EMPTY_INTEGRATION });
  };

  const deleteRow = (idx: number) => {
    onChange(integrations.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
    if (editingIdx === idx) setEditingIdx(null);
  };

  const toggleExpand = (idx: number) => { setExpandedIdx(expandedIdx === idx ? null : idx); setEditingIdx(null); };

  const COL = '28px 1fr 100px 90px 120px 96px';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <FieldLabel>Integration Points</FieldLabel>
        <button type="button" onClick={startAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: 'rgba(166,119,99,0.10)', color: '#A67763', border: '1px solid rgba(166,119,99,0.20)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Integration
        </button>
      </div>

      {integrations.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-soft)' }}>
          <div className="grid items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ gridTemplateColumns: COL, background: 'rgba(77,87,65,0.06)', color: 'var(--ink-mid)' }}>
            <span>#</span>
            <span>Integration Name</span>
            <span>Direction</span>
            <span>Protocol</span>
            <span>Authentication</span>
            <span className="text-center">Actions</span>
          </div>

          {integrations.map((intg, idx) => (
            <React.Fragment key={idx}>
              <div className={cn("grid items-center px-4 py-3 text-[13px] border-t transition-colors", expandedIdx === idx || editingIdx === idx ? "bg-gray-50" : "hover:bg-gray-50/60")}
                style={{ gridTemplateColumns: COL, borderColor: 'var(--border-soft)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #A67763, #886151)' }}>{idx + 1}</span>
                <span className="font-medium text-gray-800 truncate pr-2">
                  {intg.name || <span className="text-gray-400 italic text-[12px]">Unnamed</span>}
                </span>
                <span className="text-gray-600 text-[12px]">{intg.direction || '—'}</span>
                <span className="text-gray-600 text-[12px]">{intg.protocol || '—'}</span>
                <span className="text-gray-600 text-[12px]">{intg.authentication || '—'}</span>
                <div className="flex items-center justify-center gap-1">
                  <button type="button" onClick={() => toggleExpand(idx)} title="View details"
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-gray-100"
                    style={{ color: expandedIdx === idx ? '#4D5741' : '#9CA3AF' }}>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expandedIdx === idx ? "rotate-180" : "")} />
                  </button>
                  <button type="button" onClick={() => startEdit(idx)} title="Edit"
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-blue-50"
                    style={{ color: editingIdx === idx ? '#3B82F6' : '#9CA3AF' }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteRow(idx)} title="Delete"
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-red-50 hover:text-red-500"
                    style={{ color: '#9CA3AF' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {expandedIdx === idx && editingIdx !== idx && (
                <div className="px-6 py-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4"
                  style={{ borderColor: 'var(--border-soft)', background: 'rgba(77,87,65,0.03)' }}>
                  {([
                    { label: "Data Format", value: intg.dataFormat },
                    { label: "Sandbox Credentials", value: intg.sandboxCredentials },
                    { label: "Testing Responsibility", value: intg.testingResponsibility },
                    { label: "Error Handling SLA", value: intg.errorHandlingSLA },
                  ] as { label: string; value: string }[]).map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ink-mid)' }}>{label}</p>
                      <p className="text-[13px] text-gray-700">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {editingIdx === idx && (
                <IntegrationForm draft={draft} onChange={setDraft} onSave={saveForm} onCancel={cancelForm} canSave={canSave} isEdit />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {integrations.length === 0 && !isAdding && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
          <p className="text-[13px] text-gray-400">No integrations added yet.</p>
          <button type="button" onClick={startAdd} className="mt-2 text-[12px] font-semibold" style={{ color: '#A67763' }}>
            + Add your first integration
          </button>
        </div>
      )}

      {isAdding && (
        <div className="mt-3 rounded-xl" style={{ border: '1px solid var(--border-soft)', background: 'rgba(166,119,99,0.03)' }}>
          <IntegrationForm draft={draft} onChange={setDraft} onSave={saveForm} onCancel={cancelForm} canSave={canSave} isEdit={false} />
        </div>
      )}
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
              background: active ? 'linear-gradient(135deg, var(--primary), var(--primary))' : 'rgba(166,119,99,0.04)',
              border: `1px solid ${active ? '' : 'var(--border-soft)'}`,
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

const SOW_DRAFT_VERSION = 9; // Increment when FormData structure changes

function loadDraft(): { formData: FormData; currentStep: number; skippedSteps: number[]; generationComplete?: boolean; generatedSowId?: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.version || parsed.version < SOW_DRAFT_VERSION) {
      sessionStorage.removeItem(SOW_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function saveDraft(
  formData: FormData,
  currentStep: number,
  skippedSteps: Set<number>,
  generationComplete = false,
  generatedSowId: string | null = null,
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SOW_STORAGE_KEY, JSON.stringify({
      version: SOW_DRAFT_VERSION,
      formData,
      currentStep,
      skippedSteps: [...skippedSteps],
      generationComplete,
      generatedSowId,
    }));
  } catch { /* storage full — ignore */ }
}

function SOWGenerateWizardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const draft = React.useRef(loadDraft());

  // Resolve initial step: URL param > draft > 0
  const initialStep = React.useMemo(() => {
    const urlStep = searchParams.get("step");
    if (urlStep !== null) {
      const n = parseInt(urlStep, 10);
      if (!isNaN(n) && n >= 0 && n < STEPS.length) return n;
    }
    return draft.current?.currentStep ?? 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentStep, setCurrentStepRaw] = React.useState(initialStep);
  const currentStepRef = React.useRef(currentStep);

  // Wrapper that accepts updater function or direct value (mirrors setState API).
  // Side effects (history pushState) must live OUTSIDE the state updater — updater
  // functions run during React's render/reconciliation phase and Next.js 16's
  // router synchronously reacts to history changes, which would violate React's
  // "no setState during render of another component" rule.
  const setCurrentStep: React.Dispatch<React.SetStateAction<number>> = React.useCallback(
    (action) => {
      const prev = currentStepRef.current;
      const next = typeof action === "function" ? (action as (p: number) => number)(prev) : action;
      if (next !== prev) {
        currentStepRef.current = next;
        const url = new URL(window.location.href);
        url.searchParams.set("step", String(next));
        window.history.pushState({ sowStep: next }, "", url.toString());
      }
      setCurrentStepRaw(next);
    },
    [],
  );

  // Keep ref in sync when step is updated via setCurrentStepRaw (popstate handler).
  React.useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Listen for browser back/forward to sync step state
  React.useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.sowStep === "number") {
        setCurrentStepRaw(e.state.sowStep);
      } else {
        const url = new URL(window.location.href);
        const s = parseInt(url.searchParams.get("step") ?? "", 10);
        if (!isNaN(s) && s >= 0 && s < STEPS.length) {
          setCurrentStepRaw(s);
        }
      }
    };
    window.addEventListener("popstate", onPopState);

    // Set initial history state so first back press has state
    if (!window.history.state?.sowStep && window.history.state?.sowStep !== 0) {
      const url = new URL(window.location.href);
      url.searchParams.set("step", String(initialStep));
      window.history.replaceState({ ...window.history.state, sowStep: initialStep }, "", url.toString());
    }

    return () => window.removeEventListener("popstate", onPopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [formData, setFormData] = React.useState<FormData>(() => {
    // Merge initialFormData as base to ensure all fields exist (handles HMR + draft migration)
    const merged = { ...initialFormData, ...draft.current?.formData };
    // Keep milestone rows fixed to the required three defaults.
    const milestones = Array.isArray((merged as Partial<FormData>).milestones) ? ((merged as Partial<FormData>).milestones ?? []) : [];
    const requiredMilestones = initialFormData.milestones;
    const hasExactRequiredMilestones =
      milestones.length === 3
      && milestones.every((m, i) => m?.name === requiredMilestones[i].name);
    if (!hasExactRequiredMilestones) {
      merged.milestones = requiredMilestones;
    }
    // Ensure array fields that changed from string[] to object[] are properly typed
    if (merged.integrationPoints && typeof merged.integrationPoints[0] === "string") {
      merged.integrationPoints = initialFormData.integrationPoints;
    }
    if (merged.scheduledJobItems && typeof merged.scheduledJobItems[0] === "string") {
      merged.scheduledJobItems = initialFormData.scheduledJobItems;
    }
    if (merged.notificationEvents && typeof merged.notificationEvents[0] === "string") {
      merged.notificationEvents = initialFormData.notificationEvents;
    }
    return merged;
  });
  const [skippedSteps, setSkippedSteps] = React.useState<Set<number>>(new Set(draft.current?.skippedSteps ?? []));
  const [stepErrors, setStepErrors] = React.useState<StepErrors>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
  const [cameFromReview, setCameFromReview] = React.useState(false);
  const [generationComplete, setGenerationComplete] = React.useState(() => draft.current?.generationComplete ?? false);
  const [generatedSowId, setGeneratedSowId] = React.useState<string | null>(() => draft.current?.generatedSowId ?? null);
  const [showGenerateConfirm, setShowGenerateConfirm] = React.useState(false);
  const [wizardSubmitted, setWizardSubmitted] = React.useState(false);
  const uploadStore = useSOWUploadStore();

  // Navigation guard — block leaving while the wizard has in-progress data
  const navGuard = useNavigationGuard({
    isActive: !wizardSubmitted && (currentStep > 0 || Object.values(formData).some((v) =>
      typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : false
    )),
    allowedPathPrefixes: ["/enterprise/sow/generate"],
  });

  // ── API integration (wizard session + step mutations) ──
  const [wizardId, setWizardId] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("sow-wizard-id");
  });

  /** Returns a user-friendly error message, hiding raw backend validation details. */
  const friendlyApiError = (err: Error): string => {
    const msg = err.message ?? "";
    if (msg.includes("input should be") || msg.includes("Field required") || msg.includes("allowed values")) {
      return "Couldn't save your progress — please review your inputs and try again.";
    }
    if (msg.includes("404") || msg.includes("not found")) return "Session expired. Starting a new session…";
    if (msg.includes("401") || msg.includes("unauthorized")) return "Your session has expired. Please refresh the page.";
    if (msg.includes("500") || msg.includes("server")) return "A server error occurred. Your progress has been saved locally.";
    return "Couldn't reach the server. Your progress is saved locally — you can continue.";
  };
  const createWizard = useCreateWizard();
  const wizardQuery = useWizard(wizardId);
  const saveStepMutation = useSaveStep(wizardId);
  const skipStepMutation = useSkipStep(wizardId);
  const generateMutation = useGenerateSOW(wizardId);
  const reviewSummary = useReviewSummary(wizardId, currentStep === 9);
  const [apiError, setApiError] = React.useState("");

  // Persist wizardId to sessionStorage
  React.useEffect(() => {
    if (wizardId) sessionStorage.setItem("sow-wizard-id", wizardId);
  }, [wizardId]);

  // If review summary returns 404, wizard is stale — recreate
  React.useEffect(() => {
    if (reviewSummary.error && (reviewSummary.error as Error).message?.includes("404")) {
      sessionStorage.removeItem("sow-wizard-id");
      setWizardId(null);
    }
  }, [reviewSummary.error]);

  // Create wizard session on mount if none exists
  const createNewWizard = React.useCallback(() => {
    if (createWizard.isPending) return;
    const enterpriseId = (session?.user as { id?: string })?.id;
    if (!enterpriseId) return;
    createWizard.mutate(enterpriseId, {
      onSuccess: (data) => {
        setWizardId(data.wizard_id);
        setApiError("");
      },
      onError: (err) => setApiError(friendlyApiError(err)),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  React.useEffect(() => {
    if (!wizardId) createNewWizard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, wizardId]);

  // Auto-fill businessOwnerApprover from logged-in user's name
  React.useEffect(() => {
    if (session?.user?.name && !formData.businessOwnerApprover) {
      updateField("businessOwnerApprover", session.user.name);
    }
  }, [session?.user?.name]);

  // AI-suggest tech stack on Section B — backend includes data.tech_stack.ai_suggestion.line
  // in the existing GET /wizards/:id response once Step 1 (Scope) is complete. Pre-fill the
  // textbox only when it's empty so we never overwrite user input.
  React.useEffect(() => {
    const wd = wizardQuery.data as { data?: Record<string, unknown> } | Record<string, unknown> | undefined;
    const inner = (wd as { data?: Record<string, unknown> })?.data ?? wd;
    const techStackBlock = (inner as { tech_stack?: { ai_suggestion?: { line?: string } | null } } | undefined)?.tech_stack;
    const suggestion = techStackBlock?.ai_suggestion?.line;
    // Diagnostic — remove once verified working in production
    console.log("[wizard/tech_stack] effect fired", {
      hasWizardData: !!wizardQuery.data,
      formDataTechStack: formData.techStack,
      formDataTechStackLen: formData.techStack.length,
      techStackBlock,
      suggestion,
      currentStep,
    });
    if (formData.techStack.trim().length > 0) {
      console.log("[wizard/tech_stack] skip — user already typed");
      return;
    }
    if (typeof suggestion === "string" && suggestion.trim().length > 0) {
      console.log("[wizard/tech_stack] applying suggestion:", suggestion);
      setFormData(prev => ({ ...prev, techStack: suggestion }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardQuery.data, currentStep]);

  // Scroll to top on page load and step change
  React.useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    // Find the main scrollable area — the <main> tag in AppShell
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Retry after render
    const t = setTimeout(() => {
      if (mainEl) mainEl.scrollTop = 0;
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    return () => clearTimeout(t);
  }, [currentStep]);

  // Persist draft to sessionStorage on every change
  React.useEffect(() => {
    saveDraft(formData, currentStep, skippedSteps, generationComplete, generatedSowId);
  }, [formData, currentStep, skippedSteps, generationComplete, generatedSowId]);

  // Clear custom compliance tags when "custom" checkbox is unchecked
  React.useEffect(() => {
    if (!(formData.complianceStandards ?? []).includes("custom")) {
      if ((formData.customComplianceStandards ?? []).length > 0) {
        setFormData((prev) => ({ ...prev, customComplianceStandards: [] }));
      }
    }
  }, [formData.complianceStandards]);

  // Business rule: Deployment = Not in Scope → auto-reset and hide Go-Live / Hypercare
  React.useEffect(() => {
    if (formData.deploymentScope === "not_in_scope") {
      setFormData((prev) => ({
        ...prev,
        goLiveScope: "not_in_scope",
        hypercareDuration: "",
        hypercareSupport: "",
      }));
    }
  }, [formData.deploymentScope]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    // Compute next state outside the setter so we can also update errors
    // without calling setStepErrors inside setFormData's updater (React violation).
    const next = { ...formData, [key]: value };
    setFormData(next);
    // Re-validate touched fields with the new value so error messages
    // appear immediately after the user types or selects.
    if (touchedFields.size > 0) {
      const allErrors = validateStep(currentStep, next);
      const filtered: StepErrors = {};
      for (const [field, msg] of Object.entries(allErrors)) {
        if (touchedFields.has(field)) filtered[field] = msg;
      }
      setStepErrors(filtered);
    }
  };

  const blurField = (field: string) => {
    const newTouched = new Set(touchedFields).add(field);
    setTouchedFields(newTouched);
    // Re-validate all touched fields so all errors stay visible
    const allErrors = validateStep(currentStep, formData);
    const filtered: StepErrors = {};
    for (const [key, msg] of Object.entries(allErrors)) {
      if (newTouched.has(key)) {
        filtered[key] = msg;
      }
    }
    setStepErrors(filtered);
  };
  const addListItem = (key: keyof FormData) => {
    setFormData((prev) => ({ ...prev, [key]: [...(prev[key] as string[]), ""] }));
  };
  const removeListItem = (key: keyof FormData, idx: number) => {
    const next = { ...formData, [key]: (formData[key] as string[]).filter((_: string, i: number) => i !== idx) };
    setFormData(next);
    if (touchedFields.has(key as string)) {
      const err = validateField(currentStep, key as string, next);
      setStepErrors((prev) => {
        const updated = { ...prev };
        if (err) updated[key as string] = err;
        else delete updated[key as string];
        return updated;
      });
    }
  };
  const updateListItem = (key: keyof FormData, idx: number, value: string) => {
    const next = { ...formData, [key]: (formData[key] as string[]).map((item: string, i: number) => (i === idx ? value : item)) };
    setFormData(next);
    if (touchedFields.has(key as string)) {
      const err = validateField(currentStep, key as string, next);
      setStepErrors((prev) => {
        const updated = { ...prev };
        if (err) updated[key as string] = err;
        else delete updated[key as string];
        return updated;
      });
    }
  };

  /* ── Confidence calculation ── */
  const calculateConfidence = React.useCallback(() => {
    const checks: boolean[] = [
      /* Step 0 */
      formData.projectVision.trim().length >= 50,
      formData.businessObjectives.some(x => (x?.objective ?? "").trim().length > 0),
      formData.painPoints.some(p => (p?.problemDescription ?? "").trim().length > 0 && (p?.whoExperiences ?? "").trim().length > 0),
      formData.businessCriticality.length > 0,
      formData.desiredFutureState.trim().length >= 30,
      formData.endUserProfiles.some(x => (x?.roleName ?? "").trim().length > 0),
      formData.definitionOfSuccess.trim().length >= 30,
      /* Step 1 */
      formData.title.trim().length >= 3,
      formData.client.trim().length >= 2,
      formData.industry.length > 0,
      formData.projectCategory.length > 0,
      formData.platformType.length > 0,
      formData.featureModules.filter(x => (x?.moduleName ?? "").trim().length > 0).length >= 2,
      formData.userRoles.some(x => (x?.roleName ?? "").trim().length > 0),
      formData.businessWorkflows.some(x => (x?.name ?? "").trim().length > 0),
      formData.outOfScope.some(x => x.trim().length > 0),
      /* Step 2 */
      formData.developmentScope.length > 0,
      formData.uiuxDesignScope.length > 0,
      formData.deploymentScope.length > 0,
      formData.goLiveScope.length > 0,
      formData.techStack.trim().length >= 10,
      (
        formData.dataMigrationScope !== "in_scope"
        || (
          formData.etlApproach.trim().length > 0
          && formData.transformationComplexity.trim().length > 0
          && formData.dataValidationMethod.trim().length > 0
        )
      ),
      /* Step 5 */
      parseFloat(formData.budgetMin) > 0,
      parseFloat(formData.budgetMax) >= parseFloat(formData.budgetMin),
      formData.pricingModel.length > 0,
      formData.knownRisks.some(x => x.trim().length > 0),
      /* Step 7 */
      formData.reportingFrequency.length > 0,
      formData.communicationChannels.length > 0,
      (formData.complianceStandards ?? []).length > 0,
      /* Step 8 */
      formData.paymentTerms.length > 0,
      formData.ipOwnership.length > 0,
      formData.terminationNoticePeriod.length > 0,
      /* Step 9 */
      formData.businessOwnerApprover.trim().length > 0,
      formData.finalApprover.trim().length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData]);

  const localConfidence = calculateConfidence();
  // Track API confidence from step save/skip responses
  const [stepApiConfidence, setStepApiConfidence] = React.useState<number | null>(null);
  // Wizard-level confidence from GET /wizards/:id
  const wizardConfidence = typeof (wizardQuery.data as any)?.data?.confidence_score === "number"
    ? (wizardQuery.data as any).data.confidence_score
    : typeof (wizardQuery.data as any)?.confidence_score === "number"
    ? (wizardQuery.data as any).confidence_score
    : null;
  const reviewApiConfidence = (reviewSummary.data?.data as any)?.confidence_score ?? null;
  // Priority: step save/skip response > review API (step 9) > wizard GET > local calculation
  const aiConfidence = stepApiConfidence
    ?? (currentStep === 9 && reviewApiConfidence !== null ? reviewApiConfidence : null)
    ?? wizardConfidence
    ?? localConfidence;

  /* ── Step completion ── */
  const isStepComplete = React.useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return formData.projectVision.trim().length >= 50
            && formData.businessObjectives.some(x => (x?.objective ?? "").trim().length > 0)
            && formData.painPoints.some(p => (p?.problemDescription ?? "").trim().length > 0 && (p?.whoExperiences ?? "").trim().length > 0)
            && formData.businessCriticality.length > 0
            && formData.desiredFutureState.trim().length >= 30
            && formData.endUserProfiles.some(x => (x?.roleName ?? "").trim().length > 0)
            && formData.definitionOfSuccess.trim().length >= 30;
        case 1:
          return formData.title.trim().length >= 3
            && formData.client.trim().length >= 2
            && formData.industry.length > 0
            && formData.projectCategory.length > 0
            && formData.platformType.length > 0
            && formData.featureModules.filter(x => (x?.moduleName ?? "").trim().length > 0).length >= 2
            && formData.userRoles.some(x => (x?.roleName ?? "").trim().length > 0)
            && formData.businessWorkflows.some(x => (x?.name ?? "").trim().length > 0)
            && formData.outOfScope.some(x => x.trim().length > 0);
        case 2:
          return formData.developmentScope.length > 0
            && formData.uiuxDesignScope.length > 0
            && formData.deploymentScope.length > 0
            && formData.goLiveScope.length > 0
            && formData.techStack.trim().length >= 10
            && (
              formData.dataMigrationScope !== "in_scope"
              || (
                formData.etlApproach.trim().length > 0
                && formData.transformationComplexity.trim().length > 0
                && formData.dataValidationMethod.trim().length > 0
              )
            );
        case 3: // Integrations — skippable, complete if user has set at least one value
          return formData.ssoRequired.length > 0 || (formData.integrationPoints ?? []).some(x => x.name.trim().length > 0);
        case 4: // Timeline & Team — skippable, complete if dates are set
          return formData.startDate.length > 0 && formData.endDate.length > 0 && formData.teamSize.length > 0;
        case 5:
          return parseFloat(formData.budgetMin) > 0
            && parseFloat(formData.budgetMax) >= parseFloat(formData.budgetMin)
            && formData.pricingModel.length > 0
            && formData.knownRisks.some(x => x.trim().length > 0);
        case 6: // Quality — skippable, complete if at least one field is set
          return (formData.codingStandards ?? "").length > 0 || (formData.browserDeviceSupport ?? []).length > 0;
        case 7:
          return formData.reportingFrequency.length > 0
            && formData.communicationChannels.length > 0
            && (formData.complianceStandards ?? []).length > 0;
        case 8:
          return formData.paymentTerms.length > 0
            && formData.ipOwnership.length > 0
            && formData.terminationNoticePeriod.length > 0;
        case 9:
          return aiConfidence >= 60
            && formData.businessOwnerApprover.trim().length > 0
            && formData.finalApprover.trim().length > 0;
        default: return false;
      }
    },
    [formData, aiConfidence]
  );

  /* ── canAdvance: always visually enabled ── */
  const canAdvance = React.useCallback(
    (_step: number): boolean => {
      return true;
    },
    []
  );

  /* ── canGenerate: always visually enabled ── */
  const canGenerate = React.useCallback((): boolean => {
    return true;
  }, []);

  /* ── Hallucination layer status ── */
  const hallucinationLayerActive = React.useCallback((idx: number): boolean => {
    switch (idx) {
      case 0: return isStepComplete(1); // Scope boundary
      case 1: return parseFloat(formData.budgetMin) > 0 && formData.startDate.length > 0; // Budget-timeline
      case 2: return (formData.complianceStandards ?? []).length > 0 && formData.reportingFrequency.length > 0; // Governance
      case 3: return formData.techStack.trim().length >= 10 && formData.developmentScope.length > 0; // Tech stack
      case 4: return formData.knownRisks.some(x => x.trim().length > 0); // Risk-mitigation
      case 5: return formData.roles.some(x => (x?.roleName ?? "").trim().length > 0) && formData.featureModules.some(x => (x?.moduleName ?? "").trim().length > 0); // Role-deliverable
      case 6: return (formData.codingStandards ?? "").length > 0 || (formData.browserDeviceSupport ?? []).length > 0; // Quality standards
      case 7: return formData.ipOwnership.length > 0 && formData.paymentTerms.length > 0; // Commercial
      default: return false;
    }
  }, [formData, isStepComplete]);

  /* ── Skip handler ── */
  const handleSkip = () => {
    if (STEPS[currentStep].skippable) {
      setApiError("");
      if (wizardId) {
        skipStepMutation.mutate(currentStep, {
          onSuccess: (data) => {
            if (typeof (data as any)?.new_confidence_score === "number") setStepApiConfidence((data as any).new_confidence_score);
          },
          onSettled: () => {
            setSkippedSteps(prev => new Set(prev).add(currentStep));
            setCurrentStep(s => Math.min(STEPS.length - 1, s + 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          },
        });
      } else {
        setSkippedSteps(prev => new Set(prev).add(currentStep));
        setCurrentStep(s => Math.min(STEPS.length - 1, s + 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  /* ── Generate handler — validates then shows confirmation modal ── */
  const handleGenerate = () => {
    if (
      formData.dataMigrationScope === "in_scope" &&
      (!formData.etlApproach.trim() || !formData.transformationComplexity.trim() || !formData.dataValidationMethod.trim())
    ) {
      const dmErrors: StepErrors = {
        dataMigrationSection: "Data Migration details are mandatory because Data Migration is marked In Scope in Step 1.",
      };
      if (!formData.etlApproach.trim()) dmErrors.etlApproach = "ETL approach is required when data migration is in scope";
      if (!formData.transformationComplexity.trim()) dmErrors.transformationComplexity = "Transformation complexity is required when data migration is in scope";
      if (!formData.dataValidationMethod.trim()) dmErrors.dataValidationMethod = "Data validation method is required when data migration is in scope";
      setStepErrors(dmErrors);
      setTouchedFields((prev) => {
        const next = new Set(prev);
        next.add("etlApproach");
        next.add("transformationComplexity");
        next.add("dataValidationMethod");
        next.add("dataMigrationSection");
        return next;
      });
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (formData.businessOwnerApprover.trim().length === 0) {
      setStepErrors({ businessOwnerApprover: "Business owner approver is required" });
      setTouchedFields((prev) => new Set(prev).add("businessOwnerApprover"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowGenerateConfirm(true);
  };

  /* ── Confirm handler — called when user clicks Continue in the modal ── */
  const confirmGenerate = () => {
    setShowGenerateConfirm(false);
    setApiError("");
    uploadStore.setGenerationState("idle");

    if (wizardId) {
      generateMutation.mutate(
        formData as unknown as Record<string, unknown>,
        {
          onSuccess: (data) => {
            const inner = (data as any)?.data ?? data;
            const id =
              inner?.sow_id ?? inner?._id ?? inner?.id ??
              (data as any)?.sow_id ?? (data as any)?._id ?? (data as any)?.id ?? null;
            if (id) setGeneratedSowId(String(id));
          },
          onError: (err) => setApiError(friendlyApiError(err)),
        },
      );
    }

    setGenerationComplete(true);
  };

  /* ── Next handler with validation + API save ── */
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Validate ALL fields in the current step at once
      const errors = validateStep(currentStep, formData);
      const dmInScope = formData.dataMigrationScope === "in_scope";
      if (currentStep === 2 && dmInScope) {
        if (!formData.etlApproach.trim()) {
          errors.etlApproach = "ETL approach is required when data migration is in scope";
        }
        if (!formData.transformationComplexity.trim()) {
          errors.transformationComplexity = "Transformation complexity is required when data migration is in scope";
        }
        if (!formData.dataValidationMethod.trim()) {
          errors.dataValidationMethod = "Data validation method is required when data migration is in scope";
        }
        if (errors.etlApproach || errors.transformationComplexity || errors.dataValidationMethod) {
          errors.dataMigrationSection = "Data Migration details are mandatory because Data Migration is marked In Scope in Step 1.";
        }
      }

      if (Object.keys(errors).length > 0) {
        // Show ALL errors at once and mark ALL fields as touched
        setStepErrors(errors);
        setTouchedFields(() => {
          const all = new Set<string>();
          Object.keys(errors).forEach((k) => all.add(k));
          return all;
        });
        // Scroll to the first field with an error after React renders
        setTimeout(() => {
          const firstErrorKey = Object.keys(errors)[0];
          const el = document.querySelector(`[data-field="${firstErrorKey}"], [data-field-error="${firstErrorKey}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(() => { window.scrollBy({ top: -100, behavior: "smooth" }); }, 400);
          }
        }, 200);
        return;
      }

      // All valid — save step to API, then show success modal
      setStepErrors({});
      setTouchedFields(new Set());
      setApiError("");

      const advanceToNext = () => {
        setCurrentStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      // Step 9 is the review step (no save, just generate) — skip API call
      if (currentStep <= 8 && wizardId) {
        saveStepMutation.mutate(
          { step: currentStep, formData: formData as unknown as Record<string, unknown> },
          {
            onSuccess: (data) => {
              setApiError("");
              if (typeof (data as any)?.confidence_score === "number") setStepApiConfidence((data as any).confidence_score);
              advanceToNext();
            },
            onError: (err) => {
              // If wizard not found (404), clear stale ID and create a new one
              if (err.message.includes("404") || err.message.includes("not found")) {
                sessionStorage.removeItem("sow-wizard-id");
                setWizardId(null);
                createNewWizard();
              }
              setApiError(friendlyApiError(err));
              // Still advance even if API fails
              advanceToNext();
            },
          },
        );
      } else {
        // No wizard session yet — proceed locally
        advanceToNext();
      }
    }
  };


  if (generationComplete) {
    return (
      <>
      <SOWAIDraftReviewPage
        sowId={generatedSowId}
        flow="ai"
        detailsOverride={wizardFormDataToDetails(formData as unknown as Record<string, any>)}
        onSubmitComplete={() => {
          try {
            sessionStorage.removeItem("sow-generator-draft");
            sessionStorage.removeItem("sow-wizard-id");
            sessionStorage.removeItem("sow-ai-review-active");
          } catch { /* ignore */ }
          setWizardSubmitted(true);
        }}
        onBack={() => {
          setGenerationComplete(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onRejectRegenerate={() => {
          setGenerationComplete(false);
          setGeneratedSowId(null);
          setCurrentStep(0);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <NavigationGuardModal
        open={navGuard.showModal}
        onStay={navGuard.onStay}
        onSaveAndLeave={navGuard.onConfirmLeave}
        onDiscardAndLeave={() => {
          sessionStorage.removeItem("sow-generator-draft");
          sessionStorage.removeItem("sow-wizard-id");
          navGuard.onConfirmLeave();
        }}
        flowLabel="the AI SOW Wizard (Review & Submit SOW)"
      />
      </>
    );
  }

  return (
    <>
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ GENERATE CONFIRMATION MODAL ═══ */}
      <AnimatePresence>
        {showGenerateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(15,10,6,0.65)", backdropFilter: "blur(10px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl"
              style={{
                background: "linear-gradient(160deg, #FFFFFF 0%, #FAF7F4 100%)",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(229,221,212,0.9)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, transparent 0%, #A67763 25%, #2A6068 50%, #A67763 75%, transparent 100%)" }} />
              <div style={{ padding: "28px 28px 24px" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center rounded-xl"
                    style={{ width: 40, height: 40, background: "linear-gradient(135deg, rgba(166,119,99,0.12), rgba(166,119,99,0.06))", border: "1px solid rgba(166,119,99,0.2)" }}>
                    <Sparkles style={{ width: 18, height: 18, color: "#A67763" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-rich)", margin: 0 }}>Generate SOW with AI</h3>
                    <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0, marginTop: 2 }}>Review your inputs before proceeding</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-base)", lineHeight: 1.6, marginBottom: 20 }}>
                  Your form data will be sent to the AI to generate a fully structured Statement of Work. This may take a few moments.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowGenerateConfirm(false)}
                    style={{ padding: "8px 16px", fontSize: 12, fontWeight: 500, borderRadius: 8, border: "1px solid var(--border-soft)", background: "transparent", color: "var(--ink-muted)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmGenerate}
                    className="flex items-center gap-1.5"
                    style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, borderRadius: 8, background: "linear-gradient(135deg, #A67763, #886151)", color: "#FFFFFF", border: "1px solid rgba(166,119,99,0.30)", boxShadow: "0 2px 10px rgba(166,119,99,0.25)", cursor: "pointer" }}
                  >
                    <Sparkles style={{ width: 13, height: 13 }} /> Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(DUMMY_FORM_DATA);
                setStepErrors({});
                setTouchedFields(new Set());
                setApiError("");
              }}
              title="Populate every field with realistic sample values (dev helper)"
              className="inline-flex items-center gap-1.5 rounded-lg transition-all duration-200"
              style={{
                padding: '6px 12px',
                fontSize: 11, fontWeight: 600,
                color: '#86713D',
                background: 'rgba(208,176,96,0.08)',
                border: '1px dashed rgba(208,176,96,0.35)',
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(208,176,96,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(208,176,96,0.08)'; }}
            >
              <Sparkles style={{ width: 12, height: 12 }} /> Fill Dummy Data
            </button>
            <div className="rounded-lg" style={{
              padding: '6px 14px',
              background: 'rgba(166,119,99,0.06)',
              border: '1px solid rgba(166,119,99,0.12)',
              fontSize: 12, fontWeight: 600, color: '#A67763',
            }}>
              Step {currentStep + 1} of {STEPS.length}
            </div>
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
            const isDone = idx < currentStep && !isActive;
            const isSkipped = skippedSteps.has(idx) && !isDone && idx !== currentStep;
            const isReachable = idx <= currentStep || isStepComplete(idx - 1);
            const StepIcon = step.icon;

            return (
              <React.Fragment key={idx}>
                {/* Step node — fixed width so connectors get the remaining space */}
                <button
                  onClick={() => { if (isReachable) { setStepErrors({}); setTouchedFields(new Set()); if (idx === 9) setCameFromReview(false); setCurrentStep(idx); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
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
                          : 'rgba(166,119,99,0.06)',
                      border: `1.5px solid ${
                        isActive
                          ? 'rgba(166,119,99,0.40)'
                          : isDone
                            ? 'rgba(77,87,65,0.25)'
                            : 'rgba(166,119,99,0.18)'
                      }`,
                      boxShadow: isActive ? '0 2px 10px rgba(166,119,99,0.25)' : 'none',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 style={{ width: 12, height: 12, color: '#4D5741' }} />
                    ) : (
                      <StepIcon style={{
                        width: isActive ? 14 : 11,
                        height: isActive ? 14 : 11,
                        color: isActive ? '#FFFFFF' : 'var(--ink-faint)',
                        strokeWidth: 1.5,
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
                    {currentStep === 9 && <Step9ReviewGenerate formData={formData} updateField={updateField} aiConfidence={aiConfidence} isStepComplete={isStepComplete} skippedSteps={skippedSteps} setCurrentStep={(step) => { setCameFromReview(true); setCurrentStep(step); }} errors={stepErrors} blurField={blurField} reviewSummaryData={reviewSummary.data?.data ?? null} reviewSummaryLoading={reviewSummary.isLoading} />}
                  </div>

                  {/* Navigation footer */}
                  <div style={{ padding: '16px 26px 20px', borderTop: '1px solid var(--border-hair)' }}>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setStepErrors({}); setTouchedFields(new Set()); setCurrentStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
                        {/* Back to Review button — only when user navigated from Review step */}
                        {cameFromReview && currentStep !== 9 && (
                          <button
                            onClick={() => { setCameFromReview(false); setStepErrors({}); setTouchedFields(new Set()); setCurrentStep(9); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                            style={{
                              padding: '7px 16px', fontSize: 12, fontWeight: 600,
                              color: '#A67763',
                              background: 'rgba(166,119,99,0.06)',
                              border: '1px solid rgba(166,119,99,0.18)',
                              cursor: 'pointer',
                            }}
                          >
                            <ClipboardCheck style={{ width: 12, height: 12 }} /> Back to Review
                          </button>
                        )}

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
                            {saveStepMutation.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : <>Next <ArrowRight style={{ width: 12, height: 12 }} /></>}
                          </button>
                        ) : generatedSowId ? (
                          <button
                            onClick={() => setGenerationComplete(true)}
                            className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                            style={{
                              padding: '8px 20px',
                              background: 'linear-gradient(135deg, #2A6068, #1a4049)',
                              color: '#FFFFFF',
                              fontSize: 12, fontWeight: 600,
                              border: '1px solid rgba(42,96,104,0.30)',
                              boxShadow: '0 2px 10px rgba(42,96,104,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(42,96,104,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(42,96,104,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; }}
                          >
                            <ArrowRight style={{ width: 13, height: 13 }} /> Review & Submit SOW
                          </button>
                        ) : (
                          <button
                            onClick={handleGenerate}
                            disabled={!canGenerate() || generateMutation.isPending}
                            className="flex items-center gap-1.5 rounded-lg transition-all duration-200"
                            style={{
                              padding: '8px 20px',
                              background: canGenerate() && !generateMutation.isPending ? 'linear-gradient(135deg, #A67763, #886151)' : 'rgba(166,119,99,0.15)',
                              color: canGenerate() && !generateMutation.isPending ? '#FFFFFF' : 'var(--ink-faint)',
                              fontSize: 12, fontWeight: 600,
                              border: `1px solid ${canGenerate() && !generateMutation.isPending ? 'rgba(166,119,99,0.30)' : 'var(--border-soft)'}`,
                              boxShadow: canGenerate() && !generateMutation.isPending ? '0 2px 10px rgba(166,119,99,0.25), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                              cursor: canGenerate() && !generateMutation.isPending ? 'pointer' : 'not-allowed',
                              opacity: canGenerate() && !generateMutation.isPending ? 1 : 0.6,
                            }}
                            onMouseEnter={(e) => { if (canGenerate() && !generateMutation.isPending) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(166,119,99,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { if (canGenerate() && !generateMutation.isPending) { e.currentTarget.style.boxShadow = '0 2px 10px rgba(166,119,99,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; } }}
                          >
                            {generateMutation.isPending
                              ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Generating...</>
                              : <><Sparkles style={{ width: 13, height: 13 }} /> Generate SOW with AI</>
                            }
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
                {(() => {
                  const apiLayers: any[] = (reviewSummary.data?.data as any)?.hallucination_layers ?? [];
                  if (apiLayers.length > 0) {
                    return apiLayers.map((layer: any, idx: number) => {
                      const active = layer.active !== false && layer.status !== "inactive";
                      return (
                        <div key={layer.layer_id ?? idx} className="flex items-center gap-2.5">
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: active ? (layer.status === "red" ? '#c04444' : layer.status === "amber" ? '#C4A24E' : '#4D5741') : 'var(--border-soft)',
                            boxShadow: active ? '0 0 4px rgba(77,87,65,0.30)' : 'none',
                            transition: 'all 0.3s ease',
                          }} />
                          <span style={{ fontSize: 12, color: active ? 'var(--ink-mid)' : 'var(--ink-faint)', fontWeight: active ? 500 : 400 }}>
                            {layer.name}
                          </span>
                        </div>
                      );
                    });
                  }
                  return HALLUCINATION_LAYERS.map((layer, idx) => {
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
                  });
                })()}
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

    </motion.div>

    {/* ═══ NAVIGATION GUARD MODAL ═══ */}
    <NavigationGuardModal
      open={navGuard.showModal}
      onStay={navGuard.onStay}
      onSaveAndLeave={navGuard.onConfirmLeave}
      onDiscardAndLeave={() => {
        sessionStorage.removeItem("sow-generator-draft");
        sessionStorage.removeItem("sow-wizard-id");
        navGuard.onConfirmLeave();
      }}
      flowLabel={`the AI SOW Wizard (Step ${currentStep + 1} of ${STEPS.length})`}
    />
    </>
  );
}


/* ================================================================
   STEP 0 — Context & Discovery
   ================================================================ */
function Step0ContextDiscovery({ formData, updateField, addListItem, removeListItem, updateListItem, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-5">
      <SectionHeading>Section A — Project Vision &amp; Business Context</SectionHeading>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Step 0 captures the WHY before any WHAT. Every clause in the output is anchored to these inputs.
      </p>

      {/* Project Vision / Elevator Pitch — FSD: min 50 / max 500 chars */}
      <div data-field="projectVision">
        <FieldLabel required>Project Vision / Elevator Pitch</FieldLabel>
        <Textarea
          placeholder="Describe the overarching vision for this project (min 50, max 500 characters)..."
          value={formData.projectVision}
          onChange={(e) => updateField("projectVision", e.target.value.slice(0, 500))}
          onBlur={onBlur("projectVision")}
          className="min-h-[100px]"
        />
        <FieldError error={errors.projectVision} field="projectVision" />
      </div>

      {/* Business Objectives (SMART) — FSD: Objective + Measurable Target + Timeline, min 1, max 6 */}
      <div data-field="businessObjectives">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">Business Objectives (SMART) *</label>
          {formData.businessObjectives.length < 6 && (
            <button
              onClick={() => updateField("businessObjectives", [...formData.businessObjectives, { objective: "", measurableTarget: "", timeline: "" }])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Objective
            </button>
          )}
        </div>
        <div className="space-y-3">
          {formData.businessObjectives.map((obj, idx) => (
            <div key={idx} className="relative p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.businessObjectives.length > 1 && (
                <button onClick={() => updateField("businessObjectives", formData.businessObjectives.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <FieldLabel required>Objective (max 200 chars)</FieldLabel>
                  <Input placeholder="e.g., Increase user retention by 30%" value={obj.objective ?? ""}
                    onChange={(e) => updateField("businessObjectives", formData.businessObjectives.map((o, i) => i === idx ? { ...o, objective: e.target.value.slice(0, 200) } : o))}
                    onBlur={onBlur("businessObjectives")} />
                </div>
                <div>
                  <FieldLabel>Timeline (max 50 chars)</FieldLabel>
                  <Input placeholder="e.g., By Q3 2026" value={obj.timeline ?? ""}
                    onChange={(e) => updateField("businessObjectives", formData.businessObjectives.map((o, i) => i === idx ? { ...o, timeline: e.target.value.slice(0, 50) } : o))} />
                </div>
              </div>
              <div className="mt-2">
                <FieldLabel>Measurable Target (max 100 chars)</FieldLabel>
                <Input placeholder="e.g., Retention rate from 60% to 78%" value={obj.measurableTarget ?? ""}
                  onChange={(e) => updateField("businessObjectives", formData.businessObjectives.map((o, i) => i === idx ? { ...o, measurableTarget: e.target.value.slice(0, 100) } : o))} />
              </div>
            </div>
          ))}
        </div>
        <FieldError error={errors.businessObjectives} field="businessObjectives" />
      </div>

      {/* Pain Points / Problems Being Solved — FSD: Problem (max 300) + Who experiences it, min 1, max 8 */}
      <div data-field="painPoints">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">Pain Points / Problems Being Solved *</label>
          {formData.painPoints.length < 8 && (
            <button
              onClick={() => updateField("painPoints", [...formData.painPoints, { problemDescription: "", whoExperiences: "" }])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Pain Point
            </button>
          )}
        </div>
        <div className="space-y-3">
          {formData.painPoints.map((point, idx) => (
            <div key={idx} className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.painPoints.length > 1 && (
                <button onClick={() => updateField("painPoints", formData.painPoints.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div>
                <FieldLabel required>Problem Description (Max 300 Chars)</FieldLabel>
                <Textarea placeholder="e.g., Patients cannot check appointment availability..." value={point.problemDescription ?? ""}
                  onChange={(e) => updateField("painPoints", formData.painPoints.map((p, i) => i === idx ? { ...p, problemDescription: e.target.value.slice(0, 300) } : p))}
                  onBlur={onBlur("painPoints")} className="min-h-[80px] resize-none" />
              </div>
              <div>
                <FieldLabel required>Who Experiences It?</FieldLabel>
                <Input placeholder="e.g., Patients" value={point.whoExperiences ?? ""}
                  onChange={(e) => updateField("painPoints", formData.painPoints.map((p, i) => i === idx ? { ...p, whoExperiences: e.target.value } : p))}
                  onBlur={onBlur("painPoints")} />
              </div>
            </div>
          ))}
        </div>
        {errors.painPoints && (
          <p data-field-error="painPoints" className="mt-2" style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>{errors.painPoints}</p>
        )}
      </div>

      {/* Strategic / Competitive Context — FSD options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Strategic / Competitive Context</FieldLabel>
          <Select value={formData.strategicContext} onValueChange={(v) => updateField("strategicContext", v)}>
            <SelectTrigger><SelectValue placeholder="Select context" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new_market_opportunity">New Market Opportunity</SelectItem>
              <SelectItem value="regulatory_obligation">Regulatory Obligation</SelectItem>
              <SelectItem value="competitive_catchup">Competitive Catch-up</SelectItem>
              <SelectItem value="internal_efficiency">Internal Efficiency</SelectItem>
              <SelectItem value="cost_reduction">Cost Reduction</SelectItem>
              <SelectItem value="revenue_generation">Revenue Generation</SelectItem>
              <SelectItem value="digital_transformation">Digital Transformation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div data-field="businessCriticality">
          <FieldLabel required>Business Criticality</FieldLabel>
          <Select value={formData.businessCriticality} onValueChange={(v) => updateField("businessCriticality", v)}>
            <SelectTrigger><SelectValue placeholder="Select criticality" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mission_critical">Mission-critical</SelectItem>
              <SelectItem value="business_important">Business-important</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.businessCriticality} field="businessCriticality" />
        </div>
      </div>

      <SectionHeading>Section B — Current State &amp; Desired Future State</SectionHeading>

      {/* Current State (As-Is) — FSD: Radio "Not applicable — greenfield" or free text min 30 / max 1000 */}
      <div data-field="currentState">
        <FieldLabel required>Current State (As-Is)</FieldLabel>
        <RadioGroup
          value={formData.currentStateType}
          onChange={(v) => {
            updateField("currentStateType", v);
            if (v === "greenfield") updateField("currentState", "Not applicable — greenfield");
          }}
          options={[
            { value: "greenfield", label: "Not applicable — greenfield" },
            { value: "existing", label: "Existing system (describe below)" },
          ]}
        />
        {formData.currentStateType !== "greenfield" && (
          <div className="mt-2">
            <Textarea
              placeholder="Describe the current state of the system/process (min 30, max 1000 chars)..."
              value={formData.currentStateType === "greenfield" ? "" : formData.currentState}
              onChange={(e) => updateField("currentState", e.target.value.slice(0, 1000))}
              onBlur={onBlur("currentState")}
              className="min-h-[80px]"
            />
            <FieldError error={errors.currentState} field="currentState" />
          </div>
        )}
      </div>

      {/* Desired Future State (To-Be) — FSD: min 30 / max 1000 */}
      <div data-field="desiredFutureState">
        <FieldLabel required>Desired Future State (To-Be)</FieldLabel>
        <Textarea
          placeholder="Describe the desired end state after project completion (min 30, max 1000 chars)..."
          value={formData.desiredFutureState}
          onChange={(e) => updateField("desiredFutureState", e.target.value.slice(0, 1000))}
          onBlur={onBlur("desiredFutureState")}
          className="min-h-[80px]"
        />
        <FieldError error={errors.desiredFutureState} field="desiredFutureState" />
      </div>

      {/* Previous Attempts / Lessons Learned — FSD: max 500 */}
      <div>
        <FieldLabel>Previous Attempts / Lessons Learned</FieldLabel>
        <Textarea
          placeholder="Describe any previous attempts to solve this problem (optional, max 500 chars)..."
          value={formData.previousAttempts}
          onChange={(e) => updateField("previousAttempts", e.target.value.slice(0, 500))}
          className="min-h-[70px]"
        />
      </div>

      <SectionHeading>Section C — Target End Users</SectionHeading>

      {/* End User Profiles — FSD: Role name + Count + Age range + Technical literacy + Primary device + Geography + Accessibility needs, min 1, max 10 */}
      <div data-field="endUserProfiles">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">End User Profiles *</label>
          {formData.endUserProfiles.length < 10 && (
            <button
              onClick={() => updateField("endUserProfiles", [...formData.endUserProfiles, { roleName: "", count: "", ageRange: "", techLiteracy: "", primaryDevice: "", geography: "", accessibilityNeeds: "" }])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Profile
            </button>
          )}
        </div>
        <div className="space-y-3">
          {formData.endUserProfiles.map((profile, idx) => (
            <div key={idx} className="relative p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.endUserProfiles.length > 1 && (
                <button onClick={() => updateField("endUserProfiles", formData.endUserProfiles.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <FieldLabel required>Role Name</FieldLabel>
                  <Input placeholder="e.g., Enterprise Admin" value={profile.roleName ?? ""}
                    onChange={(e) => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, roleName: e.target.value } : p))}
                    onBlur={onBlur("endUserProfiles")} />
                </div>
                <div>
                  <FieldLabel>User Count</FieldLabel>
                  <Input placeholder="e.g., 500" value={profile.count ?? ""}
                    onChange={(e) => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, count: e.target.value } : p))} />
                </div>
                <div>
                  <FieldLabel>Age Range</FieldLabel>
                  <Select value={profile.ageRange ?? ""} onValueChange={(v) => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, ageRange: v } : p))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_18">Under 18</SelectItem>
                      <SelectItem value="18-25">18–25</SelectItem>
                      <SelectItem value="25-35">25–35</SelectItem>
                      <SelectItem value="35-45">35–45</SelectItem>
                      <SelectItem value="45-55">45–55</SelectItem>
                      <SelectItem value="55-65">55–65</SelectItem>
                      <SelectItem value="65+">65+</SelectItem>
                      <SelectItem value="all_ages">All Ages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Technical Literacy</FieldLabel>
                  <Select value={profile.techLiteracy ?? ""} onValueChange={(v) => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, techLiteracy: v } : p))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Primary Device</FieldLabel>
                  <Input placeholder="e.g., Mobile" value={profile.primaryDevice ?? ""}
                    onChange={(e) => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, primaryDevice: e.target.value } : p))} />
                </div>
                <div>
                  <FieldLabel>Geography</FieldLabel>
                  <Input placeholder="e.g., India, US" value={profile.geography ?? ""}
                    onChange={(e) => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, geography: e.target.value } : p))} />
                </div>
                <div>
                  <FieldLabel>Accessibility Needs</FieldLabel>
                  <div className="flex items-center gap-1.5">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unknown", label: "Unknown" },
                    ].map((opt) => {
                      const selected = (profile.accessibilityNeeds ?? "") === opt.value;
                      return (
                        <button key={opt.value} type="button"
                          onClick={() => updateField("endUserProfiles", formData.endUserProfiles.map((p, i) => i === idx ? { ...p, accessibilityNeeds: opt.value } : p))}
                          className="flex-1 rounded-lg text-[12px] font-medium py-2 transition-all"
                          style={{
                            background: selected ? "linear-gradient(135deg, var(--primary), var(--primary))" : "white",
                            color: selected ? "white" : "var(--ink-mid)",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <FieldError error={errors.endUserProfiles} field="endUserProfiles" />
      </div>

      {/* Language Requirements — FSD: Multi-select + conditional */}
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
          <OtherLanguageTagInput languages={formData.customLanguages} onChange={(v) => updateField("customLanguages", v)} />
        )}
      </div>

      {/* User Expectations & Non-Negotiables — FSD: each max 200 chars */}
      <ListField label="User Expectations & Non-Negotiables" items={formData.userExpectations} fieldKey="userExpectations" placeholder="e.g., Sub-second page load times (max 200 chars)" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Expectation" />

      {/* Enterprise's Expectations of GlimmoraTeam — FSD: max 500 */}
      <div>
        <FieldLabel>Enterprise&apos;s Expectations of GlimmoraTeam</FieldLabel>
        <Textarea
          placeholder="Open field — what does the enterprise expect from GlimmoraTeam? (max 500 chars)"
          value={formData.enterpriseExpectations}
          onChange={(e) => updateField("enterpriseExpectations", e.target.value.slice(0, 500))}
          className="min-h-[60px]"
        />
      </div>

      {/* Definition of Project Success — FSD: min 30 / max 500 */}
      <div data-field="definitionOfSuccess">
        <FieldLabel required>Definition of Project Success</FieldLabel>
        <Textarea
          placeholder="Enterprise's subjective measure of success (min 30, max 500 chars)"
          value={formData.definitionOfSuccess}
          onChange={(e) => updateField("definitionOfSuccess", e.target.value.slice(0, 500))}
          onBlur={onBlur("definitionOfSuccess")}
          className="min-h-[80px]"
        />
        <FieldError error={errors.definitionOfSuccess} field="definitionOfSuccess" />
      </div>

      <TipBox icon={Lightbulb} variant="teal" title="Why this step is first:">
        Without declared business context — vision, objectives, pain points, current state, end user characteristics, success metrics — the AI generates technically correct features that may solve the wrong problem.
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
        <div data-field="title">
          <FieldLabel required>Project Title</FieldLabel>
          <Input placeholder="e.g., Enterprise Resource Planning Platform v2.0" value={formData.title} onChange={(e) => updateField("title", e.target.value)} onBlur={onBlur("title")} />
          <FieldError error={errors.title} field="title" />
        </div>
        <div data-field="client">
          <FieldLabel required>Client / Organization</FieldLabel>
          <Input placeholder="e.g., TechVista Solutions" value={formData.client} onChange={(e) => updateField("client", e.target.value)} onBlur={onBlur("client")} />
          <FieldError error={errors.client} field="client" />
        </div>
      </div>

      {/* Industry, Project Category, Platform Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div data-field="industry">
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
          <FieldError error={errors.industry} field="industry" />
        </div>
        <div data-field="projectCategory">
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
          <FieldError error={errors.projectCategory} field="projectCategory" />
        </div>
        <div data-field="platformType">
          <FieldLabel required>Platform Type (select all that apply)</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              { value: "web", label: "Web App" },
              { value: "mobile_ios", label: "Mobile iOS" },
              { value: "mobile_android", label: "Mobile Android" },
              { value: "mobile_hybrid", label: "Mobile Hybrid" },
              { value: "desktop", label: "Desktop" },
              { value: "api_backend", label: "API / Backend" },
              { value: "other", label: "Other" },
            ].map(({ value, label }) => {
              const selected = (formData.platformType as string[]).includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const current = formData.platformType as string[];
                    updateField("platformType", selected ? current.filter(v => v !== value) : [...current, value]);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
                    selected
                      ? "bg-brown-500 border-brown-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-brown-300 hover:text-brown-600"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <FieldError error={errors.platformType} field="platformType" />
        </div>
      </div>

      {/* Existing Tech Landscape */}
      <div>
        <FieldLabel>Existing Tech Landscape</FieldLabel>
        <Textarea placeholder="Describe any existing systems, tools, or tech the project must work with (optional)..." value={formData.existingTechLandscape} onChange={(e) => updateField("existingTechLandscape", e.target.value)} className="min-h-[70px]" />
      </div>

      <SectionHeading>Section B — Functional Requirements</SectionHeading>

      {/* Feature / Module List — FSD: Module Name + Description + Priority, min 2 */}
      <div data-field="featureModules">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">Feature / Module List * (min 2)</label>
          <button onClick={() => updateField("featureModules", [...formData.featureModules, { moduleName: "", description: "", priority: "" }])}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Module
          </button>
        </div>
        <div className="space-y-3">
          {formData.featureModules.map((mod, idx) => (
            <div key={idx} className="relative p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.featureModules.length > 1 && (
                <button onClick={() => updateField("featureModules", formData.featureModules.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {(() => {
                const isDuplicate = mod.moduleName.trim().length > 0 &&
                  formData.featureModules.some((m, i) => i !== idx && m.moduleName.trim().toLowerCase() === mod.moduleName.trim().toLowerCase());
                return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <FieldLabel required>Module Name (max 100)</FieldLabel>
                  <Input placeholder="e.g., User Authentication" value={mod.moduleName ?? ""}
                    onChange={(e) => updateField("featureModules", formData.featureModules.map((m, i) => i === idx ? { ...m, moduleName: e.target.value.slice(0, 100) } : m))}
                    onBlur={onBlur("featureModules")}
                    className={isDuplicate ? "border-red-300 focus:border-red-400" : ""} />
                  {isDuplicate && <p className="text-[11px] text-red-500 mt-1 font-medium">Module name already exists</p>}
                </div>
                <div>
                  <FieldLabel>Description (max 300)</FieldLabel>
                  <Input placeholder="e.g., JWT-based auth with SSO support" value={mod.description ?? ""}
                    onChange={(e) => updateField("featureModules", formData.featureModules.map((m, i) => i === idx ? { ...m, description: e.target.value.slice(0, 300) } : m))} />
                </div>
                <div>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={mod.priority ?? ""} onValueChange={(v) => updateField("featureModules", formData.featureModules.map((m, i) => i === idx ? { ...m, priority: v } : m))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="must_have">Must Have</SelectItem>
                      <SelectItem value="should_have">Should Have</SelectItem>
                      <SelectItem value="nice_to_have">Nice to Have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                );
              })()}
            </div>
          ))}
        </div>
        <FieldError error={errors.featureModules} field="featureModules" />
      </div>

      {/* User Roles / Personas — FSD: Role Name + Primary Actions, min 1, max 20 */}
      <div data-field="userRoles">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">User Roles / Personas *</label>
          {formData.userRoles.length < 20 && (
            <button onClick={() => updateField("userRoles", [...formData.userRoles, { roleName: "", primaryActions: "" }])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Role
            </button>
          )}
        </div>
        <div className="space-y-3">
          {formData.userRoles.map((role, idx) => (
            <div key={idx} className="relative grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.userRoles.length > 1 && (
                <button onClick={() => updateField("userRoles", formData.userRoles.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div>
                <FieldLabel required>Role Name</FieldLabel>
                <Input placeholder="e.g., Admin" value={role.roleName ?? ""}
                  onChange={(e) => updateField("userRoles", formData.userRoles.map((r, i) => i === idx ? { ...r, roleName: e.target.value } : r))}
                  onBlur={onBlur("userRoles")} />
              </div>
              <div>
                <FieldLabel>Primary Actions (max 200)</FieldLabel>
                <Input placeholder="e.g., Manage users, configure settings" value={role.primaryActions ?? ""}
                  onChange={(e) => updateField("userRoles", formData.userRoles.map((r, i) => i === idx ? { ...r, primaryActions: e.target.value.slice(0, 200) } : r))} />
              </div>
            </div>
          ))}
        </div>
        <FieldError error={errors.userRoles} field="userRoles" />
      </div>

      {/* Key Business Workflows — FSD: Name + numbered steps + outcome, min 1 */}
      <div data-field="businessWorkflows">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">Key Business Workflows *</label>
          <button onClick={() => updateField("businessWorkflows", [...formData.businessWorkflows, { name: "", steps: "", outcome: "" }])}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Workflow
          </button>
        </div>
        <div className="space-y-3">
          {formData.businessWorkflows.map((wf, idx) => (
            <div key={idx} className="relative p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.businessWorkflows.length > 1 && (
                <button onClick={() => updateField("businessWorkflows", formData.businessWorkflows.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <FieldLabel required>Workflow Name</FieldLabel>
                  <Input placeholder="e.g., Order-to-fulfillment" value={wf.name ?? ""}
                    onChange={(e) => updateField("businessWorkflows", formData.businessWorkflows.map((w, i) => i === idx ? { ...w, name: e.target.value } : w))}
                    onBlur={onBlur("businessWorkflows")} />
                </div>
                <div>
                  <FieldLabel>Steps</FieldLabel>
                  <Input placeholder="e.g., 1. Submit → 2. Review → 3. Approve" value={wf.steps ?? ""}
                    onChange={(e) => updateField("businessWorkflows", formData.businessWorkflows.map((w, i) => i === idx ? { ...w, steps: e.target.value } : w))} />
                </div>
                <div>
                  <FieldLabel>Outcome</FieldLabel>
                  <Input placeholder="e.g., Order dispatched" value={wf.outcome ?? ""}
                    onChange={(e) => updateField("businessWorkflows", formData.businessWorkflows.map((w, i) => i === idx ? { ...w, outcome: e.target.value } : w))} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <FieldError error={errors.businessWorkflows} field="businessWorkflows" />
      </div>

      {/* Critical Business Rules — FSD: each max 200 chars */}
      <ListField label="Critical Business Rules" items={formData.criticalBusinessRules} fieldKey="criticalBusinessRules" placeholder="e.g., Orders above $10k require manager approval (max 200)" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Rule" />

      <SectionHeading>Section C — Scope Boundaries</SectionHeading>

      {/* Out of Scope — Exclusions */}
      <ListField label="Out of Scope — Exclusions *" items={formData.outOfScope} fieldKey="outOfScope" placeholder="e.g., Legacy data migration, Mobile app (max 200)" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Item" error={errors.outOfScope} onBlur={onBlur("outOfScope")} />

      {/* Assumptions */}
      <ListField label="Assumptions" items={formData.assumptions} fieldKey="assumptions" placeholder="e.g., Client will provide API documentation by Week 2 (max 200)" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Assumption" />

      {/* Constraints */}
      <ListField label="Constraints" items={formData.constraints} fieldKey="constraints" placeholder="e.g., Must use client's existing AWS account" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Constraint" />

      {/* Data Migration Scope — FSD: Radio + conditional 6 sub-fields */}
      <div data-field="dataMigrationScope">
        <FieldLabel required>Data Migration Scope</FieldLabel>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
          <div>
            <FieldLabel>Source System</FieldLabel>
            <Input placeholder="e.g., Oracle ERP, SAP" value={formData.dataMigrationSource} onChange={(e) => updateField("dataMigrationSource", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Data Volume</FieldLabel>
            <Select value={formData.dataMigrationVolume} onValueChange={(v) => updateField("dataMigrationVolume", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="< 10K rows">&lt; 10K rows</SelectItem>
                <SelectItem value="10K–1M rows">10K–1M rows</SelectItem>
                <SelectItem value="1M–100M rows">1M–100M rows</SelectItem>
                <SelectItem value="> 100M rows">&gt; 100M rows</SelectItem>
                <SelectItem value="Volume in GB">Volume in GB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Migration Approach</FieldLabel>
            <Select value={formData.dataMigrationApproach} onValueChange={(v) => updateField("dataMigrationApproach", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="One-time cutover">One-time cutover</SelectItem>
                <SelectItem value="Incremental">Incremental</SelectItem>
                <SelectItem value="Ongoing sync">Ongoing sync</SelectItem>
                <SelectItem value="Delta">Delta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Extract Ownership</FieldLabel>
            <Select value={formData.dataMigrationExtractOwnership} onValueChange={(v) => updateField("dataMigrationExtractOwnership", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="GlimmoraTeam">GlimmoraTeam</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
                <SelectItem value="Third-party">Third-party</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Validation Responsibility</FieldLabel>
            <Select value={formData.dataMigrationValidation} onValueChange={(v) => updateField("dataMigrationValidation", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="GlimmoraTeam">GlimmoraTeam</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
                <SelectItem value="Third-party">Third-party</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Rollback Plan</FieldLabel>
            <Select value={formData.dataMigrationRollback} onValueChange={(v) => updateField("dataMigrationRollback", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      <SectionHeading>Section A — Delivery Scope Boundary</SectionHeading>

      {/* Development Scope — FSD: Frontend / Backend / Database / Third-party integration / CI/CD */}
      <div data-field="developmentScope">
        <FieldLabel required>Development Scope</FieldLabel>
        <CheckboxGroup
          values={formData.developmentScope}
          onChange={(v) => updateField("developmentScope", v)}
          options={[
            { value: "frontend", label: "Frontend" },
            { value: "backend", label: "Backend" },
            { value: "integration", label: "Third-party Integration" },
            { value: "cicd", label: "CI/CD Pipeline" },
          ]}
        />
        <FieldError error={errors.developmentScope} field="developmentScope" />
      </div>

      {/* UI/UX Design Scope — FSD: Not in scope / In scope / Client provides designs */}
      <div data-field="uiuxDesignScope">
        <label className="mb-2 block" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          UI/UX Design Scope *
        </label>
        <RadioGroup
          value={formData.uiuxDesignScope}
          onChange={(v) => updateField("uiuxDesignScope", v)}
          options={[
            { value: "not_in_scope", label: "Not in Scope" },
            // { value: "in_scope", label: "In Scope" }, // TODO: PM to define workflow before re-enabling
            { value: "client_provides", label: "Client Provides" },
          ]}
        />
        <FieldError error={errors.uiuxDesignScope} field="uiuxDesignScope" />
      </div>
      {formData.uiuxDesignScope === "in_scope" && (
        <div className="rounded-xl p-5" style={{ background: "rgba(166,119,99,0.06)", border: "1px solid rgba(166,119,99,0.15)" }}>
          <label className="mb-3 block" style={{ fontSize: 11, fontWeight: 700, color: '#A67763', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Design Deliverables
          </label>
          <div className="space-y-2.5">
            {[
              { value: "wireframes", label: "Wireframes" },
              { value: "high_fidelity", label: "High-fidelity mockups" },
              { value: "design_system", label: "Design system" },
              { value: "prototype", label: "Clickable prototype" },
              { value: "brand_identity", label: "Brand identity work" },
            ].map((opt) => {
              const checked = (formData.uiuxDesignDeliverables ?? []).includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all"
                    style={{
                      borderColor: checked ? "#A67763" : "var(--border-soft)",
                      background: checked ? "#A67763" : "white",
                    }}>
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={checked}
                    onChange={() => {
                      const current = formData.uiuxDesignDeliverables ?? [];
                      const next = checked ? current.filter((v) => v !== opt.value) : [...current, opt.value];
                      updateField("uiuxDesignDeliverables", next);
                    }} />
                  <span className="text-[13px] text-gray-700 group-hover:text-gray-900">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      {formData.uiuxDesignScope === "client_provides" && (
        <div className="rounded-xl p-5" style={{ background: "rgba(166,119,99,0.06)", border: "1px solid rgba(166,119,99,0.15)" }}>
          <label className="mb-4 block" style={{ fontSize: 11, fontWeight: 700, color: '#A67763', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Provide Design Assets
          </label>

          {/* Upload or URL — two cards with OR in between */}
          <div className="flex items-stretch gap-0 mb-4">
            {/* Upload File Card */}
            <label className="flex-1 flex flex-col items-center justify-center gap-2 rounded-l-xl bg-white p-5 cursor-pointer transition-all hover:shadow-md"
              style={{ border: "2px dashed rgba(166,119,99,0.25)", borderRight: "none" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(166,119,99,0.08)" }}>
                <Upload className="w-5 h-5" style={{ color: "#A67763" }} />
              </div>
              <span className="text-[13px] font-medium text-gray-700">Upload File</span>
              <span className="text-[10px] text-gray-400">PDF, PNG, JPG, Figma, Sketch, XD</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.fig,.sketch,.xd,.zip" className="sr-only"
                onChange={(e) => {
                  const fileName = e.target.files?.[0]?.name ?? "";
                  if (fileName) updateField("clientDesignAssets", [...(formData.clientDesignAssets ?? []), { type: "file" as const, value: fileName }]);
                }}
              />
            </label>

            {/* OR divider — vertical between cards */}
            <div className="flex flex-col items-center justify-center px-3 bg-white" style={{ borderTop: "2px dashed rgba(166,119,99,0.25)", borderBottom: "2px dashed rgba(166,119,99,0.25)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A67763" }}>OR</span>
            </div>

            {/* Add URL Card */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 rounded-r-xl bg-white p-5"
              style={{ border: "2px dashed rgba(166,119,99,0.25)", borderLeft: "none" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(166,119,99,0.08)" }}>
                <Link2 className="w-5 h-5" style={{ color: "#A67763" }} />
              </div>
              <span className="text-[13px] font-medium text-gray-700">Add URL</span>
              <div className="w-full flex items-center gap-2 mt-1">
                <Input
                  placeholder="https://figma.com/file/..."
                  className="!text-[12px] !py-1.5 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        updateField("clientDesignAssets", [...(formData.clientDesignAssets ?? []), { type: "url" as const, value: val }]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <button type="button"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    const val = input?.value.trim() ?? "";
                    if (val) {
                      updateField("clientDesignAssets", [...(formData.clientDesignAssets ?? []), { type: "url" as const, value: val }]);
                      input.value = "";
                    }
                  }}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-white shrink-0"
                  style={{ background: "#A67763" }}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Added assets list */}
          {(formData.clientDesignAssets ?? []).length > 0 && (
            <div className="space-y-2">
              {(formData.clientDesignAssets ?? []).map((asset, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5" style={{ border: "1px solid var(--border-soft)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(166,119,99,0.08)" }}>
                    {asset.type === "file"
                      ? <FileText className="w-3.5 h-3.5" style={{ color: "#A67763" }} />
                      : <Link2 className="w-3.5 h-3.5" style={{ color: "#A67763" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] text-gray-700 truncate block">{asset.value || "Untitled"}</span>
                    <span className="text-[10px] text-gray-400">{asset.type === "file" ? "Uploaded file" : "URL link"}</span>
                  </div>
                  <button type="button"
                    onClick={() => updateField("clientDesignAssets", (formData.clientDesignAssets ?? []).filter((_, i) => i !== idx))}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deployment Scope */}
      <div data-field="deploymentScope">
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
        <FieldError error={errors.deploymentScope} field="deploymentScope" />
      </div>
      {(formData.deploymentScope === "cloud" || formData.deploymentScope === "both") && (
        <div className="rounded-xl p-5 space-y-5" style={{ background: "rgba(166,119,99,0.04)", border: "1px solid rgba(166,119,99,0.12)" }}>
          <label className="block" style={{ fontSize: 11, fontWeight: 700, color: '#A67763', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Cloud Deployment Details
          </label>

          {/* Cloud Provider */}
          <div>
            <label className="mb-2 block" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cloud Provider</label>
            <div className="flex items-center gap-2">
              {["AWS", "Azure", "GCP", "Other"].map((p) => {
                const selected = formData.deploymentProvider === p;
                return (
                  <button key={p} type="button" onClick={() => updateField("deploymentProvider", p)}
                    className="rounded-lg px-4 py-2 text-[12px] font-medium transition-all"
                    style={{
                      background: selected ? "#A67763" : "white",
                      color: selected ? "white" : "var(--ink-mid)",
                      border: selected ? "1px solid #A67763" : "1px solid var(--border-soft)",
                    }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Specification */}
          <div>
            <label className="mb-2 block" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Service Specification</label>
            <div className="grid grid-cols-2 gap-2">
              {["EC2/ECS/EKS", "RDS/Aurora", "S3", "CloudFront", "Lambda", "API Gateway", "Load Balancer"].map((svc) => {
                const checked = (formData.deploymentServices ?? []).includes(svc);
                return (
                  <label key={svc} className="flex items-center gap-2.5 cursor-pointer">
                    <div className="w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all"
                      style={{ width: 18, height: 18, borderColor: checked ? "#A67763" : "var(--border-soft)", background: checked ? "#A67763" : "white" }}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={checked}
                      onChange={() => {
                        const curr = formData.deploymentServices ?? [];
                        updateField("deploymentServices", checked ? curr.filter((v) => v !== svc) : [...curr, svc]);
                      }} />
                    <span className="text-[12px] text-gray-700">{svc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Containerisation */}
          <div className="flex items-center justify-between">
            <label className="block" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Containerisation (Docker/K8s)</label>
            <button type="button" onClick={() => updateField("deploymentContainerisation", !formData.deploymentContainerisation)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: formData.deploymentContainerisation ? "#A67763" : "var(--color-gray-200)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: formData.deploymentContainerisation ? 22 : 2 }} />
            </button>
          </div>

          {/* Environments */}
          <div>
            <label className="mb-2 block" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Environments to Create</label>
            <div className="flex items-center gap-2">
              {["Dev", "Staging", "Pre-Prod", "Production"].map((env) => {
                const checked = (formData.deploymentEnvironments ?? []).includes(env);
                return (
                  <label key={env} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all"
                      style={{ width: 18, height: 18, borderColor: checked ? "#A67763" : "var(--border-soft)", background: checked ? "#A67763" : "white" }}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={checked}
                      onChange={() => {
                        const curr = formData.deploymentEnvironments ?? [];
                        updateField("deploymentEnvironments", checked ? curr.filter((v) => v !== env) : [...curr, env]);
                      }} />
                    <span className="text-[12px] text-gray-700">{env}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(formData.deploymentScope === "on_premise" || formData.deploymentScope === "both") && (
        <div className="rounded-xl p-5" style={{ background: "rgba(166,119,99,0.04)", border: "1px solid rgba(166,119,99,0.12)" }}>
          <label className="mb-4 block" style={{ fontSize: 11, fontWeight: 700, color: '#A67763', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            On-Premise Deployment Details
          </label>
          <div className="space-y-3">
            {/* Previous options: ["Server installation", "SSL certificates", "Monitoring & alerting", "Backup configuration"] */}
            {["SSL certificates"].map((svc) => {
              const checked = (formData.onPremiseServices ?? []).includes(svc);
              return (
                <label key={svc} className="flex items-center gap-3 cursor-pointer">
                  <div className="rounded border flex items-center justify-center shrink-0 transition-all"
                    style={{ width: 18, height: 18, borderColor: checked ? "#A67763" : "var(--border-soft)", background: checked ? "#A67763" : "white" }}>
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={checked}
                    onChange={() => {
                      const curr = formData.onPremiseServices ?? [];
                      updateField("onPremiseServices", checked ? curr.filter((v) => v !== svc) : [...curr, svc]);
                    }} />
                  <span className="text-[13px] text-gray-700">{svc}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Go-Live Scope — hidden when Deployment = Not in Scope (auto-set to not_in_scope) */}
      {formData.deploymentScope !== "not_in_scope" && (
      <div data-field="goLiveScope">
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
        <FieldError error={errors.goLiveScope} field="goLiveScope" />
      </div>
      )}
      {formData.deploymentScope !== "not_in_scope" && formData.goLiveScope === "go_live_hypercare" && (
        <div className="rounded-xl p-5 space-y-5" style={{ background: "rgba(166,119,99,0.04)", border: "1px solid rgba(166,119,99,0.12)" }}>
          <label className="block" style={{ fontSize: 11, fontWeight: 700, color: '#A67763', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Hypercare Details
          </label>

          {/* Duration */}
          <div>
            <label className="mb-2 block" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Duration</label>
            <div className="flex items-center gap-2">
              {[
                { value: "1_week", label: "1 week" },
                { value: "2_weeks", label: "2 weeks" },
                { value: "1_month", label: "1 month" },
                { value: "custom", label: "Custom" },
              ].map((opt) => {
                const selected = formData.hypercareDuration === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => updateField("hypercareDuration", opt.value)}
                    className="rounded-lg px-4 py-2 text-[12px] font-medium transition-all"
                    style={{
                      background: selected ? "#A67763" : "white",
                      color: selected ? "white" : "var(--ink-mid)",
                      border: selected ? "1px solid #A67763" : "1px solid var(--border-soft)",
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Support Level */}
          <div>
            <label className="mb-2 block" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Support Level</label>
            <div className="flex items-center gap-2">
              {[
                { value: "bug_fixes", label: "Bug fixes only" },
                { value: "bug_fixes_enhancements", label: "Bug fixes + minor enhancements" },
              ].map((opt) => {
                const selected = formData.hypercareSupport === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => updateField("hypercareSupport", opt.value)}
                    className="flex-1 rounded-lg px-4 py-2.5 text-[12px] font-medium transition-all"
                    style={{
                      background: selected ? "#A67763" : "white",
                      color: selected ? "white" : "var(--ink-mid)",
                      border: selected ? "1px solid #A67763" : "1px solid var(--border-soft)",
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SectionHeading>Section B — Technical Architecture</SectionHeading>

      {/* Technology Stack — FSD: min 10 / max 1000 */}
      <div data-field="techStack">
        <FieldLabel required>Technology Stack</FieldLabel>
        <Textarea placeholder="e.g., React + TypeScript frontend, Node.js/NestJS backend, PostgreSQL, Redis, Docker/K8s (min 10, max 1000 chars)" value={formData.techStack} onChange={(e) => updateField("techStack", e.target.value.slice(0, 1000))} onBlur={onBlur("techStack")} className="min-h-[80px]" />
        <FieldError error={errors.techStack} field="techStack" />
      </div>

      {/* Scalability & Performance Requirements — FSD: Concurrent users + Response time SLA + Data volume */}
      <div>
        <FieldLabel>Scalability &amp; Performance Requirements</FieldLabel>
        <Textarea placeholder="e.g., Concurrent users: 10,000 · Response time p95: <200ms · Data volume at launch: 500GB" value={formData.scalabilityRequirements} onChange={(e) => updateField("scalabilityRequirements", e.target.value)} className="min-h-[60px]" />
      </div>

      {/* Section C — Data Migration Technical Detail (conditional) — FSD §7.3.4 */}
      {formData.dataMigrationScope === "in_scope" && (
        <>
          <SectionHeading>Section C — Data Migration Technical Detail</SectionHeading>
          {errors.dataMigrationSection && (
            <div data-field="dataMigrationSection" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              Data Migration details are mandatory because Data Migration is marked In Scope in Step 1.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-field="etlApproach">
              <FieldLabel required>ETL Approach</FieldLabel>
              <Select value={formData.etlApproach} onValueChange={(v) => updateField("etlApproach", v)}>
                <SelectTrigger><SelectValue placeholder="Select approach" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom_scripts">Custom Scripts</SelectItem>
                  <SelectItem value="aws_dms">AWS DMS</SelectItem>
                  <SelectItem value="talend">Talend</SelectItem>
                  <SelectItem value="azure_data_factory">Azure Data Factory</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FieldError error={errors.etlApproach} field="etlApproach" />
            </div>
            <div data-field="transformationComplexity">
              <FieldLabel required>Transformation Complexity</FieldLabel>
              <Select value={formData.transformationComplexity} onValueChange={(v) => updateField("transformationComplexity", v)}>
                <SelectTrigger><SelectValue placeholder="Select complexity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_transformation">No Transformation</SelectItem>
                  <SelectItem value="simple_mapping">Simple Mapping</SelectItem>
                  <SelectItem value="complex_business_logic">Complex Business Logic</SelectItem>
                  <SelectItem value="data_cleansing">Data Cleansing</SelectItem>
                </SelectContent>
              </Select>
              <FieldError error={errors.transformationComplexity} field="transformationComplexity" />
            </div>
          </div>
          <div data-field="dataValidationMethod">
            <FieldLabel required>Data Validation Method</FieldLabel>
            <RadioGroup
              value={formData.dataValidationMethod}
              onChange={(v) => updateField("dataValidationMethod", v)}
              options={[
                { value: "automated", label: "Automated Scripts" },
                { value: "manual", label: "Manual Spot-check" },
                { value: "both", label: "Both" },
              ]}
            />
            <FieldError error={errors.dataValidationMethod} field="dataValidationMethod" />
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
function Step3IntegrationsUserMgmt({ formData, updateField, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);

  const addIntegration = () => updateField("integrationPoints", [...formData.integrationPoints, { name: "", direction: "", protocol: "", authentication: "", dataFormat: "", sandboxCredentials: "", testingResponsibility: "", errorHandlingSLA: "" }]);
  const removeIntegration = (idx: number) => updateField("integrationPoints", formData.integrationPoints.filter((_, i) => i !== idx));
  const updateIntegration = (idx: number, key: string, value: string) => updateField("integrationPoints", formData.integrationPoints.map((item, i) => i === idx ? { ...item, [key]: value } : item));

  const addNotificationEvent = () => updateField("notificationEvents", [...formData.notificationEvents, { trigger: "", channel: ["Email"] }]);
  const removeNotificationEvent = (idx: number) => updateField("notificationEvents", formData.notificationEvents.filter((_, i) => i !== idx));
  const updateNotificationEvent = (idx: number, key: string, value: string | string[]) => updateField("notificationEvents", formData.notificationEvents.map((item, i) => i === idx ? { ...item, [key]: value } : item));

  const addScheduledJob = () => updateField("scheduledJobItems", [...formData.scheduledJobItems, { jobName: "", frequency: "", triggerCondition: "" }]);
  const removeScheduledJob = (idx: number) => updateField("scheduledJobItems", formData.scheduledJobItems.filter((_, i) => i !== idx));
  const updateScheduledJob = (idx: number, key: string, value: string) => updateField("scheduledJobItems", formData.scheduledJobItems.map((item, i) => i === idx ? { ...item, [key]: value } : item));

  const toggleAuditEvent = (event: string) => {
    if (event === "all") {
      const allEvents = ["login_logout", "data_access", "record_modifications", "configuration_changes", "all"];
      const hasAll = formData.auditLogEvents.includes("all");
      updateField("auditLogEvents", hasAll ? [] : allEvents);
    } else {
      const current = formData.auditLogEvents.filter(e => e !== "all");
      const updated = current.includes(event) ? current.filter(e => e !== event) : [...current, event];
      const allIndividual = ["login_logout", "data_access", "record_modifications", "configuration_changes"];
      const hasAllIndividual = allIndividual.every(e => updated.includes(e));
      updateField("auditLogEvents", hasAllIndividual ? [...updated, "all"] : updated);
    }
  };

  return (
    <div className="space-y-6">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define third-party integrations, authentication, and user management requirements. This step is optional but improves SOW accuracy.
      </p>

      {/* ── SECTION A — External Integrations ── */}
      <SectionHeading>Section A — External Integrations</SectionHeading>

      <div data-field="integrationPoints">
        <IntegrationTableSection
          integrations={formData.integrationPoints}
          onChange={(v) => updateField("integrationPoints", v)}
        />
      </div>

      {/* ── SECTION B — User Management Scope ── */}
      <SectionHeading>Section B — User Management Scope</SectionHeading>

      {/* SSO Required */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(77,87,65,0.10)' }}>
              <ShieldCheck className="w-5 h-5" style={{ color: '#4D5741' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-800">SSO Required</p>
              <p className="text-[11px] text-gray-500">SINGLE SIGN-ON INTEGRATION</p>
            </div>
          </div>
          <RadioGroup
            value={formData.ssoRequired}
            onChange={(v) => updateField("ssoRequired", v)}
            options={[
              { value: "not_required", label: "Not Required" },
              { value: "required", label: "Required" },
            ]}
          />
        </div>
        {formData.ssoRequired === "required" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <FieldLabel>Provider Name*</FieldLabel>
              <Input placeholder="e.g. Okta, Azure AD, Google" value={formData.ssoProviderName} onChange={(e) => updateField("ssoProviderName", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Protocol*</FieldLabel>
              <Input placeholder="SAML 2.0" value={formData.ssoProtocol} onChange={(e) => updateField("ssoProtocol", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* User Registration Model */}
      <div>
        <FieldLabel>User Registration Model</FieldLabel>
        <Select value={formData.userRegistrationModel} onValueChange={(v) => updateField("userRegistrationModel", v)}>
          <SelectTrigger><SelectValue placeholder="Select registration model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="self_registration">Self Registration</SelectItem>
            <SelectItem value="admin_only">Admin-only</SelectItem>
            <SelectItem value="admin_invite">Admin Invite Only</SelectItem>
            <SelectItem value="sso_only">SSO Only</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Password & Session Policy */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(166,119,99,0.10)' }}>
              <Lock className="w-5 h-5" style={{ color: '#A67763' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-800">Password &amp; Session Policy</p>
              <p className="text-[11px] text-gray-500">SECURITY CONSTRAINTS</p>
            </div>
          </div>
          <RadioGroup
            value={formData.passwordPolicy}
            onChange={(v) => updateField("passwordPolicy", v)}
            options={[
              { value: "platform_defaults", label: "Use Platform Defaults" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
        {formData.passwordPolicy === "custom" && (
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Min Length</FieldLabel>
                <Input type="number" value={formData.passwordMinLength} onChange={(e) => updateField("passwordMinLength", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Complexity</FieldLabel>
                <Select value={formData.passwordComplexity} onValueChange={(v) => updateField("passwordComplexity", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Strong">Strong</SelectItem>
                    <SelectItem value="Very Strong">Very Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Expiry (Days)</FieldLabel>
                <Input type="number" value={formData.passwordExpiry} onChange={(e) => updateField("passwordExpiry", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Session Timeout (Min)</FieldLabel>
                <Input type="number" value={formData.sessionTimeout} onChange={(e) => updateField("sessionTimeout", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Lockout Attempts</FieldLabel>
                <Input type="number" value={formData.lockoutAttempts} onChange={(e) => updateField("lockoutAttempts", e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Action Audit Logging */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(77,87,65,0.10)' }}>
              <ShieldCheck className="w-5 h-5" style={{ color: '#4D5741' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-800">User Action Audit Logging</p>
              <p className="text-[11px] text-gray-500">COMPLIANCE &amp; TRACKING</p>
            </div>
          </div>
          <RadioGroup
            value={formData.auditLogging}
            onChange={(v) => updateField("auditLogging", v)}
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ]}
          />
        </div>
        {formData.auditLogging === "yes" && (
          <div className="mt-3">
            <FieldLabel>Events to Log*</FieldLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {[
                { value: "login_logout", label: "Login/Logout" },
                { value: "data_access", label: "Data Access" },
                { value: "record_modifications", label: "Record Modifications" },
                { value: "configuration_changes", label: "Configuration Changes" },
                { value: "all", label: "All" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-white cursor-pointer hover:border-gray-200 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.auditLogEvents.includes(opt.value)}
                    onChange={() => toggleAuditEvent(opt.value)}
                    className="w-4 h-4 rounded border-gray-300 accent-[#A67763]"
                  />
                  <span className="text-[13px] text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION C — Workflow Automation Scope ── */}
      <SectionHeading>Section C — Workflow Automation Scope</SectionHeading>

      {/* Multi-Step Approval Workflows */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(166,119,99,0.10)' }}>
              <Users className="w-5 h-5" style={{ color: '#A67763' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-800">Multi-Step Approval Workflows</p>
              <p className="text-[11px] text-gray-500">HUMAN-IN-THE-LOOP ROUTING</p>
            </div>
          </div>
          <RadioGroup
            value={formData.approvalWorkflows}
            onChange={(v) => updateField("approvalWorkflows", v)}
            options={[
              { value: "not_in_scope", label: "Not in Scope" },
              { value: "in_scope", label: "In Scope" },
            ]}
          />
        </div>
        {formData.approvalWorkflows === "in_scope" && (
          <div className="mt-3">
            <FieldLabel>Select Workflows Requiring Approval*</FieldLabel>
            {formData.businessWorkflows.some(w => w.name.trim().length > 0) ? (
              <div className="space-y-2 mt-2">
                {formData.businessWorkflows.filter(w => w.name.trim().length > 0).map((w, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-white cursor-pointer hover:border-gray-200 transition-all">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#4D5741]" />
                    <span className="text-[13px] text-gray-700">{w.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-lg px-4 py-3" style={{ background: 'rgba(255, 193, 7, 0.12)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#E65100' }} />
                  <p className="text-[12px] font-semibold" style={{ color: '#E65100' }}>No workflows defined in Step 1 yet.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email / Push Notifications */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(166,119,99,0.10)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#A67763' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-800">Email / Push Notifications</p>
              <p className="text-[11px] text-gray-500">USER ENGAGEMENT</p>
            </div>
          </div>
          <RadioGroup
            value={formData.notifications}
            onChange={(v) => updateField("notifications", v)}
            options={[
              { value: "not_in_scope", label: "Not in Scope" },
              { value: "in_scope", label: "In Scope" },
            ]}
          />
        </div>
        {formData.notifications === "in_scope" && (
          <div className="mt-3">
            <FieldLabel>Notification Events (Max 10)*</FieldLabel>
            <div className="space-y-2 mt-2">
              {formData.notificationEvents.map((evt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input placeholder="Event trigger (e.g. New Order Received)" value={evt.trigger} onChange={(e) => updateNotificationEvent(idx, "trigger", e.target.value)} className="flex-1" />
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(["Email", "Push", "SMS", "In-App"] as const).map((ch) => {
                      const channels = Array.isArray(evt.channel) ? evt.channel : [evt.channel];
                      const active = channels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => {
                            const next = active ? channels.filter(c => c !== ch) : [...channels, ch];
                            updateNotificationEvent(idx, "channel", next.length > 0 ? next : [ch]);
                          }}
                          className={cn(
                            "px-2 py-1 rounded-md text-[11px] font-medium border transition-all",
                            active
                              ? "bg-brown-500 border-brown-500 text-white"
                              : "bg-white border-gray-200 text-gray-500 hover:border-brown-300 hover:text-brown-600"
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                  {formData.notificationEvents.length > 1 && (
                    <button onClick={() => removeNotificationEvent(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.notificationEvents.length < 10 && (
              <button onClick={addNotificationEvent}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors">
                <Plus className="w-3.5 h-3.5" /> ADD EVENT
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scheduled / Automated Jobs */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(77,87,65,0.10)' }}>
              <Calendar className="w-5 h-5" style={{ color: '#4D5741' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-800">Scheduled / Automated Jobs</p>
              <p className="text-[11px] text-gray-500">BACKGROUND PROCESSING</p>
            </div>
          </div>
          <RadioGroup
            value={formData.scheduledJobsScope}
            onChange={(v) => updateField("scheduledJobsScope", v)}
            options={[
              { value: "not_in_scope", label: "Not in Scope" },
              { value: "in_scope", label: "In Scope" },
            ]}
          />
        </div>
        {formData.scheduledJobsScope === "in_scope" && (
          <div className="mt-3">
            <FieldLabel>Automated Jobs*</FieldLabel>
            <div className="space-y-3 mt-2">
              {formData.scheduledJobItems.map((job, idx) => (
                <div key={idx} className="relative p-4 rounded-lg border border-gray-100 bg-white">
                  {formData.scheduledJobItems.length > 1 && (
                    <button onClick={() => removeScheduledJob(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Job Name*</FieldLabel>
                      <Input placeholder="e.g. Daily Data Backup" value={job.jobName} onChange={(e) => updateScheduledJob(idx, "jobName", e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>Frequency*</FieldLabel>
                      <Input placeholder="e.g. Every 24 hours" value={job.frequency} onChange={(e) => updateScheduledJob(idx, "frequency", e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <FieldLabel>Trigger Condition (Max 200 Chars)*</FieldLabel>
                    <Textarea placeholder="Describe what triggers this job..." value={job.triggerCondition} onChange={(e) => updateScheduledJob(idx, "triggerCondition", e.target.value.slice(0, 200))} className="min-h-[60px]" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addScheduledJob}
              className="mt-3 w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-[12px] font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-all flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> ADD AUTOMATED JOB
            </button>
          </div>
        )}
      </div>

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
  const todayStr = new Date().toISOString().split('T')[0];
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
          <DateInput value={formData.startDate} onChange={(v) => updateField("startDate", v)} placeholder="Select start date" minDate={todayStr} />
        </div>
        <div>
          <FieldLabel>Target End Date</FieldLabel>
          <DateInput value={formData.endDate} onChange={(v) => updateField("endDate", v)} placeholder="Select end date" minDate={formData.startDate || todayStr} />
        </div>
      </div>

      {/* Phasing Strategy */}
      <div>
        <FieldLabel>Phasing Strategy</FieldLabel>
        <Select value={formData.phasingStrategy} onValueChange={(v) => updateField("phasingStrategy", v)}>
          <SelectTrigger><SelectValue placeholder="Select phasing approach" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">Sequential</SelectItem>
            <SelectItem value="parallel">Parallel Workstreams</SelectItem>
            <SelectItem value="sprint_based">Sprint-based</SelectItem>
            <SelectItem value="milestone_only">Milestone-only</SelectItem>
            <SelectItem value="not_decided">Not Decided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Milestones — FSD: Name + Target Date + Acceptance Criteria (min 50 chars) */}
      <div data-field="milestones">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-semibold text-gray-800">Key Milestones with Acceptance Criteria</label>
            <div className="relative group">
              <button
                type="button"
                aria-label="Milestone definitions"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-1"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
              <div
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-[11px] leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <div>M1: SOW Onboarding</div>
                <div>M2: Dev Milestone</div>
                <div>M3: UAT Sign-off</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {formData.milestones.map((ms, idx) => (
            <div key={idx} className="relative p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <FieldLabel>Milestone Name (max 100)</FieldLabel>
                  <Input placeholder="e.g., Phase 1 Complete" value={ms.name ?? ""} readOnly disabled />
                </div>
                <div>
                  <FieldLabel>Target Date</FieldLabel>
                  <DateInput value={ms.targetDate ?? ""} onChange={(v) => updateField("milestones", formData.milestones.map((m, i) => i === idx ? { ...m, targetDate: v } : m))} placeholder="Select date" minDate={todayStr} />
                </div>
                <div>
                  <FieldLabel>Acceptance Criteria (min 50)</FieldLabel>
                  <Input placeholder="Specific, testable criteria..." value={ms.acceptanceCriteria ?? ""}
                    onChange={(e) => updateField("milestones", formData.milestones.map((m, i) => i === idx ? { ...m, acceptanceCriteria: e.target.value } : m))} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Dependencies */}
      <ListField label="Client Dependencies" items={formData.clientDependencies} fieldKey="clientDependencies" placeholder="e.g., API documentation, Design assets by Week 2" addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} addLabel="Add Dependency" />

      <SectionHeading>Team</SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Estimated Team Size</FieldLabel>
          <Select value={formData.teamSize} onValueChange={(v) => updateField("teamSize", v)}>
            <SelectTrigger><SelectValue placeholder="Select team size" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-3">1–3</SelectItem>
              <SelectItem value="4-8">4–8</SelectItem>
              <SelectItem value="9-15">9–15</SelectItem>
              <SelectItem value="16-25">16–25</SelectItem>
              <SelectItem value="25+">25+</SelectItem>
              <SelectItem value="not_decided">Not Decided</SelectItem>
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

      {/* Required Roles — FSD: Role Name + Seniority, min 1 */}
      <div data-field="roles">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[13px] font-semibold text-gray-800">Required Roles *</label>
          <button onClick={() => updateField("roles", [...formData.roles, { roleName: "", seniority: "" }])}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-500 hover:text-brown-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Role
          </button>
        </div>
        <div className="space-y-3">
          {formData.roles.map((role, idx) => (
            <div key={idx} className="relative grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              {formData.roles.length > 1 && (
                <button onClick={() => updateField("roles", formData.roles.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div>
                <FieldLabel required>Role Name</FieldLabel>
                <Input placeholder="e.g., Senior React Developer" value={role.roleName ?? ""}
                  onChange={(e) => updateField("roles", formData.roles.map((r, i) => i === idx ? { ...r, roleName: e.target.value } : r))} />
              </div>
              <div>
                <FieldLabel>Seniority</FieldLabel>
                <Select value={role.seniority ?? ""} onValueChange={(v) => updateField("roles", formData.roles.map((r, i) => i === idx ? { ...r, seniority: v } : r))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Priorities & Preferences — FSD: max 500 */}
      <div>
        <FieldLabel>Skill Priorities &amp; Preferences</FieldLabel>
        <Textarea placeholder="e.g., Must have TypeScript expertise, prefer contributors with fintech experience (max 500)" value={formData.skillPriorities} onChange={(e) => updateField("skillPriorities", e.target.value.slice(0, 500))} className="min-h-[70px]" />
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

      <SectionHeading>Section C — Testing Strategy</SectionHeading>

      {/* Testing Types & Target Environments */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Testing Types Included */}
          <div>
            <FieldLabel required>Testing Types Included</FieldLabel>
            <div className="space-y-2 mt-2">
              {[
                { value: "unit_testing", label: "Unit Testing" },
                { value: "integration_testing", label: "System Integration Testing (SIT)" },
                { value: "uat_testing", label: "User Acceptance Testing (UAT)" },
                { value: "security_testing", label: "Security Testing" },
                { value: "performance_testing", label: "Performance Testing" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <span
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{
                      borderColor: formData.testingTypes.includes(opt.value) ? '#4D5741' : '#d1d5db',
                      background: formData.testingTypes.includes(opt.value) ? '#4D5741' : 'transparent',
                    }}
                    onClick={() => {
                      const current = formData.testingTypes;
                      updateField("testingTypes", current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value]);
                    }}
                  >
                    {formData.testingTypes.includes(opt.value) && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span
                    className="text-[13px] text-gray-700 cursor-pointer"
                    onClick={() => {
                      const current = formData.testingTypes;
                      updateField("testingTypes", current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value]);
                    }}
                  >{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Environments */}
          <div>
            <FieldLabel required>Target Environments</FieldLabel>
            <div className="space-y-2 mt-2">
              {[
                { value: "dev", label: "DEV Environment" },
                { value: "staging", label: "STAGING Environment" },
                { value: "uat", label: "UAT Environment" },
                { value: "prod", label: "PROD Environment" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <span
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{
                      borderColor: formData.targetEnvironments.includes(opt.value) ? '#4D5741' : '#d1d5db',
                      background: formData.targetEnvironments.includes(opt.value) ? '#4D5741' : 'transparent',
                    }}
                    onClick={() => {
                      const current = formData.targetEnvironments;
                      updateField("targetEnvironments", current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value]);
                    }}
                  >
                    {formData.targetEnvironments.includes(opt.value) && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span
                    className="text-[13px] text-gray-700 cursor-pointer"
                    onClick={() => {
                      const current = formData.targetEnvironments;
                      updateField("targetEnvironments", current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value]);
                    }}
                  >{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testing Tools Preference & Acceptance Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Testing Tools Preference</FieldLabel>
          <Textarea placeholder="e.g. Jest, Cypress, Selenium, JMeter..." value={formData.testingToolsPreference} onChange={(e) => updateField("testingToolsPreference", e.target.value)} className="min-h-[80px]" />
        </div>
        <div>
          <FieldLabel>Acceptance Criteria</FieldLabel>
          <Textarea placeholder="What constitutes a successful delivery for each phase?" value={formData.testingAcceptanceCriteria} onChange={(e) => updateField("testingAcceptanceCriteria", e.target.value)} className="min-h-[80px]" />
        </div>
      </div>

      {/* UAT Period & Bug Severity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>UAT Period</FieldLabel>
          <Input placeholder="e.g. 10 business days after delivery" value={formData.uatPeriod} onChange={(e) => updateField("uatPeriod", e.target.value)} />
        </div>
        <div>
          <FieldLabel>Bug Severity Definitions</FieldLabel>
          <Select value={formData.bugSeverityDefinitions} onValueChange={(v) => updateField("bugSeverityDefinitions", v)}>
            <SelectTrigger><SelectValue placeholder="Select severity model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard_p0_p4">Standard (P0-P4)</SelectItem>
              <SelectItem value="critical_high_med_low">Critical / High / Medium / Low</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Travel Requirements & Onboarding Process */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Travel Requirements</FieldLabel>
          <Select value={formData.travelRequirements} onValueChange={(v) => updateField("travelRequirements", v)}>
            <SelectTrigger><SelectValue placeholder="Select travel requirement" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none_remote">None / Remote Only</SelectItem>
              <SelectItem value="occasional">Occasional (Quarterly)</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="as_needed">As Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Onboarding Process</FieldLabel>
          <Input
            placeholder="Describe the onboarding process..."
            value={formData.onboardingProcess}
            onChange={(e) => updateField("onboardingProcess", e.target.value)}
          />
        </div>
      </div>

      {/* Team Location, Working Hours, Test Data Provisioning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Team Location</FieldLabel>
          <Select value={formData.teamLocation} onValueChange={(v) => updateField("teamLocation", v)}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="on_site">On-Site</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Working Hours / Timezone</FieldLabel>
          <Select value={formData.workingHoursTimezone} onValueChange={(v) => updateField("workingHoursTimezone", v)}>
            <SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="9am_6pm_local">9 AM - 6 PM (Local Time)</SelectItem>
              <SelectItem value="flexible">Flexible / Async</SelectItem>
              <SelectItem value="overlap_us">US Overlap (4 hrs)</SelectItem>
              <SelectItem value="overlap_eu">EU Overlap (4 hrs)</SelectItem>
              <SelectItem value="24_7">24/7 Coverage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Test Data Provisioning</FieldLabel>
          <Select value={formData.testDataProvisioning} onValueChange={(v) => updateField("testDataProvisioning", v)}>
            <SelectTrigger><SelectValue placeholder="Select provisioning" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="client_provided">Client Provided</SelectItem>
              <SelectItem value="vendor_generated">Vendor Generated</SelectItem>
              <SelectItem value="shared">Shared Responsibility</SelectItem>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        <div data-field="budgetMin">
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
          <FieldError error={errors.budgetMin} field="budgetMin" />
        </div>
        <div data-field="budgetMax">
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
          <FieldError error={errors.budgetMax} field="budgetMax" />
        </div>
        <div>
          <FieldLabel required>Currency</FieldLabel>
          <Select value={formData.currency} onValueChange={(v) => updateField("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="INR">INR (&#8377;)</SelectItem>
              <SelectItem value="GBP">GBP (&#163;)</SelectItem>
              <SelectItem value="EUR">EUR (&#8364;)</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="SGD">SGD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Model — FSD: Fixed Price / T&M / Outcome-Based / Hybrid. Default: Fixed Price */}
      <div data-field="pricingModel">
        <FieldLabel required>Pricing Model</FieldLabel>
        <Select value={formData.pricingModel} onValueChange={(v) => updateField("pricingModel", v)}>
          <SelectTrigger><SelectValue placeholder="Select pricing model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed_price">Fixed Price</SelectItem>
            <SelectItem value="t_and_m">T&M</SelectItem>
            <SelectItem value="outcome_based">Outcome-Based</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
        <FieldError error={errors.pricingModel} field="pricingModel" />
      </div>

      {/* Payment Schedule — FSD: Display only, not configurable */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <FieldLabel>Payment Schedule (Platform Standard)</FieldLabel>
        <p className="text-[12px] text-gray-600 leading-relaxed">
          30% on SOW onboarding (M1) &middot; 35% on development (M2) &middot; 35% on UAT sign-off (M3). All before production go-live.
        </p>
      </div>

      {/* Budget Breakdown Preference */}
      <div>
        <FieldLabel>Budget Breakdown Preference</FieldLabel>
        <Select value={formData.breakdownPreference} onValueChange={(v) => updateField("breakdownPreference", v)}>
          <SelectTrigger><SelectValue placeholder="Select breakdown preference" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="milestone">Milestone-based</SelectItem>
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
              <SelectItem value="direct_admin">Direct to GlimmoraTeam Admin</SelectItem>
              <SelectItem value="client_executive">Client Executive</SelectItem>
              <SelectItem value="joint_committee">Joint Committee</SelectItem>
              <SelectItem value="not_defined">Not Defined</SelectItem>
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
  const toggleBrowserDevice = (value: string) => {
    const current = formData.browserDeviceSupport ?? [];
    updateField("browserDeviceSupport", current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  return (
    <div className="space-y-6">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define coding standards, quality gates, and support expectations. These become enforceable checkpoints in the generated SOW.
      </p>

      {/* ── SECTION B — Performance & Accessibility ── */}
      <SectionHeading>Section A — Performance &amp; Accessibility</SectionHeading>

      {/* Performance KPIs */}
      <div>
        <FieldLabel>Performance KPIs</FieldLabel>
        <Select value={formData.performanceKpis} onValueChange={(v) => updateField("performanceKpis", v)}>
          <SelectTrigger><SelectValue placeholder="Select performance target" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lighthouse_90">Lighthouse &gt; 90</SelectItem>
            <SelectItem value="lighthouse_80">Lighthouse &gt; 80</SelectItem>
            <SelectItem value="core_web_vitals">Core Web Vitals Pass</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Browser / Device Support */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <FieldLabel required>Browser / Device Support</FieldLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {[
            { value: "chrome_latest", label: "Chrome (Latest)" },
            { value: "safari_latest", label: "Safari (Latest)" },
            { value: "firefox_latest", label: "Firefox (Latest)" },
            { value: "edge_latest", label: "Edge (Latest)" },
            { value: "ios_safari", label: "iOS Safari" },
            { value: "android_chrome", label: "Android Chrome" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <span
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: (formData.browserDeviceSupport ?? []).includes(opt.value) ? '#A67763' : '#d1d5db',
                  background: (formData.browserDeviceSupport ?? []).includes(opt.value) ? '#A67763' : 'transparent',
                }}
                onClick={() => toggleBrowserDevice(opt.value)}
              >
                {(formData.browserDeviceSupport ?? []).includes(opt.value) && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="text-[13px] text-gray-700 cursor-pointer" onClick={() => toggleBrowserDevice(opt.value)}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* QA Responsibility & Defect Management Tool */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>QA Responsibility</FieldLabel>
          <Select value={formData.qaResponsibility} onValueChange={(v) => updateField("qaResponsibility", v)}>
            <SelectTrigger><SelectValue placeholder="Select QA responsibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="glimmorateam">GlimmoraTeam</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
              <SelectItem value="third_party">Third Party</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Defect Management Tool</FieldLabel>
          <Select value={formData.defectManagementTool} onValueChange={(v) => updateField("defectManagementTool", v)}>
            <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="jira">Jira</SelectItem>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="github_issues">GitHub Issues</SelectItem>
              <SelectItem value="azure_devops">Azure DevOps</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Post-Launch Support & Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Post-Launch Support Period</FieldLabel>
          <Select value={formData.postLaunchSupportPeriod} onValueChange={(v) => updateField("postLaunchSupportPeriod", v)}>
            <SelectTrigger><SelectValue placeholder="Select support period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15_days">15 Days</SelectItem>
              <SelectItem value="30_days">30 Days</SelectItem>
              <SelectItem value="60_days">60 Days</SelectItem>
              <SelectItem value="90_days">90 Days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Maintenance Scope</FieldLabel>
          <Textarea
            placeholder="Describe what is included in post-launch maintenance (e.g. security patches, minor UI tweaks)..."
            value={formData.maintenanceScope}
            onChange={(e) => updateField("maintenanceScope", e.target.value)}
            className="min-h-[80px]"
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
function Step7GovernanceCompliance({ formData, updateField, errors = {}, blurField }: StepListProps) {
  const onBlur = (field: string) => () => blurField?.(field);
  return (
    <div className="space-y-6">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Specify project governance, compliance requirements, and audit standards. The AI will embed governance clauses into the generated SOW.
      </p>

      {/* ── SECTION A — Project Governance ── */}
      <SectionHeading>Section A — Project Governance</SectionHeading>

      {/* Reporting Frequency & Communication Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div data-field="reportingFrequency">
          <FieldLabel required>Reporting Frequency</FieldLabel>
          <Select value={formData.reportingFrequency} onValueChange={(v) => updateField("reportingFrequency", v)}>
            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.reportingFrequency} field="reportingFrequency" />
        </div>
        <div data-field="communicationChannels">
          <FieldLabel required>Primary Communication Channels</FieldLabel>
          <Select value={formData.communicationChannels} onValueChange={(v) => updateField("communicationChannels", v)}>
            <SelectTrigger><SelectValue placeholder="Select channels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="glimmora_platform">GlimmoraTeam Platform</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.communicationChannels} field="communicationChannels" />
        </div>
      </div>

      {/* Steering Committee & Change Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Steering Committee Frequency</FieldLabel>
          <Select value={formData.steeringCommitteeFrequency} onValueChange={(v) => updateField("steeringCommitteeFrequency", v)}>
            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="as_needed">As Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel>Change Management Process</FieldLabel>
          <Textarea
            placeholder="How will scope changes be requested, reviewed, and approved?"
            value={formData.changeManagementProcess}
            onChange={(e) => updateField("changeManagementProcess", e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>

      {/* ── SECTION B — Compliance & Audits ── */}
      <SectionHeading>Section B — Compliance &amp; Audits</SectionHeading>

      {/* Compliance Standards */}
      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
        <FieldLabel required>Compliance Standards</FieldLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {[
            { value: "gdpr", label: "GDPR" },
            { value: "hipaa", label: "HIPAA" },
            { value: "pci_dss", label: "PCI-DSS" },
            { value: "soc2", label: "SOC2" },
            { value: "iso_27001", label: "ISO 27001" },
            { value: "local_data_laws", label: "Local Data Laws" },
            { value: "custom", label: "Custom" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-white cursor-pointer hover:border-gray-200 transition-all">
              <input
                type="checkbox"
                checked={(formData.complianceStandards ?? []).includes(opt.value)}
                onChange={() => {
                  const current = formData.complianceStandards ?? [];
                  updateField("complianceStandards", current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value]);
                  blurField?.("complianceStandards");
                }}
                className="w-4 h-4 rounded border-gray-300 accent-[#A67763]"
              />
              <span className="text-[13px] text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        {(formData.complianceStandards ?? []).includes("custom") && (
          <CustomStandardTagInput
            standards={formData.customComplianceStandards ?? []}
            onChange={(v) => updateField("customComplianceStandards", v)}
          />
        )}
        <FieldError error={errors.complianceStandards} field="complianceStandards" />
      </div>


      {/* SLA Uptime Commitment */}
      <div>
        <FieldLabel>SLA Uptime Commitment</FieldLabel>
        <Select value={formData.slaUptimeCommitment} onValueChange={(v) => updateField("slaUptimeCommitment", v)}>
          <SelectTrigger><SelectValue placeholder="Select SLA uptime" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="99.9">99.9%</SelectItem>
            <SelectItem value="99.95">99.95%</SelectItem>
            <SelectItem value="99.99">99.99%</SelectItem>
            <SelectItem value="best_effort">Best Effort</SelectItem>
            <SelectItem value="na">Not Applicable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TipBox icon={Scale} variant="forest" title="Governance:">
        These governance and compliance settings are embedded as enforceable clauses in the generated SOW, ensuring regulatory alignment throughout the project lifecycle.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 8 — Commercial & Legal (MANDATORY)
   ================================================================ */
function Step8CommercialLegal({ formData, updateField, errors = {}, blurField }: { formData: FormData; updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void; errors?: StepErrors; blurField?: (field: string) => void }) {
  return (
    <div className="space-y-6">
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        Define commercial terms, IP ownership, and legal provisions. These clauses are critical for the generated SOW&apos;s enforceability.
      </p>

      {/* ── SECTION A — Commercial Terms ── */}
      <SectionHeading>Section A — Commercial Terms</SectionHeading>

      <div>
        <div data-field="paymentTerms">
          <FieldLabel required>Payment Terms</FieldLabel>
          <Select value={formData.paymentTerms} onValueChange={(v) => updateField("paymentTerms", v)}>
            <SelectTrigger><SelectValue placeholder="Select payment terms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem>
              <SelectItem value="net_15">Net 15</SelectItem>
              <SelectItem value="net_30">Net 30</SelectItem>
              <SelectItem value="net_45">Net 45</SelectItem>
              <SelectItem value="net_60">Net 60</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.paymentTerms} field="paymentTerms" />
        </div>
      </div>

      <div>
        <FieldLabel>Additional Comments</FieldLabel>
        <Textarea
          placeholder="Add any extra commercial/payment notes..."
          value={formData.invoicingSchedule}
          onChange={(e) => updateField("invoicingSchedule", e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* ── SECTION B — Legal & IP Clauses ── */}
      <SectionHeading>Section B — Legal &amp; IP Clauses</SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div data-field="ipOwnership">
          <FieldLabel required>IP Ownership</FieldLabel>
          <Select value={formData.ipOwnership} onValueChange={(v) => updateField("ipOwnership", v)}>
            <SelectTrigger><SelectValue placeholder="Select IP ownership" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="glimmora_team">GlimmoraTeam</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.ipOwnership} field="ipOwnership" />
        </div>
        <div data-field="terminationNoticePeriod">
          <FieldLabel required>Termination Notice Period</FieldLabel>
          <Select value={formData.terminationNoticePeriod} onValueChange={(v) => updateField("terminationNoticePeriod", v)}>
            <SelectTrigger><SelectValue placeholder="Select notice period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15_days">15 Days</SelectItem>
              <SelectItem value="30_days">30 Days</SelectItem>
              <SelectItem value="60_days">60 Days</SelectItem>
              <SelectItem value="90_days">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.terminationNoticePeriod} field="terminationNoticePeriod" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Governing Law</FieldLabel>
          <Select value={formData.governingLaw} onValueChange={(v) => updateField("governingLaw", v)}>
            <SelectTrigger><SelectValue placeholder="Select governing law" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="delaware_usa">Delaware, USA</SelectItem>
              <SelectItem value="california_usa">California, USA</SelectItem>
              <SelectItem value="new_york_usa">New York, USA</SelectItem>
              <SelectItem value="england_wales">England &amp; Wales</SelectItem>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="singapore">Singapore</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel>Confidentiality / NDA</FieldLabel>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-[13px] text-gray-700">
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#4D5741' }} />
          GlimmoraTeam Standard NDA
        </div>
      </div>

      <div>
        <FieldLabel>Expenses Policy</FieldLabel>
        <Textarea
          placeholder="Describe the expenses policy (e.g. reimbursable with prior approval)..."
          value={formData.expensesPolicy}
          onChange={(e) => updateField("expensesPolicy", e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      <TipBox icon={Gavel} variant="brown" title="Legal note:">
        IP ownership and termination clauses are critical for contract enforceability. The AI will structure these as formal contract sections.
      </TipBox>
    </div>
  );
}


/* ================================================================
   STEP 9 — Review & Generate
   ================================================================ */
function Step9ReviewGenerate({ formData, updateField, aiConfidence, isStepComplete, skippedSteps, setCurrentStep, errors = {}, blurField, reviewSummaryData, reviewSummaryLoading }: {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  aiConfidence: number;
  isStepComplete: (step: number) => boolean;
  skippedSteps: Set<number>;
  setCurrentStep: (step: number) => void;
  errors?: StepErrors;
  blurField?: (field: string) => void;
  reviewSummaryData?: any;
  reviewSummaryLoading?: boolean;
}) {
  const onBlur = (field: string) => () => blurField?.(field);

  const apiStepIndicators: Record<string, string> = reviewSummaryData?.step_indicators ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Approvers */}
      <SectionHeading>Approvers</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Business Owner / Approver</FieldLabel>
          <Input placeholder="e.g., John Smith, VP Engineering" value={formData.businessOwnerApprover} onChange={(e) => updateField("businessOwnerApprover", e.target.value)} onBlur={onBlur("businessOwnerApprover")} />
          <FieldError error={errors.businessOwnerApprover} field="businessOwnerApprover" />
        </div>
      </div>

      {/* Step completion indicators */}
      <SectionHeading>Step Completion</SectionHeading>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
        {STEPS.map((step, idx) => {
          // Use API step indicator if available
          const apiIndicator = apiStepIndicators[String(idx)];
          const complete = apiIndicator === "green" || isStepComplete(idx);
          const skipped = apiIndicator === "amber" || (skippedSteps.has(idx) && !complete);
          const isMandatory = step.mandatory;
          const incomplete = !complete && !skipped;
          const statusColor = complete ? '#4D5741' : skipped ? '#C4A24E' : isMandatory ? '#A67763' : 'var(--ink-faint)';
          const statusLabel = complete ? 'Complete' : skipped ? 'Skipped' : (isMandatory && incomplete) ? 'Incomplete' : 'Not filled';

          return (
            <div
              key={idx}
              className="flex items-center w-full"
              style={{
                padding: '9px 16px',
                background: idx % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(249,245,241,0.25)',
                borderBottom: idx < STEPS.length - 1 ? '1px solid var(--border-hair)' : 'none',
                gap: 10,
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
              {/* Action buttons */}
              <div className="flex items-center gap-1.5" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                {/* View button */}
                <button
                  onClick={() => setCurrentStep(idx)}
                  title={`View ${step.label}`}
                  className="flex items-center gap-1 rounded-md transition-all duration-150"
                  style={{
                    padding: '3px 8px', fontSize: 10, fontWeight: 600,
                    color: '#4D5741', background: 'rgba(77,87,65,0.07)',
                    border: '1px solid rgba(77,87,65,0.15)',
                    cursor: 'pointer', letterSpacing: '0.02em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(77,87,65,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(77,87,65,0.07)'; }}
                >
                  <Eye style={{ width: 11, height: 11 }} />
                  View
                </button>
                {/* Edit button */}
                <button
                  onClick={() => setCurrentStep(idx)}
                  title={`Edit ${step.label}`}
                  className="flex items-center gap-1 rounded-md transition-all duration-150"
                  style={{
                    padding: '3px 8px', fontSize: 10, fontWeight: 600,
                    color: '#A67763', background: 'rgba(166,119,99,0.07)',
                    border: '1px solid rgba(166,119,99,0.15)',
                    cursor: 'pointer', letterSpacing: '0.02em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.07)'; }}
                >
                  <Pencil style={{ width: 11, height: 11 }} />
                  Edit
                </button>
              </div>
            </div>
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
          { label: "Platform", value: formData.platformType.length > 0 ? formData.platformType.map(p => p.replace(/_/g, ' ')).join(', ') : "\u2014", filled: formData.platformType.length > 0 },
          { label: "Vision", value: formData.projectVision ? formData.projectVision.slice(0, 60) + (formData.projectVision.length > 60 ? "\u2026" : "") : "\u2014", filled: formData.projectVision.trim().length >= 50 },
          { label: "Tech Stack", value: formData.techStack ? formData.techStack.slice(0, 60) + (formData.techStack.length > 60 ? "\u2026" : "") : "\u2014", filled: formData.techStack.trim().length >= 10 },
          { label: "Budget", value: parseFloat(formData.budgetMin) > 0 || parseFloat(formData.budgetMax) > 0 ? `${formData.currency} ${formData.budgetMin || "?"} \u2013 ${formData.budgetMax || "?"}` : "\u2014", filled: parseFloat(formData.budgetMin) > 0 && parseFloat(formData.budgetMax) > 0 },
          { label: "Pricing", value: formData.pricingModel ? formData.pricingModel.replace(/_/g, ' ') : "\u2014", filled: formData.pricingModel.length > 0 },
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

export default function SOWGenerateWizardPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <React.Suspense fallback={null}>
      <SOWGenerateWizardPageInner />
    </React.Suspense>
  );
}
