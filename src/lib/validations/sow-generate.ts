import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Array must contain at least `min` non-empty (trimmed) strings. */
const nonEmptyList = (min: number, msg: string) =>
  z.array(z.string()).refine(
    (arr) => arr.filter((s) => s.trim().length > 0).length >= min,
    { message: msg },
  );

/** String that is non-empty after trimming. */
const nonEmptyString = (msg: string) =>
  z.string().refine((s) => s.trim().length > 0, { message: msg });

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type StepErrors = Record<string, string>;

// ---------------------------------------------------------------------------
// Step 0 - Context Discovery
// ---------------------------------------------------------------------------

const step0Schema = z.object({
  projectVision: z
    .string()
    .min(50, "Project vision must be at least 50 characters"),
  businessObjectives: nonEmptyList(1, "Add at least one business objective"),
  painPoints: nonEmptyList(1, "Add at least one pain point"),
  businessCriticality: nonEmptyString("Select a business criticality level"),
  desiredFutureState: z
    .string()
    .min(30, "Desired future state must be at least 30 characters"),
  endUserProfiles: nonEmptyList(1, "Add at least one end user profile"),
  successMetrics: nonEmptyList(1, "Add at least one success metric"),
  definitionOfSuccess: z
    .string()
    .min(30, "Definition of success must be at least 30 characters"),
});

// ---------------------------------------------------------------------------
// Step 1 - Project Scope
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  title: z.string().min(3, "Project title must be at least 3 characters"),
  client: z.string().min(2, "Client name must be at least 2 characters"),
  industry: nonEmptyString("Select an industry"),
  projectCategory: nonEmptyString("Select a project category"),
  platformType: nonEmptyString("Select a platform type"),
  featureModules: nonEmptyList(2, "Add at least 2 feature modules"),
  userRoles: nonEmptyList(1, "Add at least one user role"),
  businessWorkflows: nonEmptyList(1, "Add at least one business workflow"),
  outOfScope: nonEmptyList(1, "Add at least one out-of-scope item"),
});

// ---------------------------------------------------------------------------
// Step 2 - Technical
// ---------------------------------------------------------------------------

const step2Schema = z.object({
  developmentScope: nonEmptyList(
    1,
    "Select at least one development scope",
  ),
  uiuxDesignScope: nonEmptyString("Select UI/UX design scope"),
  deploymentScope: nonEmptyString("Select deployment scope"),
  goLiveScope: nonEmptyString("Select go-live scope"),
  techStack: z
    .string()
    .min(10, "Tech stack must be at least 10 characters"),
});

// ---------------------------------------------------------------------------
// Step 3 - Integrations (skippable)
// ---------------------------------------------------------------------------

// No required validation.

// ---------------------------------------------------------------------------
// Step 4 - Timeline (skippable)
// ---------------------------------------------------------------------------

// No required validation.

// ---------------------------------------------------------------------------
// Step 5 - Budget & Risk
// ---------------------------------------------------------------------------

const step5Schema = z
  .object({
    budgetMin: z.coerce
      .number()
      .refine((n) => n > 0, {
        message: "Minimum budget must be greater than 0",
      }),
    budgetMax: z.coerce.number(),
    pricingModel: nonEmptyString("Select a pricing model"),
    knownRisks: nonEmptyList(1, "Add at least one known risk"),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "Maximum budget must be greater than or equal to minimum",
    path: ["budgetMax"],
  });

// ---------------------------------------------------------------------------
// Step 6 - Quality (skippable)
// ---------------------------------------------------------------------------

// No required validation.

// ---------------------------------------------------------------------------
// Step 7 - Governance
// ---------------------------------------------------------------------------

const step7Schema = z.object({
  nonDiscriminationConfirm: z.literal(true, {
    error: "Non-discrimination confirmation is required",
  }),
  dataSensitivity: nonEmptyString("Select data sensitivity level"),
  labourStandards: nonEmptyString("Select labour standards"),
});

// ---------------------------------------------------------------------------
// Step 8 - Commercial
// ---------------------------------------------------------------------------

const step8Schema = z.object({
  ipOwnership: nonEmptyString("Select IP ownership model"),
  sourceCodeOwnership: nonEmptyString("Select source code ownership"),
  referenceRights: nonEmptyString("Select reference rights"),
  thirdPartyCosts: nonEmptyString("Select third-party costs model"),
  warrantyPeriod: nonEmptyString("Select warranty period"),
  changeRequestProcess: nonEmptyString("Select change request process"),
});

// ---------------------------------------------------------------------------
// Step 9 - Review
// ---------------------------------------------------------------------------

const step9Schema = z.object({
  businessOwnerApprover: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Business owner approver is required")),
  finalApprover: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Final approver is required")),
});

// ---------------------------------------------------------------------------
// Schema lookup
// ---------------------------------------------------------------------------

const schemas: Record<number, z.ZodTypeAny | null> = {
  0: step0Schema,
  1: step1Schema,
  2: step2Schema,
  3: null, // skippable
  4: null, // skippable
  5: step5Schema,
  6: null, // skippable
  7: step7Schema,
  8: step8Schema,
  9: step9Schema,
};

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * Validate a single step of the SOW Generator form.
 *
 * @param step  - Zero-based step index (0-9).
 * @param formData - The current form data (only the fields relevant to the
 *                   step need to be present).
 * @returns An object mapping field names to their first error message.
 *          An empty object means the step is valid.
 */
export function validateStep(step: number, formData: any): StepErrors {
  const schema = schemas[step];

  // Steps without a schema are always valid (skippable).
  if (!schema) {
    return {};
  }

  const result = schema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: StepErrors = {};

  for (const issue of result.error.issues) {
    // Use the deepest path segment as the field key.
    const key = issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : "_root";

    // Keep only the first error per field.
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}

/**
 * Validate a single field within a step.
 * Returns the error message for that field, or undefined if valid.
 */
export function validateField(step: number, field: string, formData: any): string | undefined {
  const errors = validateStep(step, formData);
  return errors[field];
}
