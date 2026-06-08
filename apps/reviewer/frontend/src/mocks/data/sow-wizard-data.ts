/**
 * Per-SOW detailed wizard / upload-flow field data displayed read-only
 * on the admin approve page.  Keys match the 10-step AI wizard and the
 * 7-section Commercial & Details form used in the manual-upload flow.
 */

/* ─── Shared type ─────────────────────────────────────────────── */

export interface SOWWizardStepData {
  /* Step 0 / §1 – Context & Discovery */
  projectVision: string;
  businessObjectives: string[];
  painPoints: string[];
  strategicContext: string;
  businessCriticality: string;
  currentState: string;
  currentStateType: string;
  desiredFutureState: string;
  previousAttempts?: string;
  endUserProfiles: string[];
  languageRequirements: string[];
  userExpectations: string[];
  successMetrics: string[];
  enterpriseExpectations?: string;
  definitionOfSuccess: string;

  /* Step 1 / §2 – Project & Scope */
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
  dataMigrationDetails?: string;

  /* Step 2 / §3 – Delivery & Technical */
  developmentScope: string[];
  uiuxDesignScope: string;
  uiuxDesignDetails?: string;
  deploymentScope: string;
  deploymentProvider: string;
  goLiveScope: string;
  goLiveDetails?: string;
  techStack: string;
  scalabilityRequirements: string;
  etlApproach: string;
  transformationComplexity: string;
  dataValidationMethod: string;

  /* Step 3 / §3b – Integrations & User Management */
  integrations: string[];
  ssoRequired: string;
  ssoDetails?: string;
  userRegistrationModel: string;
  passwordPolicy: string;
  passwordPolicyDetails: string;
  auditLogging: string;
  approvalWorkflows: string;
  notifications: string;
  scheduledJobs: string[];

  /* Step 4 / §4 – Timeline, Team & Testing */
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
  uatOwnership: string;
  uatDuration: string;
  uatSignoffAuthority: string;
  defectSLA: string;

  /* Step 5 / §5 – Budget & Risk */
  budgetMin: string;
  budgetMax: string;
  currency: string;
  pricingModel: string;
  breakdownPreference: string;
  knownRisks: string[];
  projectConstraints: string;
  contingencyBudget: string;
  escalationProcess: string;

  /* Step 6 – Quality Standards (AI SOW only; shown merged in §4 for manual) */
  acceptanceCriteria: string;
  slaUptime: string;
  codeReviewPolicy: string;
  documentationRequirements: string[];
  browserCompatibility: string[];
  deviceCompatibility: string[];
  accessibilityStandard: string;

  /* Step 7 / §6 – Governance & Compliance */
  personalDataInvolved: string;
  privacyLaws: string[];
  dpaRequired: string;
  encryptionRequirements: string;
  regulatoryFrameworks: string[];
  dataResidency: string;
  accessControl: string;
  reportingFrequency: string;
  communicationChannels: string;
  projectMethodology: string;

  /* Step 8 / §7 – Commercial & Legal */
  ipOwnership: string;
  sourceCodeOwnership: string;
  referenceRights: string;
  openSourcePolicy: string;
  thirdPartyCosts: string;
  warrantyPeriod: string;
  postWarrantySupport: string;
  changeRequestProcess: string;
  changeRequestApprover: string;
  environmentCosts?: string;

  /* Step 9 – Approvers (AI-generated only) */
  businessOwnerApprover?: string;
  finalApprover?: string;
  legalReviewer?: string;
  securityReviewer?: string;
}

export interface SOWWizardRecord {
  sowId: string;
  intakeMode: "ai_generated" | "manual_upload";
  data: SOWWizardStepData;
  generatedSections: { title: string; body: string }[];
}

/* ─────────────────────────────────────────────────────────────────
   sow-009 · Digital Insurance Claims Portal (manual_upload)
   AssureNow Insurance · Industry: Insurance · Budget: $310K
   ───────────────────────────────────────────────────────────────── */

