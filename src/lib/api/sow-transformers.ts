/**
 * Transform frontend FormData into API step payloads.
 *
 * Maps the flat FormData shape + frontend enum values to the nested
 * section structure and exact enum strings the Glimmora API expects.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type FD = Record<string, any>;

// ── helpers ───────────────────────────────────────────────────────────────

const nonEmpty = (arr: string[] | undefined): string[] =>
  (arr ?? []).filter((s) => typeof s === "string" && s.trim().length > 0);

const maybe = <T,>(v: T | undefined | null | ""): T | undefined =>
  v === "" || v === null || v === undefined ? undefined : v;

/**
 * Map a frontend select value to the exact API enum string.
 * Falls through to the original value if no mapping exists.
 */
function mapEnum(value: string, mapping: Record<string, string>): string {
  return mapping[value] ?? value;
}

// ── Enum mappings (frontend value → API enum) ────────────────────────────

const BUSINESS_CRITICALITY: Record<string, string> = {
  mission_critical: "Mission-critical",
  business_important: "Business-important",
  standard: "Standard",
  low: "Low",
};

const STRATEGIC_CONTEXT: Record<string, string> = {
  new_market_opportunity: "New market opportunity",
  regulatory_obligation: "Regulatory compliance obligation",
  competitive_catchup: "Competitive catch-up",
  internal_efficiency: "Internal efficiency improvement",
  cost_reduction: "Cost reduction",
  revenue_generation: "Revenue generation",
  digital_transformation: "Digital transformation",
  customer_experience: "Customer experience improvement",
  other: "Other",
};

const AGE_RANGE: Record<string, string> = {
  under_18: "Under 18",
  "18-25": "18–35", "18-35": "18–35", "25-35": "18–35",
  "35-45": "36–55", "36-55": "36–55", "45-55": "36–55",
  "55-65": "55+", "65+": "55+",
  all_ages: "Mixed",
};

const TECH_LITERACY: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High",
};

const PRIMARY_DEVICE: Record<string, string> = {
  mobile: "Mobile", desktop: "Desktop", both: "Both", "kiosk/pos": "Kiosk/POS",
  Mobile: "Mobile", Desktop: "Desktop", Both: "Both",
};

const INDUSTRY: Record<string, string> = {
  technology: "Fintech",
  healthcare: "Healthtech",
  finance: "Fintech",
  retail: "E-commerce / Retail",
  logistics: "Logistics / Supply Chain",
  education: "Edtech",
  government: "Government / Public Sector",
  manufacturing: "Manufacturing",
  media: "Media / Entertainment",
  other: "Other",
};

const PROJECT_CATEGORY: Record<string, string> = {
  new_build: "New product build",
  enhancement: "Feature expansion on existing product",
  migration: "System migration",
  integration_only: "Integration / API project",
  uiux_redesign: "Rebuild / Re-platform",
  mvp: "MVP / Proof of concept",
  other: "Other",
};

const PLATFORM_TYPE: Record<string, string> = {
  web: "Web application",
  mobile_ios: "Mobile — iOS only",
  mobile_android: "Mobile — Android only",
  mobile_hybrid: "Mobile — Cross-platform (iOS + Android)",
  desktop: "Desktop application",
  api_backend: "API / Backend only",
  data_platform: "Data pipeline / ETL",
  full_stack: "Web + Mobile",
  other: "Other",
};

const PRIORITY: Record<string, string> = {
  must_have: "Must Have",
  should_have: "Should Have",
  nice_to_have: "Nice to Have",
  out_of_scope: "Out of Scope",
};

const UIUX_SCOPE: Record<string, string> = {
  not_in_scope: "Not in scope",
  in_scope: "In scope",
  full_design: "In scope",
  client_provides: "Client provides designs",
};

const DEPLOYMENT_SCOPE: Record<string, string> = {
  cloud: "Deploy to cloud",
  on_premise: "Deploy to client on-premise",
  both: "Both",
  not_in_scope: "Not in scope — working build handover only",
};

