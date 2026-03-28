import { z } from "zod";
import type { CommercialSectionKey } from "@/types/enterprise";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const nonEmptyString = (msg: string) =>
  z.string().refine((s) => s.trim().length > 0, { message: msg });

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type SectionErrors = Record<string, string>;

// ---------------------------------------------------------------------------
// Section 1 — Business Context & Vision
// ---------------------------------------------------------------------------

const section1Schema = z.object({
  projectVision: z
    .string()
    .min(50, "Project vision must be at least 50 characters"),
  businessCriticality: nonEmptyString("Select a business criticality level"),
  currentState: nonEmptyString("Current state is required"),
  desiredFutureState: nonEmptyString("Desired future state is required"),
  definitionOfSuccess: nonEmptyString("Definition of success is required"),
});

// ---------------------------------------------------------------------------
// Section 2 — Delivery Scope Boundary
// ---------------------------------------------------------------------------

const section2Schema = z.object({
  developmentScope: z
    .array(z.string())
    .min(1, "Select at least one development scope item"),
  uiuxDesignScope: nonEmptyString("Select UI/UX design scope"),
  deploymentScope: nonEmptyString("Select deployment scope"),
  goLiveScope: nonEmptyString("Select go-live & hypercare scope"),
  dataMigrationScope: nonEmptyString("Select data migration scope"),
});

// ---------------------------------------------------------------------------
// Section 3 — Technical Architecture & Integrations
// ---------------------------------------------------------------------------

const section3Schema = z.object({
  technologyStack: nonEmptyString("Technology stack is required"),
});

// ---------------------------------------------------------------------------
// Section 4 — Timeline, Team & Testing
// ---------------------------------------------------------------------------

const section4Schema = z
  .object({
    startDate: nonEmptyString("Start date is required"),
    targetEndDate: nonEmptyString("Target end date is required"),
    uatSignOffAuthority: nonEmptyString("UAT sign-off authority is required"),
    uatSignOffConfirmed: z.literal(true, {
      error: "You must confirm the UAT sign-off authority",
    }),
  })
  .refine((d) => !d.startDate || !d.targetEndDate || d.targetEndDate > d.startDate, {
    message: "End date must be after start date",
    path: ["targetEndDate"],
  });

// ---------------------------------------------------------------------------
// Section 5 — Budget & Risk
// ---------------------------------------------------------------------------

const section5Schema = z
  .object({
    budgetMinimum: z.coerce
      .number()
      .refine((n) => n > 0, { message: "Minimum budget must be greater than 0" }),
    budgetMaximum: z.coerce
      .number()
      .refine((n) => n > 0, { message: "Maximum budget must be greater than 0" }),
    pricingModel: nonEmptyString("Select a pricing model"),
  })
  .refine((d) => d.budgetMaximum >= d.budgetMinimum, {
    message: "Maximum budget must be greater than or equal to minimum",
    path: ["budgetMaximum"],
  });

// ---------------------------------------------------------------------------
// Section 6 — Governance & Compliance
// ---------------------------------------------------------------------------

const section6Schema = z.object({
  nonDiscriminationConfirmed: z.literal(true, {
    error: "Non-discrimination confirmation is required",
  }),
  dataSensitivityLevel: nonEmptyString("Select a data sensitivity level"),
  personalDataInvolved: nonEmptyString("Indicate whether personal data is involved"),
});

// ---------------------------------------------------------------------------
// Section 7 — Commercial & Legal + Approval Authorities
// (pass merged { ...commercialLegal, ...approvalAuthorities })
// ---------------------------------------------------------------------------

const section7Schema = z.object({
  ipOwnership: nonEmptyString("Select IP ownership model"),
  sourceCodeOwnership: nonEmptyString("Select source code repository ownership"),
  warrantyPeriod: nonEmptyString("Select warranty period"),
  changeRequestProcess: nonEmptyString("Select change request process"),
  thirdPartyCosts: nonEmptyString("Select third-party licensing costs model"),
  businessOwnerApprover: nonEmptyString("Business owner approver is required"),
  finalApprover: nonEmptyString("Final approver is required"),
});

// ---------------------------------------------------------------------------
// Schema map
// ---------------------------------------------------------------------------

const schemas: Record<CommercialSectionKey, z.ZodTypeAny> = {
  businessContext: section1Schema,
  deliveryScope: section2Schema,
  techIntegrations: section3Schema,
  timelineTeam: section4Schema,
  budgetRisk: section5Schema,
  governance: section6Schema,
  commercialLegal: section7Schema,
};

// ---------------------------------------------------------------------------
// Exported validator
// ---------------------------------------------------------------------------

/**
 * Validate a single section's data against its Zod schema.
 * @returns An object mapping field names to their first error message.
 *          An empty object means the section is valid.
 */
export function validateSection(section: CommercialSectionKey, data: unknown): SectionErrors {
  const schema = schemas[section];
  const result = schema.safeParse(data);

  if (result.success) return {};

  const errors: SectionErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : "_root";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/**
 * Validate a single field within a section.
 * Returns the error message for that field, or undefined if valid.
 */
export function validateField(section: CommercialSectionKey, field: string, data: unknown): string | undefined {
  return validateSection(section, data)[field];
}
