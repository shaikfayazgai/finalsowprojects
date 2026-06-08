/**
 * Complete realistic sample dataset for the AI SOW Generator 10-step wizard.
 * Used to pre-fill the form for demo/testing purposes.
 */

export const sampleSOWFormData = {
  /* ═══════════════════════════════════════════
     Step 0: Context & Discovery
     ═══════════════════════════════════════════ */
  projectVision:
    "Build a unified enterprise resource planning platform that consolidates procurement, inventory management, and financial reporting into a single cloud-native application, replacing three legacy systems and reducing operational overhead by 40%.",
  businessObjectives: [
    "Reduce manual data entry by 60% through automated workflows within 6 months of launch",
    "Achieve 99.9% system uptime for mission-critical procurement operations",
    "Enable real-time financial reporting with less than 5-second dashboard load times",
    "Decrease procurement cycle time from 14 days to 3 days",
  ],
  painPoints: [
    "Three disconnected legacy systems require manual data reconciliation daily, consuming 4+ FTE hours",
    "No real-time visibility into inventory levels across 12 warehouse locations",
    "Financial close process takes 15 business days due to manual consolidation",
    "Vendor onboarding requires 23 manual steps across multiple systems",
  ],
  strategicContext: "digital_transformation",
  businessCriticality: "mission_critical",
  currentState:
    "The organization currently operates on SAP R/3 (2008 version), a custom-built inventory tracker in MS Access, and QuickBooks Enterprise for financial reporting. Data is synchronized via nightly CSV exports.",
  currentStateType: "existing",
  desiredFutureState:
    "A single cloud-native ERP platform with real-time data synchronization, role-based dashboards, automated approval workflows, and mobile access for warehouse managers. Full API integration with existing CRM (Salesforce) and HR (Workday) systems.",
  previousAttempts:
    "A 2023 attempt to migrate to SAP S/4HANA was abandoned after 8 months due to scope creep and budget overruns. Key lesson: phased rollout is essential.",
  endUserProfiles: [
    "Procurement managers (25 users) — create POs, manage vendor relationships, approve purchases",
    "Warehouse staff (60 users) — scan barcodes, update inventory, process receiving",
    "Finance team (15 users) — generate reports, manage GL entries, perform reconciliation",
    "Executive leadership (8 users) — view dashboards, approve budgets, monitor KPIs",
    "External vendors (200+) — submit invoices, update catalogs, view PO status",
  ],
  languageRequirements: ["English (primary)", "Spanish (warehouse staff)", "French (Canadian operations)"],
  userExpectations: [
    "Sub-3-second page load times for all core workflows",
    "Mobile-responsive interface for warehouse barcode scanning",
    "Single sign-on integration with existing Azure AD",
    "Offline capability for warehouse operations during network outages",
  ],
  successMetrics: [
    "40% reduction in operational overhead within 12 months",
    "95% user adoption rate within 3 months of go-live",
    "Zero critical defects in production for first 90 days",
    "ROI break-even within 18 months",
  ],
  enterpriseExpectations:
    "The platform must comply with SOX requirements for financial controls and provide complete audit trails for all procurement transactions.",
  definitionOfSuccess:
    "The project is considered successful when all three legacy systems are fully decommissioned, 95% of users are actively using the new platform daily, and the finance team can close monthly books within 5 business days.",

  /* ═══════════════════════════════════════════
     Step 1: Project & Scope
     ═══════════════════════════════════════════ */
  title: "Enterprise Resource Planning Platform — Cloud Migration & Consolidation",
  client: "TechVista Solutions",
  industry: "technology",
  projectCategory: "enterprise_platform",
  platformType: "web_and_mobile",
  existingTechLandscape:
    "SAP R/3, MS Access inventory DB, QuickBooks Enterprise, Salesforce CRM, Workday HR, Azure AD, AWS (partial), on-premises data center",
  featureModules: [
    "Procurement & Purchase Order Management",
    "Inventory & Warehouse Management",
    "Financial Reporting & General Ledger",
    "Vendor Portal & Self-Service",
    "Executive Dashboard & Analytics",
    "Approval Workflow Engine",
    "Document Management & Audit Trail",
    "Notification & Alert System",
  ],
  userRoles: [
    "System Administrator",
    "Procurement Manager",
    "Warehouse Operator",
    "Finance Analyst",
    "Executive Viewer",
    "Vendor (External)",
    "Auditor (Read-Only)",
  ],
  businessWorkflows: [
    "Purchase Requisition → Approval → PO Creation → Goods Receipt → Invoice Matching → Payment",
    "Inventory Receiving → Quality Check → Shelving → Stock Update → Reorder Trigger",
    "Monthly Close → Journal Entry Review → Consolidation → Financial Statement Generation",
    "Vendor Registration → Compliance Check → Approval → Catalog Upload → Activation",
  ],
  estimatedScreenCount: "85-100",
  criticalBusinessRules: [
    "Three-way match required for all invoices above $5,000 (PO, GR, Invoice)",
    "Dual approval required for purchases exceeding $50,000",
    "Inventory reorder points must trigger automatic PO creation",
    "All financial transactions must have complete audit trail per SOX requirements",
    "Vendor payments must not exceed contracted rates without change order approval",
  ],
  outOfScope: [
    "HR/Payroll system replacement (remains on Workday)",
    "CRM functionality (remains on Salesforce)",
    "Physical warehouse layout redesign",
    "Legacy data archival beyond 3-year lookback",
    "Custom hardware/IoT sensor integration",
  ],
  assumptions: [
    "Client will provide dedicated product owner with decision-making authority",
    "Azure AD tenant is available for SSO integration from Day 1",
    "Client IT team will handle network/VPN configuration for warehouse locations",
    "Existing Salesforce API access is available with appropriate licenses",
    "Test data from legacy systems will be provided within 2 weeks of project start",
  ],
  constraints: [
    "Go-live must occur before fiscal year end (December 31, 2026)",
    "Budget ceiling of $350,000 including contingency",
    "Must maintain zero downtime for procurement during migration",
    "All data must reside in US-East AWS region per compliance requirements",
  ],
  dataMigrationScope: "full_migration",
  dataMigrationDetails:
    "Migrate 3 years of transactional data from SAP R/3, complete inventory records from MS Access, and 2 years of financial data from QuickBooks. Estimated 2.5M records across all systems.",

  /* ═══════════════════════════════════════════
     Step 2: Delivery & Technical
     ═══════════════════════════════════════════ */
  developmentScope: [
    "frontend_development",
    "backend_development",
    "api_development",
    "database_design",
    "data_migration",
    "integration_development",
  ],
  uiuxDesignScope: "full_design",
  uiuxDesignDetails:
    "Complete UI/UX design including wireframes, high-fidelity mockups, design system, component library, and usability testing for all 8 feature modules.",
  deploymentScope: "full_deployment",
  deploymentDetails:
    "CI/CD pipeline setup on AWS with blue-green deployment, staging and production environments, automated testing gates, and infrastructure-as-code via Terraform.",
  goLiveScope: "phased_rollout",
  goLiveDetails:
    "Phase 1: Procurement module (Month 5), Phase 2: Inventory & Warehouse (Month 6), Phase 3: Finance & Reporting (Month 7), Phase 4: Vendor Portal (Month 8).",
  techStack:
    "Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand. Backend: Node.js, Express, PostgreSQL 16, Redis. Infrastructure: AWS ECS Fargate, RDS, S3, CloudFront, Terraform. Monitoring: Datadog, PagerDuty.",
  scalabilityRequirements:
    "Support 500 concurrent users with sub-3s response times. Auto-scale to handle month-end processing spikes (3x normal load). Database must handle 10M+ records with query performance under 200ms.",
  etlApproach: "incremental",
  transformationComplexity: "high",
  dataValidationMethod: "automated_with_manual_review",

  /* ═══════════════════════════════════════════
     Step 3: Integrations & User Mgmt
     ═══════════════════════════════════════════ */
  integrations: [
    "Salesforce CRM — bidirectional sync for vendor/customer data via REST API",
    "Workday HR — employee data sync for role provisioning via SCIM",
    "Azure AD — SSO and user provisioning via SAML 2.0 / OIDC",
    "AWS S3 — document storage for invoices, POs, and contracts",
    "Stripe — payment processing for vendor payouts",
    "SendGrid — transactional email notifications",
  ],
  ssoRequired: "yes",
  ssoDetails:
    "Azure AD integration via SAML 2.0 for internal users. External vendors use email/password with MFA via Authenticator app.",
  userRegistrationModel: "admin_provisioned",
  passwordPolicy: "custom",
  passwordPolicyDetails:
    "Minimum 12 characters, uppercase + lowercase + number + special character. 90-day rotation for admin accounts. MFA required for all users.",
  auditLogging: "yes",
  approvalWorkflows: "multi_level",
  notifications: "email_and_in_app",
  scheduledJobs: [
    "Nightly data sync with Salesforce CRM (2:00 AM EST)",
    "Weekly inventory reconciliation report generation (Sunday 6:00 AM)",
    "Monthly financial close automation trigger (Last business day, 11:00 PM)",
    "Daily backup verification and health check (3:00 AM EST)",
  ],

  /* ═══════════════════════════════════════════
     Step 4: Timeline, Team & Testing
     ═══════════════════════════════════════════ */
  startDate: "2026-05-01",
  endDate: "2026-12-15",
  phasingStrategy: "milestone_only",
  milestones: [
    "Project Kickoff & Discovery Complete — May 15, 2026",
    "Design System & Wireframes Approved — June 15, 2026",
    "Sprint 1-4: Core Platform & Procurement Module — August 31, 2026",
    "Sprint 5-6: Inventory & Warehouse Module — September 30, 2026",
    "Sprint 7-8: Finance & Reporting Module — October 31, 2026",
    "Sprint 9-10: Vendor Portal & Integrations — November 30, 2026",
    "UAT Complete & Go-Live — December 15, 2026",
  ],
  clientDependencies: [
    "Legacy system API access and documentation by May 15",
    "Dedicated Product Owner availability (minimum 20 hrs/week)",
    "Azure AD configuration for SSO by June 1",
    "Test data provision from all three legacy systems by May 30",
    "Warehouse site access for user research sessions",
  ],
  teamSize: "12-15",
  workModel: "hybrid",
  roles: [
    "Project Manager / Scrum Master",
    "Solution Architect",
    "Senior Full-Stack Developer (x3)",
    "Frontend Developer (x2)",
    "Backend Developer (x2)",
    "QA Engineer (x2)",
    "DevOps Engineer",
    "UX Designer",
    "Data Migration Specialist",
    "Business Analyst",
  ],
  skillPriorities:
    "ERP domain experience, AWS cloud architecture, PostgreSQL optimization, React/Next.js, data migration from SAP systems",
  knowledgeTransfer: "included",
  sitScope: "comprehensive",
  uatOwnership: "client_led",
  uatDuration: "3_weeks",
  uatSignoffAuthority: "",
  preProductionTesting: "included",
  performanceTesting: "included",
  securityTesting: "included",
  defectSLA:
    "Critical: 4-hour response, 24-hour resolution. High: 8-hour response, 48-hour resolution. Medium: 24-hour response, 5-day resolution. Low: 48-hour response, next sprint.",

  /* ═══════════════════════════════════════════
     Step 5: Budget & Risk
     ═══════════════════════════════════════════ */
  budgetMin: "280000",
  budgetMax: "350000",
  currency: "USD",
  pricingModel: "fixed_price",
  breakdownPreference: "phase_based",
  knownRisks: [
    "Legacy data quality issues may require additional cleansing effort — Mitigation: Allocate 2 weeks buffer for data validation",
    "SAP R/3 API documentation is incomplete — Mitigation: Reverse-engineer endpoints during discovery phase",
    "Month-end processing freeze may delay UAT — Mitigation: Schedule UAT to avoid fiscal close periods",
    "Vendor portal adoption may be slow — Mitigation: Include vendor training program and incentive structure",
    "AWS region capacity constraints during peak provisioning — Mitigation: Pre-provision infrastructure 2 weeks before go-live",
  ],
  projectConstraints:
    "Hard deadline of December 31 for fiscal year compliance. No system downtime permitted for procurement during business hours (6 AM - 8 PM EST).",
  contingencyBudget: "15",
  escalationProcess:
    "Level 1: Project Manager + Client PO (24h). Level 2: Solution Architect + VP Operations (48h). Level 3: Executive Sponsor + CTO (72h).",

  /* ═══════════════════════════════════════════
     Step 6: Quality Standards
     ═══════════════════════════════════════════ */
  acceptanceCriteria:
    "All user stories must pass acceptance criteria defined in JIRA. Code coverage minimum 80%. All critical and high-severity defects resolved before UAT. Performance benchmarks met (sub-3s page loads, sub-200ms API responses). Accessibility WCAG 2.1 AA compliance verified.",
  slaUptime: "99.95",
  codeReviewPolicy:
    "All PRs require at least 2 approvals. Automated linting, type-checking, and security scanning on every commit. Architecture-impacting changes require Solution Architect review.",
  documentationRequirements: [
    "technical_architecture",
    "api_documentation",
    "user_guides",
    "admin_guides",
    "deployment_runbook",
    "data_migration_plan",
  ],
  browserCompatibility: ["chrome", "firefox", "safari", "edge"],
  deviceCompatibility: ["desktop", "tablet", "mobile"],
  reportingScope: "comprehensive",
  offlineSupport: "partial",
  localisation: "multi_language",

  /* ═══════════════════════════════════════════
     Step 7: Governance & Compliance
     ═══════════════════════════════════════════ */
  nonDiscriminationConfirm: true,
  labourStandards: "compliant",
  accessibilityRequirements: "wcag_2_1_aa",
  prohibitedCategories: ["weapons", "gambling", "surveillance"],
  personalDataInvolved: "yes",
  privacyLaws: ["CCPA", "SOX"],
  dpaRequired: "yes",
  privacyImpactStatus: "required",
  dataSensitivity: "confidential",
  encryptionRequirements:
    "AES-256 encryption at rest for all PII and financial data. TLS 1.3 for all data in transit. Database-level encryption for PostgreSQL. S3 server-side encryption for documents.",
  regulatoryFrameworks: ["SOX", "CCPA", "ISO 27001"],
  dataResidency: "us_east",
  accessControl: "rbac",

  /* ═══════════════════════════════════════════
     Step 8: Commercial & Legal
     ═══════════════════════════════════════════ */
  ipOwnership: "client_owns_all",
  sourceCodeOwnership: "client_owns_all",
  referenceRights: "anonymized_reference",
  openSourcePolicy: "approved_licenses_only",
  thirdPartyCosts:
    "AWS infrastructure: ~$3,500/month. Datadog monitoring: $800/month. SendGrid: $200/month. Stripe transaction fees: 2.9% + $0.30. All third-party costs are client responsibility.",
  warrantyPeriod: "custom",
  postWarrantySupport: "optional_retainer",
  changeRequestProcess: "formal_cr",
  changeRequestApprover: "",
  environmentCosts:
    "Development: $1,200/month. Staging: $800/month. Production: $3,500/month. All environments provisioned via Terraform and managed through CI/CD pipeline.",

  /* ═══════════════════════════════════════════
     Step 9: Review & Generate
     ═══════════════════════════════════════════ */
  businessOwnerApprover: "",
  finalApprover: "",
  legalReviewer: "",
  securityReviewer: "Arjun Reddy",
};