const GO_LIVE_SCOPE: Record<string, string> = {
  not_in_scope: "Not in scope",
  production: "Production go-live included",
  production_hypercare: "Go-live + post-go-live hypercare",
  phased_rollout: "Production go-live included",
};

const ETL_APPROACH: Record<string, string> = {
  custom_scripts: "Custom scripts",
  aws_dms: "AWS DMS",
  talend: "Talend",
  azure_data_factory: "Azure Data Factory",
  manual: "Manual export-import",
  other: "Other",
};

const TRANSFORMATION: Record<string, string> = {
  no_transformation: "No transformation (direct copy)",
  simple_mapping: "Simple field mapping",
  complex_business_logic: "Complex business logic",
  data_cleansing: "Data cleansing required",
};

const PRICING_MODEL: Record<string, string> = {
  fixed: "Fixed Price", fixed_price: "Fixed Price",
  time_materials: "Time & Materials", t_and_m: "Time & Materials", "t&m": "Time & Materials",
  outcome_based: "Milestone-based",
  hybrid: "Milestone-based",
  milestone: "Milestone-based",
  retainer: "Retainer",
};

const LIKELIHOOD: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High",
};

const DATA_SENSITIVITY: Record<string, string> = {
  public: "Public", internal: "Internal",
  confidential: "Confidential", restricted: "Restricted",
};

const WARRANTY_PERIOD: Record<string, string> = {
  "30_days": "30 days post go-live", "30 days": "30 days post go-live",
  "60_days": "60 days", "60 days": "60 days",
  "90_days": "90 days", "90 days": "90 days",
  "6_months": "6 months", "6 months": "6 months",
  none: "No warranty", custom: "Custom",
};

const SENIORITY: Record<string, string> = {
  junior: "Junior", mid: "Mid-level", "mid-level": "Mid-level",
  senior: "Senior", lead: "Lead", principal: "Principal / Staff",
};

// ── Step 0: Project Context & Discovery ──────────────────────────────────

export function toStep0(fd: FD) {
  return {
    section_a: {
      project_vision: fd.projectVision,
      business_objectives: (fd.businessObjectives ?? [])
        .filter((o: any) => o.objective?.trim())
        .map((o: any) => ({
          objective: o.objective,
          measurable_target: o.measurableTarget || "To be defined",
          target_timeline: o.timeline || "TBD",
        })),
      pain_points: (fd.painPoints ?? [])
        .filter((p: any) => p.problemDescription?.trim())
        .map((p: any) => ({
          problem_description: p.problemDescription,
          who_experiences_it: p.whoExperiences || "End users",
        })),
      strategic_context: maybe(fd.strategicContext)
        ? mapEnum(fd.strategicContext, STRATEGIC_CONTEXT)
        : undefined,
      business_criticality: mapEnum(fd.businessCriticality, BUSINESS_CRITICALITY),
    },
    section_b: {
      current_state_not_applicable: fd.currentStateType === "not_applicable",
      // API requires 30+ chars or null — don't send short strings
      current_state_description:
        fd.currentState && fd.currentState.trim().length >= 30
          ? fd.currentState
          : undefined,
      desired_future_state: fd.desiredFutureState,
      previous_attempts: maybe(fd.previousAttempts),
    },
    section_c: {
      end_user_profiles: (fd.endUserProfiles ?? [])
        .filter((u: any) => u.roleName?.trim())
        .map((u: any) => ({
          role_name: u.roleName,
          approximate_user_count: u.count || "1-50",
          age_range: mapEnum(u.ageRange || "all_ages", AGE_RANGE),
          tech_literacy: mapEnum(u.techLiteracy || "medium", TECH_LITERACY),
          primary_device: mapEnum(u.primaryDevice || "desktop", PRIMARY_DEVICE),
          geography: u.geography || "Global",
          accessibility_needs: u.accessibilityNeeds || "None",
        })),
      // Only send languages that match API enum values
      languages: (() => {
        const VALID_LANGS = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Arabic", "French", "Other"];
        const langs = nonEmpty(fd.languageRequirements).filter((l) => VALID_LANGS.includes(l));
        return langs.length ? langs : undefined;
      })(),
      user_expectations: nonEmpty(fd.userExpectations).length
        ? nonEmpty(fd.userExpectations)
        : undefined,
    },
    section_d: {
      // API requires at least 1 metric — provide a default if user left it empty
      success_metrics: (() => {
        const filled = (fd.successMetrics ?? [])
          .filter((m: any) => m.metricName?.trim())
          .map((m: any) => ({
            metric_name: m.metricName,
            baseline_value: m.baseline || "N/A",
            target_value: m.target || "TBD",
            measurement_method: m.measurementMethod || "To be defined",
            timeframe: m.timeframe || "Project duration",
          }));
        // Ensure at least one metric exists
        return filled.length > 0
          ? filled
          : [{ metric_name: "Project delivery", baseline_value: "N/A", target_value: "On time, on budget", measurement_method: "Milestone tracking", timeframe: "Project duration" }];
      })(),
      enterprise_expectations: maybe(fd.enterpriseExpectations),
      definition_of_success: fd.definitionOfSuccess,
    },
  };
}