const sow009Data: SOWWizardStepData = {
  /* §1 – Context & Discovery */
  projectVision:
    "Build a fully digital, IRDAI-compliant insurance claims portal that enables policyholders to submit, track, and resolve claims end-to-end without branch visits, cutting average settlement time from 21 days to under 5.",
  businessObjectives: [
    "Reduce average claims settlement time from 21 days to ≤ 5 days within 9 months of go-live",
    "Achieve 80% digital (no-touch) claim submissions in the first 6 months",
    "Lower claims processing cost per case by 40% through workflow automation",
    "Maintain IRDAI TAT compliance at 98%+ across all claim categories",
  ],
  painPoints: [
    "Claimants must visit branch offices to submit documents — driving 60%+ of NPS detractor scores",
    "Claims examiners manage 3 separate legacy systems with no shared audit trail",
    "Manual document review adds 8–10 days to average settlement cycle",
    "No real-time status visibility — customers call support 3+ times per claim on average",
  ],
  strategicContext: "digital_transformation",
  businessCriticality: "mission_critical",
  currentState:
    "Combination of a 2009 J2EE claims system, scanned document archive on-premises, and manual examiner workflows via email and spreadsheets. No customer-facing portal exists.",
  currentStateType: "existing",
  desiredFutureState:
    "A cloud-native claims portal where policyholders self-serve from FNOL (first notice of loss) through final settlement. Examiners work in a unified dashboard with AI-assisted document review and automated rule-based decisions for low-complexity claims.",
  previousAttempts:
    "A 2022 vendor-led portal project was shelved after 5 months due to IRDAI data-localisation concerns and inability to integrate with the legacy claims core.",
  endUserProfiles: [
    "Retail policyholders (120,000+) — file claims, upload documents, track status via web & mobile",
    "Claims examiners (85 users) — review submissions, request documents, approve/reject decisions",
    "Fraud analytics team (12 users) — investigate flagged claims, view ML risk scores",
    "Branch operations managers (30 users) — oversee SLA dashboards, escalate edge cases",
    "IT & compliance admins (8 users) — configure rules, manage users, audit logs",
  ],
  languageRequirements: ["English", "Hindi", "Tamil", "Telugu", "Marathi"],
  userExpectations: [
    "Mobile-first FNOL submission under 5 minutes with document camera upload",
    "Real-time claim status push notifications at every stage",
    "Single sign-on via Aadhaar OTP / Digi-Locker integration",
    "Sub-3-second page loads on 4G connections",
  ],
  successMetrics: [
    "Claims settlement TAT ≤ 5 days for 80% of standard claims within 6 months",
    "Digital submission rate ≥ 80% by Month 6",
    "Customer NPS improvement from +12 to +38 within 12 months",
    "Zero IRDAI SLA breach incidents post go-live",
  ],
  enterpriseExpectations:
    "Full IRDAI data localisation compliance. All PII and claim data to reside within India (ap-south-1). BAA and data processing agreement signed before development begins.",
  definitionOfSuccess:
    "Project is successful when 80% of new claims are filed digitally with zero critical production defects for 60 consecutive days, and IRDAI TAT compliance is at 98%+.",

  /* §2 – Project & Scope */
  projectCategory: "enterprise_platform",
  platformType: "web_and_mobile",
  existingTechLandscape:
    "Legacy J2EE claims system (IBM WebSphere), on-premises document archive (Documentum), Oracle 11g database, Finacle integration for premium verification, Azure AD for internal users",
  featureModules: [
    "FNOL — First Notice of Loss digital submission with multi-document upload",
    "Claims Dashboard — real-time status tracking for policyholders and examiners",
    "Document Management — AI-assisted OCR extraction and classification",
    "Examiner Workbench — unified queue, workflow rules, decision capture",
    "Fraud Risk Scoring — ML-based anomaly detection with examiner override",
    "Notification Engine — SMS, email, WhatsApp push at each stage milestone",
    "IRDAI Compliance Reporting — automated TAT tracking and regulatory export",
    "Admin & Configuration — rule engine, user management, audit trail",
    "Digi-Locker Integration — pull policy documents and KYC from govt repository",
  ],
  userRoles: [
    "Policyholder (Self-Service)",
    "Claims Examiner",
    "Senior Examiner / Approver",
    "Fraud Analyst",
    "Branch Operations Manager",
    "IT Administrator",
    "Compliance Auditor (Read-Only)",
  ],
  businessWorkflows: [
    "FNOL → Document Upload → AI OCR → Examiner Assignment → Review → Decision → Settlement → Notification",
    "Fraud Flag → Fraud Analyst Review → Evidence Request → Investigation → Resolution",
    "Escalation → Senior Examiner → Legal / Branch Manager → Regulatory Reporting",
    "KYC Verification → Aadhaar OTP → Digi-Locker Pull → Identity Confirmation",
  ],
  estimatedScreenCount: "55–70",
  criticalBusinessRules: [
    "Claims under ₹10,000 with complete documents auto-approved within 48 hours if fraud score < 20",
    "All claims must be acknowledged within 3 working hours of submission (IRDAI mandate)",
    "No claim decision without at least one document verified against Digi-Locker or original",
    "Fraud score ≥ 65 blocks auto-approval and routes to fraud team — cannot be overridden below senior examiner",
    "Settlement payment released only after final approval and dual-signoff for amounts > ₹2,00,000",
  ],
  outOfScope: [
    "New insurance product configuration or underwriting workflows",
    "Agent/broker commission management",
    "Premium collection or payment gateway for renewals",
    "Legacy core claims system replacement (integration only)",
    "IoT / telematics-based dynamic premium pricing",
  ],
  assumptions: [
    "AssureNow to provide access to legacy J2EE APIs and data dictionaries within 2 weeks of project start",
    "Finacle integration sandbox available from Day 1",
    "Digi-Locker partner credentials provisioned by AssureNow under their MeitY agreement",
    "Client product owner available minimum 25 hrs/week with decision authority",
    "IRDAI pre-filing for the digital portal completed by client before go-live",
  ],
  constraints: [
    "All data must reside within AWS ap-south-1 (Mumbai) per IRDAI data localisation rules",
    "Budget ceiling of ₹2,60,00,000 (≈$310,000) including contingency",
    "Portal must handle peak load of 5,000 concurrent users during monsoon flood-claim season",
    "Legacy core system cannot be taken offline during migration — parallel operation required",
  ],
  dataMigrationScope: "partial_migration",
  dataMigrationDetails:
    "Migrate 2 years of open and recently closed claims from Oracle 11g + Documentum. Estimated 380,000 claim records and 2.1M document files. Legacy closed claims remain in read-only archive.",

  /* §3 – Delivery & Technical */
  developmentScope: [
    "Frontend development",
    "Backend development",
    "API development",
    "Database design",
    "Data migration",
    "Integration development",
  ],
  uiuxDesignScope: "full_design",
  uiuxDesignDetails:
    "Complete UX research, wireframes, high-fidelity mockups, multilingual design system, component library, WCAG 2.1 AA compliance audit, and usability testing sessions with 15 real policyholders.",
  deploymentScope: "full_deployment",
  deploymentProvider: "AWS",
  goLiveScope: "phased_rollout",
  goLiveDetails:
    "Phase 1 (Month 4): Policyholder portal (FNOL + tracking). Phase 2 (Month 5): Examiner workbench + document AI. Phase 3 (Month 6): Fraud scoring + IRDAI reporting + full go-live.",
  techStack:
    "Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS. Backend: Node.js, NestJS, PostgreSQL 16, Redis. AI/ML: Python, FastAPI, AWS Textract for OCR. Infra: AWS ECS Fargate, RDS Aurora, S3, CloudFront, Terraform. Monitoring: Datadog, PagerDuty.",
  scalabilityRequirements:
    "5,000 concurrent users at peak. Auto-scale ECS tasks within 90 seconds. Database handles 5M+ claim records with p95 query time < 300ms. S3 document storage with lifecycle policy for cost management.",
  etlApproach: "incremental",
  transformationComplexity: "high",
  dataValidationMethod: "automated_with_manual_review",

  /* §3b – Integrations & User Management */
  integrations: [
    "Legacy J2EE Claims Core — REST API wrapper for read/write claim status sync",
    "Oracle 11g / Finacle — premium verification and policy validity check",
    "Digi-Locker (MeitY) — pull KYC documents and policy certificates",
    "AWS Textract — OCR extraction for uploaded claim documents",
    "Aadhaar e-KYC via UIDAI — OTP-based identity verification for policyholders",
    "WhatsApp Business API (Meta) — status notification delivery",
    "SendGrid — transactional email for OTPs, decision letters",
    "Twilio — SMS OTP fallback for non-WhatsApp users",
    "Internal Fraud ML Model — REST API call for risk score on every new claim",
  ],
  ssoRequired: "yes",
  ssoDetails:
    "Internal users (examiners, admins) authenticate via Azure AD SAML 2.0. Policyholders authenticate via mobile OTP (Aadhaar or registered mobile). No shared IdP with policyholder portal.",
  userRegistrationModel: "hybrid",
  passwordPolicy: "custom",
  passwordPolicyDetails:
    "Examiners: min 12 chars, uppercase + lowercase + digit + special char, 60-day rotation, MFA mandatory. Policyholders: OTP-only login (no persistent password), session valid for 24 hours.",
  auditLogging: "yes",
  approvalWorkflows: "multi_level",
  notifications: "email_and_in_app",
  scheduledJobs: [
    "Hourly IRDAI TAT compliance check and alert generation",
    "Nightly batch sync of claim status from legacy core to portal DB",
    "Daily fraud model retraining job (low-traffic window, 1:00–3:00 AM IST)",
    "Weekly IRDAI regulatory report generation and staging for compliance team review",
    "Monthly data lifecycle policy execution — archive settled claims > 3 years old",
  ],

  /* §4 – Timeline, Team & Testing */
  startDate: "2026-05-01",
  endDate: "2026-10-31",
  phasingStrategy: "sequential",
  milestones: [
    "Kickoff & Discovery Complete — May 14, 2026",
    "Architecture Decision Record (ADR) approved — May 28, 2026",
    "Design System & Wireframes signed off — June 13, 2026",
    "Phase 1 go-live: Policyholder FNOL portal — August 31, 2026",
    "Phase 2 go-live: Examiner workbench + Document AI — September 30, 2026",
    "Phase 3 full go-live: Fraud scoring + IRDAI reporting — October 24, 2026",
    "Hypercare end & project closure — October 31, 2026",
  ],
  clientDependencies: [
    "Legacy J2EE API documentation and sandbox access by May 14",
    "Digi-Locker partner API credentials by May 14",
    "Aadhaar e-KYC API access (UIDAI AUA/KUA registration) by May 28",
    "Test claim dataset (anonymised) from Oracle 11g by May 21",
    "Client product owner 25 hrs/week from Day 1",
    "Policyholder usability testing participants (15 people) arranged by June 1",
  ],
  teamSize: "10–12",
  workModel: "hybrid",
  roles: [
    "Project Manager / Scrum Master",
    "Solution Architect",
    "Senior Full-Stack Engineer × 2",
    "Frontend Engineer (Mobile-first specialist)",
    "Backend Engineer (Node.js / NestJS)",
    "ML Engineer (Python / AWS Textract)",
    "DevOps / Cloud Engineer",
    "QA Engineer (automated + manual)",
    "UX Designer (multilingual / accessibility)",
    "Business Analyst",
  ],
  skillPriorities:
    "Insurance domain knowledge (IRDAI compliance), AWS ap-south-1 experience, Next.js 15, NestJS, Digi-Locker / Aadhaar e-KYC integration, document AI (AWS Textract), multilingual React UI",
  knowledgeTransfer: "included",
  uatOwnership: "client_led",
  uatDuration: "3_weeks",
  uatSignoffAuthority: "",
  defectSLA:
    "Critical (portal down / data loss): 2-hour resolution. High (feature broken): 8-hour resolution. Medium: 3-business-day resolution. Low: next sprint.",

  /* §5 – Budget & Risk */
  budgetMin: "285000",
  budgetMax: "310000",
  currency: "USD",
  pricingModel: "fixed_price",
  breakdownPreference: "phase_based",
  knownRisks: [
    "Legacy J2EE API wrapper complexity may extend integration timeline — Mitigation: 2-week discovery spike in Month 1",
    "Digi-Locker / Aadhaar API rate limits during peak submission hours — Mitigation: implement request queue with exponential back-off and local caching",
    "IRDAI pre-filing approval may delay go-live — Mitigation: engage IRDAI from Month 1; design portal to operate in restricted mode if approval delayed",
    "Multilingual content translation quality — Mitigation: native speaker review for all 5 languages before UAT",
    "Data migration volume (2.1M documents) may exceed estimated effort — Mitigation: 2-week buffer and parallel dry-run migration in staging",
  ],
  projectConstraints:
    "Hard go-live deadline of October 31 tied to IRDAI digital initiative compliance window. No system downtime during business hours (9 AM – 7 PM IST). All PII must be tokenised before leaving the AWS VPC.",
  contingencyBudget: "10",
  escalationProcess:
    "L1: Project Manager + AssureNow PO (24h). L2: Solution Architect + VP Operations (48h). L3: GlimmoraTeam Account Director + CTO (72h). Escalations tracked in shared JIRA board.",

  /* §6 – Quality Standards */
  acceptanceCriteria:
    "All user stories pass acceptance tests in JIRA. Code coverage ≥ 80% (unit + integration). Performance: p95 < 2s for web, < 3s for mobile on 4G. Zero Critical or High open defects before Phase go-lives. WCAG 2.1 AA verified for all screens.",
  slaUptime: "99.9",
  codeReviewPolicy:
    "All PRs require 2 approvals. Automated lint, type-check, security scan (Snyk) on every push. Architecture-impacting changes require Solution Architect sign-off. No direct commits to main branch.",
  documentationRequirements: [
    "Technical architecture document",
    "API documentation (OpenAPI 3.0)",
    "User guides (policyholder + examiner)",
    "Admin configuration guide",
    "Data migration runbook",
    "Deployment & rollback runbook",
    "IRDAI compliance evidence pack",
  ],
  browserCompatibility: ["Chrome", "Firefox", "Safari", "Edge"],
  deviceCompatibility: ["Desktop", "Tablet", "Mobile"],
  accessibilityStandard: "WCAG 2.1 AA",

  /* §6 – Governance & Compliance */
  personalDataInvolved: "yes",
  privacyLaws: ["PDPB (India)", "IRDAI Data Security Guidelines"],
  dpaRequired: "yes",
  encryptionRequirements:
    "AES-256 at rest for all PII and claim documents. TLS 1.3 in transit. RDS encryption enabled. S3 SSE-KMS for document buckets. All keys managed via AWS KMS with 90-day rotation.",
  regulatoryFrameworks: ["IRDAI", "PDPB", "ISO 27001"],
  dataResidency: "ap-south-1 (Mumbai)",
  accessControl: "RBAC with MFA for all internal users",
  reportingFrequency: "bi_weekly",
  communicationChannels: "Email, Slack, Confluence, JIRA",
  projectMethodology: "Agile (2-week sprints)",

  /* §7 – Commercial & Legal */
  ipOwnership: "client_owns_all",
  sourceCodeOwnership: "client_owns_all",
  referenceRights: "anonymized_reference",
  openSourcePolicy: "approved_licenses_only",
  thirdPartyCosts:
    "AWS ap-south-1 infra: ~$2,800/month (ECS, RDS, S3, CloudFront). Datadog: $600/month. SendGrid: $150/month. WhatsApp Business API: variable per message. All third-party costs are AssureNow's responsibility.",
  warrantyPeriod: "90_days",
  postWarrantySupport: "optional_retainer",
  changeRequestProcess: "formal_cr",
  changeRequestApprover: "",
  environmentCosts:
    "Dev: $900/month. Staging: $600/month. Production: $2,800/month. All via Terraform; environments are parity-matched to prevent environment-specific bugs.",

  /* Step 9 – Approvers (not applicable for manual upload, left blank) */
};