// ── Step 1: Project Identity & Scope ─────────────────────────────────────

export function toStep1(fd: FD) {
  return {
    section_a: {
      project_title: fd.title,
      client_organisation: fd.client,
      industry: mapEnum(fd.industry, INDUSTRY),
      industry_other: maybe(fd.industryOther),
      project_category: mapEnum(fd.projectCategory, PROJECT_CATEGORY),
      platform_type: mapEnum(fd.platformType, PLATFORM_TYPE),
      platform_other: maybe(fd.platformOther),
      client_tech_landscape: maybe(fd.existingTechLandscape),
    },
    section_b: {
      feature_modules: (fd.featureModules ?? [])
        .filter((m: any) => m.moduleName?.trim())
        .map((m: any) => ({
          module_name: m.moduleName,
          description: m.description || "To be detailed",
          priority: mapEnum(m.priority || "must_have", PRIORITY),
        })),
      user_roles: (fd.userRoles ?? [])
        .filter((r: any) => r.roleName?.trim())
        .map((r: any) => ({
          role_name: r.roleName,
          primary_actions: r.primaryActions || "View and manage",
        })),
      key_workflows: (fd.businessWorkflows ?? [])
        .filter((w: any) => w.name?.trim())
        .map((w: any) => ({
          workflow_name: w.name,
          steps: (w.steps || "Step 1")
            .split(/[,;\n]+/)
            .filter((s: string) => s.trim())
            .map((s: string, i: number) => ({ step_number: i + 1, description: s.trim() })),
          outcome: w.outcome || "Completed",
        })),
      estimated_screen_count: fd.estimatedScreenCount
        ? parseInt(fd.estimatedScreenCount, 10)
        : undefined,
      critical_business_rules: nonEmpty(fd.criticalBusinessRules).length
        ? nonEmpty(fd.criticalBusinessRules)
        : undefined,
    },
    section_c: {
      out_of_scope_exclusions: nonEmpty(fd.outOfScope),
      assumptions: nonEmpty(fd.assumptions).length ? nonEmpty(fd.assumptions) : undefined,
      constraints: nonEmpty(fd.constraints).length ? nonEmpty(fd.constraints) : undefined,
      data_migration: {
        in_scope: !!fd.dataMigrationScope && fd.dataMigrationScope !== "none" && fd.dataMigrationScope !== "",
        source_system_name: maybe(fd.dataMigrationSource),
        estimated_data_volume: maybe(fd.dataMigrationVolume),
        migration_approach: maybe(fd.dataMigrationApproach),
        source_extract_provided_by: maybe(fd.dataMigrationExtractOwnership),
        data_validation_responsibility: maybe(fd.dataMigrationValidation),
        rollback_plan_required: fd.dataMigrationRollback === "yes" ? true : fd.dataMigrationRollback === "no" ? false : undefined,
      },
    },
  };
}

// ── Step 2: Delivery & Technical Scope ───────────────────────────────────

export function toStep2(fd: FD) {
  const devScope = nonEmpty(fd.developmentScope);
  return {
    section_a: {
      development_scope: {
        frontend: devScope.some((s) => /front/i.test(s)),
        backend: devScope.some((s) => /back/i.test(s)),
        api: devScope.some((s) => /api/i.test(s)),
        database_design: devScope.some((s) => /data/i.test(s)),
        third_party_integration: devScope.some((s) => /integr/i.test(s)),
        ci_cd_setup: devScope.some((s) => /ci|cd|devops|deploy/i.test(s)),
      },
      ui_ux: {
        scope: mapEnum(fd.uiuxDesignScope || "in_scope", UIUX_SCOPE),
      },
      deployment: {
        scope: mapEnum(fd.deploymentScope || "cloud", DEPLOYMENT_SCOPE),
        provider: maybe(fd.deploymentProvider),
      },
      go_live: {
        scope: mapEnum(fd.goLiveScope || "production", GO_LIVE_SCOPE),
        hypercare_duration: maybe(fd.hypercareDuration),
        hypercare_support: maybe(fd.hypercareSupport),
      },
    },
    section_b: {
      technology_stack: fd.techStack,
      scalability_performance: maybe(fd.scalabilityRequirements)
        ? { description: fd.scalabilityRequirements }
        : undefined,
    },
    section_c: fd.dataMigrationScope && fd.dataMigrationScope !== "none"
      ? {
          etl_approach: maybe(fd.etlApproach) ? mapEnum(fd.etlApproach, ETL_APPROACH) : undefined,
          transformation_complexity: maybe(fd.transformationComplexity) ? mapEnum(fd.transformationComplexity, TRANSFORMATION) : undefined,
          data_validation_method: maybe(fd.dataValidationMethod),
        }
      : undefined,
  };
}

// ── Step 3: Integrations & User Management (optional) ────────────────────

export function toStep3(fd: FD) {
  const integrations = (fd.integrationPoints ?? [])
    .filter((ip: any) => ip.name?.trim())
    .map((ip: any) => ({
      name: ip.name,
      direction: maybe(ip.direction),
      protocol: maybe(ip.protocol),
      authentication: maybe(ip.authentication),
      data_format: maybe(ip.dataFormat),
      sandbox_credentials: maybe(ip.sandboxCredentials),
      testing_responsibility: maybe(ip.testingResponsibility),
      error_handling_sla: maybe(ip.errorHandlingSLA),
    }));

  return {
    section_a: {
      integrations: integrations.length ? integrations : undefined,
    },
    section_b: {
      sso_required: fd.ssoRequired === "yes",
      sso_provider_name: maybe(fd.ssoProviderName),
      sso_protocol: maybe(fd.ssoProtocol),
      user_registration_model: maybe(fd.userRegistrationModel),
      use_custom_password_policy: fd.passwordPolicy === "custom",
      custom_password_policy: fd.passwordPolicy === "custom"
        ? {
            min_length: parseInt(fd.passwordMinLength, 10) || 8,
            complexity: fd.passwordComplexity || "Standard",
            expiry_days: parseInt(fd.passwordExpiry, 10) || 90,
            session_timeout_minutes: parseInt(fd.sessionTimeout, 10) || 30,
            lockout_attempts: parseInt(fd.lockoutAttempts, 10) || 5,
          }
        : undefined,
      user_action_audit_logging: fd.auditLogging === "yes",
      audit_events: nonEmpty(fd.auditLogEvents).length ? nonEmpty(fd.auditLogEvents) : undefined,
    },
    section_c: {
      approval_workflows_in_scope: fd.approvalWorkflows === "yes",
      notifications_in_scope: fd.notifications === "yes",
      notification_events: fd.notifications === "yes"
        ? (fd.notificationEvents ?? []).filter((n: any) => n.trigger?.trim()).map((n: any) => `${n.trigger} (${n.channel})`)
        : undefined,
      scheduled_jobs_in_scope: fd.scheduledJobsScope === "yes",
      scheduled_jobs: fd.scheduledJobsScope === "yes"
        ? (fd.scheduledJobItems ?? []).filter((j: any) => j.jobName?.trim()).map((j: any) => ({
            job_name: j.jobName, frequency: maybe(j.frequency), trigger_condition: maybe(j.triggerCondition),
          }))
        : undefined,
    },
  };
}