const sow009GeneratedSections = [];

/* ─────────────────────────────────────────────────────────────────
   sow-002 · Mobile Banking App Redesign (ai_generated)
   FinServe Global · Industry: Financial Services · Budget: $180K
   ───────────────────────────────────────────────────────────────── */

const sow002Data: SOWWizardStepData = {
  /* Step 0 – Context & Discovery */
  projectVision:
    "Redesign the FinServe Global mobile banking application from the ground up to deliver a modern, intuitive experience that increases active daily users by 45% and reduces support call volume by 30% within 6 months of launch.",
  businessObjectives: [
    "Increase mobile app DAU by 45% within 6 months of redesigned app launch",
    "Reduce customer support call volume by 30% through improved in-app self-service",
    "Achieve App Store rating of 4.5+ (currently 3.1) within 3 months post-launch",
    "Reduce mobile session abandonment rate from 38% to below 15%",
  ],
  painPoints: [
    "Current app (built 2018) has a non-intuitive navigation structure with 6+ taps to complete common transactions",
    "3.1 App Store rating driven by frequent crashes on Android 13+ and iOS 17+",
    "No biometric authentication — users must enter full password for every session",
    "Zero accessibility support — visually impaired customers cannot use the app",
  ],
  strategicContext: "product_modernisation",
  businessCriticality: "business_important",
  currentState:
    "React Native 0.63 app (2018), single monolithic codebase, REST API via legacy BFSI middleware, no design system, manual OTP for every login, 38% session abandonment rate.",
  currentStateType: "existing",
  desiredFutureState:
    "A redesigned React Native 0.76 app with a cohesive design system, biometric login, personalised dashboard, one-tap common transactions, real-time notifications, and full WCAG 2.1 AA accessibility compliance.",
  previousAttempts:
    "A 2023 internal redesign effort was dropped after 4 months due to resource constraints. Customer feedback from exit interviews fed directly into this engagement brief.",
  endUserProfiles: [
    "Retail banking customers (1.2M app users) — view balances, transfer funds, pay bills, manage cards",
    "SME account holders (80,000 users) — bulk transfers, payroll, invoice payments",
    "Customer support agents (200 users) — view app sessions and assist customers remotely",
  ],
  languageRequirements: ["English (primary)", "Hindi", "Tamil"],
  userExpectations: [
    "Biometric login (Face ID / fingerprint) with fallback to 6-digit PIN",
    "Dashboard personalisation with pinned frequent transactions",
    "Real-time balance and transaction push notifications",
    "Sub-2-second screen transitions on mid-range Android devices",
  ],
  successMetrics: [
    "DAU increase of 45% within 6 months",
    "App Store rating ≥ 4.5 within 3 months",
    "Session abandonment rate < 15% within 60 days",
    "Support call reduction of 30% within 6 months",
  ],
  enterpriseExpectations:
    "Full PCI-DSS Level 1 compliance. RBI Mobile Banking Guidelines 2023 compliance. All financial data transmitted via TLS 1.3 with certificate pinning.",
  definitionOfSuccess:
    "Success is confirmed when DAU reaches 45% growth, App Store rating exceeds 4.5, and zero PCI-DSS compliance issues are flagged in the first post-launch PCI audit.",

  /* Step 1 – Project & Scope */
  projectCategory: "mobile_app",
  platformType: "mobile_only",
  existingTechLandscape:
    "React Native 0.63, legacy BFSI REST middleware, Oracle DB, Firebase for push notifications, Braze for CRM, Appsflyer for analytics, Crashlytics",
  featureModules: [
    "Redesigned onboarding & KYC flow",
    "Biometric authentication (Face ID / fingerprint / PIN)",
    "Personalised home dashboard with balance and quick actions",
    "Fund transfers (NEFT, RTGS, IMPS, UPI) with saved beneficiaries",
    "Bill payments & recurring mandates",
    "Card management — freeze, limit, virtual card issuance",
    "Loan & FD account summary with quick top-up",
    "In-app support chat and branch/ATM locator",
    "Transaction history with smart search and filters",
    "Push notification preferences and alert configuration",
  ],
  userRoles: [
    "Retail Customer",
    "SME Account Holder",
    "Joint Account Member",
    "Customer Support Agent (read-only session view)",
    "App Administrator",
  ],
  businessWorkflows: [
    "Biometric Login → Dashboard → Quick Transfer → OTP Confirmation → Receipt",
    "Bill Payment Setup → Biller Discovery → Account Linking → Schedule → Confirmation",
    "Card Freeze → Instant Toggle → Push Notification → Confirmation Screen",
    "Support Chat → Issue Classification → Agent Escalation → Resolution",
  ],
  estimatedScreenCount: "45–55",
  criticalBusinessRules: [
    "Biometric must fall back to PIN if 3 consecutive biometric failures",
    "Transfers > ₹1,00,000 require OTP in addition to biometric",
    "Session auto-locks after 5 minutes of inactivity",
    "New beneficiary additions must have a 4-hour cooling period before first transfer",
    "Card freeze / unfreeze must reflect in real-time (< 30 seconds)",
  ],
  outOfScope: [
    "Web internet banking portal redesign",
    "Core banking system changes",
    "Backend API re-architecture (integration only)",
    "New financial product development (loans, FDs — display only)",
    "Desktop / tablet native apps",
  ],
  assumptions: [
    "FinServe to provide sandbox access to BFSI REST middleware within 1 week of kickoff",
    "Firebase and Braze accounts are provisioned and accessible from Day 1",
    "Existing Crashlytics data is shared for UX research analysis",
    "App store developer accounts (iOS + Android) are available for distribution",
    "UX research participant recruitment handled by FinServe CX team",
  ],
  constraints: [
    "Must support Android 10+ and iOS 15+ (covers 95% of active user base)",
    "App binary size must not exceed 45MB on Android and 50MB on iOS",
    "All API changes must be backward-compatible with existing web portal",
    "Go-live must not conflict with RBI quarterly reporting window (March, June, September, December)",
  ],
  dataMigrationScope: "greenfield",
  dataMigrationDetails: "No data migration required — app connects to existing backend APIs.",

  /* Step 2 – Delivery & Technical */
  developmentScope: [
    "Frontend development (React Native)",
    "API development (integration adapters)",
    "Database design (app-side SQLite offline cache)",
  ],
  uiuxDesignScope: "full_design",
  uiuxDesignDetails:
    "End-to-end UX research (user interviews, usability testing), information architecture redesign, complete design system (tokens, components, patterns), high-fidelity prototypes, accessibility audit.",
  deploymentScope: "phased_deployment",
  deploymentProvider: "App Store / Google Play",
  goLiveScope: "phased_rollout",
  goLiveDetails:
    "Beta: 5% user rollout via Firebase Remote Config (Month 3). Gradual: 25% → 50% → 100% over 6 weeks based on crash rate and NPS signals.",
  techStack:
    "React Native 0.76, TypeScript, Redux Toolkit, React Query, Reanimated 3 for animations. Backend integration: existing BFSI REST middleware (no changes). Analytics: Mixpanel. Crash reporting: Sentry. CI/CD: Bitrise.",
  scalabilityRequirements:
    "App must handle 50,000 concurrent sessions without degradation. Push notifications delivered within 10 seconds at peak. Offline-capable for balance viewing and transaction history.",
  etlApproach: "incremental",
  transformationComplexity: "low",
  dataValidationMethod: "automated_only",

  /* Step 3 – Integrations & User Management */
  integrations: [
    "BFSI REST Middleware — all banking operations (balance, transfers, cards)",
    "Firebase Cloud Messaging — push notification delivery",
    "Braze — CRM and in-app message personalization",
    "Appsflyer — attribution and install tracking",
    "Sentry — crash and error reporting",
    "Mixpanel — product analytics and funnel tracking",
    "Biometric APIs — iOS LocalAuthentication, Android BiometricPrompt",
    "UPI — integration via existing middleware adapter",
  ],
  ssoRequired: "no",
  userRegistrationModel: "self_service",
  passwordPolicy: "custom",
  passwordPolicyDetails:
    "6-digit PIN as fallback. Biometric (Face ID / fingerprint) as primary. PIN requires change every 90 days. 5 failed attempts trigger account lock with call-centre unlock flow.",
  auditLogging: "yes",
  approvalWorkflows: "simple_approval",
  notifications: "email_and_in_app",
  scheduledJobs: [
    "Nightly local SQLite cache sync for offline balance display",
    "Weekly push notification digest for inactive users (re-engagement campaign)",
    "Daily Sentry error digest to engineering Slack channel",
  ],

  /* Step 4 – Timeline, Team & Testing */
  startDate: "2026-05-15",
  endDate: "2026-09-30",
  phasingStrategy: "sprint_based",
  milestones: [
    "UX Research & Information Architecture complete — June 15, 2026",
    "Design System v1 approved — June 30, 2026",
    "Alpha build (core screens) — July 31, 2026",
    "Beta release to 5% users — August 31, 2026",
    "Full rollout (100% users) — September 30, 2026",
  ],
  clientDependencies: [
    "BFSI middleware sandbox credentials by May 22",
    "Firebase and Braze access by May 22",
    "UX research participants (20 retail, 5 SME) arranged by June 1",
    "App store developer account credentials by July 15",
  ],
  teamSize: "7–9",
  workModel: "remote",
  roles: [
    "Project Manager",
    "Senior React Native Engineer × 2",
    "React Native Engineer",
    "UX Designer (mobile specialist)",
    "UX Researcher",
    "QA Engineer (mobile testing)",
    "DevOps / Release Engineer",
  ],
  skillPriorities:
    "React Native 0.76, Reanimated 3, BFSI domain knowledge, accessibility (WCAG / iOS / Android), Bitrise CI, biometric API integration, PCI-DSS awareness",
  knowledgeTransfer: "included",
  uatOwnership: "client_led",
  uatDuration: "2_weeks",
  uatSignoffAuthority: "",
  defectSLA:
    "Critical (app crash / data loss): 4-hour resolution. High (feature broken): 24-hour resolution. Medium: 3-business-day resolution. Low: next sprint.",

  /* Step 5 – Budget & Risk */
  budgetMin: "165000",
  budgetMax: "180000",
  currency: "USD",
  pricingModel: "fixed_price",
  breakdownPreference: "phase_based",
  knownRisks: [
    "BFSI middleware undocumented edge cases may delay integration — Mitigation: 2-week API spike in Month 1",
    "App Store review rejection for PCI-DSS or biometric implementation — Mitigation: pre-submission Apple/Google compliance checklist review",
    "Phased rollout crash rate spike triggering rollback — Mitigation: Firebase Remote Config kill switch and automated rollback trigger at > 1% crash rate",
    "Existing users resistant to UX changes — Mitigation: opt-in beta programme with onboarding tooltips and in-app feedback channel",
  ],
  projectConstraints:
    "App binary size limit 45MB Android / 50MB iOS. No breaking API changes to existing web portal. Go-live cannot overlap with RBI quarterly reporting windows.",
  contingencyBudget: "8",
  escalationProcess:
    "L1: Project Manager + FinServe Product Owner (24h). L2: Solution Lead + Head of Digital (48h). L3: Account Director (72h).",

  /* Step 6 – Quality Standards */
  acceptanceCriteria:
    "All user stories pass acceptance criteria in Linear. Jest unit test coverage ≥ 75%. Detox E2E tests pass on iOS 17 and Android 13 (real devices). Zero crash-free rate drop > 0.5% during beta rollout. WCAG 2.1 AA verified.",
  slaUptime: "99.9",
  codeReviewPolicy:
    "All PRs require 2 approvals. ESLint, TypeScript strict mode, and Snyk security scan on every push. Bitrise CI must be green before merge.",
  documentationRequirements: [
    "Component library (Storybook)",
    "API integration guide",
    "Release notes per version",
    "QA test plan and results report",
    "Accessibility audit report",
  ],
  browserCompatibility: ["N/A — native mobile app"],
  deviceCompatibility: ["Mobile (iOS 15+, Android 10+)"],
  accessibilityStandard: "WCAG 2.1 AA",

  /* Step 7 – Governance & Compliance */
  personalDataInvolved: "yes",
  privacyLaws: ["RBI Mobile Banking Guidelines 2023", "PDPB (India)", "PCI-DSS Level 1"],
  dpaRequired: "yes",
  encryptionRequirements:
    "TLS 1.3 with certificate pinning for all API calls. SQLite local cache encrypted via SQLCipher. Biometric credentials stored in iOS Secure Enclave / Android Keystore only — never transmitted.",
  regulatoryFrameworks: ["PCI-DSS Level 1", "RBI", "PDPB"],
  dataResidency: "ap-south-1 (Mumbai)",
  accessControl: "Role-based with biometric MFA",
  reportingFrequency: "weekly",
  communicationChannels: "Slack, Linear, Notion, email",
  projectMethodology: "Agile (2-week sprints)",

  /* Step 8 – Commercial & Legal */
  ipOwnership: "client_owns_all",
  sourceCodeOwnership: "client_owns_all",
  referenceRights: "anonymized_reference",
  openSourcePolicy: "approved_licenses_only",
  thirdPartyCosts:
    "Sentry: $300/month. Mixpanel: $450/month. Braze: existing contract. App store developer accounts: $200/year. All client responsibility.",
  warrantyPeriod: "90_days",
  postWarrantySupport: "optional_retainer",
  changeRequestProcess: "formal_cr",
  changeRequestApprover: "",

  /* Step 9 – Approvers */
  businessOwnerApprover: "",
  finalApprover: "",
  legalReviewer: "",
  securityReviewer: "Arjun Reddy",
};

const sow002GeneratedSections = [];

/* ─── Registry ────────────────────────────────────────────────── */

export const sowWizardRegistry: Record<string, SOWWizardRecord> = {};

/**
 * Falls back to the sow-009 data (manual) or sow-002 data (AI)
 * for any SOW not explicitly registered.
 */
export function getSOWWizardRecord(sowId: string, intakeMode: "ai_generated" | "manual_upload"): SOWWizardRecord {
  if (sowWizardRegistry[sowId]) return sowWizardRegistry[sowId];
  const fallback = intakeMode === "ai_generated" ? sowWizardRegistry["sow-002"] : sowWizardRegistry["sow-009"];
  return { ...fallback, sowId };
}