// ── Step 4: Timeline, Team & Testing (optional) ──────────────────────────

export function toStep4(fd: FD) {
  // Ensure required_roles has at least 1 entry
  const roles = (fd.roles ?? [])
    .filter((r: any) => r.roleName?.trim())
    .map((r: any) => ({
      role_name: r.roleName,
      seniority: mapEnum(r.seniority || "mid", SENIORITY),
    }));

  return {
    section_a: {
      start_date: fd.startDate || new Date().toISOString().split("T")[0],
      target_end_date: fd.endDate || new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      phasing_strategy: maybe(fd.phasingStrategy),
      key_milestones: (() => {
        const filled = (fd.milestones ?? [])
          .filter((m: any) => m.name?.trim())
          .map((m: any) => ({
            name: m.name,
            target_date: m.targetDate || fd.endDate || new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
            acceptance_criteria: m.acceptanceCriteria || "Stakeholder sign-off",
          }));
        return filled.length ? filled : undefined;
      })(),
      client_side_dependencies: nonEmpty(fd.clientDependencies).length ? nonEmpty(fd.clientDependencies) : undefined,
    },
    section_b: {
      required_roles: roles.length > 0
        ? roles
        : [{ role_name: "Full-Stack Developer", seniority: "Mid-level" }],
      estimated_team_size: maybe(fd.teamSize),
      work_model: maybe(fd.workModel),
      skill_priorities: maybe(fd.skillPriorities),
      knowledge_transfer_included: fd.knowledgeTransfer === "yes",
    },
    section_c: {
      unit_integration_coverage_target: fd.testCoverageTarget || "80%+",
      sit_in_scope: false,
      uat: {
        glimmora_support_level: "Full support during UAT",
        client_uat_resource: fd.qaResponsibility || "Client-side QA team lead and designated testers",
        uat_duration_days: parseInt(fd.uatPeriod, 10) || 14,
        signoff_authority_name: fd.businessOwnerApprover || "Project Owner",
        signoff_authority_title: "Project Manager",
      },
      pre_production_testing: false,
      performance_testing_in_scope: false,
      security_testing_in_scope: false,
    },
  };
}

// ── Step 5: Budget & Risk ────────────────────────────────────────────────

export function toStep5(fd: FD) {
  return {
    section_a: {
      budget_minimum: parseFloat(fd.budgetMin) || 1,
      budget_maximum: parseFloat(fd.budgetMax) || parseFloat(fd.budgetMin) || 1,
      currency: fd.currency || "USD",
      pricing_model: mapEnum(fd.pricingModel || "fixed_price", PRICING_MODEL),
      budget_breakdown_preference: maybe(fd.breakdownPreference),
    },
    section_b: {
      known_risks: nonEmpty(fd.knownRisks).map((r) => ({
        description: r,
        likelihood: "Medium" as const,
        impact: "Medium" as const,
      })),
      project_constraints: maybe(fd.projectConstraints),
      contingency_budget: maybe(fd.contingencyBudget),
      escalation_process: maybe(fd.escalationProcess),
    },
  };
}

// ── Step 6: Quality Standards (optional) ─────────────────────────────────

export function toStep6(fd: FD) {
  const browserSupport = fd.browserDeviceSupport ?? [];
  return {
    project_level_acceptance_criteria:
      (fd.codingStandards && fd.codingStandards.length >= 30 ? fd.codingStandards : null)
      ?? (fd.testingAcceptanceCriteria && fd.testingAcceptanceCriteria.length >= 30 ? fd.testingAcceptanceCriteria : null)
      ?? "All acceptance criteria met, tested, and signed off by designated stakeholders before release.",
    sla_uptime: maybe(fd.slaUptimeCommitment),
    code_review_policy: maybe(fd.codeReviewProcess),
    documentation_requirements: maybe(fd.documentationLevel) ? [fd.documentationLevel] : undefined,
    browser_compatibility: {
      chrome: browserSupport.includes("Chrome") || true,
      firefox: browserSupport.includes("Firefox") || false,
      safari: browserSupport.includes("Safari") || false,
      edge: browserSupport.includes("Edge") || false,
      ie11: browserSupport.includes("IE11") || false,
      all_modern: browserSupport.includes("All modern") || false,
    },
    device_compatibility: {
      desktop: true,
      tablet: browserSupport.includes("Tablet") || false,
      mobile: browserSupport.includes("Mobile") || false,
    },
    offline_support_required: false,
  };
}

// ── Step 7: Governance & Compliance ──────────────────────────────────────

export function toStep7(fd: FD) {
  return {
    section_a: {
      non_discrimination_confirmed: true,
      labour_standards: "ILO Core Labour Standards (international)",
      accessibility_requirements: maybe(fd.accessibilityStandard),
    },
    section_b: {
      personal_data_involved: fd.dpaRequired || (fd.complianceStandards ?? []).includes("GDPR"),
    },
    section_c: {
      data_sensitivity_level: mapEnum(fd.dataRetentionPolicy || "confidential", DATA_SENSITIVITY),
      regulatory_frameworks: nonEmpty(fd.complianceStandards).length ? nonEmpty(fd.complianceStandards) : undefined,
    },
  };
}

// ── Step 8: Commercial & Legal ───────────────────────────────────────────

const IP_OWNERSHIP: Record<string, string> = {
  client: "Client owns all IP and source code",
  vendor: "GlimmoraTeam retains framework and component IP — client owns application layer",
  shared: "Joint ownership (defined in NDA)",
  custom: "Custom arrangement",
};

export function toStep8(fd: FD) {
  return {
    section_a: {
      ip_ownership: mapEnum(fd.ipOwnership || "client", IP_OWNERSHIP),
      source_code_repo_ownership: "Client owns and hosts the repository throughout delivery",
      portfolio_reference_rights: "GlimmoraTeam may reference this project as portfolio work with client name",
    },
    section_b: {
      third_party_licensing: "Client pays all third-party service and licence costs directly",
      warranty_period: mapEnum(fd.warrantyPeriod || "90 days", WARRANTY_PERIOD),
      change_request_process: {
        model: "All changes formally priced and approved before work begins",
      },
    },
  };
}

// ── Step 9: Generate payload ─────────────────────────────────────────────

export function toStep9(fd: FD) {
  return {
    business_owner_approver_id: fd.businessOwnerApprover,
    final_approver_id: fd.finalApprover || fd.businessOwnerApprover,
    legal_compliance_reviewer_id: maybe(fd.legalReviewer),
    security_reviewer_id: maybe(fd.securityReviewer),
  };
}

// ── Master dispatcher ────────────────────────────────────────────────────

const TRANSFORMERS: Record<number, (fd: FD) => unknown> = {
  0: toStep0, 1: toStep1, 2: toStep2, 3: toStep3, 4: toStep4,
  5: toStep5, 6: toStep6, 7: toStep7, 8: toStep8,
};

export function transformStepPayload(step: number, formData: FD): unknown {
  const fn = TRANSFORMERS[step];
  if (!fn) throw new Error(`No transformer for step ${step}`);
  return fn(formData);
}
